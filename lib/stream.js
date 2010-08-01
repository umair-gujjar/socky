var events = require("events"),
  net = require('net'),
  dns = require('dns'),
  sys = require('sys'),
  assert = require('assert'),
  utils = require('./utils');

exports.Stream = Stream = function(proxy_port, proxy_host) {
	events.EventEmitter.call(this);
	this.config = {
		proxy_host: proxy_host,
		proxy_port: proxy_port
	};
	
	this.pstream = null;
};

sys.inherits(Stream, events.EventEmitter);

// Events:
// ready: proxy stream is ready
// connect: proxy connection has been established
// data: incoming proxy data
// end: proxy connection end
// error: proxy connection error
// close: proxy connection close

Stream.prototype.init = function() {
	if (this.pstream == null) {
		var self = this;
		var stream = this.pstream = net.createConnection(this.config.proxy_port, this.config.proxy_host);
		
		stream.on('connect', function() {
			// send hello package
			stream.write(utils.helloPacket(utils.VER5, [utils.NOAUTH]));
		});
		
		stream.on('data', function(data) {
			if (self.readyState == utils.STATE.OPENING) {
				// version packet from server
				var p = utils.unpackHelloPacket(data);
				assert.equal(utils.VER5, p.version);
				assert.equal(utils.NOAUTH, p.method);
				
				self.emit('ready');
			} else {
				// reply packet
			}
		});
		
		stream.on('end', function() {
			stream.end();
			
			// change state to end
		});
		
		stream.on('error', function(exception) {
			throw exception;
		});
		
		stream.on('close', function(is_error) {
			self.emit('close');
		})
	}
}

Stream.prototype.connect = function(port, host) {
	
}

Stream.prototype.write = function() {
	throw new Error("Not implemented");
}

Stream.prototype.pause = function() {
	throw new Error("Not implemented");
}

Stream.prototype.resume = function() {
	throw new Error("Not implemented");
}

Stream.prototype.end = function() {
	throw new Error("Not implemented");
}

Stream.prototype.destroy = function(exception) {
	if (this.pstream != null) {
		this.pstream.destroy(exception);
	}
}

Object.defineProperty(Stream.prototype, 'readyState', {
	get: function () {
		return utils.STATE.OPENING;
	
		/*if (this._connecting) {
			return 'opening';
		} else if (this.readable && this.writable) {
			assert(typeof this.fd == 'number');
			return 'open';
		} else if (this.readable && !this.writable){
			assert(typeof this.fd == 'number');
			return 'readOnly';
		} else if (!this.readable && this.writable){
			assert(typeof this.fd == 'number');
			return 'writeOnly';
		} else {
			assert(typeof this.fd != 'number');
			return 'closed';
		}*/
	}
});