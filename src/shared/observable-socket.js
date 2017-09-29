import {Observable, ReplaySubject} from "rxjs";

export function clientMessage(message) {
	const error = new Error(message);
	error.clientMessage = message;
	return error;
}

export class ObservableSocket {
	get isConnected() { return this._state.isConnected; }
	get isReconnected() { return this._state.isReconnecting; }
	get isTotallyDead() { return !this._state.isConnected && !this._state.isReconnecting; }

	constructor(socket) {
		this._socket = socket;
		this._state = {};
		this._actionCallbacks = {};
		this._requests = {};
		this._nextRequestId = 0;

		this.status$ = Observable.merge(
			this.on$("connect").map(() => ({isConnected: true})),
			this.on$("disconnect").map(() => ({isConnected: false})),
			this.on$("reconnect").map(attempt => ({isConnected: false, isReconnecting: true, attempt})),
			this.on$("reconnect_failed").map(() => ({isConnected: false, isReconnecting: false}))
		).publishReplay(1).refCount();

		this.status$.subscribe(state => this._state = state);
	}

	// Basic wrappers
	on$(event) {
		return Observable.fromEvent(this._socket, event);
	}

	on(event, callback) {
		this._socket.on(event, callback);
	}

	off(event, callback) {
		this._socket.off(event, callback);
	}

	emit(event, arg) {
		this._socket.emit(event, arg);
	}

	// On (server side)
	onAction(action, callback) {
		this._socket.on(action, (arg, requestID) => {
			try {
				const value = callback(arg);
				if (!value) {
					this._socket.emit(action, null, requestID);
					return;
				}
				if (typeof(value.subscribe) !== "function") {
					this._socket.emit(action, value, requestID);
					return;
				}
				let hasValue = false;
				value.subscribe({
					next: (item) => {
						if (hasValue) {
							throw new Error(`Action ${action} prduced more than one value`);
						}
						this._socket.emit(action, item, requestID);
						hasValue = true;
					},
					eror: (error) => {
						this._emitError(action, requestID, error);
						console.error(error.stack || error);
					},
					complete: () => {
						if (!hasValue) {
							this._socket.emit(action, null, requestID);
						}
					}
				});
			} catch (error) {
				if (typeof(requestID) !== "undefined") {
					this._emitError(action, requestID, error);
				}
				console.error(error.stack || error);
			}
		});
	}

	// Emit (client side)
	emitAction$(action, arg) {
		const id = this._nextRequestId++;
		this._registerCallbacks(action);
		const subject = this._requests[id] = new ReplaySubject(1);
		this._socket.emit(action, arg, id);
		return subject;
	}

	_emitError(action, id, error) {
		const message = (error && error.clientMessage) || "Fatal Error";
		this._socket.emit(`${action}:fail`, {message}, id);
	}

	_registerCallbacks(action) {
		if (this._actionCallbacks.hasOwnProperty(action)) {
			return;
		}
		this._socket.on(action, (arg, id) => {
			const request = this._popRequest(id);
			if (!request) {
				return;
			}
			request.next(arg);
			request.complete();
		});

		this._socket.on(`${action}:fail`, (arg, id) => {
			const request = this._popRequest(id);
			if (!request) {
				return;
			}
			request.error(arg);
		});

		this._actionCallbacks[action] = true;
	}

	_popRequest(id) {
		if (!this._requests.hasOwnProperty(id)) {
			console.error(`Event with id ${id} was returned twice or the server did not send an ID`);
			return;
		}
		const request = this._requests[id];
		delete this._requests[id];
		return request;
	}
}