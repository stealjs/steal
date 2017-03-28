var makeIframe = require("../make_iframe");

QUnit.module("live-reload behavior");

QUnit.test("can install something", function(assert) {
	makeIframe("live-reload/dev.html", assert);
});

QUnit.start();
