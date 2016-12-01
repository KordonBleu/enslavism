import * as message from '../shared/proto.js';

var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;

export default class SlaveConnection {
	constructor(id, userData, master) {
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
			this.master._masterSocket.send(message.iceCandidateToSlave.serialize(this.id, candidate));
		});
	}
	createDataChannel(dcName) { // TODO: connect if not already connected
		return new Promise((resolve, reject) => {
			let dc;
			try {
				dc = this.slaveCon.createDataChannel(dcName);
			} catch(err) {
				reject(err);
			}

			dc.addEventListener('open', () => {
				this.dataChannels[dcName] = dc;
				console.log('Data channel open');
				resolve(dc);
			});
			this.slaveCon.createOffer().then(offer => {
				let descTest = new RTCSessionDescription(offer);
				this.slaveCon.setLocalDescription(descTest);
				this.master._masterSocket.send(message.offerToSlave.serialize(this.id, offer.sdp));
			});
		});
	}
	_setRemoteDescription(sdp) {
		this.slaveCon.setRemoteDescription(new RTCSessionDescription({
			type: 'answer',
			sdp
		}));
		console.log('remote description set');
	}
	_addIceCandidate(candidate, sdpMid, sdpMLineIndex) {
		this.slaveCon.addIceCandidate(new RTCIceCandidate({candidate, sdpMid, sdpMLineIndex}));
		console.log('ice candidate added');
	}
}
