/* the client must register to the master
   then expose an API that allows a script to:
    - get the server list
    - connect to a server on this list */

let MasterConnection = (() => {
	'use strict';
	'include message.js';//this marks where to insert the whole file message.js
	// it works fine but as it is a hack it will be replaced by ES6 modules when they'll be available

	class SlaveConnection {
		constructor(id, userData) {
			this.id = id;
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
			this._masterSocket = new WebSocket(url + '/enslavism/clients');
			this._masterSocket.binaryType = 'arraybuffer';
			this._masterSocket.addEventListener('message', (msg) => {
				switch (new Uint8Array(msg.data)[0]) {
					case message.addSlaves.type:
						console.log('got addServers');
						message.addSlaves.deserialize(msg.data).forEach(slave => {
							this._slaves.push(new SlaveConnection(slave.id, slave.userData));
						});
						break;
					case message.removeSlaves.type:
						console.log('got removeServers');
						message.removeSlaves.deserialize(msg.data).forEach((rmId) => {
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
