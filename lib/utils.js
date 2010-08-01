var assert = require('assert');

exports.VER5 = 0x05;

exports.NOAUTH = 0x00;
exports.GSSAPI = 0x01;
exports.AUTH = 0x02; // auth with username and password

exports.ADDR_IPV4 = 0x01;
exports.ADDR_DOMAIN = 0x03;
exports.ADDR_IPV6 = 0x04;

exports.CMD_CONNECT = 0x01;
exports.CMD_BIND = 0x02;
exports.CMD_UDP = 0x03;

exports.STATE = {
	OPENING: 'opening',
	OPEN: 'open',
	READONLY: 'readOnly',
	WRITEONLY: 'writeOnly',
	CLOSED: 'closed'
};

exports.helloPacket = function(ver, methods) {
	var b = new Buffer(methods.length + 2);
	
	b[0] = ver;
	b[1] = methods.length;
	
	for (var i = 0; i < methods.length;i++) b[i+2] = methods[i];
	
	return b;
}

exports.unpackHelloPacket = function(buffer) {
	return {
		version: buffer[0],
		method: buffer[1]
	};
};

exports.requestPacket = function(ver, cmd, host, port) {
	var l = 6,
		addr = '',
		b = null,
		packFunction = null;

	// determine address type
	if (exports.isIPv4(host)) {
		addr = exports.ADDR_IPV4;
		l += 4;
		packFunction = exports.packIPv4;
	} else {
		addr = exports.ADDR_DOMAIN;
		l += host.length + 1;
		packFunction = exports.packDomain;
	}
	
	// VER + CMD + RSV + ATYP + ADDR + PORT
	b = new Buffer(l);
	b[0] = ver;
	b[1] = cmd;
	b[2] = 0;
	b.write(addr, 3);
	packFunction(b, 4, host);
	
	return b;
}

exports.packDomain = function(buffer, offset, host) {
	buffer.write(host, offset);
}

exports.packIPv4 = function(buffer, offset, ip) {
	var m = ip.split('.');
	assert.equal(4, m.length);
	
	for (var i = 0; i < m.length; i++) {
		buffer[offset + i] = m[i].toString(10);
	}
}

exports.isIPv4 = function(ip) {
	return /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.test(ip);
}

exports.debugBytes = function(data) {
	var b = new Buffer(data.length * 2);
	for (var i = 0; i < data.length; i++) {
		var h = data[i].toString(16) + '';
		if (h < 10) h = '0' + h;
		
		b.write(h, i*2);
	}
	
	return b;
}