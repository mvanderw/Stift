self.addEventListener('message', function(e) {
	importScripts('raphael.js');

	// Helper tool to piece together Raphael's paths into strings again
	Array.prototype.flatten || (Array.prototype.flatten = function() {
		return this.reduce(function(a, b) {
			return a.concat('function' === typeof b.flatten ? b.flatten() : b);
		}, []);
	});

	self.postMessage(Raphael.path2curve(e.data.path).flatten().join(' '));

	//self.close()
}, false);