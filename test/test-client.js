var socky = require('../lib/socky');

var factory = socky.createConnectionFactory(1111, 'localhost');
var connection = factory.createConnection(80, 'google.com');

connection.on('connect', function() {
	console.log('client connect');
});

connection.on('data', function(data) {
	console.log(data);
});

connection.on('end', function() {
	console.log('client end');
	
	connection.end();
});