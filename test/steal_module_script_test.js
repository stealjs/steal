var QUnit = require("steal-qunit");
var makeIframe = require("./helpers").makeIframe;

QUnit.module("script type 'steal-module'");

QUnit.test("with an @empty config", function(assert) {
	makeIframe("steal-module-script/without-config.html", assert);
});

QUnit.test("with default config", function(assert) {
	makeIframe("steal-module-script/default-config.html", assert);
});

QUnit.test("with package.json as config", function(assert) {
	makeIframe("steal-module-script/npm-config.html", assert);
});

QUnit.test("type attr does not need to start with text #1185", function(assert) {
	makeIframe("steal-module-script/minimal-type.html", assert);
});
