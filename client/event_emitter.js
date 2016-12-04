export default class EventEmitter {
	constructor() {
		this._eventListeners = Object.create(null);
	}
	addEventListener(event, eventListener) {
		if (this._eventListeners[event] === undefined) this._eventListeners[event] = new Set();

		this._eventListeners[event].add(eventListener);
	}
	removeEventListener(event, eventListener) {
		if (this._eventListeners[event] !== undefined) this._eventListeners[event].delete(eventListener);
	}
	emit(event, ...values) {
		if (this._eventListeners[event] !== undefined) {
			for (let listener of this._eventListeners[event]) {
				listener.apply(this, values);
			}
		}
	}
}
