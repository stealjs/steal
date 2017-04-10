var QUnit = require("steal-qunit");
var _loader = require("@loader");

function makeLoader(){
	this.loader = _loader.clone();
	if(_loader.main == "src/trace/trace_test") {
		this.loader.baseURL = "./";
	}else {
		this.loader.baseURL = _loader.baseURL + "src/trace";
	}

	this.loader.paths = _loader.paths;
}

function setupBasics(assert){
	makeLoader.call(this);

	var done = assert.async();
	this.loader.import("tests/basics/main")
		.then(done, assertFailure("Failed to load"));
}

function assertFailure(reason){
	var doAssert = function(reason, error){
		var theReason;
		if(error) {
			theReason = reason + "\n" + error;
		}

		QUnit.ok(false, theReason);
	};
	return reason ? doAssert.bind(null, "Failure") : doAssert(reason);
}


QUnit.module("getDependencies", {
	beforeEach: setupBasics
});

QUnit.test("Gets the dependencies of a module", function(assert) {
	var loader = this.loader;

	assert.deepEqual(loader.getDependencies("tests/basics/main"),
					["tests/basics/b", "tests/basics/c"],
					"Correctly gets the dependencies for the main");

	assert.deepEqual(loader.getDependencies("tests/basics/c"),
					["tests/basics/d", "tests/basics/f",
					"tests/basics/g"],
					"Correctly gets the dependencies for the c module");

	assert.deepEqual(loader.getDependencies("tests/basics/g"),
					["tests/basics/h"],
					"Correctly gets the dependencies for the g module");

	assert.deepEqual(loader.getDependencies("tests/basics/h"),
					["tests/basics/j"],
					"Correctly gets the dependencies for the h module");

	assert.deepEqual(loader.getDependencies("tests/basics/j"), [],
					"Correctly gets the dependencies for the j module");
});

QUnit.test("Ignores import statements within backticks", function(assert) {
	var loader = this.loader;
	var done = assert.async();

	loader["import"]("tests/basics/str")
	.then(function(){
		assert.deepEqual(loader.getDependencies("tests/basics/str"), [],
						"this module has no deps");
	})
	.then(done, function() {
		assert.ok(false, "should not fail");
	});
});

QUnit.test("Returns undefined when a module is not in the graph", function(assert) {
	var loader = this.loader;

	assert.equal(loader.getDependencies("test/basics/not_in_graph"), undefined,
				"undefined is returned when the module is not in the graph");
});

QUnit.test("gets dependency below a commented out import #23", function(assert) {
	var loader = this.loader;
	var done = assert.async();

	loader["import"]("tests/basics/k")
		.then(function() {
			assert.deepEqual(
				loader.getDependencies("tests/basics/k"),
				["tests/basics/b", "tests/basics/c", "tests/basics/d"],
				"should not ignore dependencies below a commented out import"
			);
		})
		.then(done);
});

QUnit.test("gets dependencies when there are comments between them #21", function(assert) {
	var loader = this.loader;
	var done = assert.async();

	loader["import"]("tests/basics/l")
		.then(function() {
			assert.deepEqual(
				loader.getDependencies("tests/basics/l"),
				["tests/basics/h", "tests/basics/j"],
				"should not ignore dependencies with comments between them"
			);
		})
		.then(done);
});

QUnit.module("getDependants", {
	beforeEach: setupBasics
});

QUnit.test("Gets modules that are dependants", function(assert) {
	var loader = this.loader;

	assert.deepEqual(loader.getDependants("tests/basics/b"), ["tests/basics/main"],
										 "main is the only dependant");
	var dDeps = loader.getDependants("tests/basics/d").sort();
	assert.deepEqual(dDeps, ["tests/basics/c","tests/basics/e"],
					"c and e are dependants");
	assert.deepEqual(loader.getDependants("tests/basics/main"), [],
										 "main has no dependants");
});

QUnit.module("getModuleLoad", {
	beforeEach: setupBasics
});

QUnit.test("Gets the module's load object", function(assert) {
	var loader = this.loader;

	var load = loader.getModuleLoad("tests/basics/b");

	assert.ok(load.source, "Has source");
});

QUnit.module("preventModuleExecution", {
	beforeEach: function(assert){
		makeLoader.call(this);

		var done = assert.async();
		this.loader.preventModuleExecution = true;
		this.loader.import("tests/basics/prevent_me")
			.then(done, assertFailure("Failed to load"));
	}
});

QUnit.test("Prevents a module from executing", function(assert) {
	var loader = this.loader;

	var value = loader.get("tests/basics/prevent_me")["default"];

	assert.equal(typeof value, "undefined", "The module is an empty object");
	assert.ok(loader.get("tests/basics/d"), "the d module loaded even though its parent is an es6 module");

	var dDeps = loader.getDependencies("tests/basics/prevent_me").sort();
	assert.deepEqual(dDeps, ["tests/basics/main", "tests/basics/prevent_es"],
					"got the correct dependencies");

	var cDeps = loader.getDependencies("tests/basics/c").sort();
	assert.deepEqual(cDeps, ["tests/basics/d", "tests/basics/f",
		"tests/basics/g"]);
});

QUnit.module("preventModuleExecution with babel", {
	beforeEach: function(assert){
		makeLoader.call(this);

		var done = assert.async();
		this.loader.preventModuleExecution = true;
		this.loader.transpiler = "babel";
		this.loader.import("tests/basics/prevent_me")
			.then(done, assertFailure("Failed to load"));
	}
});

QUnit.test("Prevents a module from executing", function(assert) {
	var loader = this.loader;

	var value = loader.get("tests/basics/prevent_me")["default"];

	assert.equal(typeof value, "undefined", "The module is an empty object");
	assert.ok(loader.get("tests/basics/d"), "the d module loaded even though its parent is an es6 module");
});

QUnit.module("getBundles", {
	beforeEach: setupBasics
});

QUnit.test("Gets the top-level module", function(assert) {
	var loader = this.loader;

	assert.deepEqual(loader.getBundles("tests/basics/d"), ["tests/basics/main"],
				"main is the bundle");
});

QUnit.module("production", {
	beforeEach: function(assert){
		makeLoader.call(this);

		this.loader.baseURL = this.loader.baseURL + "/tests/production";
		this.loader.bundles = {"bundles/main":["main"]};
		this.loader.loadBundles = true;

		var done = assert.async();
		this.loader.import("main")
			.then(done, assertFailure("Failed to load"));
	}
});

QUnit.test("Loads normally", function(assert) {
	assert.ok(true, "it loaded!");
});

QUnit.module("eachModule", {
	beforeEach: function() {
		makeLoader.call(this);

		this.loader.set('module1', System.newModule({'default': function() { return 'foo'; }, __useDefault: true }));
		this.loader.set('module2', System.newModule({'bar': function() { return 'bar'; } }));
	}
});

QUnit.test("Calls callback", function(assert) {
	this.loader.eachModule(function(name, val) {
		if (name === 'module1') {
			assert.equal(val['default'](), 'foo', 'should get correct value for module1');
		}
		if (name === 'module2') {
			assert.equal(val.bar(), 'bar', 'should get correct value for module2');
		}
	});
});
