export function stringToBuffer(string) {
	const buf = Buffer.from(string, 'utf8');
	return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

export function bufferToString(arrayBuffer) {
	const StringDecoder = require('string_decoder').StringDecoder;
	const decoder = new StringDecoder('utf8');
	const tmpBuf = Buffer.from(arrayBuffer);
	return decoder.write(tmpBuf);
}

export function bufferToArrayBuffer(buf) {
	return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}
