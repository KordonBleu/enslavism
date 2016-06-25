'use strict';

/* this file must accept connections from clients
   and expose an API use to exchange messages with clients */

const webrtc = require('wrtc'),
	WebSocket = require('ws'),
	message = require('./message.js');

class ClientConnection {
	constructor(id, sdp, slave) {
		this.slave = slave;


		this.pCon = new webrtc.RTCPeerConnection();
		this.pCon.onicecandidate = (iceEv) => {
			console.log('this should not be undefined', id);
			this.slave.ws.send(message.iceCandidateToClient.serialize(id, iceEv.candidate));
		};
		this.pCon.ondatachannel = (event) => {
			console.log("wat is dat", event);
			event.channel.onopen = () => {
				console.log("data channel open I guess?");
			};
		};

		let desc = new webrtc.RTCSessionDescription({
			type: 'offer',
			sdp
		});

		this.pCon.setRemoteDescription(desc).then(() => {
			return this.pCon.createAnswer();
		}).then(answer => {
			this.pCon.setLocalDescription(answer).then(() => {
				this.slave.ws.send(message.answerToClient.serialize(id, answer.sdp));
			}).catch(err => {
				console.log(err);
			});
		}).catch(err => {
			console.log('error: ' + err);
		});
	}
}

class Slave {
	constructor(wsUrl, userData) {
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
					let {id, sdp} = message.offerFromClient.deserialize(msg);
					this.connections.push(new ClientConnection(id, sdp, this));
					break;
				}
				case message.iceCandidateFromClient.type: {
					console.log('got an iceCandidateFromC');
					let {id, sdpMid, sdpMLineIndex, candidate} = message.iceCandidateFromClient.deserialize(msg);
					this.pCon.addIceCandidate(new RTCIceCandidate(candidate, sdpMid, sdpMLineIndex));
					break;
				}
			}
		});
	}
}
module.exports = Slave;
