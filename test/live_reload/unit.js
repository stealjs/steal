var reloader = require("live-reload");
var loader = require("@loader");

QUnit.module("Unit tests", {
	beforeEach: function(){
		var fetch = this.oldFetch = loader.fetch;
		loader.fetch = function(load){
			if(load.name === "foo") {
				return Promise.resolve("exports.foo = 'bar'");
			} else if(load.name === "bar") {
				return Promise.resolve("exports.bar = 'bam'");
			}
		};
	},
	afterEach: function(){
		loader.fetch = this.oldFetch;
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

	var fetch = loader.fetch;
	var test = this;
	loader.fetch = function(load){
		if(load.name === "foo") {
			var src = fooSrc || "req" + "uire('bar');";
			return Promise.resolve(src);
		} else if(load.name === "bar") {
			return Promise.resolve("exports.foo = 'bar';");
		}
	};

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
		loader.fetch = fetch;
		loader.delete("foo");
		loader.delete("bar");
	})
	.then(done, done);
});

QUnit.test("are not removed if they have another parent", function(assert){
	var done = assert.async();
	var fooSrc;

	var fetch = loader.fetch;
	var test = this;
	loader.fetch = function(load){
		if(load.name === "foo") {
			var src = fooSrc || "req" + "uire('bar');";
			return Promise.resolve(src);
		} else if(load.name === "bar") {
			return Promise.resolve("exports.foo = 'bar';");
		} else if(load.name === "qux") {
			return Promise.resolve("req" + "uire('bar');");
		}
	};

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
		loader.fetch = fetch;
		loader.delete("foo");
		loader.delete("bar");
		loader.delete("qux");
	})
	.then(done, done);
});

QUnit.module("reload.dispose", {
	beforeEach: function(assert){
		var test = this;

		var fetch = this.oldFetch = loader.fetch;
		loader.fetch = function(load){
			if(load.name === "foo") {
				return Promise.resolve("requ" + "ire('bar');");
			} else if(load.name === "bar") {
				return Promise.resolve("exports.bar = 'bam'");
			} else if(load.name === "baz") {
				return Promise.resolve("requ" + "ire('foo');");
			}
		};
	},
	afterEach: function(){
		loader.fetch = this.oldFetch;
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

QUnit.start();
