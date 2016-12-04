import * as proto from '../shared/proto.js';
import * as convert from './convert.js';
import ClientConnection from './client_connection.js';

const EventEmitter = require('events'),
	webrtc = require('wrtc'),
	WebSocket = require('ws');

export default class Slave extends EventEmitter {
	constructor(wsUrl, userData) {
		super();

		this.ws = new WebSocket(wsUrl + '/enslavism/slaves');
		this.connections = [];

		this.ws.on('open', () => {
			this.ws.send(proto.register.serialize(userData));
		});
		this.ws.on('message', msg => {
			msg = convert.bufferToArrayBuffer(msg);
			switch (proto.getSerializator(msg)) {
				case proto.offerFromClient: {
					let {id, sdp} = proto.offerFromClient.deserialize(msg),
						accept = true;
					this.emit('offer', () => {
						accept = false;
					});
					if (accept) {
						let clCo = new ClientConnection(id, sdp, this);
						this.connections.push(clCo);
						this.emit('connection', clCo);
					} else {
						this.ws.send(proto.rejectToClient.serialize(id));
					}
					break;
				}
				case proto.iceCandidateFromClient: {
					let {id, sdpMid, sdpMLineIndex, candidate} = proto.iceCandidateFromClient.deserialize(msg);
					let receiver = this.findClient(id);
					if (receiver !== undefined) {
						receiver.clientCon.addIceCandidate(new webrtc.RTCIceCandidate({candidate, sdpMid, sdpMLineIndex}))
						.catch(e => {
							console.error('adding ICE candidate: failure', e, id, sdpMid, sdpMLineIndex, candidate);
						});
					}
					break;
				}
			}
		});
	}
	findClient(id) { // get client corresponding to this id
		return this.connections.find(client => {
			return client.id === id;
		});
	}
}
