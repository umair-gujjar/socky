var utils = require('../lib/utils'),
  assert = require('assert'),
  Buffer = require('buffer').Buffer;

// isIPv4
var IPv4 = ['127.0.0.1', '0.0.0.0', '255.255.255.255'];
var notIPv4 = ['12345', 'google.com'];

IPv4.forEach(function(ip) {
	assert.ok(utils.isIPv4(ip));
});

notIPv4.forEach(function(ip) {
	assert.ok(!utils.isIPv4(ip));
});

// packIPv4
var IPv4bin = {
	'127.0.0.1': '\x7F\x00\x00\x01',
	'0.0.0.0': '\x00\x00\x00\x00',
};

var buff = new Buffer(4);
for (var addr in IPv4bin) {
	utils.packIPv4(buff, 0, addr);
	
	assert.equal(IPv4bin[addr], buff.toString('ascii', 0, 4));
}
delete buff;

// packDomain
var domains = {
	'google.com': '\x0agoogle.com',
	'www.google.com': '\x0ewww.google.com',
};

for (var addr in domains) {
	buff = new Buffer(addr.length+1, 'binary');
	utils.packDomain(buff, 0, addr);
	
	assert.equal(domains[addr], buff.toString('binary', 0, buff.length));
	delete buff;
}

// packPort
var ports = {
	80: '\x00\x50',
	1121: '\x04\x61',
	65535: '\xff\xff',
};

buff = new Buffer(2);
for (var port in ports) {
	utils.packPort(buff, 0, port);
	
	assert.equal(ports[port], buff.toString('binary', 0, buff.length));
	assert.equal(port, utils.unpackPort(buff, 0));
}

delete buff;