'use strict';

/* this file must accept connections from clients
   and expose an API use to exchange messages with clients */

const webrtc = require('wrtc'),
	WebSocket = require('ws'),
	message = require('./message.js');

class Slave {
	constructor(wsUrl, userData) {
		let ws = new WebSocket(wsUrl + '/enslavism/slaves'),
			connections = [];

		ws.on('open', () => {
			ws.send(message.register.serialize(userData));
		});
		ws.on('message', msg => {
			msg = msg.buffer.slice(msg.byteOffset, msg.byteOffset + msg.byteLength); // convert `Buffer` to `ArrayBuffer`
			switch (new Uint8Array(msg)[0]) {
				case message.offerFromClient.type:
					console.log('got an offerFromClient');
					this.answer(message.offerFromClient.deserialize(msg), ws);
					break;
				case message.iceCandidateToFromClient.type:
					let {id, sdpMid, sdpMLineIndex, candidate} = message.iceCandidateToFromClient.deserialize(msg);
					this.pCon.addIceCandidate(new RTCIceCandidate(candidate, sdpMid, sdpMLineIndex));
					break;
			}
		});
	}

	answer(params, ws) {
		this.pCon = new webrtc.RTCPeerConnection();
		this.pCon.onicecandidate = (iceEv) => {
			ws.send(message.iceCandidateToClient.serialize(666, iceEv.candidate));
		};
		this.pCon.ondatachannel = (event) => {
			console.log("wat is dat", event);
			event.channel.onopen = () => {
				console.log("data channel open I guess?");
			};
		};

		let desc = new webrtc.RTCSessionDescription({
			type: 'offer',
			sdp: params.sdp
		});

		this.pCon.setRemoteDescription(desc).then(() => {
			return this.pCon.createAnswer();
		}).then(answer => {
			this.pCon.setLocalDescription(answer).then(() => {
				ws.send(message.answerToClient.serialize(params.id, answer.sdp));
			}).catch(err => {
				console.log(err);
			});
		}).catch(err => {
			console.log('error: ' + err);
		});
	}
}
module.exports = Slave;
