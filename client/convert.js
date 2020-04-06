export function stringToBuffer(string) {
	const encoder = new TextEncoder('utf8');
	return encoder.encode(string);
}
export function bufferToString(arrayBuffer) {
	const decoder = new TextDecoder('utf8');
	return decoder.decode(arrayBuffer);
}
