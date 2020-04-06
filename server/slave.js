import * as proto from '../shared/proto.js';
import * as convert from './convert.js';
import ClientConnection from './client_connection.js';

const EventEmitter = require('events'),
	webrtc = require('wrtc'),
	WebSocket = require('ws'),
	cookie = require('cookie');

export default class Slave extends EventEmitter {
	constructor(wsUrl, userData, authData) {
		super();

		// ugly hack until this gets merged: https://github.com/jshttp/cookie/pull/47
		let cookieStr = '';
		if (authData !== undefined) {
			let keys = Object.keys(authData);
			for (let [i, key] of keys.entries()) {
				cookieStr += cookie.serialize(key, authData[key]);
				if (i !== keys.length -1) cookieStr += '; ';
			}
		}

		this.ws = new WebSocket(wsUrl + '/enslavism/slaves', cookieStr === '' ? undefined : {
			headers: {
				'Cookie': cookieStr
			}
		});
		this.connections = [];

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
						receiver.clientCon.addIceCandidate(new webrtc.RTCIceCandidate({candidate, sdpMid, sdpMLineIndex})).catch(e => {
							console.error('adding ICE candidate: failure', e, id, sdpMid, sdpMLineIndex, candidate);
						});
					}
					break;
				}
			}
		});
		return new Promise((resolve, reject) => {
			this.ws.on('open', () => {
				this.ws.send(proto.register.serialize(userData));
				resolve(this);
			});
			this.ws.on('error', err => {
				reject(err);
			});
		});
	}
	findClient(id) { // get client corresponding to this id
		return this.connections.find(client => {
			return client.id === id;
		});
	}
}
