
QUnit.module("meta configuration", {
	teardown: function(){
		delete System.meta.foo;
	}
});

QUnit.test("meta configuration is set deep", function(){
	System.config({
		meta: {
			foo: {
				format: "global",
				deps: ["bar"]
			}
		}
	});

	System.config({
		meta: {
			foo: {
				format: "global"
			}
		}
	});

	var cfg = System.meta.foo;
	QUnit.equal(cfg.deps.length, 1, "still have the one dep");
});
