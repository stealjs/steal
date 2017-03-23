var crawl = require("npm-crawl");
var convert = require("npm-convert");
var utils = require("npm-utils");

function Runner(System){
	this.BaseSystem = System;
	this.deps = [];
	this.sources = {};
	this.fetchAllowed = {};
	this.fetchAll = false;
}

Runner.prototype.clone = function(){
	var runner = this;
	var System = this.BaseSystem;
	var loader = this.loader = System.clone();
	loader.set("@loader", loader.newModule({
		__useDefault: true,
		"default": loader
	}));
	loader.set("@steal", loader.newModule({
		__useDefault: true,
		"default": steal
	}));

	loader.paths["live-reload"] = "node_modules/steal/ext/live-reload.js";

	var allow = {};
	utils.forEach([
		"package.json",
		"package.json!npm",
		"npm",
		"npm-convert",
		"npm-crawl",
		"npm-load",
		"npm-extension",
		"npm-utils",
		"semver",
		"@loader",
		"@steal"
	], function(name){
		allow[name] = true;
	});

	this.rootPackage({
		name: "npm-test",
		main: "main.js",
		version: "1.0.0"
	});

	// Keep a copy of each package.json in this scope
	this.packagePaths = {};

	// Override loader.fetch and return packages that are part of this loader
	var fetch = loader.fetch;
	loader.fetch = function(load){
		var pkg = runner.packagePaths[load.address];
		if(pkg) {
			var json = JSON.stringify(pkg);
			return Promise.resolve(json);
		}
		if(load.name === "package.json!npm") {
			var source = JSON.stringify(runner.root);
			return Promise.resolve(source);

		}
		if(allow[load.name]) {
			var source = System.getModuleLoad(load.name).source;
			return Promise.resolve(source);
		}
		if(runner.sources[load.name]) {
			var source = runner.sources[load.name];
			return Promise.resolve(source);
		}
		if(runner.fetchAll || runner.fetchAllowed[load.name]) {
			return fetch.apply(this, arguments);
		}
		var error = new Error("Unable to find: " + load.name);
		error.statusCode = 404;
		return Promise.reject(error);
	};

	var normalize = loader.normalize;
	loader.normalize = function(name){
		if(this._helperInited) {
			return normalize.apply(this, arguments);
		}

		var steal = runner.root.steal || {};
		var configDeps = steal.configDependencies || [];
		if(configDeps.indexOf(name) !== -1) {
			return normalize.apply(this, arguments);
		}

		var loader = this, args = arguments;
		return normalize.apply(this, arguments)
			.then(function(name){
				if(allow[name]) {
					return name;
				}

				return loader.import("package.json!npm")
				.then(function(){
					return normalize.apply(loader, args);
				});
			});
	};

	return this;
};

Runner.prototype.rootPackage = function(pkg){
	this.root = pkg;
	this._addVersion();
	return this;
};

/**
 * Add packages to the cloned loader. Packages can either be preloaded or not
 * by default they are. This function will add all of the appropriate config
 * to the loader for each scenario.
 */
Runner.prototype.withPackages = function(packages){
	// Do something to initialize these packages
	var deps = this.deps = packages.map(function(pkg){
		return (pkg instanceof Package) ? pkg : new Package(pkg);
	});

	var runner = this;
	deps.forEach(function(package){
		addPackage(package);
	});

	function addPackage(package, parentPackage, parentFileUrl){
		function shouldNest() {
			return parentPackage && (
				!runner.isFlat() ||
				runner.packagePaths[fileUrl + "/package.json"]
			);
		}

		var pkg = package.pkg;

		var fileUrl = "./node_modules/" + pkg.name;

		if(shouldNest()) {
			fileUrl = parentFileUrl + "/node_modules/" + pkg.name;
		}

		var pkgUrl = fileUrl + "/package.json";
		runner.packagePaths[pkgUrl] = pkg;

		package.forEachDeps(function(childPackage){
			addPackage(childPackage, package, fileUrl);
		});
	}

	return this;
};

Runner.prototype.withModule = function(moduleName, src){
	this.sources[moduleName] = src;
	return this;
};

Runner.prototype.withConfig = function(cfg){
	this.loader.config(cfg);
	return this;
};

Runner.prototype.npmVersion = function(version){
	if(arguments.length === 0) {
		return this._version;
	}
	this._version = version;
	return this;
};

Runner.prototype._addVersion = function(){
	var root = this.root;
	var system = root.system = root.system || {};

	if(root.system.npmAlgorithm === 'nested') {
		system.npmAlgorithm = this.algorithm = 'nested';
		this.npmVersion(2.15); // latest npm 2
	} else {
		system.npmAlgorithm = this.algorithm = 'flat';
		this.npmVersion(3);
	}
};

Runner.prototype.allowFetch = function(val){
	if(val === true) {
		this.fetchAll = true;
	} else {
		this.fetchAllowed[val] = true;
	}
	return this;
};

Runner.prototype.isFlat = function(){
	return this._version >= 3;
};

function Package(pkg){
	this.pkg = pkg;
	this._deps = [];
}

Package.toPackage = function(pkg){
	return (pkg instanceof Package) ? pkg : new Package(pkg)
};

Package.prototype.deps = function(deps){
	this._deps = this._deps.concat(deps.map(Package.toPackage));
	return this;
};

Package.prototype.forEachDeps = function(callback){
	var deps = this._deps;
	for(var i = 0, len = deps.length; i < len; i++) {
		callback(deps[i]);
	}
};

module.exports = function(System){
	var helpers = {
		clone: function(){
			return new Runner(System).clone();
		},
		Package: Package,
		package: function(pkg){
			return new Package(pkg);
		},
		// Create a done callback that will call some other functions
		// first, usually for cleanup.
		done: function(done /* , fns */){
			var fns = [].slice.call(arguments, 1);
			return function(value){
				utils.forEach(fns, function(fn){
					fn();
				});
				done(value);
			};
		},
		fail: function(assert, done){
			return function(err){
				assert.ok(false, err.message && err.stack || err);
				done(err);
			};
		},
		// Override a System hook. Returns a function that will reset
		// to the original state.
		hook: function(prop, callback){
			var hook = System[prop];
			var fn = callback(hook);
			System[prop] = fn;

			return function(){
				System[prop] = hook;
			};
		},
		// Override System.fetch, providing some values that will resolve
		// moduleNames.
		hookFetch: function(loads){
			return helpers.hook("fetch", function(fetch){
				return function(load){
					var value = loads[load.name];
					if(value) {
						if(typeof value === "object") {
							value = JSON.stringify(value);
						}
						return Promise.resolve(value);
					} else {
						return Promise.reject("Unable to load " + load.address);
					}
				};
			});
		},
		makeContext: function(){
			return {
				loader: System,
				paths: {},
				loadingPaths: {},
				packages: []
			};
		},
		init: function(loader){
			return loader.import("package.json!npm")
			.then(function(){
				loader._helperInited = true;
			});
		}
	};

	return helpers;
};
