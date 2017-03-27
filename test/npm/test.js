var GlobalSystem = window.System;

require("./utils_test");
require("./crawl_test");
require("./normalize_test");
require("./import_test");
require("./load_test");
require("./locate_test");

var makeIframe = function(src){
	var iframe = document.createElement('iframe');

	window.removeMyself = function(){
		delete window.removeMyself;
		document.body.removeChild(iframe);
		QUnit.start();
	};

	document.body.appendChild(iframe);
	iframe.src = src;
};

QUnit.module("npm extension");

QUnit.test("utils.moduleName.create and utils.moduleName.parse", function(assert) {
	var done = assert.async();

	GlobalSystem["import"]("npm-utils")
		.then(function(utils) {
			var parsed = utils.moduleName.parse("abc/foo/def","bar");
			assert.equal(parsed.modulePath, "foo/def", "is absolute");

			parsed = utils.moduleName.parse("abc#./foo/def","bar");
			assert.equal(parsed.modulePath, "./foo/def", "is relative");

			var res = utils.moduleName.create(parsed);
			assert.equal(res,"abc#foo/def", "set back to absolute");

		})
		.then(done, function(err) {
			assert.notOk(err, "should not fail");
			done();
		});
});

QUnit.test("crawl.getDependencyMap", function(assert) {
	var done = assert.async();

	GlobalSystem["import"]("npm-crawl")
		.then(function(crawl){
			var deps = crawl.getDependencyMap({}, {
				dependencies: {"bower": "1.2.3", "can": "2.2.2"}
			});
			assert.deepEqual(deps, { "can": {name: "can", version: "2.2.2"}});

		})
		.then(done, function(err) {
			assert.notOk(err, "should not fail");
			done();
		});
});

QUnit.test("Loads globals", function(assert) {
	var done = assert.async();

	GlobalSystem["import"]("jquery")
		.then(function($) {
			assert.ok($.fn.jquery, "jQuery loaded");
		})
		.then(done, function(err) {
			assert.notOk(err, "should not fail");
			done();
		});
});

QUnit.test("meta", function(assert) {
	var done = assert.async();

	GlobalSystem["import"]("~/meta")
		.then(function(meta) {
			assert.equal(meta, "123", "got 123");
		})
		.then(done, function(err) {
			assert.notOk(err, "should not fail");
			done();
		});
});

QUnit.test("module names that start with @", function(assert) {
	var done = assert.async();

	GlobalSystem.paths["@foo"] = "test/npm/foo.js";
	GlobalSystem["import"]("@foo")
		.then(function(foo){
			assert.equal(foo, "bar", "got 123");
		})
		.then(done);
});

QUnit.test("jquery-ui", function(assert) {
	var done = assert.async();

	GlobalSystem.paths["@foo"] = "test/foo.js";

	var reqs = [
		GlobalSystem["import"]("jquery"),
		GlobalSystem["import"]("jquery-ui/draggable")
	];

	Promise.all(reqs)
		.then(function(mods) {
			var $ = mods[0];
			assert.ok($.fn.draggable);
		})
		.then(done, function(err) {
			assert.notOk(err, "should not fail");
			done();
		});
});

QUnit.test("import using package name", function(assert) {
	var done = assert.async();

	GlobalSystem.globalBrowser = {
		"steal-npm": "steal-npm"
	};

	var reqs = [
		GlobalSystem["import"]("steal-npm"),
		GlobalSystem["import"]("steal-npm/meta")
	];

	Promise.all(reqs)
		.then(function(mods) {
			assert.equal(mods[0], "example-main", "example-main");
			assert.equal(mods[1], "123", "steal-npm/meta");
		})
		.then(done);
});

QUnit.test("modules using process.env", function(assert) {
	var done = assert.async();

	GlobalSystem.env = "development";
	GlobalSystem["delete"]("package.json!npm");
	delete window.process;

	GlobalSystem["import"]("package.json!npm")
		.then(function() {
			return GlobalSystem["import"]("test/npm/env");
		})
		.then(function(env){
			assert.equal(env, "development", "loaded the env");
		})
		.then(done);
});

QUnit.test("Reuse existing npmContext.pkgInfo", function(assert) {
	var done = assert.async();

	GlobalSystem.npmContext.pkgInfo = [{
		name: "reuse-test", version: "1.0.0",
		fileUrl: GlobalSystem.baseURL
	}];
	GlobalSystem["delete"]("package.json!npm");

	GlobalSystem["import"]("package.json!npm")
		.then(function(){
			var pkgInfo = GlobalSystem.npmContext.pkgInfo;
			var pkg = pkgInfo[pkgInfo.length - 1];
			assert.equal(pkg.name, "reuse-test", "package was reused");
		})
		.then(done);
});

QUnit.test("Support cloned loader", function(assert) {
	var done = assert.async();
	var origDefault = GlobalSystem.npmPaths.__default;

	GlobalSystem.npmPaths.__default = {
		fileUrl: origDefault.fileUrl,
		main: origDefault.main,
		name: origDefault.name,
		version: origDefault.version,
		resolutions: {}
	};

	GlobalSystem.normalize(origDefault.name)
		.then(function(normalizedName) {
			return GlobalSystem.locate({ name: normalizedName });
		})
		.then(function(path) {
			assert.ok(path);
		})
		.then(done);
});

asyncTest("module names", function(){
	makeIframe("not_relative_main/dev.html");
});

asyncTest("main does not include .js in map", function(){
	makeIframe("map_main/dev.html");
});

asyncTest("ignoreBrowser", function(){
	makeIframe("ignore_browser/dev.html");
});

asyncTest("directories.lib", function(){
	makeIframe("directories_lib/dev.html");
});

asyncTest("github ranges as requested versions are matched", function(){
	makeIframe("git_ranges/dev.html");
});

asyncTest("works with packages that have multiple versions of the same dependency", function(){
	makeIframe("mult_dep/dev.html");
});

asyncTest("works when System.map and System.paths are provided", function(){
	makeIframe("map_paths/dev.html");
});

asyncTest("browser config pointing to an alt main", function(){
	makeIframe("browser/dev.html");
});

asyncTest("browser config to ignore a module", function(){
	makeIframe("browser-false/dev.html");
});

asyncTest("configDependencies combined from loader and pkg.system", function(){
	makeIframe("config_deps/dev.html");
});

asyncTest("Converting name of git versions works", function(){
	makeIframe("git_config/dev.html");
});

asyncTest("contextual maps work", function(){
	makeIframe("contextual_map/dev.html");
});

asyncTest("configDependencies can override config with systemConfig export", function(){
	makeIframe("ext_config/dev.html");
});

asyncTest("transform the JSON with jsonOptions", function(){
	makeIframe("json-options/dev.html");
});

QUnit.module("npmDependencies");

asyncTest("are used exclusively if npmIgnore is not provided", function(){
	makeIframe("npm_deps_only/dev.html");
});

asyncTest("override npmIgnore when npmIgnore is provided", function(){
	makeIframe("npm_deps_override/dev.html");
});

asyncTest("ignores devDependencies when no npmDependencies is provided", function(){
	makeIframe("npm_deps_devignore/dev.html");
});

asyncTest("npmIgnore a single module works", function(){
	makeIframe("npm_deps_ignore/dev.html");
});

asyncTest("use paths configured, including wildcards, for modules when provided", function(){
	makeIframe("paths_config/dev.html");
});

asyncTest("scoped packages work", function(){
	makeIframe("scoped/dev.html");
});

asyncTest("works with npm 3's flat file structure", function(){
	makeIframe("npm3/dev.html");
});

asyncTest("works with child packages with version ranges", function(){
	makeIframe("parent/dev.html");
});

asyncTest("With npm3 traversal starts by going to the mosted nested position", function(){
	makeIframe("nested_back/dev.html");
});

// TODO: Fix this test
QUnit.skip("peerDependencies are matched against parent that has a matching version", function(){
	makeIframe("peer_deps/dev.html");
});

asyncTest("Able to load dependencies using /index convention", function(){
	makeIframe("folder_index/dev.html");
});

asyncTest("load in a webworker", function(){
	makeIframe("worker/dev.html");
});

asyncTest("works with steal-conditional", function() {
	makeIframe("conditionals/dev.html");
});

asyncTest("works if only system.main is defined", function() {
	makeIframe("only-system-main/dev.html");
});

asyncTest("forward slash with npm", function(){
	makeIframe("npm-deep/dev.html");
});

asyncTest("meta config is deep", function(){
	makeIframe("meta-deep/dev.html");
});

asyncTest("meta globals config works", function() {
	makeIframe("globals/dev.html");
});

asyncTest("npm extension helpers to add/get packages", function() {
	makeIframe("steal_npm_helpers/dev.html");
});

QUnit.start();
