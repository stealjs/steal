var QUnit = require("steal-qunit");

QUnit.module("steal via system import");

QUnit.test("steal basics", function(assert) {
    return System["import"]("test/tests/module")
		.then(function(m){
			assert.equal(m.name,"module.js", "module returned" );
			assert.equal(m.bar.name, "bar", "module.js was not able to get bar");
		});
});

QUnit.test("steal's normalize", function(assert) {
    return System["import"]("test/tests/mod/mod")
		.then(function(m){
			assert.equal(m.name,"mod", "mod returned" );
			assert.equal(m.module.bar.name, "bar", "module.js was able to get bar");
			assert.equal(m.widget(), "widget", "got a function");
		});
});

QUnit.test("steal's normalize with a plugin", function(assert) {
    return System.instantiate({
		name: "foo",
		metadata: {format: "steal"},
		source: 'steal("foo/bar!foo/bar", function(){})'
	}).then(function(result){
		assert.equal(result.deps[0], "foo/bar/bar!foo/bar", "normalize fixed part before !");
	});
});

QUnit.test("steal's normalize with plugin only the bang", function(assert) {
    var done = assert.async();
    System.instantiate({
		name: "foobar",
		metadata: {format: "steal"},
		source: 'steal("./rdfa.stache!", function(){})'
	}).then(function(result){
		System.normalize(result.deps[0], "foo","http://abc.com").then(function(result){
			assert.equal(result, "rdfa.stache!stache", "normalize fixed part before !");
			done();
		});
	});
});

QUnit.test("ignoring an import by mapping to @empty", function(assert) {
	System.map["test/map-empty/other"] = "@empty";

	return System["import"]("test/map-empty/main")
		.then(function(m) {
			var empty = System.get("@empty");
			assert.equal(m.other, empty, "Other is an empty module because it was mapped to empty in the config");
		});
});

QUnit.test("steal.dev.assert", function(assert) {
    var done = assert.async();
    System["import"]("@dev").then(function(){
		assert.throws(
			function() {
				steal.dev.assert(false);
			},
			/Expected/,
			"throws an error with default message"
		);
		assert.throws(
			function() {
				steal.dev.assert(false, "custom message");
			},
			/custom message/,
			"throws an error with custom message"
		);
		done();
	});
});

QUnit.test("__esModule flag is added by babel plugin", function(assert) {
	var done = assert.async();

	return System["import"]("test/babel/other")
		.then(function(mod) {
			assert.ok(mod.__esModule, "flag should have been added");
			done();
		})
		.then(null, function(err) {
			assert.notOk(err, "should not fail");
			done();
		});
});

QUnit.test("__esModule flag only set to ES6 modules", function(assert) {
	var done = assert.async();

	return System["import"]("test/tests/module")
		.then(function(mod) {
			assert.notOk(mod.__esModule, "not an ES6 module");
			done();
		})
		.then(null, function(err) {
			assert.notOk(err, "should not fail");
			done();
		});
});

QUnit.test("babel decorators plugin work", function(assert) {
	var done = assert.async();

	System["import"]("test/decorators/package.json!npm")
		.then(function() {
			return System["import"]("test/decorators/cellphone");
		})
		.then(function(mod) {
			var Cellphone = mod.default;
			var foo = new Cellphone();

			assert.equal(foo.brand, "Bitovi", "decorators should work");
			done();
		})
		.catch(function(err) {
			assert.notOk(err, "should not fail");
			done();
		});
});

// or any module using Object.defineProperty to set `module.exports`
QUnit.test("can import babel-generated CJS modules", function(assert) {
	return System["import"]("test/basics/babel_cjs")
		.then(function(mod) {
			assert.equal(mod, "foo", "should detect CJS module");
		});
});
