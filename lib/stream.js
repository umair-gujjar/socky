var events = require("events"),
  net = require('net'),
  dns = require('dns'),
  sys = require('sys'),
  assert = require('assert'),
  utils = require('./utils');

var resetState = function(stream) {
	stream._connecting = false;
	stream._ready = false;
	stream.pstream = null;
}
  
exports.Stream = Stream = function(proxy_port, proxy_host) {
	events.EventEmitter.call(this);
	this.config = {
		proxy_host: proxy_host,
		proxy_port: proxy_port
	};
	
	resetState(this);
};

sys.inherits(Stream, events.EventEmitter);

// Events:
// ready: proxy stream is ready
// connect: proxy connection has been established
// data: incoming proxy data
// end: proxy connection end
// error: proxy connection error
// close: proxy connection close

Stream.prototype.init = function(callback) {
	callback = callback || utils.nothing;

	if (this.pstream == null) {
		var self = this;
		var stream = this.pstream = net.createConnection(this.config.proxy_port, this.config.proxy_host);
		
		stream.on('connect', function() {
			// send hello package
			stream.write(utils.helloPacket(utils.VER5, [utils.NOAUTH]));
		});
		
		stream.on('data', function(data) {
			if (!self._ready) {
				// version packet from server
				var p = utils.unpackHelloPacket(data);
				assert.equal(utils.VER5, p.version);
				assert.equal(utils.NOAUTH, p.method);
				
				self._ready = true;
				self.emit('ready');
				callback();
			} else if (self._connecting) {
				assert.equal(utils.STATE.OPENING, self.readyState);
			
				// reply to request packet
				self._connecting = false;
				
				var p = utils.unpackReplyPacket(data);
				assert.equal(utils.VER5, p.version);
				
				switch (p.reply) {
					case utils.REP_SUCCESS:
						self.emit('connect');
					break;
				
					default:
						throw new Error("Reply failure: " + p.reply);
				}
			} else {
				assert.equal(self.readyState, utils.STATE.OPEN);
				
				self.emit('data', data);
			}
		});
		
		stream.on('end', function() {
			// change state to end
			self.emit('end');
		});
		
		stream.on('error', function(exception) {
			throw exception;
		});
		
		stream.on('close', function(is_error) {
			self.emit('close', is_error);
		})
	} else {
		callback();
	}
}

Stream.prototype.connect = function(port, host) {
	var self = this;

	this.init(function() {
		self._connecting = true;
		self.pstream.write(utils.requestPacket(utils.VER5, utils.CMD_CONNECT, host, port));
	});
}

Stream.prototype.write = function(data) {
	// when we're ready, we can stream data
	var self = this;
	
	if (this.readyState != utils.STATE.OPEN) {
		throw new Error(utils.MSG.stream_not_ready);
	}
	
	self.pstream.write(data);
}

Stream.prototype.pause = function() {
	if (this.pstream) {
		this.pstream.pause();
	}
}

Stream.prototype.resume = function() {
	if (this.pstream) {
		this.pstream.resume();
	}
}

Stream.prototype.end = function() {
	if (this.pstream) {
		this.pstream.end();
		this.destroy();
	}
}

Stream.prototype.destroy = function(exception) {
	if (this.pstream) {
		this.pstream.destroy(exception);
		resetState(this);
	}
}

Stream.prototype.isProxyReady = function() {
	return this._ready;
};

Object.defineProperty(Stream.prototype, 'readyState', {
	get: function () {
		if (this._connecting) {
			return utils.STATE.OPENING;
		/*} else if (this.readable && this.writable) {
			assert(typeof this.fd == 'number');
			return 'open';
		} else if (this.readable && !this.writable){
			assert(typeof this.fd == 'number');
			return 'readOnly';
		} else if (!this.readable && this.writable){
			assert(typeof this.fd == 'number');
			return 'writeOnly';*/
		} else if (this.pstream) {
			return utils.STATE.OPEN;
		} else {
			return utils.STATE.CLOSED;
		}
	}
});