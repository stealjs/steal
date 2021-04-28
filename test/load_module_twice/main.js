require("./bar");
var foo = require("./foo");
var foo2 = require("foo");

if (!window || !window.assert) {
	console.log("foo: ", foo);
	console.log("foo2: ", foo2);
}
