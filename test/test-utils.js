var utils = require('../lib/utils'),
  assert = require('assert');

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
	'google.com': 'google.com',
	'www.google.com': 'www.google.com',
};
for (var addr in domains) {
	buff = new Buffer(addr.length);
	utils.packDomain(buff, 0, addr);
	
	assert.equal(domains[addr], buff.toString('ascii', 0, addr.length));
	delete(buff);
}