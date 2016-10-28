
QUnit.module("meta configuration", {
	teardown: function(){
		delete steal.config("meta").foo;
	}
});

QUnit.test("is set deep", function(){
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
	QUnit.equal(cfg.deps.length, 1, "still have the one dep");
});

QUnit.test("added deps get added", function(){
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
	QUnit.equal(cfg.deps.length, 1, "still have the one dep");
});

QUnit.test("setting deps to empty removes them", function(){
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
	QUnit.equal(cfg.deps.length, 0, "deps were removed");
});

QUnit.test("Can provide a string as the meta value", function(){
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
	QUnit.equal(cfg, "qux", "meta was set");
});

