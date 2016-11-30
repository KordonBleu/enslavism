'use strict';

/* this file must accept connections from clients
   and expose an API use to exchange messages with clients */

const EventEmitter = require('events'),
	webrtc = require('wrtc'),
	WebSocket = require('ws'),
	message = require('./message.js');

class ClientConnection extends EventEmitter {
	constructor(id, sdp, slave) {
		super();

		this.slave = slave;
		this.id = id;
		this.dataChannels = {};

		this.clientCon = new webrtc.RTCPeerConnection();
		this.clientCon.onicecandidate = (iceEv) => {
			if (!iceEv.candidate) return;
			this.slave.ws.send(message.iceCandidateToClient.serialize(id, iceEv.candidate));
		};
		this.clientCon.ondatachannel = ev => {
			this.emit('newdc', ev.channel);
		};

		let desc = new webrtc.RTCSessionDescription({
			type: 'offer',
			sdp
		});

		this.clientCon.setRemoteDescription(desc).then(() => {
			return this.clientCon.createAnswer();
		}).then(answer => {
			this.clientCon.setLocalDescription(answer).then(() => {
				this.slave.ws.send(message.answerToClient.serialize(id, answer.sdp));
			}).catch(err => {
				console.log(err);
			});
		}).catch(err => {
			console.log('error: ' + err);
		});
	}
}

class Slave extends EventEmitter {
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
module.exports = Slave;
