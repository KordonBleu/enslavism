import * as proto from '../shared/proto.js';
import EventEmitter from './event_emitter.js';
import SlaveConnection from './slave_connection.js';

export default class MasterConnection extends EventEmitter {
	// let's stick with one type of MasterConnection for now but
	// it might be nice to be able to choose how it acts, either:
	// - the slave list is updated continuously
	// - the client must requests slaves (with a query)
	constructor(url) {
		super();

		this.slaves = [];

		this._masterSocket = new WebSocket(url + '/enslavism/clients');
		this._masterSocket.binaryType = 'arraybuffer';
		this._masterSocket.addEventListener('message', msg => {
			switch (proto.getSerializator(msg.data)) {
				case proto.addSlaves: {
					for (let {id, userData} of proto.addSlaves.deserialize(msg.data)) {
						let slaveCo = new SlaveConnection(id, userData, this);

						this.slaves[id] = slaveCo;
						this.emit('slave', slaveCo);
					}
					break;
				}
				case proto.removeSlaves: {
					for (let rmId of proto.removeSlaves.deserialize(msg.data)) {
						this.slaves[rmId].close();
						delete this.slaves[rmId];
					}
					break;
				}
				case proto.answerFromSlave: {
					let {id, sdp} = proto.answerFromSlave.deserialize(msg.data),
						receiver = this.slaves[id];
					if (receiver !== undefined) receiver._setRemoteDescription(sdp);
					break;
				}
				case proto.iceCandidateFromSlave: {
					let {id, sdpMid, sdpMLineIndex, candidate} = proto.iceCandidateFromSlave.deserialize(msg.data),
						receiver = this.slaves[id];
					if (receiver !== undefined) receiver._addIceCandidate(candidate, sdpMid, sdpMLineIndex);
					break;
				}
				case proto.rejectFromSlave: {
					let id = proto.rejectFromSlave.deserialize(msg.data),
						receiver = this.slaves[id];
					if (receiver !== undefined) {
						receiver.close();
						receiver.emit('rejected');
					}
					break;
				}
			}
		});
	}
}
