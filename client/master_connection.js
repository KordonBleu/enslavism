import * as proto from '../shared/proto.js';
import EventEmitter from './event_emitter.js';
import SlaveConnection from './slave_connection.js';

export default class MasterConnection extends EventEmitter {
	constructor(url) {
		super();

		this._slaves = [];
		this._masterSocket = new WebSocket(url + '/enslavism/clients');
		this._masterSocket.binaryType = 'arraybuffer';
		this._masterSocket.addEventListener('message', (msg) => {
			switch (proto.getSerializator(msg.data)) {
				case proto.addSlaves:
					for (let slave of proto.addSlaves.deserialize(msg.data)) {
						let slaveCo = new SlaveConnection(slave.id, slave.userData, this);
						this._slaves.push(slaveCo);
						this.emit('slave', slaveCo);
						//if (this.onSlave !== undefined) this.onSlave(slaveCo);
					}
					break;
				case proto.removeSlaves:
					for (let rmId of proto.removeSlaves.deserialize(msg.data)) {
						this._slaves.splice(rmId, 1);
					}
					break;
				case proto.answerFromSlave: {
					let {id, sdp} = proto.answerFromSlave.deserialize(msg.data),
						receiver = this.findSlave(id);
					if (receiver !== undefined) receiver._setRemoteDescription(sdp);
					break;
				}
				case proto.iceCandidateFromSlave: {
					let {id, sdpMid, sdpMLineIndex, candidate} = proto.iceCandidateFromSlave.deserialize(msg.data),
						receiver = this.findSlave(id);
					if (receiver !== undefined) receiver._addIceCandidate(candidate, sdpMid, sdpMLineIndex);
					break;
				}
			}
		});
	}
	findSlave(id) { // get slave corresponding to this id
		return this._slaves.find(slave => {
			return slave.id === id;
		});
	}
	get slaves() {
		// let's stick with one type of MasterConnection for now but
		// it might be nice to be able to choose how it acts, either:
		// - the server list is updated continuously
		return this._slaves;
	}
}
