var helper = require("framework/#{which}");
var foo = require("framework/#{which.foo}");
var library = require("library#?conditions.isNeeded");

if (window.QUnit) {
	QUnit.equal(foo.name, "foo", "should load framework/foo");
	QUnit.equal(helper.name, "bar", "should load framework/bar");
	QUnit.equal(library.name, undefined, "should not load library");
	removeMyself();
} else {
	console.log("foo", foo);
	console.log("helper ", library);
	console.log("library ", library);
}
