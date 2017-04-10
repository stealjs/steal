QUnit.module("System", function() {

	var ie = typeof window !== "undefined" &&
		window.navigator.userAgent.match(/Trident/);

	function notSupposedToFail(err) {
		if (err) {
			console.log(err);
			throw new Error("should not fail");
		}
	}

	QUnit.module("prerequisite", function() {
		QUnit.test("should be a instance of Loader", function(assert) {
			assert.ok(System instanceof Reflect.Loader);
		});
	});

	QUnit.module("#import", function () {

		QUnit.module("an ES5 script", function() {
			QUnit.test("should import a ES5 script", function(assert) {
				var done = assert.async();

				System.import("tests/syntax/script")
					.then(function(m) {
						assert.ok(!!m);
					})
					.then(done, notSupposedToFail);
			});

			QUnit.test("should import a ES5 script once loaded", function(assert) {
				var done = assert.async();

				System.import("tests/syntax/script")
					.then(function() {
						return System.import("tests/syntax/script");
					})
					.then(function(m) {
						assert.ok(!!m);
					})
					.then(done, notSupposedToFail);
			});
		});

		QUnit.module("System registry methods", function() {

			QUnit.test("should support set, get and delete", function(assert) {
				var done = assert.async();
				var testPath = "tests/loader/module";

				System.import(testPath)
					.then(function(m) {
						assert.equal(m.run, "first");
						System.delete(testPath);
						return System.import(testPath);
					})
					.then(function(m) {
						assert.equal(m.run, "second");
						System.delete("loader.module");
						System.set(testPath, System.newModule({ custom: "module" }));
						return System.import(testPath);
					})
					.then(function(m) {
						assert.equal(m.custom, "module");
					})
					.then(done, notSupposedToFail);
			});
		});

		QUnit.module("an ES6 script", function() {

			QUnit.test("should import an ES6 script", function(assert) {
				var done = assert.async();

				System.import("tests/syntax/es6")
					.then(function(m) {
						assert.equal(m.p, "p");
					})
					.then(done, notSupposedToFail);
			});

			QUnit.test("should import an ES6 script with its dependencies", function(assert) {
				var done = assert.async();

				System.import("tests/syntax/es6-withdep")
					.then(function (m) {
						assert.equal(m.p, "p");
					})
					.then(done, notSupposedToFail);
			});

			(ie ? QUnit.skip : QUnit.test)("should import an ES6 script with a generator", function(assert) {
				var done = assert.async();

				System.import("tests/syntax/es6-generator")
					.then(function(m) {
						assert.ok(!!m.generator);
					})
					.then(done, notSupposedToFail);
			});

			QUnit.test("should import without bindings", function(assert) {
				var done = assert.async();

				System.import("tests/syntax/direct")
					.then(function(m) {
						assert.ok(!!m);
					})
					.then(done, notSupposedToFail);
			});

			QUnit.test("should support es6 various syntax", function(assert) {
				var done = assert.async();

				System.import("tests/syntax/es6-file")
					.then(function(m) {
						assert.equal(typeof m.q, "function");

						try {
							(new m.q()).foo();
							assert.ok("false", "should throw");
						} catch(e) {
							assert.equal(e, "g");
						}
					})
					.then(done, notSupposedToFail);
			});

		});

		QUnit.module("with circular dependencies", function() {

			(System.transpiler === "traceur" ? QUnit.test : QUnit.skip)("should resolve circular dependencies", function(assert) {
				var done = assert.async();

				System.import("tests/syntax/circular1")
					.then(function (m1) {
						return System.import("tests/syntax/circular2").then(function (m2) {
							assert.equal(m1.variable1, "test circular 1");
							assert.equal(m2.variable2, "test circular 2");

							assert.equal(
								m2.output,
								"test circular 1",
								"The module 2 output is the module 1 variable"
							);
							assert.equal(
								m1.output,
								"test circular 2",
								"The module 1 output is the module 2 variable"
							);
							assert.equal(
								m2.output1,
								"test circular 2",
								"The module 2 output1 is the module 1 output"
							);
							assert.equal(
								m1.output2,
								"test circular 1",
								"The module 1 output2 is the module 2 output"
							);
						});
					})
					.then(done, notSupposedToFail);
			});

			QUnit.test("should update circular dependencies", function(assert) {
				var done = assert.async();

				System.import("tests/syntax/even")
					.then(function (m) {
						assert.ok(m.counter, "Counter initially at 1");
						assert.ok(m.even(10), "Must be an even number")
						assert.ok(m.counter, "Counter sould now be at 7");
						assert.notOk(m.even(15), "Must be an odd number");
						assert.ok(m.counter, "Counter sould now be at 15");
					})
					.then(done, notSupposedToFail);
			});

		});

		QUnit.module("loading order", function() {

			function expectedOrder(file, order, assert) {
				var done = assert.async();

				System.import("tests/loads/" + file)
					.then(function(m) {
						order.forEach(function(letter) {
							assert.equal(
								m[letter],
								letter,
								"The '" + letter + "' file wasn\"t loaded"
							);
						});
					})
					.then(done, notSupposedToFail);
			}

			QUnit.test("should load in order (a)", function(assert) {
				expectedOrder("a", ["a", "b"], assert);
			});

			QUnit.test("should load in order (c)", function(assert) {
				expectedOrder("c", ["c", "a", "b"], assert);
			});

			QUnit.test("should load in order (s)", function(assert) {
				expectedOrder("s", ["s", "c", "a", "b"], assert);
			});

			QUnit.test("should load in order (_a)", function(assert) {
				expectedOrder("_a", ["b", "d", "g", "a"], assert);
			});

			QUnit.test("should load in order (_e)", function(assert) {
				expectedOrder("_e", ["c", "e"], assert);
			});

			QUnit.test("should load in order (_f)", function(assert) {
				expectedOrder("_f", ["g", "f"], assert);
			});

			QUnit.test("should load in order (_h)", function(assert) {
				expectedOrder("_h", ["i", "a", "h"], assert);
			});
		});

		//

		QUnit.module("errors", function () {
			function supposeToFail() {
				throw new Error("should not be successful")
			}

			QUnit.test("should throw if on syntax error", function(assert) {
				var done = assert.async();

				System.import("tests/loads/main")
					.then(supposeToFail)
					.catch(function(e) {
						assert.equal(e,
							"Error evaluating tests/loads/deperror\ndep error");
						done();
					});
			});

			QUnit.skip("should throw what the script throws", function(assert) {
				var done = assert.async();

				System.import("tests/loads/deperror")
					.then(supposeToFail)
					.catch(function() {
						assert.ok(false, "should be successful ??");
						done();
					});
			});

			QUnit.test("Unhandled rejection test", function(assert) {
				var done = assert.async();

				System.import("tests/loads/load-non-existent")
					.then(supposeToFail)
					.catch(function(e) {
						assert.ok(/Error loading "\S+" at \S+/.test(e));
						done();
					});
			});
		});

		QUnit.module("es6 export syntax overview", function() {
			QUnit.test("should resolve different export syntax", function(assert) {
				var done = assert.async();

				System.import("tests/syntax/export")
					.then(function(m) {
						assert.equal(m.p, 5, "should export a number");
						assert.equal(typeof m.foo, "function", "should export a function");
						assert.equal(typeof m.q, "object", "should export an object");
						assert.equal(typeof m.default, "function", "should export a default function");
						assert.equal(m.s, 4, "should export a set of variable");
						assert.equal(m.t, 4, "should export a specifier number");
						assert.equal(typeof m.m, "object", "should export a specifier object");
					})
					.then(done, notSupposedToFail);
			});
		});

		QUnit.module("es6 export default syntax", function() {
			QUnit.test("should resolve 'export default'", function(assert) {
				var done = assert.async();

				System.import("tests/syntax/export-default")
					.then(function(m) {
						assert.equal(m.default(), "test");
					})
					.then(done, notSupposedToFail);
			});
		});

		QUnit.module("es6 export re-exporting", function() {
			QUnit.test("should support simple re-exporting", function(assert) {
				var done = assert.async();

				System.import("tests/syntax/reexport1")
					.then(function (m) {
						assert.equal(m.p, 5, "should export 5 from the './export'");
					})
					.then(done, notSupposedToFail);
			});

			QUnit.test("should support re-exporting binding", function(assert) {
				var done = assert.async();

				System.import("tests/syntax/reexport-binding")
					.then(function() {
						return System.import("tests/syntax/rebinding");
					})
					.then(function (m) {
						assert.equal(m.p, 4, "should export 'p' from the './rebinding'");
					})
					.then(done, notSupposedToFail);
			});

			QUnit.test("should support re-exporting with a new name", function(assert) {
				var done = assert.async();

				System.import("tests/syntax/reexport2")
					.then(function(m) {
						assert.equal(m.q, 4, "should export 't' as 'q' from the './export'");
						assert.equal(m.z, 5, "should export 'q' as 'z' from the './export'");
					})
					.then(done, notSupposedToFail);
			});

			QUnit.test("should support re-exporting", function(assert) {
				var done = assert.async();

				System.import("tests/syntax/export-star")
					.then(function(m) {
						assert.equal(m.foo, "foo", "should export a function");
						assert.equal(m.bar, "bar", "should re-export export-star bar variable");
					})
					.then(done, notSupposedToFail);
			});

			(System.transpiler !== "traceur" ? QUnit.skip : QUnit.test)("should support re-exporting overwriting", function(assert) {
				var done = assert.async();

				System.import("tests/syntax/export-star2")
					.then(function (m) {
						assert.equal(m.bar, "bar", "should re-export './export-star' bar variable");
						assert.equal(
							typeof m.foo,
							"function",
							"should overwrite './star-dep' foo variable with a function"
						);
					})
					.then(done, notSupposedToFail);
			});
		});

		QUnit.module("es6 import syntax overview", function() {
			QUnit.test("should resolve different import syntax", function(assert) {
				var done = assert.async();

				System.import("tests/syntax/import")
					.then(function(m) {
						assert.equal(typeof m.a, "function", "should export 'd' as 'a' from the './export'");
						assert.equal(m.b, 4, "should export 'p' as 'b' for 's' as 'p' from './reexport1'");
						assert.equal(m.c, 5, "should export 'z' as 'c' with 'z' from './reexport2'");
						assert.equal(m.d, 4, "should export 'r' as 'd' for 'q' as 'r' from the './reexport2'");
						assert.equal(typeof m.q, "object", "should export 'q' as '*' from the './reexport1'");
						assert.equal(typeof m.q.foo, "function", "should access the 'foo' function of './reexport1' through 'q' ad '*'");
					})
					.then(done, notSupposedToFail);
			});
		});
	});

	QUnit.module("#paths", function() {

		QUnit.test("should support custom paths", function(assert) {
			var done = assert.async();

			System.paths["bar"] = "tests/loader/custom-path.js";
			System.import("bar")
				.then(function(m) {
					assert.equal(m.bar, "bar");
					delete System.paths["bar"];
				})
				.then(done, notSupposedToFail);
		});


		QUnit.test("should support path wildcard", function(assert) {
			var done = assert.async();

			System.paths["bar/*"] = "tests/loader/custom-folder/*.js";
			System.import("bar/path")
				.then(function(m) {
					assert.equal(m.bar, "baa");
					delete System.paths["bar/*"];
				})
				.then(done, notSupposedToFail);
		});

		QUnit.test("should support most specific paths", function(assert) {
			var done = assert.async();

			System.paths["bar/bar"] = "tests/loader/specific-path.js";
			System.paths["bar/*"] = "tests/loader/custom-folder/*.js";
			System.import("bar/bar")
				.then(function(m) {
					assert.ok(m.path);
					delete System.paths["bar/bar"];
					delete System.paths["bar/*"];
				})
				.then(done, notSupposedToFail);
		});

	});

	QUnit.module("#System.define", function () {

		QUnit.test("should load System.define", function(assert) {
			var done = assert.async();
			var oldLocate = System.locate;

			var slaveLocatePromise = new Promise(function(resolve, reject) {

				System.locate = function(load) {
					if (load.name === "slave") {
						setTimeout(function() {
							System.define("slave", "var double = [1,2,3].map(i => i * 2);");
							resolve("slave.js");
						}, 1);
						return slaveLocatePromise;
					}
					return oldLocate.apply(this, arguments);
				};

			});

			function reset() {
				System.locate = oldLocate;
			}

			System.import("tests/loader/master")
				.then(function(m) {
					assert.ok(!!m);
					reset();
				})
				.then(done, notSupposedToFail);
		});

	});

	if (typeof window !== "undefined" && window.Worker) {
		QUnit.module("with Web Worker");

		(ie ? QUnit.skip : QUnit.test)("should loading inside of a Web Worker", function(assert) {
			var done = assert.async();
			var worker = new Worker(System.baseURL + "tests/worker/worker-" + System.transpiler + ".js");

			worker.onmessage = function(e) {
				assert.equal(e.data, "p");
				done();
			};
		});

	}

	if (typeof window !== "undefined") {
		QUnit.module("with script type 'module'");

		// TODO: Verify why window.anon is undefined
		QUnit.skip("should load the module on the document 'load' event", function(assert) {
			var done = assert.async();

			setTimeout(function() { // wait for script processing first
				assert.equal(typeof window.anon, "function");
				done();
			}, 0);
		});
	}
});
