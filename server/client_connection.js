import * as proto from '../shared/proto.js';

const EventEmitter = require('events');
const webrtc = require('wrtc');

export default class ClientConnection extends EventEmitter {
	constructor(id, sdp, slave) {
		super();

		this.slave = slave;
		this.id = id;
		this.dataChannels = {};

		this.clientCon = new webrtc.RTCPeerConnection();
		this.clientCon.addEventListener('icecandidate', (iceEv) => {
			if (!iceEv.candidate) return;
			this.slave.ws.send(proto.iceCandidateToClient.serialize(id, iceEv.candidate));
		});
		this.clientCon.addEventListener('datachannel', (ev) => {
			this.emit('datachannel', ev.channel);
		});

		const desc = new webrtc.RTCSessionDescription({
			type: 'offer',
			sdp,
		});

		this.clientCon.setRemoteDescription(desc).then(() => {
			return this.clientCon.createAnswer();
		}).then((answer) => {
			this.clientCon.setLocalDescription(answer).then(() => {
				this.slave.ws.send(proto.answerToClient.serialize(id, answer.sdp));
			// eslint-disable-next-line no-console
			}).catch(console.error);
		// eslint-disable-next-line no-console
		}).catch(console.error);
	}
}
