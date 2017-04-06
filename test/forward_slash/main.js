var foo = require("forward_slash/folder/").foo;
var bar = require("forward_slash/folder/foo/").bar;
var baz = require("forward_slash/folder/foo/bar/").baz;

if (typeof window !== "undefined" && window.assert) {
	assert.equal(foo, "bar", "value set in folder module");
	assert.equal(bar, "baz", "value set in folder/foo module");
	assert.equal(baz, "end", "value set in folder/foo/bar module");
	done();
} else {
	console.log("foo ", foo);
	console.log("bar ", bar);
	console.log("baz ", baz);
}
