var helpers = require("./helpers")(System);
var Package = helpers.Package;
var utils = require("../../ext/npm-utils");

QUnit.module("npm normalize - 'main' config variations");

var mainVariations = {
	"steal.main": function(pkg){
		pkg.steal = {
			main: "bar"
		};
	},
	"system.main": function(pkg){
		pkg.system = {
			main: "bar"
		};
	},

	"pkg.main": function(pkg){
		pkg.main = "bar.js";
	},

	"browser string": function(pkg){
		pkg.browser = "bar.js";
	},

	"browser string ending with slash": function(pkg){
		pkg.browser = "bar/";
		return "bar/index";
	},

	"browserify string": function(pkg){
		pkg.browserify = "bar";
	},

	"jam.main": function(pkg){
		pkg.jam = {
			main: "./bar.js"
		};
	}
};

Object.keys(mainVariations).forEach(function(testName){
	var definer = mainVariations[testName];

	QUnit.test(testName, function(assert){
		var done = assert.async();

		var deepPackageJSON = {
			name: "deep",
			main: "foo.js",
			version: "1.0.0",
		};
		var modulePath = definer(deepPackageJSON) || "bar";

		var loader = helpers.clone()
			.npmVersion(3)
			.rootPackage({
				name: "parent",
				main: "main.js",
				version: "1.0.0",
				dependencies: {
					"child": "1.0.0"
				}
			})
			.withPackages([
				new Package({
					name: "child",
					main: "main.js",
					version: "1.0.0",
					dependencies: {
						"deep": "1.0.0"
					}
				}).deps([
					deepPackageJSON
				])
			])
			.loader;

		helpers.init(loader)
		.then(function(){
			return loader.normalize("child", "parent@1.0.0#main");
		})
		.then(function(){
			return loader.normalize("deep", "child@1.0.0#main");
		})
		.then(function(name){
			assert.equal(name, "deep@1.0.0#" + modulePath, "Correctly normalized");
		})
		.then(done, done);
	});
});

QUnit.test("A package's steal.main is retained when loading dependant packages", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			version: "1.0.0",
			main: "main.js",
			dependencies: {
				parent: "1.0.0"
			}
		})
		.withPackages([
			{
				name: "parent",
				main: "main.js",
				version: "1.0.0",
				system: {
					main: "other.js",
					map: {
						"child/a": "child/b"
					}
				},
				dependencies: {
					child: "1.0.0"
				}
			},
			{
				name: "child",
				main: "main.js",
				version: "1.0.0"
			}
		])
		.loader;

	helpers.init(loader)
	.then(function(){
		return loader.normalize("parent", "app@1.0.0#main");
	})
	.then(function(){
		loader.npmContext.resavePackageInfo = true;

		return loader.normalize("child", "parent@1.0.0#other");
	})
	.then(function(name){
		var pkgs = loader.npmContext.pkgInfo;
		var pkg = utils.filter(pkgs, function(p) { return p.name === "parent"; })[0];
		assert.equal(pkg.steal.main, "other.js");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("A dependency can load its devDependencies if they happen to exist", function(assert){
	var done = assert.async();
	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0",
			dependencies: {
				foo: "1.0.0"
			}
		})
		.withPackages([
			{
				name: "foo",
				main: "main.js",
				version: "1.0.0",
				devDependencies: {
					bar: "1.0.0"
				}
			},
			{
				name: "bar",
				main: "main.js",
				version: "1.0.0"
			}
		])
		.loader;

	helpers.init(loader)
	.then(function(){
		return loader.normalize("foo", "app@1.0.0#main");
	})
	.then(function(){
		return loader.normalize("bar", "foo@1.0.0#main");
	})
	.then(function(name){
		assert.equal(name, "bar@1.0.0#main");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("A dependency's devDependencies are not fetched when in 'plugins'", function(assert){
	var done = assert.async();
	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0",
			dependencies: {
				foo: "1.0.0"
			}
		})
		.withPackages([
			{
				name: "foo",
				main: "main.js",
				version: "1.0.0",
				devDependencies: {
					bar: "1.0.0"
				},
				steal: {
					plugins: ["bar"]
				}
			},
			{
				name: "bar",
				main: "main.js",
				version: "1.0.0"
			}
		])
		.loader;

	helpers.init(loader)
	.then(function(){
		return loader.normalize("foo", "app@1.0.0#main");
	})
	.then(function(name){
		var pkg = loader.npmPaths["./node_modules/bar"];
		assert.equal(pkg, undefined, "This should not be fetched");
	})
	.then(done, helpers.fail(assert, done));
});
