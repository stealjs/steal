var http = require("http");
var Emitter = require("events").EventEmitter;

if(typeof window !== "undefined" && window.QUnit) {
	QUnit.equal(typeof http.request, "function", "got the http module");
	QUnit.equal(typeof Emitter, "function", "Got EventEmitter");

	QUnit.start();
	removeMyself();
} else {
	console.log("http", http, "EventEmitter", Emitter);
}
