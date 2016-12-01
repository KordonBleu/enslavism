import * as message from '../shared/proto.js';
import EventEmitter from './event_emitter.js';
import SlaveConnection from './slave_connection.js';

export default class MasterConnection extends EventEmitter {
	constructor(url) {
		super();

		this._slaves = [];
		this._masterSocket = new WebSocket(url + '/enslavism/clients');
		this._masterSocket.binaryType = 'arraybuffer';
		this._masterSocket.addEventListener('message', (msg) => {
			switch (new Uint8Array(msg.data)[0]) {
				case message.addSlaves.type:
					console.log('got addServers');
					for (let slave of message.addSlaves.deserialize(msg.data)) {
						console.log(slave, msg.data);
						let slaveCo = new SlaveConnection(slave.id, slave.userData, this);
						this._slaves.push(slaveCo);
						this.emit('slave', slaveCo);
						//if (this.onSlave !== undefined) this.onSlave(slaveCo);
					}
					break;
				case message.removeSlaves.type:
					console.log('got removeServers');
					for (let rmId of message.removeSlaves.deserialize(msg.data)) {
						this._slaves.splice(rmId, 1);
					}
					break;
				case message.answerFromSlave.type: {
					let {id, sdp} = message.answerFromSlave.deserialize(msg.data),
						receiver = this.findSlave(id);
					if (receiver !== undefined) receiver._setRemoteDescription(sdp);
					break;
				}
				case message.iceCandidateFromSlave.type: {
					let {id, sdpMid, sdpMLineIndex, candidate} = message.iceCandidateFromSlave.deserialize(msg.data),
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
