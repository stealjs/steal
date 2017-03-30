var QUnit = require("steal-qunit");
var makeIframe = require("./make_iframe");
var supportsES = require("./supports_proto")();

(supportsES ? QUnit.module : QUnit.skip)("babel presets", function() {
	QUnit.test("babel presets work", function(assert) {
		makeIframe("babel_presets/dev.html", assert);
	});

	QUnit.test("passing options to babel plugins works", function(assert) {
		makeIframe("babel_presets_options/dev.html", assert);
	});

	QUnit.test("environment dependant presets work", function(assert) {
		makeIframe("babel_env_presets/dev.html", assert);
	});
});
