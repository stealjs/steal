"format global";

System.parser = "babel";

(function(QUnit, global) {
	var isBrowser = typeof window !== "undefined";

	QUnit.config.testTimeout = 2000;

	QUnit.module("StealJS base extension");

	if (typeof window === "undefined") {
		System.baseURL = "test";
	}

	function err(e) {
		setTimeout(function() {
			if (typeof window === "undefined") console.log(e.stack);
			else throw e.stack || e;
			QUnit.start();
		});
	}

	var ie8 = typeof navigator !== "undefined" &&
		navigator.appVersion &&
		navigator.appVersion.indexOf("MSIE 8") !== -1;

	QUnit.test("Error handling", function(assert) {
		var done = assert.async();
		System["import"]("tests/error-loader").then(err, function(e) {
			var msg = e.originalErr;
			assert.ok(/ReferenceError/.test(msg), "Is a ReferenceError");
			done();
		});
	});

	QUnit.test("Error handling2", function(assert) {
		var done = assert.async();
		System["import"]("tests/error-loader2").then(err, function(e) {
			console.error(e);
			assert.ok(true);
			done();
		});
	});

	if (!ie8)
		QUnit.test("Global script loading", function(assert) {
			var done = assert.async();
			System["import"]("tests/global").then(
				function(m) {
					assert.ok(m.jjQuery && m.another, "Global objects not defined");
					done();
				},
				err
			);
		});

	if (!ie8) {
		QUnit.test("Global script with var syntax", function(assert) {
			var done = assert.async();
			System.config({
				meta: {
					"tests/global-single": {
						eval: "script"
					}
				}
			});
			System["import"]("tests/global-single").then(
				function(m) {
					assert.ok(m == "bar", "Wrong global value");
					done();
				},
				err
			);
		});
	}

	QUnit.test("Global script with multiple objects the same", function(assert) {
		var done = assert.async();
		System["import"]("tests/global-multi").then(
			function(m) {
				assert.ok(m.jquery == "here", "Multi globals not detected");
				done();
			},
			err
		);
	});

	if (!ie8) {
		QUnit.test("Global script multiple objects different", function(assert) {
			var done = assert.async();
			System["import"]("tests/global-multi-diff").then(
				function(m) {
					assert.ok(m.foo == "barz");
					assert.ok(m.baz == "chaz");
					assert.ok(m.zed == "ted");
					done();
				},
				err
			);
		});
	}

	QUnit.test("Global script loading with inline shim", function(assert) {
		var done = assert.async();
		System["import"]("tests/global-inline-dep").then(
			function(m) {
				assert.ok(m == "1.8.3", "Global dependency not defined");
				done();
			},
			err
		);
	});

	QUnit.test("Global script with inline exports", function(assert) {
		var done = assert.async();
		System["import"]("tests/global-inline-export").then(
			function(m) {
				assert.ok(m == "r", "Inline export not applied");
				done();
			},
			err
		);
	});

	QUnit.test("Global script with shim config", function(assert) {
		var done = assert.async();
		System.meta["tests/global-shim-config"] = {
			deps: ["./global-shim-config-dep"]
		};
		System["import"]("tests/global-shim-config").then(
			function(m) {
				assert.ok(m == "shimmed", "Not shimmed");
				done();
			},
			err
		);
	});

	if (!ie8) {
		QUnit.test("Global script with inaccessible properties", function(assert) {
			var done = assert.async();
			Object.defineProperty(System.global, "errorOnAccess", {
				configurable: true,
				enumerable: true,
				get: function() {
					throw Error("This property is inaccessible");
				}
			});

			System["import"]("tests/global-inaccessible-props").then(
				function(m) {
					assert.ok(
						m == "result of global-inaccessible-props",
						"Failed due to a inaccessible property"
					);

					delete System.global.errorOnAccess;
					done();
				},
				err
			);
		});
	}

	QUnit.test(
		"Global script loading that detects as AMD with shim config",
		function(assert) {
			var done = assert.async();
			System.meta["tests/global-shim-amd"] = { format: "global" };
			System["import"]("tests/global-shim-amd").then(
				function(m) {
					assert.ok(m == "global", "Not shimmed");
					done();
				},
				err
			);
		}
	);

	if (!ie8) {
		QUnit.test("Meta should override meta syntax", function(assert) {
			var done = assert.async();
			System.meta["tests/meta-override"] = { format: "es6" };
			System["import"]("tests/meta-override").then(
				function(m) {
					assert.ok(m.p == "value", "Not ES6");
					done();
				},
				err
			);
		});
	}

	QUnit.test("Support the empty module", function(assert) {
		var done = assert.async();
		System["import"]("@empty").then(
			function(m) {
				assert.ok(m, "No empty module");
				done();
			},
			err
		);
	});

	QUnit.test("Global script with shim config exports", function(assert) {
		var done = assert.async();
		System.meta["tests/global-shim-config-exports"] = {
			exports: "p"
		};
		System["import"]("tests/global-shim-config-exports").then(
			function(m) {
				assert.ok(m == "export", "Exports not shimmed");
				done();
			},
			err
		);
	});

	QUnit.test("Map configuration", function(assert) {
		var done = assert.async();
		System.map["maptest"] = "tests/map-test";
		System["import"]("maptest").then(
			function(m) {
				assert.ok(m.maptest == "maptest", "Mapped module not loaded");
				done();
			},
			err
		);
	});

	QUnit.test("Map configuration subpath", function(assert) {
		var done = assert.async();
		System.map["maptest"] = "tests/map-test";
		System["import"]("maptest/sub").then(
			function(m) {
				assert.ok(m.maptest == "maptestsub", "Mapped folder not loaded");
				done();
			},
			err
		);
	});

	QUnit.test("Contextual map configuration", function(assert) {
		var done = assert.async();
		System.map["tests/contextual-map"] = {
			maptest: "tests/contextual-map-dep"
		};
		System["import"]("tests/contextual-map").then(
			function(m) {
				assert.ok(m.mapdep == "mapdep", "Contextual map dep not loaded");
				done();
			},
			err
		);
	});

	QUnit.test("Submodule contextual map configuration", function(assert) {
		var done = assert.async();
		System.map["tests/subcontextual-map"] = {
			dep: "tests/subcontextual-mapdep"
		};
		System["import"]("tests/subcontextual-map/submodule").then(
			function(m) {
				assert.ok(m == "submapdep", "Submodule contextual map not loaded");
				done();
			},
			err
		);
	});

	QUnit.test("Contextual map with shim", function(assert) {
		var done = assert.async();
		System.meta["tests/shim-map-test"] = {
			deps: ["shim-map-dep"]
		};
		System.map["tests/shim-map-test"] = {
			"shim-map-dep": "tests/shim-map-test-dep"
		};
		System["import"]("tests/shim-map-test").then(
			function(m) {
				assert.ok(m == "depvalue", "shim dep not loaded");
				done();
			},
			err
		);
	});

	QUnit.test("Prefetching", function(assert) {
		var done = assert.async();
		assert.throws(System["import"]("tests/prefetch"));
		done();
	});

	QUnit.test("Package loading shorthand", function(assert) {
		var done = assert.async();
		System.map["tests/package"] = "tests/some-package";
		System["import"]("tests/package/").then(
			function(m) {
				assert.ok(m.isPackage);
				done();
			},
			err
		);
	});

	QUnit.test("Loading an AMD module", function(assert) {
		var done = assert.async();
		System["import"]("tests/amd-module").then(
			function(m) {
				assert.ok(m.amd == true, "Incorrect module");
				assert.ok(m.dep.amd == "dep", "Dependency not defined");
				done();
			},
			err
		);
	});

	QUnit.test("AMD detection test", function(assert) {
		var done = assert.async();
		System["import"]("tests/amd-module-2").then(
			function(m) {
				assert.ok(m.amd);
				done();
			},
			err
		);
	});

	QUnit.test("AMD detection test with comments", function(assert) {
		var done = assert.async();
		System["import"]("tests/amd-module-3").then(
			function(m) {
				assert.ok(m.amd);
				done();
			},
			err
		);
	});

	QUnit.test("AMD minified detection with cjs wrapper", function(assert) {
		var done = assert.async();
		System["import"]("tests/amd-module-4").then(
			function(m) {
				assert.ok(m.amd);
				done();
			},
			err
		);
	});

	QUnit.test("AMD cjs wrapper with comments", function(assert) {
		var done = assert.async();
		System["import"]("tests/amd-module-5").then(
			function(m) {
				assert.ok(m.amd);
				done();
			},
			err
		);
	});

	QUnit.test("AMD cjs wrapper with inline regex", function(assert) {
		var done = assert.async();
		System["import"]("tests/amd-module-7-regex").then(
			function(m) {
				assert.ok(m.amd);
				done();
			},
			err
		);
	});

	QUnit.test("Not a AMD module", function(assert) {
		var done = assert.async();
		System["import"]("tests/not-amd-module").then(
			function(m) {
				assert.equal(Object.getOwnPropertyNames(m).length, 0);
				done();
			},
			err
		);
	});

	QUnit.test("Not a AMD module within a if statement", function(assert) {
		var done = assert.async();
		System["import"]("tests/not-amd-module2").then(
			function(m) {
				assert.equal(Object.getOwnPropertyNames(m).length, 0);
				done();
			},
			err
		);
	});

	QUnit.test("Not a AMD module after javascript keywords", function(assert) {
		var done = assert.async();
		System["import"]("tests/not-amd-module3").then(
			function(m) {
				assert.equal(Object.getOwnPropertyNames(m).length, 0);
				done();
			},
			err
		);
	});

	QUnit.test("AMD detection test with byte order mark (BOM)", function(assert) {
		var done = assert.async();
		System["import"]("tests/amd-module-bom").then(
			function(m) {
				assert.ok(m.amd);
				done();
			},
			err
		);
	});

	System.bundles["tests/amd-bundle"] = ["bundle-1", "bundle-2"];
	QUnit.test("Loading an AMD bundle", function(assert) {
		var done = assert.async();

		System["import"]("bundle-1")
			.then(function(m) {
				assert.ok(m.defined == true);
			})
			.then(function() {
				return System["import"]("bundle-2");
			})
			.then(function(m) {
				assert.ok(m.defined == true);
			})
			.then(done, err);
	});

	QUnit.test("Loading an AMD named define", function(assert) {
		var done = assert.async();
		System["import"]("tests/nameddefine").then(
			function(m1) {
				assert.ok(m1.converter, "Showdown not loaded");
				System["import"]("another-define").then(
					function(m2) {
						assert.ok(m2.named === "define", "Another module is not defined");
						done();
					},
					err
				);
			},
			err
		);
	});

	QUnit.test("Loading AMD CommonJS form", function(assert) {
		var done = assert.async();
		System["import"]("tests/amd-cjs-module").then(
			function(m) {
				assert.ok(m.test == "hi", "Not defined");
				done();
			},
			err
		);
	});

	QUnit.test("Loading a CommonJS module", function(assert) {
		var done = assert.async();
		System["import"]("tests/common-js-module").then(
			function(m) {
				assert.ok(m.hello == "world", "module value not defined");
				assert.ok(m.first == "this is a dep", "dep value not defined");
				done();
			},
			err
		);
	});

	QUnit.test("Loading a CommonJS module with this", function(assert) {
		var done = assert.async();
		System["import"]("tests/cjs-this").then(
			function(m) {
				assert.ok(m.asdf == "module value");
				done();
			},
			err
		);
	});

	QUnit.test("CommonJS setting module.exports", function(assert) {
		var done = assert.async();
		System["import"]("tests/cjs-exports").then(
			function(m) {
				assert.ok(m.e == "export");
				done();
			},
			err
		);
	});

	QUnit.test("CommonJS detection variation", function(assert) {
		var done = assert.async();
		System["import"]("tests/commonjs-variation").then(
			function(m) {
				assert.ok(m.e === System.get("@empty"));
				done();
			},
			err
		);
	});

	QUnit.test("CommonJS detection test with byte order mark (BOM)", function(assert) {
		var done = assert.async();
		System["import"]("tests/cjs-exports-bom").then(
			function(m) {
				assert.ok(m.foo == "bar");
				done();
			},
			err
		);
	});

	QUnit.test(
		"CommonJS module detection test with byte order mark (BOM)",
		function(assert) {
			var done = assert.async();
			System["import"]("tests/cjs-module-bom").then(
				function(m) {
					assert.ok(m.foo == "bar");
					done();
				},
				err
			);
		}
	);

	QUnit.test("CommonJS require variations", function(assert) {
		var done = assert.async();
		System["import"]("tests/commonjs-requires").then(
			function(m) {
				assert.ok(m.d1 == "d");
				assert.ok(m.d2 == "d");
				assert.ok(m.d3 == "require('not a dep')");
				done();
			},
			err
		);
	});

	QUnit.test("Loading a UMD module", function(assert) {
		var done = assert.async();
		System["import"]("tests/umd").then(
			function(m) {
				assert.ok(m.d == "hi", "module value not defined");
				done();
			},
			err
		);
	});

	QUnit.test("Loading AMD with format hint", function(assert) {
		var done = assert.async();
		System["import"]("tests/amd-format").then(
			function(m) {
				assert.ok(m.amd == "amd", "AMD not loaded");
				done();
			},
			err
		);
	});

	QUnit.test("Loading CJS with format hint", function(assert) {
		var done = assert.async();
		System["import"]("tests/cjs-format").then(
			function(m) {
				assert.ok(m.cjs == "cjs", "CJS not loaded");
				done();
			},
			err
		);
	});

	QUnit.test("Versions 2", function(assert) {
		var done = assert.async();
		System["import"]("tests/zero@0").then(
			function(m) {
				assert.ok(m == "0");
				done();
			},
			err
		);
	});

	QUnit.test("Simple compiler Plugin", function(assert) {
		var done = assert.async();
		System.map["coffee"] = "tests/compiler-plugin";
		System["import"]("tests/compiler-test.coffee!").then(
			function(m) {
				assert.ok(m.output == "plugin output", "Plugin not working.");
				assert.ok(m.extra == "yay!", "Compiler not working.");
				done();
			},
			err
		);
	});

	QUnit.test("Mapping to a plugin", function(assert) {
		var done = assert.async();
		System.map["pluginrequest"] = "tests/compiled.coffee!";
		System.map["coffee"] = "tests/compiler-plugin";
		System["import"]("pluginrequest").then(
			function(m) {
				assert.ok(m.extra == "yay!", "Plugin not applying.");
				done();
			},
			err
		);
	});

	QUnit.test("Advanced compiler plugin", function(assert) {
		var done = assert.async();
		System["import"]("tests/compiler-test!tests/advanced-plugin").then(
			function(m) {
				assert.ok(m == "custom fetch:tests/compiler-test!tests/advanced-plugin", m);
				done();
			},
			err
		);
	});

	QUnit.test("Plugin as a dependency", function(assert) {
		var done = assert.async();
		System.map["css"] = "tests/css";
		System["import"]("tests/cjs-loading-plugin").then(
			function(m) {
				assert.ok(m.pluginSource == "this is css");
				done();
			},
			err
		);
	});

	QUnit.test("Plugin version stripping", function(assert) {
		var done = assert.async();
		System.normalize("some/module@1.2.3!some/plugin@3.4.5.jsx").then(
			function(normalized) {
				assert.ok(normalized == "some/module@1.2.3!some/plugin@3.4.5.jsx");
				done();
			},
			err
		);
	});

	QUnit.test("AMD Circular", function(assert) {
		var done = assert.async();
		System["import"]("tests/amd-circular1")
			.then(function(m) {
				assert.ok(m.outFunc() == 5, "Expected execution");
				done();
			})
		["catch"](err);
	});

	QUnit.test("CJS Circular", function(assert) {
		var done = assert.async();
		System["import"]("tests/cjs-circular1").then(
			function(m) {
				assert.ok(m.first == "second value");
				assert.ok(m.firstWas == "first value", "Original value");
				done();
			},
			err
		);
	});

	QUnit.test("System.register Circular", function(assert) {
		var done = assert.async();
		System["import"]("tests/register-circular1").then(
			function(m) {
				assert.ok(m.q == 3, "Binding not allocated");
				assert.ok(m.r == 5, "Binding not updated");
				done();
			},
			err
		);
	});

	QUnit.test("System.register group linking test", function(assert) {
		var done = assert.async();
		System.bundles["tests/group-test"] = ["group-a"];
		System["import"]("group-a").then(
			function(m) {
				assert.ok(m);
				done();
			},
			err
		);
	});

	System.bundles["tests/mixed-bundle"] = [
		"tree/third",
		"tree/cjs",
		"tree/jquery",
		"tree/second",
		"tree/global",
		"tree/amd",
		"tree/first"
	];

	QUnit.test("Loading AMD from a bundle", function(assert) {
		var done = assert.async();
		System["import"]("tree/amd").then(
			function(m) {
				assert.ok(m.is == "amd");
				done();
			},
			err
		);
	});

	System.bundles["tests/mixed-bundle"] = [
		"tree/third",
		"tree/cjs",
		"tree/jquery",
		"tree/second",
		"tree/global",
		"tree/amd",
		"tree/first"
	];
	QUnit.test("Loading CommonJS from a bundle", function(assert) {
		var done = assert.async();
		System["import"]("tree/cjs").then(
			function(m) {
				assert.ok(m.cjs === true);
				done();
			},
			err
		);
	});

	QUnit.test("Loading a Global from a bundle", function(assert) {
		var done = assert.async();
		System["import"]("tree/global").then(
			function(m) {
				assert.ok(m === "output");
				done();
			},
			err
		);
	});

	QUnit.test("Loading named System.register", function(assert) {
		var done = assert.async();
		System["import"]("tree/third").then(
			function(m) {
				assert.ok(m.some == "exports");
				done();
			},
			err
		);
	});
	QUnit.test("Loading System.register from ES6", function(assert) {
		var done = assert.async();
		System["import"]("tree/first").then(
			function(m) {
				assert.ok(m.p == 5);
				done();
			},
			err
		);
	});

	//asyncTest('Loading from jspm', function() {
	//  System.paths['npm:*'] = 'https://npm.jspm.io/*.js';
	//  System['import']('npm:underscore').then(function(m) {
	//    ok(m && typeof m.chain == 'function', 'Not loaded');
	//    start();
	//  }, err);
	//});

	QUnit.test(
		"AMD simplified CommonJS wrapping with an aliased require",
		function(assert) {
			var done = assert.async();
			System["import"]("tests/amd-simplified-cjs-aliased-require1").then(
				function(m) {
					assert.ok(m.require2, "got dependency from aliased require");
					assert.ok(
						m.require2.amdCJS,
						"got dependency from aliased require listed as a dependency"
					);
					done();
				},
				err
			);
		}
	);

	QUnit.test("Loading dynamic modules with __esModule flag set", function(assert) {
		var done = assert.async();
		System["import"]("tests/es-module-flag").then(
			function() {
				m = System.get("tests/es-module-flag");
				assert.ok(m.exportName == "export");
				assert.ok(m["default"] == "default export");
				assert.ok(m.__esModule === true);
				done();
			},
			err
		);
	});

	if (ie8) return;

	QUnit.test("Async functions", function(assert) {
		var done = assert.async();
		System.traceurOptions = { asyncFunctions: true };
		System["import"]("tests/async").then(function(m) {
			assert.ok(true);
			done();
		});
	});

	QUnit.test("ES6 plugin", function(assert) {
		var done = assert.async();
		System["import"]("tests/blah!tests/es6-plugin").then(
			function(m) {
				assert.ok(m == "plugin");
				done();
			},
			err
		);
	});

	QUnit.test("ES6 detection", function(assert) {
		var done = assert.async();
		System["import"]("tests/es6-detection1").then(
			function(m) {
				assert.ok(true);
				done();
			},
			err
		);
	});

	QUnit.test("Basic exporting & importing", function(assert) {
		var done = assert.async();
		var m1, m2, m3, m4, err;
		var checkComplete = function() {
			if (m1 && m2 && m3 && m4 && err) {
				assert.ok(m1["default"] == "default1", "Error defining default 1");
				assert.ok(m2["default"] == "default2", "Error defining default 2");
				assert.ok(m3["default"] == "default3", "Error defining default 3");
				assert.ok(m4.test == "default3", "Error defining module");
				done();
			}
		};
		System["import"]("tests/default1")
			.then(function(_m1) {
				if (m1 === undefined) m1 = null;
				else m1 = _m1;
				checkComplete();
			})
		["catch"](err);
		System["import"]("tests/default1")
			.then(function(_m1) {
				if (m1 === undefined) m1 = null;
				else m1 = _m1;
				checkComplete();
			})
		["catch"](err);
		System["import"]("tests/default2")
			.then(function(_m2) {
				m2 = _m2;
				checkComplete();
			})
		["catch"](err);
		System["import"]("tests/asdf")
			.then(function() {}, function(_err) {
				err = _err;
				checkComplete();
			})
		["catch"](err);
		System["import"]("tests/default3")
			.then(function(_m3) {
				m3 = _m3;
				checkComplete();
			})
		["catch"](err);
		System["import"]("tests/module")
			.then(function(_m4) {
				m4 = _m4;
				checkComplete();
			})
		["catch"](err);
	});

	QUnit.test("Export Star", function(assert) {
		var done = assert.async();
		System["import"]("tests/export-star").then(
			function(m) {
				assert.ok(m.foo == "foo");
				assert.ok(m.bar == "bar");
				done();
			},
			err
		);
	});

	QUnit.test("Importing a mapped loaded module", function(assert) {
		var done = assert.async();
		System.map["default1"] = "tests/default1";
		System["import"]("default1").then(
			function(m) {
				System["import"]("default1").then(
					function(m) {
						assert.ok(m, "no module");
						done();
					},
					err
				);
			},
			err
		);
	});

	QUnit.test("Loading empty ES6", function(assert) {
		var done = assert.async();
		System["import"]("tests/empty-es6").then(
			function(m) {
				assert.ok(m && emptyES6);
				done();
			},
			err
		);
	});

	QUnit.test("Loading ES6 with format hint", function(assert) {
		var done = assert.async();
		System["import"]("tests/es6-format").then(
			function(m) {
				assert.expect(0);
				done();
			},
			err
		);
	});

	QUnit.test("Loading ES6 loading AMD", function(assert) {
		var done = assert.async();
		System["import"]("tests/es6-loading-amd").then(function(m) {
			assert.ok(m.amd == true);
			done();
		});
	});

	QUnit.test("Loading AMD with import *", function(assert) {
		var done = assert.async();
		System["import"]("tests/es6-import-star-amd").then(
			function(m) {
				assert.ok(m.g == true);
				done();
			},
			err
		);
	});

	QUnit.test("Loading ES6 and AMD", function(assert) {
		var done = assert.async();
		System["import"]("tests/es6-and-amd").then(
			function(m) {
				assert.ok(m.amd_module == "AMD Module");
				assert.ok(m.es6_module == "ES6 Module");
				done();
			},
			err
		);
	});

	QUnit.test("Relative dyanamic loading", function(assert) {
		var done = assert.async();
		System["import"]("tests/reldynamic")
			.then(function(m) {
				return m.dynamicLoad();
			})
			.then(function(m) {
				assert.ok(m.dynamic == "module", "Dynamic load failed");
				done();
			})
		["catch"](err);
	});

	QUnit.test("ES6 Circular", function(assert) {
		var done = assert.async();
		System["import"]("tests/es6-circular1").then(
			function(m) {
				assert.ok(m.q == 3, "Binding not allocated");
				if (System.transpiler != "6to5") assert.ok(m.r == 3, "Binding not updated");
				done();
			},
			err
		);
	});

	QUnit.test("AMD & CJS circular, ES6 Circular", function(assert) {
		var done = assert.async();
		System["import"]("tests/all-circular1").then(
			function(m) {
				if (System.transpiler != "6to5") assert.ok(m.q == 4);
				assert.ok(m.o.checkObj() == "changed");
				done();
			},
			err
		);
	});

	QUnit.test("AMD -> System.register circular -> ES6", function(assert) {
		var done = assert.async();
		System["import"]("tests/all-layers1").then(
			function(m) {
				assert.ok(m == true);
				done();
			},
			err
		);
	});

	QUnit.test("System.meta", function(assert) {
		var done = assert.async();
		System.meta = {
			"tests/global-multi": {
				arbitraryMetaProperty: true,
				exports: "jjQuery"
			}
		};

		var oldLocate = System.locate;
		System.locate = function(load) {
			var res = oldLocate.apply(this, arguments);
			if (load.name == "tests/global-multi") {
				assert.ok(load.metadata.arbitraryMetaProperty, "got arbitrary metadata");
			}
			return res;
		};

		System["import"]("tests/global-multi").then(
			function(m) {
				assert.ok(m.jquery === "here", "exports works right");
				done();
			},
			err
		);
	});

	QUnit.test("System.clone", function(assert) {
		var done = assert.async();
		var ClonedSystem = System.clone();

		System.map["maptest"] = "tests/map-test";
		ClonedSystem.map["maptest"] = "tests/map-test-dep";

		var systemDef = System["import"]("maptest");
		var cloneDef = ClonedSystem["import"]("maptest");

		Promise.all([systemDef, cloneDef]).then(function(modules) {
			var m = modules[0];
			var mClone = modules[1];
			assert.ok(m.maptest == "maptest", "Mapped module not loaded");
			assert.ok(mClone.dep == "maptest", "Mapped module not loaded");
			assert.ok(mClone !== m, "different modules");
			done();
		});
	});

	QUnit.test("bundled defines without dependencies", function(assert) {
		var done = assert.async();

		System.bundles["tests/amd-bundle/amd-bundled"] = [
			"amd-bundle",
			"amd-dependency"
		];

		System["import"]("amd-bundle").then(
			function(m) {
				assert.equal(m.name, "tests/amd-bundle", "got the right module value");
				done();
			},
			function(e) {
				assert.ok(false, "got error " + e);
				done();
			}
		);
	});

	if (isBrowser) {
		QUnit.test("plugin instantiate hook", function(assert) {
			var done = assert.async();

			var testEl = document.createElement("div");
			testEl.id = "test-element";
			document.body.appendChild(testEl);

			var instantiate = System.instantiate;
			System.instantiate = function(load) {
				if (load.name.indexOf("tests/build_types/test.css") === 0) {
					assert.equal(load.metadata.buildType, "css", "buildType set");
				}
				return instantiate.apply(this, arguments);
			};

			System["import"](
				"tests/build_types/test.css!tests/build_types/css"
			).then(
				function(value) {
					assert.equal(testEl.clientWidth, 200, "style added to the page");
					document.body.removeChild(testEl);
					System.instantiate = instantiate;
					done();
				},
				function(e) {
					assert.ok(false, "got error " + e);
					done();
				}
			);
		});
	}

	QUnit.test(
		"AMD simplified CommonJS wrapping with an aliased require",
		function(assert) {
			var done = assert.async();
			System["import"]("tests/amd-simplified-cjs-aliased-require1").then(
				function(m) {
					assert.ok(m.require2, "got dependency from aliased require");
					assert.ok(
						m.require2.amdCJS,
						"got dependency from aliased require listed as a dependency"
					);
					done();
				},
				err
			);
		}
	);

	QUnit.test("Metadata dependencies work for named defines", function(assert) {
		var done = assert.async();
		System["import"]("tests/meta-deps")
			.then(function(m) {
				return System["import"]("b");
			})
			.then(function(m) {
				assert.ok(m.a === "a");
				done();
			});
	});

	QUnit.test("Loading an AMD module that requires another works", function(assert) {
		var done = assert.async();
		assert.expect(0);
		System["import"]("tests/amd-require").then(function() {
			done();
		});
	});

	QUnit.test(
		"Loading a connected tree that connects ES and CJS modules",
		function(assert) {
			var done = assert.async();
			System["import"]("tests/connected-tree/a").then(function(a) {
				assert.ok(a.name === "a");
				done();
			});
		}
	);

	QUnit.test("Loading two bundles that have a shared dependency", function(assert) {
		var done = assert.async();
		System.bundles["tests/shared-dep-bundles/a"] = ["lib/shared-dep", "lib/a"];
		System.bundles["tests/shared-dep-bundles/b"] = ["lib/shared-dep", "lib/b"];
		assert.expect(0);
		System["import"]("lib/a").then(
			function() {
				System["import"]("lib/b").then(
					function() {
						done();
					},
					err
				);
			},
			err
		);
	});

	QUnit.test("System.clone", function(assert) {
		var done = assert.async();
		var ClonedSystem = System.clone();

		System.map["maptest"] = "tests/map-test";
		ClonedSystem.map["maptest"] = "tests/map-test-dep";

		var systemDef = System["import"]("maptest");
		var cloneDef = ClonedSystem["import"]("maptest");

		Promise.all([systemDef, cloneDef]).then(function(modules) {
			var m = modules[0];
			var mClone = modules[1];
			assert.ok(m.maptest == "maptest", "Mapped module not loaded");
			assert.ok(mClone.dep == "maptest", "Mapped module not loaded");
			assert.ok(mClone !== m, "different modules");
			done();
		});
	});

	if (typeof window !== "undefined" && window.Worker) {
		QUnit.test("Using SystemJS in a Web Worker", function(assert) {
			var done = assert.async();
			var worker = new Worker("tests/worker-" + System.transpiler + ".js");
			worker.onmessage = function(e) {
				assert.ok(e.data.amd === "AMD Module");
				assert.ok(e.data.es6 === "ES6 Module");
				done();
			};
		});
	}

	QUnit.test(
		"inferGlobals: false will not attempt to define an export",
		function(assert) {
			var done = assert.async();
			assert.expect(1);
			System.inferGlobals = false;
			System["import"]("tests/global-with-export2").then(function(mod) {
				assert.deepEqual(mod, {}, "global module has no value");
				System.inferGlobals = true;
				done();
			});
		}
	);

	QUnit.test("ES Modules can use {} syntax on CommonJS modules", function(assert) {
		var done = assert.async();
		assert.expect(1);
		System["import"]("tests/modulea").then(function(mod) {
			var def = mod["default"];
			assert.equal(def, "foo", "able to extract from moduleb");
			done();
		});
	});

	QUnit.test("ES Modules can import default from CommonJS modules", function(assert) {
		var done = assert.async();
		assert.expect(1);
		System["import"]("tests/modulec").then(function(mod) {
			var def = mod["default"];
			assert.equal(def, "foo", "able to extract from moduled");
			done();
		});
	});

	QUnit.test("ES Modules can use {} syntax on AMD modules", function(assert) {
		var done = assert.async();
		assert.expect(1);
		System["import"]("tests/modulee").then(function(mod) {
			var def = mod["default"];
			assert.equal(def, "bar", "able to extract from modulef");
			done();
		});
	});

	QUnit.test("Using a plugin that is currently being imported", function(assert) {
		var done = assert.async();
		assert.expect(1);
		System["import"]("tests/link-plug1")
			.then(function(mod) {
				console.log("done");
				assert.equal(mod, "foo", "able to load both at the same time");
				done();
			})
			.catch(err => console.log("an error"));
	});

	QUnit.test("Globals", function(assert) {
		var done = assert.async();
		System.config({
			meta: {
				"tests/with-global-deps": {
					globals: {
						$$$: "tests/dep"
					}
				}
			}
		});
		System["import"]("tests/with-global-deps")
			.then(function(m) {
				for (var p in m) {
					assert.ok(false);
				}
				assert.ok(true);
				done();
			})
			.then(null, err);
	});
})(QUnit, typeof window == "undefined" ? global : window);
