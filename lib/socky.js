exports.Server = Server = require('./server').Server;
exports.Stream = Stream = require('./stream').Stream;

// proxy server

exports.createServer = function(config) {
	var server = new Server(config);

	return server;
};

// proxy stream and factory class

exports.Factory = Factory = function(proxy_port, proxy_host) {
	this.config = {};
	this.config.proxy_host = proxy_host;
	this.config.proxy_port = proxy_port;
};

exports.createConnectionFactory = function(proxy_port, proxy_host) {
	var factory = new Factory(proxy_port, proxy_host);
	
	return factory;
};

Factory.prototype.createConnection = function(port, host) {
  var s = new Stream(this.config.proxy_port, this.config.proxy_host);
  s.connect(port, host);
  return s;
};