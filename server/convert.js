export function stringToBuffer(string) {
	let buf = Buffer.from(string, 'utf8');
	return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

export function bufferToString(arrayBuffer) {
	let StringDecoder = require('string_decoder').StringDecoder,
		decoder = new StringDecoder('utf8'),
		tmpBuf = Buffer.from(arrayBuffer);
	return decoder.write(tmpBuf);
}

export function bufferToArrayBuffer(buf) {
	return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}
