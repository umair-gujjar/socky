var assert = require('assert'),
  sys = require('sys'),
  Buffer = require('buffer').Buffer
  ;
  
var utils = exports;

utils.VER5 = 0x05;

utils.NOAUTH = 0x00;
utils.GSSAPI = 0x01;
utils.AUTH = 0x02; // auth with username and password

utils.ADDR_IPV4 = 0x01;
utils.ADDR_DOMAIN = 0x03;
utils.ADDR_IPV6 = 0x04;

utils.CMD_CONNECT = 0x01;
utils.CMD_BIND = 0x02;
utils.CMD_UDP = 0x03;

utils.REP_SUCCESS = 0x00;

utils.STATE = {
	OPENING: 'opening',
	OPEN: 'open',
	READONLY: 'readOnly',
	WRITEONLY: 'writeOnly',
	CLOSED: 'closed'
};

utils.MSG = {
	stream_not_ready: 'Stream is not ready'
};

utils.nothing = function() {}

utils.helloPacket = function(ver, methods) {
	var b = new Buffer(methods.length + 2);
	
	b[0] = ver;
	b[1] = methods.length;
	
	for (var i = 0; i < methods.length;i++) b[i+2] = methods[i];
	
	return b;
}

utils.unpackHelloPacket = function(b) {
	return {
		version: b[0],
		method: b[1]
	}
};

utils.unpackReplyPacket = function(b) {
	var addr = '', port = 0, addr_type = b[3];
	
	var port_idx = 4;
	
	// TODO: later we can fetch these value lazily
	
	switch (addr_type) {
		case utils.ADDR_IPV4:
			addr = utils.unpackIPv4(b, 4);
			port_idx += 4;
			break;
		default:
			throw new Error("Not supported address type");
	}
	
	port = utils.unpackPort(b, port_idx);
	
	// VER + REPLY + RSV + ATYP + ADDR + PORT

	return {
		version: b[0],
		reply: b[1],
		address_type: addr_type,
		address: addr,
		port: port
	}
}

utils.requestPacket = function(ver, cmd, host, port) {
	var l = 6,
		addr = 0,
		b = null,
		packFunction = null;

	// determine address type
	if (utils.isIPv4(host)) {
		addr = utils.ADDR_IPV4;
		l += 4;
		packFunction = utils.packIPv4;
	} else {
		addr = utils.ADDR_DOMAIN;
		l += host.length + 1;
		packFunction = utils.packDomain;
	}
	
	// VER + CMD + RSV + ATYP + ADDR + PORT
	b = new Buffer(l);
	b[0] = ver;
	b[1] = cmd;
	b[2] = 0;
	b[3] = addr;
	packFunction(b, 4, host);
	utils.packPort(b, l-2, port);
	
	return b;
}

utils.packDomain = function(buffer, offset, host) {
	buffer[offset] = host.length;
	buffer.write(host, offset+1);
}

utils.packIPv4 = function(buffer, offset, ip) {
	var m = ip.split('.');
	assert.equal(4, m.length);
	
	for (var i = 0; i < m.length; i++) {
		buffer[offset + i] = m[i].toString(10);
	}
}

utils.packPort = function(buffer, offset, port) {
	var p1 = Math.floor(port / 256),
	  p2 = port % 256;
	
	buffer[offset] = p1;
	buffer[offset+1] = p2;
}

utils.unpackPort = function(buffer, offset) {
	return buffer[offset]*256 + buffer[offset+1];
}

utils.unpackIPv4 = function(b, offset) {
	var o1 = b[offset], o2 = b[offset+1], o3 = b[offset+2], o4 = b[offset+3];
	
	return o1 + "." + o2 + "." + o3 + "." + o4;
}

utils.isIPv4 = function(ip) {
	return /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.test(ip);
}

utils.debugBytes = function(data) {
	var b = new Buffer(data.length * 2);
	for (var i = 0; i < data.length; i++) {
		var h = data[i].toString(16) + '';
		if (h.length == 1) h = '0' + h;
		
		b.write(h, i*2);
	}
	
	return b;
}