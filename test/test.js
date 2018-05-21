var QUnit = require("steal-qunit");

QUnit.config.testTimeout = 30000;

require("src/cache-bust/test/");
require("src/env/test/");
require("src/json/test/");
require("src/trace/trace_test");

require("test/joinuris_test");
require("test/config/config_test");
require("test/clone/clone_test");
require("test/babel_plugins_test");
require("test/babel_presets_test");
require("test/steal_clone_test");
require("test/steal_import_test");
require("test/steal_module_script_test");

var helpers = require("./helpers");
var makeIframe = helpers.makeIframe;
var writeIframe = helpers.writeIframe;
var supportsES = helpers.supportsProto();
var makeStealHTML = helpers.makeStealHTML;

var hasConsole = typeof console === "object";
var supportsTypedArrays = typeof Uint16Array !== "undefined";

QUnit.module("steal via html", {
	beforeEach: function() {
		System.baseURL = "../";
	}
});

if (supportsES) {
	QUnit.test("basics", function(assert) {
		makeIframe("basics/basics.html", assert);
	});

	QUnit.test("basics with steal.config backwards compatability", function(assert) {
		makeIframe("basics/basics-steal-config.html", assert);
	});

	QUnit.test("basics with generated html", function(assert) {
		writeIframe(
			makeStealHTML({
				baseUrl: "basics/basics.html",
				scriptTagAttrs: {
					src:  "../../steal.js",
					main: "basics/basics",
					config: "../config.js"
				}
			}),
			assert
		);
	});

	QUnit.test("default config path", function(assert) {
		writeIframe(
			makeStealHTML({
				baseUrl: "basics/basics.html",
				scriptTagAttrs: {
					src: "../steal-with-promises.js",
					main: "basics/basics"
				}
			}),
			assert
		);
	});

	QUnit.test("jsx is enabled by default", function(assert) {
		makeIframe("jsx/dev.html", assert);
	});

	QUnit.test("read config", function(assert) {
		writeIframe(
			makeStealHTML({
				baseUrl: "basics/basics.html",
				scriptTagAttrs: {
					src: "../../steal.js",
					main: "configed/configed",
					config: "../config.js"
				}
			}),
			assert
		);
	});

	QUnit.test("load js-file with es6", function(assert) {
		makeIframe("import-js-file/es6.html", assert);
	});

	QUnit.test("@loader is current loader with es6", function(assert) {
		makeIframe("current-loader/dev-es6.html", assert);
	});

	QUnit.test("using babel as transpiler works", function(assert) {
		makeIframe("babel/site.html", assert);
	});

	QUnit.test("inline code", function(assert) {
		makeIframe("basics/inline_code.html", assert);
	});

	QUnit.test("inline code works without line breaks", function(assert) {
		makeIframe("basics/inline_code_no_break.html", assert);
	});

	QUnit.test("Private scope variables are available in ES exports", function(assert) {
		makeIframe("reg/index.html", assert);
	});
}

QUnit.test("steal done promise is rejected without steal config", function(assert) {
	makeIframe("no-config-error/test.html", assert);
});

QUnit.test("inline", function(assert) {
	makeIframe("basics/inline_basics.html", assert);
});

QUnit.test("inline main source", function(assert) {
	makeIframe("basics/inline_main_source.html", assert);
});

QUnit.test("map works", function(assert) {
	makeIframe("map/map.html", assert);
});

QUnit.test("load js-file and npm module", function(assert) {
	makeIframe("import-js-file/npm.html", assert);
});

QUnit.test("default npm-algorithm", function(assert) {
	makeIframe("default-npm-algorithm/default.html", assert);
});

QUnit.test("default npm-algorithm overwritten", function(assert) {
	makeIframe("default-npm-algorithm/npm-algorithm.html", assert);
});

QUnit.test("npm-algorithm less npm 3", function(assert) {
	makeIframe("nested-npm-algorithm/nested.html", assert);
});

QUnit.test("compat - production bundle works", function(assert) {
	makeIframe("production/prod.html", assert);
});

QUnit.test("production bundle specifying main works", function(assert) {
	makeIframe("production/prod-main.html", assert);
});

QUnit.test("steal.production.js doesn't require setting env", function(assert) {
	makeIframe("production/prod-env.html", assert);
});

QUnit.test("production works with Babel circular dependencies", function(assert) {
	makeIframe("prod_circ/prod.html", assert);
});

if (hasConsole) {
	QUnit.test("steal.production.js logs errors", function(assert) {
		makeIframe("production_err/prod.html", assert);
	});
}

QUnit.test("loadBundles true with a different env loads the bundles", function(assert) {
	makeIframe("load-bundles/prod.html", assert);
});

QUnit.test("Using path's * qualifier", function(assert) {
	writeIframe(
		makeStealHTML({
			baseUrl: "basics/basics.html",
			scriptTagAttrs: {
				src: "../steal-with-promises.js",
				main: "../paths",
				config: "../paths/config.js"
			}
		}),
		assert
	);
});

QUnit.test("forward slash extension", function(assert) {
	makeIframe("forward_slash/site.html", assert);
});

QUnit.test("a steal object in the page before steal.js is loaded will be used for configuration", function(assert) {
	makeIframe("configed/steal_object.html", assert);
});

QUnit.test("compat - production bundle works", function(assert) {
	makeIframe("prod-bundlesPath/prod.html", assert);
});

QUnit.test("System.instantiate preventing production css bundle", function(assert) {
	makeIframe("production/prod-inst.html", assert);
});

QUnit.test("Multi mains", function(assert) {
	makeIframe("multi-main/dev.html", assert);
});

QUnit.test("@loader is current loader", function(assert) {
	makeIframe("current-loader/dev.html", assert);
});

QUnit.test("@loader is current loader with steal syntax", function(assert) {
	makeIframe("current-loader/dev-steal.html", assert);
});

QUnit.test("@steal is the current steal", function(assert) {
	makeIframe("current-steal/dev.html", assert);
});

QUnit.test("allow truthy script options (#298)", function(assert) {
	makeIframe("basics/truthy_script_options.html", assert);
});

if (hasConsole) {
	QUnit.test("warn in production when main is not set (#537)", function(assert) {
		makeIframe("basics/no_main_warning.html", assert);
	});

	QUnit.test("warns when module is loaded twice with different paths", function(assert) {
		makeIframe("load_module_twice/dev.html", assert);
	});

	QUnit.test("No false positive 'loaded twice' warnings with steal-clone", function(assert) {
		makeIframe("load_module_twice_clone/dev.html", assert);
	});

	QUnit.test("No 'loaded twice' warnings when a module was loaded before the config", function(assert){
		makeIframe("load_module_twice_false_positive/dev.html", assert);
	});

	QUnit.test("No 'loaded twice' warnings when there is a loading error", function(assert){
		makeIframe("load_module_twice_false_positive/on-error.html", assert);
	});
}

QUnit.test("can add implicit deps to ES and CJS modules", function(assert) {
	makeIframe("meta_deps/dev.html", assert);
});

QUnit.test("can load a bundle with an amd module depending on a global", function(assert) {
	makeIframe("prod_define/prod.html", assert);
});

QUnit.test("envs config works", function(assert) {
	makeIframe("envs/envs.html", assert);
});

QUnit.test("envs config works with steal.production", function(assert) {
	makeIframe("envs/prod/prod.html", assert);
});

QUnit.test("envs config is applied after a live-reload", function(assert) {
	makeIframe("envs/envs-live.html", assert);
});

QUnit.test("script tag wins against global steal object", function(assert) {
	makeIframe("script-tag_wins/index.html", assert);
});

QUnit.test("steal tag detection", function(assert) {
	makeIframe("last_script_tag/index.html", assert);
});

QUnit.test("missing steal-less plugin error message", function(assert) {
	makeIframe("missing_less_plugin/index.html", assert);
});

if(supportsTypedArrays) {
	QUnit.test("Node builtins come for free when using npm", function(assert) {
		makeIframe("builtins/dev.html", assert);
	});
}

QUnit.test("importing a module that exports the window object", function(assert){
	makeIframe("import_cjs_global/dev.html", assert);
});

QUnit.test("A module part of a failed linkset can still be loaded", function(assert){
	makeIframe("load_after_fail/dev.html", assert);
});

QUnit.test("Error messages in malformed package.jsons", function(assert){
	makeIframe("bad_json/dev.html", assert);
});

QUnit.test("Error message in malformed JSON modules", function(assert){
	makeIframe("json_syntax_err/dev.html", assert);
});

QUnit.test("Error message for syntax errors in ES and CJS modules", function(assert){
	makeIframe("parse_errors/dev.html", assert);
});

QUnit.test("If a module errors because a child module throws show the correct stack trace", function(assert){
	makeIframe("init_error/dev.html", assert);
});

QUnit.test("Syntax error in child module shows up in the stack trace", function(assert){
	makeIframe("syntax_errs/dev.html", assert);
});

QUnit.test("Can tree-shake modules that only re-export from others", function(assert){
	makeIframe("tree_shake/dev.html", assert);
});

QUnit.test("Can tree-shake anonymous modules", function(assert){
	makeIframe("tree_shake/anon.html", assert);
});

QUnit.module("steal startup and config");

QUnit.test("Load urlOptions correctly with async script append", function(assert) {
	makeIframe("async-script/index.html", assert);
});

QUnit.test("use steal object and configMain", function(assert) {
	makeIframe("stealconfig/dev.html", assert);
});

QUnit.module("json extension");

QUnit.test("json extension", function(assert) {
	makeIframe("json/dev.html", assert);
});

QUnit.module("Web Workers");

if(window.Worker) {
	QUnit.test("basics works", function(assert) {
		makeIframe("webworkers/dev.html", assert);
	});

	QUnit.test("env is properly set", function(assert) {
		makeIframe("envs/worker/dev.html", assert);
	});
}

QUnit.module("Locate/Pkg Path Scheme extension");

QUnit.test("Basics work", function(assert) {
	makeIframe("locate/site.html", assert);
});

QUnit.module("Contextual extension");

QUnit.test("Basics work", function(assert) {
	makeIframe("contextual/test.html", assert);
});

QUnit.module("nw.js");

QUnit.test("it works", function(assert) {
	makeIframe("nw/nw.html", assert);
});

QUnit.module("Electron");

QUnit.test("steal is able to load", function(assert) {
	makeIframe("electron/electron.html", assert);
});

QUnit.module("Service Workers");

if("serviceWorker" in navigator) {
	QUnit.test("steal is able to load within a service worker", function(assert) {
		makeIframe("service-worker/dev.html", assert);
	});
}

QUnit.module("development bundles");

QUnit.test("deps bundle loads AFTER configMain", function(assert) {
	makeIframe("dev_bundles/deps.html", assert);
});

QUnit.test("dev bundle loads BEFORE configMain", function(assert) {
	makeIframe("dev_bundles/dev.html", assert);
});

QUnit.test("When the dev-bundle is missing we get a nice message", function(assert){
	makeIframe("dev_bundle_err/dev.html", assert);
});
