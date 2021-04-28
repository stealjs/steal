var QUnit = require("steal-qunit");

QUnit.module("meta configuration", {
	afterEach: function(assert) {
		delete steal.config("meta").foo;
	}
});

QUnit.test("is set deep", function(assert) {
	steal.config({
		meta: {
			foo: {
				format: "global",
				deps: ["bar"]
			}
		}
	});

	steal.config({
		meta: {
			foo: {
				format: "global"
			}
		}
	});

	var cfg = steal.config("meta").foo;
	assert.equal(cfg.deps.length, 1, "still have the one dep");
});

QUnit.test("added deps get added", function(assert) {
	steal.config({
		meta: {
			foo: {
				format: "global",
				deps: []
			}
		}
	});

	steal.config({
		meta: {
			foo: {
				format: "global",
				deps: ["bar"]
			}
		}
	});

	var cfg = steal.config("meta").foo;
	assert.equal(cfg.deps.length, 1, "still have the one dep");
});

QUnit.test("setting deps to empty removes them", function(assert) {
	steal.config({
		meta: {
			foo: {
				format: "global",
				deps: ["bar"]
			}
		}
	});

	steal.config({
		meta: {
			foo: {
				format: "global",
				deps: []
			}
		}
	});

	var cfg = steal.config("meta").foo;
	assert.equal(cfg.deps.length, 0, "deps were removed");
});

QUnit.test("Can provide a string as the meta value", function(assert) {
	steal.config({
		meta: {
			foo: "bar"
		}
	});

	steal.config({
		meta: {
			foo: "qux"
		}
	});

	var cfg = steal.config("meta").foo;
	assert.equal(cfg, "qux", "meta was set");
});

