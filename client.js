'use strict';

/* the client must register to the master
   then expose an API that allows a script to:
    - get the server list
    - connect to a server on this list */

// this must run in the browser!
var client = new webrtc.RTCPeerConnection();

dc = client.createDataChannel('test');
dc.onopen = function() {
	console.log('Data channel open');
}
dc.onmessage = function(e) {
	console.log(e);
}
client.createOffer().then(function(offer) {
	client.setLocalDescription(offer);
	console.log(offer.sdp);
	var descTest = new webrtc.RTCSessionDescription(offer);
	console.log(descTest);
});
