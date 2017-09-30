import {Observable} from "rxjs";

/* eslint no-unused-vars: off */

export class ModuleBase {
	init$() {
		return Observable.empty();
	}

	registerClient(client) {
		client.onAction("playlist:add", data => {

		});
	}

	clientRegistered() {

	}
}