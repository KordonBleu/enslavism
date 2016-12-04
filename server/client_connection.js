import * as proto from '../shared/proto.js';

const EventEmitter = require('events'),
	webrtc = require('wrtc');

export default class ClientConnection extends EventEmitter {
	constructor(id, sdp, slave) {
		super();

		this.slave = slave;
		this.id = id;
		this.dataChannels = {};

		this.clientCon = new webrtc.RTCPeerConnection();
		this.clientCon.onicecandidate = (iceEv) => {
			if (!iceEv.candidate) return;
			this.slave.ws.send(proto.iceCandidateToClient.serialize(id, iceEv.candidate));
		};
		this.clientCon.ondatachannel = ev => {
			this.emit('datachannel', ev.channel);
		};

		let desc = new webrtc.RTCSessionDescription({
			type: 'offer',
			sdp
		});

		this.clientCon.setRemoteDescription(desc).then(() => {
			return this.clientCon.createAnswer();
		}).then(answer => {
			this.clientCon.setLocalDescription(answer).then(() => {
				this.slave.ws.send(proto.answerToClient.serialize(id, answer.sdp));
			}).catch(console.error);
		}).catch(console.error);
	}
}


