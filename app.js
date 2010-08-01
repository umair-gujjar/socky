var net = require('net');
var socky = require('./lib/socky');

var config = {
	port: 1080,
	host: '127.0.0.1'
};

var server = socky.createServer(config);
server.listen();

console.log("Server is running at " + config.host + ":" + config.port);