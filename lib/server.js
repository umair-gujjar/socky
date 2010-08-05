var net = require('net')
  Buffer = require('buffer'),
  assert = require('assert');

exports.Server = Server = function(config) {
	this.config = config;

	this.pserver = net.createServer(function(socket) {
		socket.setEncoding("binary");
	
		socket.on("data", function (data) {
			// TODO
		});
	
		socket.on("end", function () {
			socket.end();
		});
	});
}

Server.prototype.listen = function(port, host) {
	this.pserver.listen(port || this.config.port, host || this.config.host);
}

Server.prototype.close = function() {
	this.pserver.close();
}