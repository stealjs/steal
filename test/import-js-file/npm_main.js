var Hola = require("salute.js");
var Hello = require("./salute.js");

if(typeof window !== "undefined" && window.assert) {
	assert.ok(true, "got main");
	assert.equal(Hello, "Hello", "got relative module");
	assert.equal(Hola, "Hola", "got npm module");
	done();
} else {
	console.log("main loaded", Hello + " World");
	console.log(Hola + " World");
}
