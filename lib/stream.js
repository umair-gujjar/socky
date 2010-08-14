var events = require("events"),
  net = require('net'),
  dns = require('dns'),
  sys = require('sys'),
  assert = require('assert'),
  utils = require('./utils');

var resetState = function(stream) {
	stream._connectInfo = null;
	stream._connecting = false;
	stream._ready = false;
};

var failure = function(stream, exception) {
	stream.destroy(exception);
	throw exception;
};
  
exports.Stream = Stream = function(proxy_port, proxy_host) {
	var self = this;

	events.EventEmitter.call(this);
	this.config = {
		proxy_host: proxy_host,
		proxy_port: proxy_port
	};
	
	resetState(this);
	
	var stream = null;
	
	// create a stream if not provided
	if (stream == null) {
		stream = new net.Stream;
	}
	
	this.pstream = stream;
	
	stream.on('connect', function() {
		// send hello package
		stream.write(utils.helloPacket(utils.VER5, [utils.AUTH_NONE]));
	});
		
	stream.on('data', function(data) {
		var p = null;
	
		if (!self._ready) {
			// version packet from server
			p = utils.unpackHelloPacket(data);
			assert.equal(utils.VER5, p.version);
			
			switch (p.method) {
				case utils.AUTH_NONE:
					self._ready = true;
					self.emit('ready');
					
					self._connecting = true;
					self.pstream.write(utils.requestPacket(utils.VER5, utils.CMD_CONNECT, self._connectInfo[0], self._connectInfo[1]));
					break;
					
				case utils.AUTH_AUTH_USERPASS:
					// TODO
				
					failure(self, new Error(utils.MSG.not_implemented));
					break;
					
				case utils.AUTH_FAIL:
					failure(self, new Error(utils.MSG.no_auth_method));
					break;
			}
		}
		else if (self._connecting) {
			assert.equal(utils.STATE.OPENING, self.readyState);
		
			// reply to request packet
			self._connecting = false;
			
			p = utils.unpackReplyPacket(data);
			assert.equal(utils.VER5, p.version);
			
			switch (p.reply) {
				case utils.REP_SUCCESS:
					self.emit('connect');
				break;
			
				default:
					throw new Error("Reply failure: " + p.reply);
			}
		}
		else {
			assert.equal(self.readyState, utils.STATE.OPEN);
			
			self.emit('data', data);
		}
	});
	
	stream.on('end', function() {
		self.emit('end');
	});
	
	stream.on('error', function(exception) {
		failure(self, exception);
	});
	
	stream.on('close', function(is_error) {
		// reset state
		resetState(self);
		
		self.emit('close', is_error);
	})
};

sys.inherits(Stream, events.EventEmitter);

// Events:
// ready: proxy stream is ready
// connect: proxy connection has been established
// data: incoming proxy data
// end: proxy connection end
// error: proxy connection error
// close: proxy connection close

Stream.prototype.connect = function(port, host) {
	// TODO: check whether we can establish a connection or not
	
	if (this.pstream.readyState == 'closed') {
		this._connectInfo = [host, port];
		this.pstream.connect(this.config.proxy_port, this.config.proxy_port);
	}
	else {
		throw new Error("Closed connection first");
	}
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
		if (this._connectInfo == null) {
			return utils.STATE.CLOSED;
		} else if (!this._ready || this._connecting) {
			return utils.STATE.OPENING;
		} else {
			return this.pstream.readyState;
		}
	}
});