import * as proto from '../shared/proto.js';
import EventEmitter from './event_emitter.js';

var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;

export default class SlaveConnection extends EventEmitter {
	constructor(id, userData, master) {
		super();

		this.id = id;
		this.userData = userData;
		this.master = master;
		this.dataChannels = {};
	}
	connect() {
		// create a connection
		// uses the parent MasterConnection for signaling

		this.slaveCon = new RTCPeerConnection(null);
		this.slaveCon.addEventListener('icecandidate', candidate => {
			if(!candidate.candidate) return;
			this.master._masterSocket.send(proto.iceCandidateToSlave.serialize(this.id, candidate.candidate));
		});
	}
	close() {
		if (this.slaveCon !== undefined) {
			this.slaveCon.close();
			this.slaveCon = undefined;
			this.dataChannels = {};
		}
	}
	createDataChannel(dcName, dcConfig) {
		return new Promise((resolve, reject) => {
			if (this.slaveCon === undefined) this.connect();
			let dc;
			try {
				dc = this.slaveCon.createDataChannel(dcName, dcConfig);
			} catch(err) {
				reject(err);
			}

			dc.addEventListener('open', () => {
				this.dataChannels[dcName] = dc;
				resolve(dc);
			});
			this.slaveCon.createOffer().then(offer => {
				let desc = new RTCSessionDescription(offer);
				this.slaveCon.setLocalDescription(desc);
				this.master._masterSocket.send(proto.offerToSlave.serialize(this.id, offer.sdp));
			});
		});
	}
	_setRemoteDescription(sdp) {
		this.slaveCon.setRemoteDescription(new RTCSessionDescription({
			type: 'answer',
			sdp
		}));
	}
	_addIceCandidate(candidate, sdpMid, sdpMLineIndex) {
		this.slaveCon.addIceCandidate(new RTCIceCandidate({candidate, sdpMid, sdpMLineIndex}));
	}
}
