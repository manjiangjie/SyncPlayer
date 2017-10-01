import $ from "jquery";
import {ElementComponent} from "../../lib/component";
import {Observable} from "rxjs";

export class ChatFormComponent extends  ElementComponent {
	constructor(usersStore, chatStore) {
		super("div");
		this._users = usersStore;
		this._chat = chatStore;
		this.$element.addClass("chat-form");
	}

	_onAttach() {
		this._error$ = $(`<div class="chat-error" />`).appendTo(this.$element);
		this._$input = $(`<input type="text" class="chat-input"/>`).appendTo(this.$element);
		this._users.currentUser$.compSubscribe(this, user => {
			this._$input.attr("placeholder", user.isLoggedIn ? ""  : "Enter a username");
		});
		Observable.fromEvent(this._$input, "keydown")
			// get value
			.filter(e => e.keyCode === 13)
			.do(e => e.preventDefault())
			.map(e => e.target.value.trim())
			.filter(e => e.length)
			// login or send messages
			.withLatestFrom(this._users.currentUser$)
			.flatMap(([value, user]) => {
				return user.isLoggedIn ? this._sendMessage$(value) : this._login$(value);
			})
			// display message
			.compSubscribe(this, res => {
				if (res && res.error) {
					this._error$.show().text(res.error.message);
				} else {
					this._error$.hide();
				}
			});
	}

	_sendMessage$(message) {
		return this._chat.sendMessage$(message).catchWrap().do(
			() => this._$input.val("")
		);
	}

	_login$(username) {
		this._$input.attr("disabled", "disabled");
		return this._users.login$(username).catchWrap()
			.do(() => this._$input.val(""))
			.finally(() => {
				this._$input.attr("disabled", null);
				this._$input.focus();
			});
	}
}