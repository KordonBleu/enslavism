'use strict';

const isNode = typeof module !== 'undefined' && typeof module.exports !== 'undefined';

function stringToBuffer(string) {
	if (isNode) {
		let buf = new Buffer(string, 'utf8');
		return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
	} else {
		let encoder = new TextEncoder('utf8');
		return encoder.encode(string);
	}
}
function bufferToString(arrayBuffer) {
	if (isNode) {
		let StringDecoder = require('string_decoder').StringDecoder,
			decoder = new StringDecoder('utf8'),
			tmpBuf = new Buffer(arrayBuffer);
		return decoder.write(tmpBuf);
	} else {
		let decoder = new TextDecoder('utf8');
		return decoder.decode(arrayBuffer);
	}
}

module.exports = {
	register: {
		value: 0,
		serialize: () => {
		},
		deserialize: () => {
		}
	},
	addServer: {
		value: 0,
		serialize: () => {
		},
		deserialize: () => {
		}
	},
	removeServer: {
		value: 0,
		serialize: () => {
		},
		deserialize: () => {
		}
	}
}
