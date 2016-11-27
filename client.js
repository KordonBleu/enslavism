/* the client must register to the master
   then expose an API that allows a script to:
    - get the server list
    - connect to a server on this list */

let MasterConnection = (() => {
	'use strict';
	'include message.js';//this marks where to insert the whole file message.js
	// it works fine but as it is a hack it will be replaced by ES6 modules when they'll be available

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
				this.master._masterSocket.send(message.iceCandidateToSlave.serialize(this.id, candidate));
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

	class MasterConnection {
		constructor(url) {
			this._slaves = [];
			this._masterSocket = new WebSocket(url + '/enslavism/clients');
			this._masterSocket.binaryType = 'arraybuffer';
			this._masterSocket.addEventListener('message', (msg) => {
				switch (new Uint8Array(msg.data)[0]) {
					case message.addSlaves.type:
						console.log('got addServers');
						message.addSlaves.deserialize(msg.data).forEach(slave => {
							console.log(slave, msg.data);
							let slaveCo = new SlaveConnection(slave.id, slave.userData, this);
							this._slaves.push(slaveCo);
							if (this.onSlave !== undefined) this.onSlave(slaveCo);
						});
						break;
					case message.removeSlaves.type:
						console.log('got removeServers');
						message.removeSlaves.deserialize(msg.data).forEach((rmId) => {
							this._slaves.splice(rmId, 1);
						});
						break;
					case message.answerFromSlave.type: {
						let {id, sdp} = message.answerFromSlave.deserialize(msg.data),
							receiver = this.findSlave(id);
						if (receiver !== undefined) receiver._setRemoteDescription(sdp);
						break;
					}
					case message.iceCandidateFromSlave.type: {
						let {id, sdpMid, sdpMLineIndex, candidate} = message.iceCandidateFromSlave.deserialize(msg.data),
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

	return MasterConnection;
})();
