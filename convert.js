export function stringToBuffer(string) {
	let buf = new Buffer(string, 'utf8');
	return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

export function bufferToString(arrayBuffer) {
	let StringDecoder = require('string_decoder').StringDecoder,
		decoder = new StringDecoder('utf8'),
		tmpBuf = new Buffer(arrayBuffer);
	return decoder.write(tmpBuf);
}
