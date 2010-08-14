var socky = require('../lib/socky'),
  utils = require('../lib/utils'),
  assert = require('assert');

// TODO: test by passing an external stream
  
var connection = new socky.Stream(1211, 'localhost');
var reused = false;

connection.on('connect', function() {
	assert.ok(connection.isProxyReady());
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

connection.on('close', function() {
	assert.equal(utils.STATE.CLOSED, connection.readyState);
});