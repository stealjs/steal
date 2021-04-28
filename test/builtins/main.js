var http = require("http");
var Emitter = require("events").EventEmitter;

if (typeof window !== "undefined" && window.assert) {
	assert.equal(typeof http.request, "function", "got the http module");
	assert.equal(typeof Emitter, "function", "Got EventEmitter");
	done();
} else {
	console.log("http", http, "EventEmitter", Emitter);
}
