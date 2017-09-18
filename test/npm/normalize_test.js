var helpers = require("./helpers")(System);
var Package = helpers.Package;

require("./normalize_main-config_test");
require("./normalize_plugins-config_test");

QUnit.module("npm normalize - various");

QUnit.test("basics", function(assert){
	var done = assert.async();

	System.normalize("foo").then(function(name){
		assert.equal(name, "foo", "Got the right name");
		done();
	});
});

QUnit.test("normalizes child package names", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "parent",
			main: "main.js",
			version: "1.0.0",
			dependencies: {
				child: "1.0.0"
			}
		})
		.withPackages([
			{
				name: "child",
				main: "main.js",
				version: "1.0.0"
			}
		]).loader;

	loader.normalize("child", "parent@1.0.0#main")
	.then(function(name){
		assert.equal(name, "child@1.0.0#main", "Normalized to the parent");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("a package with .js in the name", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "parent",
			main: "main.js",
			version: "1.0.0",
			dependencies: {
				"foo.js": "0.0.1"
			}
		})
		.withPackages([
			{
				name: "foo.js",
				main: "foo.js",
				version: "0.0.1"
			}
		]).loader;

	loader.normalize("foo.js", "parent#1.0.0#main")
	.then(function(name){
		assert.equal(name, "foo.js@0.0.1#foo", "Correctly normalized");
	})
	.then(done, done);
});

QUnit.test("normalizes a package with peer deps", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "parent",
			main: "main.js",
			version: "1.0.0",
			dependencies: {
				dep: "1.0.0",
				peer: "1.0.0"
			}
		})
		.withPackages([
			{
				name: "dep",
				main: "main.js",
				version: "1.0.0",
				peerDependencies: {
					peer: "1.0.0"
				}
			},
			{
				name: "peer",
				main: "main.js",
				version: "1.0.0"
			}
		]).loader;

		loader.normalize("peer", "dep@1.0.0#main")
		.then(function(name){
			assert.equal(name, "peer@1.0.0#main", "normalized peer");
		})
		.then(done, done);
});

QUnit.test("Can load two separate versions of same package", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.npmVersion(3)
		.rootPackage({
			name: "parent",
			main: "main.js",
			version: "1.0.0",
			dependencies: {
				"fixture": "1.0.0",
				"connect": "1.0.0"
			}
		})
		.withPackages([
			{
				name: "connect",
				main: "main.js",
				version: "1.0.0",
				dependencies: {
					"set": "^5.0.0"
				}
			},
			{
				name: "set",
				main: "main.js",
				version: "5.0.4"
			},
			new Package({
				name: "fixture",
				main: "main.js",
				version: "1.0.0",
				dependencies: {
					"set": "^3.0.0"
				}
			}).deps([
				{
					name: "set",
					main: "main.js",
					version: "3.0.4"
				}
			])
		])
		.loader;

	helpers.init(loader)
	.then(function(){
		return loader.normalize("fixture", "parent@1.0.0#main");
	})
	.then(function(){
		return loader.normalize("set", "fixture@1.0.0#main");
	})
	.then(function(name){
		assert.equal(name, "set@3.0.4#main", "Got the correct version of set");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("Configures a package when conflicting package.jsons are progressively loaded", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.npmVersion(3)
		.rootPackage({
			name: "app",
			version: "1.0.0",
			main: "main.js",
			dependencies: {
				"steal-focha": "1.0.0"
			}
		})
		.withPackages([
			{
				name: "focha",
				version: "1.0.0",
				main: "main.js"
			},
			new Package({
				name: "steal-focha",
				version: "1.0.0",
				main: "main.js",
				dependencies: {
					"focha": "^2.0.0"
				},
				system: {
					map: {
						focha: "focha#./other"
					}
				}
			}).deps([
				{
					name: "focha",
					version: "2.0.0",
					main: "main.js"
				}
			])
		])
		.loader;

	helpers.init(loader)
	.then(function(){
		return loader.normalize("steal-focha", "app@1.0.0");
	})
	.then(function(){
		return loader.normalize("focha", "steal-focha@1.0.0#main");
	})
	.then(function(name){
		assert.equal(name, "focha@2.0.0#other", "config applied");
	})
	.then(done, done);
});

QUnit.test("Progressively loaded configuration in the pluginLoader during the build is applied to the localLoader as well", function(assert){
	var done = assert.async();

	var pluginLoader = helpers.clone()
		.npmVersion(3)
		.rootPackage({
			name: "app",
			version: "1.0.0",
			main: "main.js",
			dependencies: {
				one: "1.0.0"
			}
		})
		.withPackages([
			new Package({
				name: "one",
				version: "1.0.0",
				main: "main.js",
				dependencies: {
					two: "1.0.0"
				}
			}).deps([
				{
					name: "two",
					version: "1.0.0",
					main: "main.js"
				}
			])
		])
		.loader;

	var localLoader = helpers.clone()
		.npmVersion(3)
		.rootPackage({
			name: "app",
			version: "1.0.0",
			main: "main.js",
			dependencies: {
				one: "1.0.0"
			}
		})
		.withPackages([
			new Package({
				name: "one",
				version: "1.0.0",
				main: "main.js",
				dependencies: {
					two: "1.0.0"
				}
			}).deps([
				{
					name: "two",
					version: "1.0.0",
					main: "main.js"
				}
			])
		])
		.loader;

	// Set this as the localLoader, like steal-tools does.
	pluginLoader.localLoader = localLoader;

	Promise.all([
		helpers.init(pluginLoader),
		helpers.init(localLoader)
	])
	.then(function(){
		pluginLoader.npmContext.resavePackageInfo = true;
		return pluginLoader.normalize("one", "app@1.0.0#main");
	})
	.then(function(){
		return pluginLoader.normalize("two", "one@1.0.0#main");
	})
	.then(function(){
		// At this point the configuration should have been copied over.
		var load = localLoader.getModuleLoad("package.json!npm");
		var hasTwo = load.source.indexOf('"name": "two"') !== -1;
		assert.ok(hasTwo, "'two' was loaded in the pluginLoader and its configuration was copied over to the localLoader");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("Loads npm convention of folder with trailing slash", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			version: "1.0.0",
			main: "main.js",
			dependencies: {
				dep: "1.0.0"
			}
		})
		.withPackages([{
			name: "dep",
			version: "1.0.0",
			main: "main.js"
		}])
		.loader;

	helpers.init(loader)
	.then(function(){
		return loader.normalize("dep", "app@1.0.0#main");
	})
	.then(function(){
		// Relative to a nested module
		return loader.normalize("./", "dep@1.0.0#folder/deep/mod")
	})
	.then(function(name){
		// Relative to current folder uses index
		assert.equal(name, "dep@1.0.0#folder/deep/index");

		// Loading the parent
		return loader.normalize("../", "dep@1.0.0#folder/deep/mod");
	})
	.then(function(name){
		// Relative to the parent folder uses index
		assert.equal(name, "dep@1.0.0#folder/index");

		return loader.normalize("..", "dep@1.0.0#folder/deep/mod");
	})
	.then(function(name){
		// Relative to the parent folder uses index
		assert.equal(name, "dep@1.0.0#folder/index");

		// Loading to the parent-most folder of the package
		return loader.normalize("../", "dep@1.0.0#folder/mod");
	})
	.then(function(name){
		// Relative to parent-most is the pkg.main
		assert.equal(name, "dep@1.0.0#main");

		return loader.normalize("..", "dep@1.0.0#folder/mod");
	})
	.then(function(name){
		// Relative to parent-most is the pkg.main
		assert.equal(name, "dep@1.0.0#main");

		return loader.normalize("./", "dep@1.0.0#thing");
	})
	.then(function(name){
		assert.equal(name, "dep@1.0.0#main");
	})
	.then(done, done);
});

QUnit.test("Race conditions in loading deps are resolved", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			version: "1.0.0",
			dependencies: {
				"dep1": "1.0.0"
			},
			system: {
				npmAlgorithm: "nested"
			}
		})
		.withPackages([
			new Package({
				name: "dep1",
				version: "1.0.0",
				dependencies: {
					"dep2": "1.0.0",
					"dep3": "2.0.0"
				}
			}).deps([
				new Package({
					name: "dep2",
					version: "1.0.0",
					dependencies: {
						"dep3": "1.0.0"
					}
				}),
				new Package({
					name: "dep3",
					version: "1.0.0"
				})
			]),
			new Package({
				name: "dep3",
				version: "2.0.0"
			})
		])
		.loader;

	helpers.init(loader)
	.then(function(){
		return Promise.all([
			loader.normalize("dep1", "app@1.0.0#main"),
			loader.normalize("dep3", "app@1.0.0#main")
		]);
	})
	.then(function(){
		return loader.normalize("dep2", "dep1@1.0.0#index");
	})
	.then(function(name){
		var one = loader.normalize("dep3", "dep1@1.0.0#index")
			.then(function(name){
				assert.equal(name, "dep3@2.0.0#index");
			});

		var two = loader.normalize("dep3", "dep2@1.0.0#index")
			.then(function(name){
				assert.equal(name, "dep3@1.0.0#index");
			});

		Promise.all([one, two]).then(done, helpers.fail(assert, done));
	});
});

QUnit.test("Normalizing a package that refers to itself", function(assert) {
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			version: "1.0.0",
			main: "main.js",
			dependencies: {
				dep: "1.0.0",
				connect: "1.0.0"
			},
			system: {
				npmAlgorithm: "nested"
			}
		})
		.withPackages([
			new Package({
				name: "dep",
				version: "1.0.0",
				main: "main.js",
				dependencies: {
					connect: "2.0.0"
				}
			}).deps([
				{
					name: "connect",
					version: "2.0.0",
					main: "main.js"
				}
			]),
			{
				name: "connect",
				version: "1.0.0",
				main: "main.js"
			}
		])
		.loader;

	helpers.init(loader)
	.then(function(){
		return loader.normalize("dep", "app@1.0.0#main");
	})
	.then(function(){
		return loader.normalize("connect", "dep@1.0.0#main");
	})
	.then(function() {
		return loader.normalize("connect/foo/bar", "connect@2.0.0#main");
	})
	.then(function(name) {
		assert.equal(name, "connect@2.0.0#foo/bar");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("normalizes in production when there is a dep in a parent node_modules with a different version than needed", function(assert){

	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0",
			dependencies: {
				a: "1.0.0",
				b: "1.0.0",
				c: "2.0.0"
			},
			system: {
				npmAlgorithm: "nested"
			}
		})
		.withPackages([
			new Package({
				name: "a",
				version: "1.0.0",
				main: "main.js",
				dependencies: {
					c: "1.0.0"
				}
			}).deps([{
				name: "c",
				version: "1.0.0",
				main: "main.js"
			}]),
			new Package({
				name: "b",
				version: "1.0.0",
				main: "main.js",
				dependencies: {
					c: "1.0.0"
				}
			}),
			new Package({
				name: "c",
				version: "2.0.0",
				main: "main.js"
			})
		])
		.loader;

	helpers.init(loader)
	.then(function(){
		return Promise.all([
			loader.normalize("a", "app@1.0.0#main"),
			loader.normalize("b", "app@1.0.0#main")
		]);
	})
	.then(function(){
		// First normalize a's "c", which is the same that b needs.
		return loader.normalize("c", "a@1.0.0#main");
	})
	.then(function(){
		// Now normalize b's "c" which is the same that b had, and will
		// save the resolution.
		return loader.normalize("c", "b@1.0.0#main");
	})
	.then(function(n){
		// Removing the context simulates production.
		delete loader.npmContext;

		// Now normalize b's "c" which is the same that b had, but
		// we will get app's c if there is a bug.
		return loader.normalize("c", "b@1.0.0#main");
	})
	.then(function(name){
		assert.equal(name, "c@1.0.0#main", "got the right version of 'c'");
	})
	.then(done, helpers.fail(assert, done));

});

QUnit.test("Child config doesn't override root config", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0",
			steal: {
				ext: {
					foo: "bar"
				}
			},
			dependencies: {
				child: "1.0.0"
			}
		})
		.withPackages([
			{
				name: "child",
				version: "1.0.0",
				main: "main.js",
				steal: {
					ext: {
						foo: "qux"
					}
				}
			}
		])
		.loader;

	helpers.init(loader)
	.then(function(){
		return loader.normalize("./mod.foo", "app@1.0.0#main");
	})
	.then(function(name){
		assert.equal(name, "app@1.0.0#mod.foo!bar", "uses the ext config from the root package");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("Browser", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0",
			browser: {
				"./node1": "./browser1",
				"./node2.js": "./browser2.js",
				"./node3/index": "./browser3/index"
			}
		})
		.loader;

	helpers.init(loader)
	.then(function(){
		return loader.normalize("app/node1");
	})
	.then(function(name){
		assert.equal(name, "app@1.0.0#browser1");

		return loader.normalize("app/node2");
	})
	.then(function(name){
		assert.equal(name, "app@1.0.0#browser2");

		return loader.normalize("app/node3/index");
	})
	.then(function(name){
		assert.equal(name, "app@1.0.0#browser3/index");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("Config applied before normalization will be reapplied after", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0",
			dependencies: {
				dep: "1.0.0"
			}
		})
		.withPackages([
			{
				name: "dep",
				main: "main.js",
				version: "1.0.0"
			}
		])
		.loader;

	helpers.init(loader)
	.then(function(){
		// The build applies config after configMain loads
		loader.npmContext.resavePackageInfo = true;
		loader.config({
			map: {
				dep: "dep/build"
			}
		});

		return loader.normalize("dep", "app@1.0.0#main");
	})
	.then(function(name){
		assert.equal(name, "dep@1.0.0#build");

		var pkg = loader.npmContext.pkgInfo[0];
		assert.ok(!pkg.steal.map, "The map shoulded be applied to what saved into the build artifact");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("Configuration with circular references works", function(assert){
	var done = assert.async();

	var someObject = {};
	someObject.foo = someObject;

	var Typed = function(){this.isTyped = true};
	var typeInst = new Typed();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0"
		})
		.loader;

	helpers.init(loader)
	.then(function(){
		loader.config({
			instantiated: {
				something: someObject,
				typeInst: typeInst
			}
		});
		assert.ok(true, "no infinite recursion");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("normalizing a nested deep dependency (#1224)", function(assert) {
	var done = assert.async();

	var cloned = helpers.clone()
		.npmVersion(3)
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0",
			dependencies: {
				"client": "1.0.0"
			}
		})
		.withPackages([
			{
				name: "emitter",
				main: "index.js",
				version: "2.0.0"
			},
			{
				name: "client",
				main: "main.js",
				version: "1.0.0",
				dependencies: {
					"parser": "1.0.0",
					"emitter": "2.0.0"
				}
			},
			new Package({
				name: "parser",
				main: "main.js",
				version: "1.0.0",
				dependencies: {
					"emitter": "1.0.0"
				}
			}).deps([
				{
					name: "emitter",
					main: "index.js",
					version: "1.0.0"
				}
			])
		]);

	var loader = cloned.loader;

	helpers.init(loader)
		.then(function() {
			return loader.normalize("client", "app@1.0.0#main")
				.then(function() {
					return loader.normalize("parser", "client@1.0.0#main");
				});
		})
		.then(function() {
			return Promise.all([
				loader.normalize("emitter", "parser@1.0.0#main"),
				loader.normalize("emitter", "client@1.0.0#main")
			]);
		})
		.then(function() {
			var data = loader.npm["emitter@2.0.0"];

			assert.equal(
				data.fileUrl,
				"./node_modules/emitter/package.json"
			);
		})
		.then(done, done);
});

QUnit.test("descriptive version mismatch error (#1176)", function(assert) {
	var done = assert.async();

	var loader = helpers.clone()
		.npmVersion(3)
		.rootPackage({
			name: "app",
			version: "1.0.0",
			main: "main.js",
			dependencies: {
				can: "1.0.0"
			}
		})
		.withPackages([
			{
				name: "can-util",
				version: "1.0.0",
				main: "main.js"
			},
			{
				name: "can",
				version: "1.0.0",
				main: "main.js",
				dependencies: {
					"can-util": "^2.0.0"
				}

			}
		])
		.loader;

	helpers.init(loader)
		.then(function(name) {
			return loader.normalize("can", name);
		})
		.then(function(name) {
			return loader.normalize("can-util", name);
		})
		.then(
			function(name) {
				assert.ok(false, "it should fail");
			},
			function(err) {
				assert.deepEqual(
					err.message.split("\n"),
					[
						"Did not find ./node_modules/can-util/package.json",
						"Unable to find a compatible version of can-util",
						"Wanted: ^2.0.0",
						"Found: 1.0.0"
					],
					"should throw descriptive error message"
				);
			}
		)
		.then(done, helpers.fail(assert, done));
});

QUnit.test("'map' configuration where the right-hand identifier is an npm package but the left is not", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0",
			dependencies: {
				mapped: "1.0.0"
			},
			steal: {
				map: {
					dep: "mapped"
				}
			}
		})
		.withPackages([
			{
				name: "mapped",
				main: "main.js",
				version: "1.0.0"
			}
		])
		.loader;

	helpers.init(loader).then(function(){
		return loader.normalize("dep", "app@1.0.0#main");
	})
	.then(function(name){
		assert.equal(name, "mapped@1.0.0#main");
	})
	.then(done, helpers.fail(assert, done));
});

