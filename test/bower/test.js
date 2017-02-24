QUnit.module("system-bower plugin");

QUnit.test("Basics works", function(assert) {
	var done = assert.async();

	System.import("lodash")
		.then(function(_) {
			assert.equal(typeof _, "function", "Function returned");
		})
		.then(done);
});

QUnit.test("Loads globals", function(assert) {
	var done = assert.async();

	System.import("jquery")
		.then(function() {
			assert.ok($.fn.jquery, "jQuery loaded");
		})
		.then(done);
});

QUnit.test("Loads buildConfig", function(assert) {
	var done = assert.async();

	System.import("test/bower/build_config/bower.json!bower")
		.then(function(){
			var config = System.buildConfig;
			assert.ok(config, "buildConfig added");
			assert.equal(config.map.foo, "bar", "Correct map included");
		})
		.then(done);
});

QUnit.test("Replaces bower_components path in paths", function(assert) {
	var done = assert.async();

	System.bowerPath = "vendor";
	System.import("test/bower/alt_path/bower.json!bower")
		.then(function(){
			assert.equal(System.paths.bar, "vendor/bar/bar.js", "Correct path set");
		})
		.then(done);
});

QUnit.test("system.main overrides main", function(assert) {
	var done = assert.async();

	System.bowerPath = "test/bower";
	System.import("test/bower/system_main/bower.json!bower")
		.then(function(){
			return System.import("system_main");
		})
		.then(function(m) {
			assert.equal(m(), "second", "the system.main was used");
		})
		.then(done);
});

QUnit.module('system-bower plugin: bowerIgnore option', {
	setup: function() {
		this.oldBowerPath = System.bowerPath;
		System.bowerPath = "test/bower/bower_ignore/bower_components";
	},
	teardown: function() {
		if (this.oldFetch) {
			System.fetch = this.oldFetch;
		}
		System.bowerPath = this.oldBowerPath;
	}
});

QUnit.test("Ignores deps you tell it to ignore", function(assert) {
	var done = assert.async();

	var fetch = this.oldFetch = System.fetch;
	System.fetch = function(load){
		if (/ignoreme/.test(load.name)) {
			throw new Error("Trying to load ignoreme");
		}
		return fetch.call(this, load);
	};

	System.import("test/bower/bower_ignore/bower.json!bower")
		.then(function() {
			assert.ok(true, "it worked");
		})
		.then(done, function(err){
			assert.equal(err, null, "got an error");
			done();
		});
});

QUnit.test("Modules with their own config works", function(assert) {
	var done = assert.async();

	System.bowerPath = "bower_components";
	System.import("can")
		.then(function(can){
			var $ = can.$;
			var tmpl = can.mustache("Hello {{name}}");

			$("#qunit-test-area").html(tmpl({
				name: "World"
			}));

			assert.equal($("#qunit-test-area").html(), "Hello World", "Loaded can and rendered a template");
		})
		.then(done);
});

QUnit.start();
