let QUnit = require("steal-qunit");

let helpers = require("./helpers");
let makeIframe = helpers.makeIframe;
let supportsES = helpers.supportsProto();

(supportsES ? QUnit.module : QUnit.skip)("babel plugins", function(hooks) {
	QUnit.test("babel plugins works", function(assert) {
		makeIframe("babel_plugins/dev.html", assert);
	});

	QUnit.test("passing options to babel plugins works", function(assert) {
		makeIframe("babel_plugin_options/dev.html", assert);
	});

	QUnit.test("environment dependant plugins work", function(assert) {
		makeIframe("babel_env_plugins/dev.html", assert);
	});
});
