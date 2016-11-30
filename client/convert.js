export function stringToBuffer(string) {
	let encoder = new TextEncoder('utf8');
	return encoder.encode(string);
}
export function bufferToString(arrayBuffer) {
	let decoder = new TextDecoder('utf8');
	return decoder.decode(arrayBuffer);
}
