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
					this.answer(message.offerFromClient.deserialize(msg));
					break;
			}
		});
	}

	answer(params) {
		let pCon = new webrtc.RTCPeerConnection();

		let desc = new webrtc.RTCSessionDescription({
			type: 'offer',
			sdp: params.sdp
		});

		pCon.setRemoteDescription(desc).then(() => {
			return pCon.createAnswer();
		}).then(answer => {
			console.log(answer);
			//TODO: respond with answer
		}).catch(err => {
			console.log('error: ' + err);
		});
	}
}
module.exports = Slave;
