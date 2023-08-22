let QUnit = require("steal-qunit");

let helpers = require("./helpers");
let makeIframe = helpers.makeIframe;
let supportsES = helpers.supportsProto();
let supportsAsyncAwait = helpers.supportsAsyncAwait();

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

(supportsAsyncAwait ? QUnit.module : QUnit.skip)("babel presets - stage0", function() {
	if(true) {
		QUnit.test("can exclude the stage-0 babel preset", function(assert){
			makeIframe("stage0/site.html", assert);
		});
	}
});
