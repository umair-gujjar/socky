var net = require('net');

exports.Server = Server = function(config) {
	this.config = config;

	this.server = net.createServer(function(socket) {
		socket.setEncoding("binary");
		socket.write("Echo server\r\n");
	
		socket.on("data", function (data) {
			socket.write(data);
		});
	
		socket.on("end", function () {
			socket.end();
		});
	});
}

Server.prototype.listen = function(port, host) {
	this.server.listen(port || this.config.port, host || this.config.host);
}

Server.prototype.close = function() {
	this.server.close();
}