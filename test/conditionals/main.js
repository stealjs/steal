var foo = require("~/polyfill#?./some/deep/folder/dont-load-it");
var bar = require("~/some/deep/#{./some/deep/folder/which}");

if (window.QUnit) {
	QUnit.equal(bar, "bar", "should load '~/some/deep/foo'");
	QUnit.notOk(foo === "polyfill", "should not load polyfill");
	QUnit.start();
	removeMyself();
} else {
	console.log("foo: ", foo);
	console.log("bar: ", bar);
}
