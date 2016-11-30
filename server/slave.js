import * as message from '../shared/proto.js';
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
			this.ws.send(message.register.serialize(userData));
		});
		this.ws.on('message', msg => {
			msg = msg.buffer.slice(msg.byteOffset, msg.byteOffset + msg.byteLength); // convert `Buffer` to `ArrayBuffer`
			switch (new Uint8Array(msg)[0]) {
				case message.offerFromClient.type: {
					console.log('got an offerFromClient');
					let {id, sdp} = message.offerFromClient.deserialize(msg),
						clCo = new ClientConnection(id, sdp, this);
					this.connections.push(clCo);
					this.emit('newclco', clCo);
					break;
				}
				case message.iceCandidateFromClient.type: {
					console.log('got an iceCandidateFromC');
					let {id, sdpMid, sdpMLineIndex, candidate} = message.iceCandidateFromClient.deserialize(msg);
					console.log(sdpMid, sdpMLineIndex, candidate);
					let receiver = this.findClient(id);
					if (receiver !== undefined) {
						receiver.clientCon.addIceCandidate(new webrtc.RTCIceCandidate(candidate, sdpMid, sdpMLineIndex))
						.then(() => {
							console.log('adding ICE candidate: succes');
						})
						.catch(e => {
							console.log('adding ICE candidate: failure', e, id, sdpMid, sdpMLineIndex, candidate);
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
