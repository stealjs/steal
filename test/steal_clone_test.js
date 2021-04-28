var QUnit = require("steal-qunit");

var helpers = require("./helpers");
var makeIframe = helpers.makeIframe;
var supportsES = helpers.supportsProto();

QUnit.module("steal-clone extension tests");

QUnit.test("basics work", function(assert) {
	makeIframe("ext-steal-clone/basics/index.html", assert);
});

QUnit.test("does not share the module registry and extensions with cloned loader", function(assert) {
	makeIframe("ext-steal-clone/config-separation/index.html", assert);
});

QUnit.test("allows you to override a module with a default export", function(assert) {
	makeIframe("ext-steal-clone/default-export-usedefault/index.html", assert);
});

QUnit.test("allows you to override a module with a default export without setting __useDefault", function(assert) {
	makeIframe("ext-steal-clone/default-export/index.html", assert);
});

QUnit.test("caches source of parent modules to avoid duplicate downloads", function(assert) {
	makeIframe("ext-steal-clone/fetch-cache/index.html", assert);
});

QUnit.test("works when overriding multiple modules", function(assert) {
	makeIframe("ext-steal-clone/multiple-overrides/index.html", assert);
});

(supportsES ? QUnit.test : QUnit.skip)("works when using the npm extensions", function(assert) {
	makeIframe("ext-steal-clone/npm-extension/index.html", assert);
});

QUnit.test("works when a parent of injected dependency has been imported", function(assert) {
	makeIframe("ext-steal-clone/prior-import/index.html", assert);
});

QUnit.test("works when using relative imports", function(assert) {
	makeIframe("ext-steal-clone/relative-import/index.html", assert);
});

QUnit.test("works when using relative overrides", function(assert) {
	makeIframe("ext-steal-clone/relative-override/index.html", assert);
});

QUnit.test("what happens within a cloned loader should not leak", function(assert) {
	makeIframe("ext-steal-clone/leak/index.html", assert);
});


QUnit.test("multiple clones can work at different paths", function(assert) {
	makeIframe("ext-steal-clone/multiple/index.html", assert);
});
