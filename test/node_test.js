let path = require("path");
let steal = require("../main");
let assert = require("assert");
let nock = require("nock");

let makeSteal = function(config){
	let localSteal =  steal.clone();
	localSteal.config(config || {});
	return localSteal;
};

describe("default configuration", function () {
	this.timeout(20000);

	it("with a npm configuration", function (done) {
		let steal = makeSteal({
			config: __dirname + "/npm/npm-deep/package.json!npm"
		});
		steal
			.startup()
			.then(function(main){
				assert.ok(main, 'main');
				assert.equal(steal.loader.transpiler, 'babel');
				assert.equal(steal.loader.configMain, 'package.json!npm');
				assert.strictEqual(steal.loader.npmContext.isFlatFileStructure, true);
			})
			.then(done, done);
	});

	it("works in production", function(done){
		let steal = makeSteal({
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
		let pwd = process.cwd();
		process.chdir(__dirname);

		let steal = makeSteal({
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
		let steal = makeSteal({
			config: __dirname + "/file_missing/package.json!npm"
		});

		steal.startup().then(function(){
			assert.ok(false, "Promise resolved when it should have rejected");
		}, function(err){
			assert.ok(err instanceof Error, "Got an error");
			assert.ok(/AwesomeButton/.test(err.message), "Code is inlined");
		})
		.then(done, done);
	});
});

describe("@node-require", function(){
	it("Should be able to load projects that have Node deps", function(done){
		let steal = makeSteal({
			config: __dirname + "/plugin-require/package.json!npm",
			main: "@empty"
		});

		steal.import("main").then(function(mod){
			assert.equal(mod, "bar", "loaded it");
		})
		.then(done, done);
	});
});

describe("tree shaking", function() {
	it("works", function() {
		let steal = makeSteal({
			config: path.join(__dirname, "tree_shake", "package.json!npm"),
			main: "node_main"
		});

		// force instantiate to return an object and
		// prevent the transpile hook to be called
		steal.loader.preventModuleExecution = true;

		return steal
			.startup()
			.then(function() {
				let load = steal.loader._traceData.loads.mod;
				let usedExports = load.metadata && load.metadata.usedExports;

				assert(usedExports, "should collect usedExports");
				assert(usedExports.has("a"), "'a' is an used export");
				assert(!usedExports.has("b"), "'b' is not an used export");
				assert(!usedExports.has("c"), "'c' is not an used export");
			});
	});
});

describe("Modules with http(s) in the module name", function() {
	it("works", function(done){
		let scope = nock(/example\.com/)
                .get('/foo.mjs')
                .reply(200, 'module.exports="one"')
				.get('/bar.js')
				.reply(200, 'module.exports="two"')
				.get('/baz.mjs')
				.reply(200, 'module.exports="three"');

		let steal = makeSteal({
			config: path.join(__dirname, "http_spec", "package.json!npm")
		});

		steal.import("~/main")
		.then(function(main){
			assert.equal(main.one, "one");
			assert.equal(main.two, "two");
			assert.equal(main.three, "three");
		})
		.then(done, done);
	});
});
