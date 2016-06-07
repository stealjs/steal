var Hola = require("salute.js");
var Hello = require("./salute.js");

if(typeof window !== "undefined" && window.QUnit) {
	QUnit.ok(true, "got main");
	QUnit.equal(Hello, "Hello", "got relative module");
	QUnit.equal(Hola, "Hola", "got npm module");

	QUnit.start();
	removeMyself();
} else {
	console.log("main loaded", Hello + " World");
	console.log(Hola + " World");
}