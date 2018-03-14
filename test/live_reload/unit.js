var reloader = require("live-reload");
var loader = require("@loader");
loader.liveReloadReload = false;

function hookFetch(fn) {
	var oldFetch = loader.fetch;
	var defaultFetch = function(self, args){
		return function(){
			return oldFetch.apply(self, args);
		};
	}
	loader.fetch = function(){
		var args = [defaultFetch(this, arguments)].concat([].slice.call(arguments));
		return fn.apply(this, args);
	}
	return function(){
		loader.fetch = oldFetch;
	};
}

QUnit.module("Unit tests", {
	beforeEach: function(){
		this.undoHook = hookFetch(function(fetch, load){
			if(load.name === "foo") {
				return Promise.resolve("exports.foo = 'bar'");
			} else if(load.name === "bar") {
				return Promise.resolve("exports.bar = 'bam'");
			} else {
				debugger;
			}
		});
	},
	afterEach: function(){
		this.undoHook();
		loader.delete("foo");
		loader.delete("bar");
	}
});

QUnit.test("Exports a function", function(assert){
	assert.equal(typeof reloader, "function", "reload is a function");
});

QUnit.test("Can take a moduleName to teardown", function(assert){
	var done = assert.async();

	loader.set("foo", loader.newModule({default: {foo:'hah'}}));
	assert.equal(loader.get("foo").default.foo, 'hah', "initial value is right");

	reloader("foo")
	.then(function(){
		assert.equal(loader.get("foo").default.foo, 'bar', "value has updated");
	})
	.then(done, done);
});

if(window.console) {
	QUnit.test("Doesn't produce 'loaded twice' warning", function(assert){
		var done = assert.async();
		var testContext = this;

		loader.import("foo")
		.then(function(){
			assert.equal(loader.get("foo").default.foo, 'bar', "initial value is right");

			return reloader("foo");
		})
		.then(done, done);
	});
}

QUnit.test("Can take an array of moduleNames to teardown", function(assert){
	var done = assert.async();

	loader.set("foo", loader.newModule({default: {foo:'hah'}}));
	assert.equal(loader.get("foo").default.foo, 'hah', "initial value is right");

	loader.set("bar", loader.newModule({default: {bar: 'qux'}}));
	assert.equal(loader.get("bar").default.bar, "qux", "bar is right");

	var msg = JSON.stringify(["foo", "bar"]);
	reloader(msg)
	.then(function(){
		assert.equal(loader.get("foo").default.foo, 'bar', "value has updated");
		assert.equal(loader.get("bar").default.bar, "bam", "bar value has updated");
	})
	.then(done, done);
});

QUnit.module("Contextual live-reload module");

QUnit.test("Can be cloned", function(assert){
	var done = assert.async();

	loader.import("live-reload", { name: "clone-test" })
	.then(function(){
		var clone = loader.clone();
		return clone.import("live-reload", { name: "clone-test" });
	})
	.then(function(reload){
		// Duck check that this is the contextual
		assert.equal(typeof reload.isReloading, "function", "this function exists");
	})
	.then(done, done);
});

QUnit.test("Returns an error when there is an error", function(assert){
	var done = assert.async();
	var loaded = false;

	var undo = hookFetch(function(fetch, load){
		if(load.name === "oops") {
			if(loaded) {
				return Promise.resolve("module.exports = {}; oops 'bad';");
			} else {
				return Promise.resolve("module.exports = {};");
			}
		} else {
			return fetch();
		}
	});

	return loader.import("oops")
	.then(function(){
		loaded = true;
		loader.set("error-in-tree", loader.newModule({}));
		return loader.import("live-reload", { name: "error-in-tree" })
	})
	.then(function(reload){
		reload(function(err){
			assert.ok(err instanceof Error, "Got an error");
			reload.disposeModule("error-in-tree");
			undo();
			done();
		});

		reloader("oops");
	});
});

QUnit.module("reload.isReloading");

QUnit.test("is false by default", function(assert){
	var done = assert.async();

	loader.import("live-reload", { name: "reload-test" })
	.then(function(reload){
		assert.equal(reload.isReloading(), false, "no reload is happening");
	})
	.then(done, done);
});

QUnit.test("is true while in a reload cycle", function(assert){
	var done = assert.async();

	loader.import("live-reload", { name: "reload-test" })
	.then(function(reload){
		var p = reloader("foo");

		assert.equal(reload.isReloading(), true, "Now it is reloading");

		return p.then(function(){
			assert.equal(reload.isReloading(), false, "False because we are not reloading");
		});
	})
	.then(done, done);
});

QUnit.module("orphaned modules");

QUnit.test("are deleted when a parent module no longer uses it", function(assert){
	var done = assert.async();
	var fooSrc;

	var undo = hookFetch(function(fetch, load){
		if(load.name === "foo") {
			var src = fooSrc || "req" + "uire('bar');";
			return Promise.resolve(src);
		} else if(load.name === "bar") {
			return Promise.resolve("exports.foo = 'bar';");
		} else {
			return fetch();
		}
	});

	loader.import("foo")
	.then(function(){
		assert.ok(loader.has("foo"), "has foo");
		assert.ok(loader.has("bar"), "has bar");
	})
	.then(function(reload){
		fooSrc = "var a;";
		return reloader("foo");
	})
	.then(function(){
		assert.ok(!loader.has("bar"), "orphaned module removed");
	})
	.then(function(){
		undo();
		loader.delete("foo");
		loader.delete("bar");
	})
	.then(done, done);
});

QUnit.test("are not removed if they have another parent", function(assert){
	var done = assert.async();
	var test = this;
	var fooSrc;

	var undo = hookFetch(function(fetch, load){
		if(load.name === "foo") {
			var src = fooSrc || "req" + "uire('bar');";
			return Promise.resolve(src);
		} else if(load.name === "bar") {
			return Promise.resolve("exports.foo = 'bar';");
		} else if(load.name === "qux") {
			return Promise.resolve("req" + "uire('bar');");
		} else {
			return fetch();
		}
	});

	loader.import("foo")
	.then(function(){
		return loader.import("qux");
	}).then(function(){
		assert.ok(loader.has("foo"), "has foo");
		assert.ok(loader.has("bar"), "has bar");
		assert.ok(loader.has("qux"), "has qux");
	})
	.then(function(reload){
		fooSrc = "var a;";
		return reloader("foo");
	})
	.then(function(){
		assert.ok(loader.has("bar"), "orphaned module removed");
	})
	.then(function(){
		undo();
		loader.delete("foo");
		loader.delete("bar");
		loader.delete("qux");
	})
	.then(done, function(err){
		undo();
		assert.notOk(err);
		done(err);
	});
});

QUnit.module("reload.dispose", {
	beforeEach: function(assert){
		var test = this;

		this.undoHook = hookFetch(function(fetch, load){
			if(load.name === "foo") {
				return Promise.resolve("requ" + "ire('bar');");
			} else if(load.name === "bar") {
				return Promise.resolve("exports.bar = 'bam'");
			} else if(load.name === "baz") {
				return Promise.resolve("requ" + "ire('foo');");
			} else {
				return fetch();
			}
		});
	},
	afterEach: function(){
		this.undoHook();
		loader.delete("foo");
		loader.delete("bar");
	}
});

QUnit.test("allows modules to dispose themselves", function(assert){
	var done = assert.async();

	loader.set("foo", loader.newModule({}));

	loader.import("live-reload", { name: "foo" })
	.then(function(reload){
		reload.dispose(function(){
			assert.ok(true, "this dispose was called");
		});

		return reloader("foo");
	})
	.then(done, done);
});

QUnit.test("disposes only the modules that it should", function(assert){
	var done = assert.async();

	loader.set("foo", loader.newModule({}));

	loader.import("live-reload", { name: "reload-foo-test" })
	.then(function(reload){
		// foo depends on bar
		reload.dispose("bar", function(){
			assert.ok(false, "bar should not be disposed");
		});

		reload.dispose("foo", function(){
			assert.ok(true, "it worked");
		});

		return reloader("foo");
	})
	.then(done, done);
});

QUnit.module("reload.disposeModule");

QUnit.test("Removes a module from the registry", function(assert){
	var done = assert.async();

	loader.set("dispose-foo", loader.newModule({}));

	loader.import("live-reload", { name: "dispose-foo-test" })
	.then(function(reload){
		assert.ok(loader.has("dispose-foo"), "in the registry");

		reload.disposeModule("dispose-foo");
		assert.ok(!loader.has("dispose-foo"), "not in the registry");
	})
	.then(done, done);
});

QUnit.test("Emits a dispose event for a module that is removed", function(assert){
	var done = assert.async();

	loader.set("dispose-foo", loader.newModule({}));

	loader.import("live-reload", { name: "dispose-foo-test" })
	.then(function(reload){
		reload.dispose("dispose-foo", function(){
			assert.ok(true, "notified of a module being disposed");
		});

		reload.disposeModule("dispose-foo");
	})
	.then(done, done);
});

QUnit.test("Removes modules that have previously failed", function(assert){
	var done = assert.async();

	var undo = hookFetch(function(fetch, load){
		if(load.name === "some-parent-module") {
			return Promise.resolve("import 'some-module';");
		} else if(load.name === "some-module") {
			return Promise.resolve("export default {}; import oops();")
		} else {
			return fetch();
		}
	});

	loader.import("some-parent-module")
	.then(null, function(err){
		undo();
		return loader.import("live-reload", { name: "dispose-failed-test" });
	})
	.then(function(reload){
		reload.disposeModule("some-module");

		undo = hookFetch(function(fetch, load){
			if(load.name === "some-parent-module") {
				return Promise.resolve("import 'some-module';");
			} else if(load.name === "some-module") {
				return Promise.resolve("export default {};");
			} else {
				return fetch();
			}
		});

		// Should work now
		return loader.import("some-parent-module");
	})
	.then(function(v){
		undo();
		assert.ok(true, "Finished without error");
		done();
	}, function(err){
		undo();
		assert.notOk(err, "Failed to load once disposed");
		done(err);
	});
});

QUnit.start();
