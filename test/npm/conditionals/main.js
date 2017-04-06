var helper = require("framework/#{which}");
var foo = require("framework/#{which.foo}");
var library = require("library#?conditions.isNeeded");

if (window.assert) {
	assert.equal(foo.name, "foo", "should load framework/foo");
	assert.equal(helper.name, "bar", "should load framework/bar");
	assert.equal(library.name, undefined, "should not load library");
	done();
} else {
	console.log("foo", foo);
	console.log("helper ", library);
	console.log("library ", library);
}
