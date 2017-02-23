var steal = require("../main");
var assert = require("assert");

var makeSteal = function(config){
	var localSteal =  steal.clone();
	localSteal.config(config || {});
	return localSteal;
};

describe("default configuration", function () {
	this.timeout(20000);

	it("with a npm configuration", function (done) {
		var steal = makeSteal({
			config: __dirname + "/npm/npm-deep/package.json!npm"
		});
		steal.startup().then(function(main){
			assert.ok(main, 'main');
			assert.equal(steal.loader.transpiler, 'babel');
			assert.equal(steal.loader.configMain, 'package.json!npm');
			assert.strictEqual(steal.loader.npmContext.isFlatFileStructure, true);
			done();
		},done);
	});

	it("works in production", function(done){
		var steal = makeSteal({
			env: "server-production",
			config: __dirname + "/node-prod/stealconfig.js",
			main: "app/app"
		});

		steal.startup().then(function(main){
			assert.equal(main.hello, "world");
		}).then(done, done);
	});
});

describe("plugins", function(){
	this.timeout(20000);

	it("able to load a config without an absolute path", function(done){
		var pwd = process.cwd();
		process.chdir(__dirname);

		var steal = makeSteal({
			config: "config.js",
			main: "basics/basics"
		});
		steal.startup()
			.then(check, check)
			.then(done, done);

		function check(e) {
			process.chdir(pwd);
			assert(!(e instanceof Error), "Did not receive an error");
		}
	});

});

describe("Modules that don't exist", function(){
	it("should reject", function(done){
		var steal = makeSteal({
			config: __dirname + "/../package.json!npm",
			main: "@empty"
		});

		steal.startup().then(function(){
			steal.import("some/fake/module")
			.then(function(){
				assert.ok(false, "Promise resolved when it should have rejected");
			}, function(err){
				assert.ok(err instanceof Error, "Got an error");
			})
			.then(done, done);
		});
	});
});

describe("@node-require", function(){
	it("Should be able to load projects that have Node deps", function(done){
		var steal = makeSteal({
			config: __dirname + "/plugin-require/package.json!npm",
			main: "@empty"
		});

		steal.import("main").then(function(mod){
			assert.equal(mod, "bar", "loaded it");
		})
		.then(done, done);
	});
});
