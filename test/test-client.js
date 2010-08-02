var socky = require('../lib/socky'),
  utils = require('../lib/utils'),
  assert = require('assert');

var factory = socky.createConnectionFactory(1211, 'localhost');
var connection = factory.createConnection(80, 'googl111e.com');

connection.on('connect', function() {
	assert.equal(utils.STATE.OPEN, connection.readyState);
	
	// send a simple HTTP request
	connection.write("GET /\r\n\r\n");
});

connection.on('data', function(data) {
	// just validate that we has data
	assert.ok(/google\.com/.test(data));
});

connection.on('end', function() {
	connection.end();
});