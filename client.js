/* the client must register to the master
   then expose an API that allows a script to:
    - get the server list
    - connect to a server on this list */

let MasterConnection = (() => {
	'use strict';

	let message = require('./message.js');
	console.log(message);

	class SlaveConnection {
		constructor() {
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
		}
		get slaves() {
			// fetch and return an array of SlaveConnection
			// with properties set by the user in the master
			// (ex: serverName, connectedClientsAmount, etc.)
		}
	}

	return MasterConnection;
})();
