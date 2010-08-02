var assert = require('assert'),
  sys = require('sys'),
  Buffer = require('buffer').Buffer
  ;

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

exports.REP_SUCCESS = 0x00;

exports.STATE = {
	OPENING: 'opening',
	OPEN: 'open',
	READONLY: 'readOnly',
	WRITEONLY: 'writeOnly',
	CLOSED: 'closed'
};

exports.MSG = {
	stream_not_ready: 'Stream is not ready'
};

exports.nothing = function() {}

exports.helloPacket = function(ver, methods) {
	var b = new Buffer(methods.length + 2);
	
	b[0] = ver;
	b[1] = methods.length;
	
	for (var i = 0; i < methods.length;i++) b[i+2] = methods[i];
	
	return b;
}

exports.unpackHelloPacket = function(b) {
	return {
		version: b[0],
		method: b[1]
	}
};

exports.unpackReplyPacket = function(b) {
	var addr = '', port = 0;

	return {
		version: b[0],
		reply: b[1],
		address_type: b[2],
		address: addr,
		port: port
	}
}

exports.requestPacket = function(ver, cmd, host, port) {
	var l = 6,
		addr = 0,
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
	b[3] = addr;
	packFunction(b, 4, host);
	b[l-2] = 0;
	b[l-1] = 80;
	
	return b;
}

exports.packDomain = function(buffer, offset, host) {
	buffer[offset] = host.length;
	buffer.write(host, offset+1);
}

exports.packIPv4 = function(buffer, offset, ip) {
	var m = ip.split('.');
	assert.equal(4, m.length);
	
	for (var i = 0; i < m.length; i++) {
		buffer[offset + i] = m[i].toString(10);
	}
}

exports.packPort = function(buffer, offset, port) {
	var p1 = Math.floor(port / 256),
	  p2 = port % 256;
	
	buffer[offset] = p1;
	buffer[offset+1] = p2;
}

exports.unpackPort = function(buffer, offset) {
	return buffer[offset+1] + buffer[offset+2]*256;
}

exports.isIPv4 = function(ip) {
	return /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.test(ip);
}

exports.debugBytes = function(data) {
	var b = new Buffer(data.length * 2);
	for (var i = 0; i < data.length; i++) {
		var h = data[i].toString(16) + '';
		if (h.length == 1) h = '0' + h;
		
		b.write(h, i*2);
	}
	
	return b;
}