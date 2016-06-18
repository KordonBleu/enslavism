'use strict';

/* this file must accept connections from clients
   and expose an API use to exchange messages with clients */

const webrtc = require('wrtc'),
	WebSocket = require('ws'),
	message = require('./master.js');

class Slave {
	constructor(wsUrl) {
		let ws = new WebSocket(wsUrl + '/enslavism/slaves');
	}

	stuff() {
		var game_server = new webrtc.RTCPeerConnection();

		var desc = new webrtc.RTCSessionDescription({
			type: 'offer',
			sdp: 'v=0\no=- 1020019771207631039 2 IN IP4 127.0.0.1\ns=-\nt=0 0\na=msid-semantic: WMS\nm=application 9 DTLS/SCTP 5000\nc=IN IP4 0.0.0.0\na=ice-ufrag:coWtKbpgwqwEsnfn\na=ice-pwd:NcUViHVijaJP1FezToNhu6eG\na=ice-options:google-ice\na=fingerprint:sha-1 D9:6E:C5:9F:00:AF:E7:E5:3C:1F:5B:99:0A:90:A0:2A:64:4F:54:5C\na=setup:actpass\na=mid:data\na=sctpmap:5000 webrtc-datachannel 1024\n'
		});
		console.log(desc);

		game_server.setRemoteDescription(desc).then(function() {
			var answer = game_server.createAnswer();
			console.log(answer);
		}).catch(function(truc) {
			console.log('error' + truc);
		});
	}
}
module.exports = Slave;
