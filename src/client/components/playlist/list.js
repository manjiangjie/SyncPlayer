import {ElementComponent} from "../../lib/component";
import {PlaylistSortComponent} from "./sort";
import $ from "jquery";
import moment from "moment";

export class PlaylistListComponent extends ElementComponent {
	constructor(playlistStore, usersStore) {
		super("ul");
		this._playlist = playlistStore;
		this._users = usersStore;
		this.$element.addClass("playlist-list");
	}

	_onAttach() {
		const $list = this.$element;
		let itemsMap = {};

		const sort = new PlaylistSortComponent();
		sort.attach(this._$mount);
		this.children.push(sort);

		this._playlist.state$
			.filter(a => a.type === "list")
			.compSubscribe(this, ({state}) => {
				$list.empty();
				itemsMap = {};
				for (let source of state.list) {
					const comp = new PlaylistItemComponent(source);
					itemsMap[source.id] = comp;
					comp.attach($list);
				}
			});
	}

}

class PlaylistItemComponent extends ElementComponent {
	constructor(source) {
		super("li");
		this._source = source;
		const $thumb = $(`<div class="thumb-wrapper" />`).append(
			$(`<image class="thumb" />`).attr("src", source.thumb)
		);

		const $details = $(`<div class="details" />`).append(
			$(`<span class="title" />`).attr("title", source.title).text(source.title),
			$(`<time />`).text(moment.duration(source.totalTime, "seconds").format())
		);

		this._$progress = $(`<span class="progress" />`);
		this.$element.append($(`<div class="inner" />`)).append([
			$thumb, $details, this._$progress
		]);
	}
}
//Todo: npm install --save moment-duration-format