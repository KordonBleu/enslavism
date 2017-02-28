const MAX_UINT32 = Math.pow(2, 32) - 1;

export default class SocketList {
	constructor() {
		this._currentId = 0;
		this._wrapMode = false;

		this._idWs = new Map();
	}
	add(ws) {
		if (this._currentId > MAX_UINT32) {
			this.wrapMode = true;
		}
		if (this.wrapMode) {
			let id = this._findAvailableId();
			if (id === undefined) throw new Error('All IDs are taken');

			this._idWs.set(id, ws);
			return id;
		} else {
			this._idWs.set(this._currentId, ws);
			return this._currentId++;
		}
	}
	delete(id) {
		this._idWs.delete(id);
	}
	find(id) {
		return this._idWs.get(id);
	}
	_findAvailableId() {
		let prevKey = null;
		for (let key of this._idWs.values()) {
			if (prevKey !== null && key - prevKey > 1) {
				// if the difference between two IDs is greater than 1 there is a slot avalaible
				return prevKey + 1;
			}

			prevKey = key;
		}
		if (prevKey < MAX_UINT32) {
			// there are slots available after the last ID
			return prevKey + 1;
		}
	}
	*[Symbol.iterator]() {
		return this._idWs.entries();
	}
	values() {
		return this._idWs.values();
	}
	keys() {
		return this._idWs.keys();
	}
}
