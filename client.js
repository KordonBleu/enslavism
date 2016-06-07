/* the client must register to the master
   then expose an API that allows a script to:
    - get the server list
    - connect to a server on this list */

let MasterConnection = (() => {
	'use strict';

	let message = require('./message.js');
	console.log(message);

	class SlaveConnection {
		constructor(userData) {
			this.userData = userData;
		}
		connect() {
			// create a connection
			// uses the parent MasterConnection for signaling

			let client = new RTCPeerConnection();

			let dc = client.createDataChannel('test');
			dc.onopen = function() {
				console.log('Data channel open');
			}
			dc.onmessage = function(e) {
				console.log(e);
			}
			client.createOffer().then(function(offer) {
				client.setLocalDescription(offer);
				console.log(offer.sdp);
				let descTest = new RTCSessionDescription(offer);
				console.log(descTest);
			});
		}
	}

	class MasterConnection {
		constructor(url) {
			this._slaves = [];
			this._masterSocket = new WebSocket(url);
			this._masterSocket.binaryType = 'arraybuffer';
			this._masterSocket.addEventListener('message', (msg) => {
				switch (new Uint8Array(msg)[0]) {
					case message.addServers.type:
						message.addServers.deserialize(msg).forEach((userData) => {
							this._slaves.push(new SlaveConnection(userData));
						});
						break;
					case message.removeServers.type:
						message.removeServers.deserialize(msg).forEach((rmId) => {
							this._slaves.splice(rmId, 1);
						});
						break;
				}
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
