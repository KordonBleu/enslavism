import * as proto from '../shared/proto.js';

var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;

class SlaveConnection {
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
			this.master._masterSocket.send(proto.iceCandidateToSlave.serialize(this.id, candidate));
		});
	}
	createDataChannel(dcName) {
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
				this.master._masterSocket.send(proto.offerToSlave.serialize(this.id, offer.sdp));
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

export default class MasterConnection {
	constructor(url) {
		this._slaves = [];
		this._masterSocket = new WebSocket(url + '/enslavism/clients');
		this._masterSocket.binaryType = 'arraybuffer';
		this._masterSocket.addEventListener('message', (msg) => {
			switch (proto.getSerializator(msg.data)) {
				case proto.addSlaves:
					console.log('got addServers');
					for (let slave of proto.addSlaves.deserialize(msg.data)) {
						console.log(slave, msg.data);
						let slaveCo = new SlaveConnection(slave.id, slave.userData, this);
						this._slaves.push(slaveCo);
						if (this.onSlave !== undefined) this.onSlave(slaveCo);
					}
					break;
				case proto.removeSlaves:
					console.log('got removeServers');
					for (let rmId of proto.removeSlaves.deserialize(msg.data)) {
						this._slaves.splice(rmId, 1);
					}
					break;
				case proto.answerFromSlave: {
					let {id, sdp} = proto.answerFromSlave.deserialize(msg.data),
						receiver = this.findSlave(id);
					if (receiver !== undefined) receiver._setRemoteDescription(sdp);
					break;
				}
				case proto.iceCandidateFromSlave: {
					let {id, sdpMid, sdpMLineIndex, candidate} = proto.iceCandidateFromSlave.deserialize(msg.data),
						receiver = this.findSlave(id);
					if (receiver !== undefined) receiver._addIceCandidate(candidate, sdpMid, sdpMLineIndex);
					break;
				}
			}
		});
	}
	findSlave(id) { // get slave corresponding to this id
		return this._slaves.find(slave => {
			return slave.id === id;
		});
	}
	get slaves() {
		// let's stick with one type of MasterConnection for now but
		// it might be nice to be able to choose how it acts, either:
		// - the server list is updated continuously
		return this._slaves;
	}
}
