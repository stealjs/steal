var helpers = require("./helpers")(System);

QUnit.module("npm normalize - 'plugins' config");

QUnit.test("Works from the root package", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			version: "1.0.0",
			main: "main.js",
			dependencies: {
				dep: "1.0.0"
			},
			steal: {
				plugins: ["dep"]
			}
		})
		.withPackages([
			{
				name: "dep",
				version: "1.0.0",
				main: "main",
				steal: {
					ext: {
						txt: "dep"
					}
				}
			}
		])
		.loader;

	helpers.init(loader)
	.then(function(){
		return loader.normalize("app/foo.txt", "app@1.0.0#main");
	})
	.then(function(name){
		assert.equal(name, "app@1.0.0#foo.txt!dep@1.0.0#main");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("Works from a dependent package", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			version: "1.0.0",
			main: "main.js",
			dependencies: {
				dep: "1.0.0"
			},
			steal: {
				plugins: ["dep"]
			}
		})
		.withPackages([
			{
				name: "dep",
				version: "1.0.0",
				main: "main.js",
				dependencies: {
					other: "1.0.0"
				},
				steal: {
					plugins: ["other"]
				}
			},
			{
				name: "other",
				version: "1.0.0",
				main: "main.js",
				steal: {
					ext: {
						txt: "other"
					}
				}
			}
		])
		.loader;

	helpers.init(loader)
	.then(function(){
		return loader.normalize("dep/foo.txt", "app@1.0.0#main");
	})
	.then(function(name){
		assert.equal(name, "dep@1.0.0#foo.txt!other@1.0.0#main");
	})
	.then(done, helpers.fail(assert, done));

});

QUnit.test("Works from a dependent package that is progressively loaded", function(assert){
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
		.withPackages([
			{
				name: "dep",
				version: "1.0.0",
				main: "main.js",
				dependencies: {
					other: "1.0.0"
				},
				steal: {
					plugins: ["other"]
				}
			},
			{
				name: "other",
				version: "1.0.0",
				main: "main.js",
				steal: {
					ext: {
						txt: "other"
					}
				}
			}
		])
		.loader;

	var fetch = loader.fetch;
	loader.fetch = function(){
		return Promise.resolve(fetch.apply(this, arguments))
			.then(null, function(err){
				assert.ok(false, err.message);
				return Promise.reject(err);
			});
	};

	helpers.init(loader)
	.then(function(){
		return loader.normalize("dep/foo.txt", "app@1.0.0#main");
	})
	.then(function(name){
		assert.equal(name, "dep@1.0.0#foo.txt!other@1.0.0#main");
	})
	.then(done, helpers.fail(assert, done));

});
