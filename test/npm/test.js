var GlobalSystem = window.System;

require("./utils_test");
require("./crawl_test");
require("./normalize_test");
require("./import_test");
require("./load_test");
require("./locate_test");

var makeIframe = require("../helpers").makeIframe;

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
			return GlobalSystem.locate({
				status: "loading",
				name: normalizedName,
				linkSets: [],
				dependencies: [],
				metadata: {}
			});
		})
		.then(function(path) {
			assert.ok(path);
		})
		.then(done);
});

QUnit.test("module names", function(assert) {
	makeIframe("not_relative_main/dev.html", assert);
});

QUnit.test("main does not include .js in map", function(assert) {
	makeIframe("map_main/dev.html", assert);
});

QUnit.test("ignoreBrowser", function(assert) {
	makeIframe("ignore_browser/dev.html", assert);
});

QUnit.test("directories.lib", function(assert) {
	makeIframe("directories_lib/dev.html", assert);
});

QUnit.test("github ranges as requested versions are matched", function(assert) {
	makeIframe("git_ranges/dev.html", assert);
});

QUnit.test("works with packages that have multiple versions of the same dependency", function(assert) {
	makeIframe("mult_dep/dev.html", assert);
});

QUnit.test("works when System.map and System.paths are provided", function(assert) {
	makeIframe("map_paths/dev.html", assert);
});

QUnit.test("browser config pointing to an alt main", function(assert) {
	makeIframe("browser/dev.html", assert);
});

QUnit.test("browser config to ignore a module", function(assert) {
	makeIframe("browser-false/dev.html", assert);
});

QUnit.test("configDependencies combined from loader and pkg.system", function(assert) {
	makeIframe("config_deps/dev.html", assert);
});

QUnit.test("Converting name of git versions works", function(assert) {
	makeIframe("git_config/dev.html", assert);
});

QUnit.test("contextual maps work", function(assert) {
	makeIframe("contextual_map/dev.html", assert);
});

QUnit.test("configDependencies can override config with systemConfig export", function(assert) {
	makeIframe("ext_config/dev.html", assert);
});

QUnit.test("transform the JSON with jsonOptions", function(assert) {
	makeIframe("json-options/dev.html", assert);
});

QUnit.module("npmDependencies");

QUnit.test("are used exclusively if npmIgnore is not provided", function(assert) {
	makeIframe("npm_deps_only/dev.html", assert);
});

QUnit.test("override npmIgnore when npmIgnore is provided", function(assert) {
	makeIframe("npm_deps_override/dev.html", assert);
});

QUnit.test("ignores devDependencies when no npmDependencies is provided", function(assert) {
	makeIframe("npm_deps_devignore/dev.html", assert);
});

QUnit.test("npmIgnore a single module works", function(assert) {
	makeIframe("npm_deps_ignore/dev.html", assert);
});

QUnit.test("use paths configured, including wildcards, for modules when provided", function(assert) {
	makeIframe("paths_config/dev.html", assert);
});

QUnit.test("scoped packages work", function(assert) {
	makeIframe("scoped/dev.html", assert);
});

QUnit.test("works with npm 3's flat file structure", function(assert) {
	makeIframe("npm3/dev.html", assert);
});

QUnit.test("works with child packages with version ranges", function(assert) {
	makeIframe("parent/dev.html", assert);
});

QUnit.test("With npm3 traversal starts by going to the mosted nested position", function(assert) {
	makeIframe("nested_back/dev.html", assert);
});

QUnit.test("peerDependencies are matched against parent that has a matching version", function(assert){
	makeIframe("peer_deps/dev.html", assert);
});

QUnit.test("Able to load dependencies using /index convention", function(assert) {
	makeIframe("folder_index/dev.html", assert);
});

QUnit.test("load in a webworker", function(assert) {
	makeIframe("worker/dev.html", assert);
});

QUnit.test("works with steal-conditional", function(assert) {
	makeIframe("conditionals/dev.html", assert);
});

QUnit.test("works if only system.main is defined", function(assert) {
	makeIframe("only-system-main/dev.html", assert);
});

QUnit.test("forward slash with npm", function(assert) {
	makeIframe("npm-deep/dev.html", assert);
});

QUnit.test("meta config is deep", function(assert) {
	makeIframe("meta-deep/dev.html", assert);
});

QUnit.test("meta globals config works", function(assert) {
	makeIframe("globals/dev.html", assert);
});

QUnit.test("npm extension helpers to add/get packages", function(assert) {
	makeIframe("steal_npm_helpers/dev.html", assert);
});

QUnit.start();
