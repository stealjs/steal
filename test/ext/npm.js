"format cjs";

// TODO: cleanup removing package.json
var SemVer = require('./semver');
var npmExtension = require('./npm-extension');
var createModuleName = npmExtension.createModuleName;
var parseModuleName = npmExtension.parseModuleName;

// Add @loader, for SystemJS
if(!System.has("@loader")) {
	System.set('@loader', System.newModule({'default':System, __useDefault: true}));
}


// BAISC HELPERS
var extend = function(d, s){
	for(var prop in s) {
		d[prop] = s[prop];
	}
	return d;
};
function truthy(x) {
	return x;
}



// SYSTEMJS PLUGIN EXPORTS =================

/**
 * @function translate
 * @description Convert the package.json file into a System.config call.
 * @signature `translate(load)`
 * @param {Object} load Load object
 * @return {Promise} a promise to resolve with the load's new source.
 */
exports.translate = function(load){
	// This could be an empty string if the fetch failed.
	if(load.source == "") {
		return "define([]);";
	}
	this.npmDev = true;

	var context = {
		packages: [],
		loader: this,
		// places we
		paths: {},
		versions: {}
	};
	var pkg = {origFileUrl: load.address, fileUrl: load.address};
	
	processPkg(context, pkg, load.source);
	
	return processDeps(context, pkg).then(function(){
		// clean up packages so everything is unique
		var names = {};
		var packages = [];
		context.packages.forEach(function(pkg, index){
			if(!packages[pkg.name+"@"+pkg.version]) {
				if(pkg.browser){ 
					delete pkg.browser.transform;
				}
				packages.push({
					name: pkg.name,
					version: pkg.version,
					fileUrl: pkg.fileUrl,
					main: pkg.main,
					system: convertSystem(context, pkg, pkg.system, index === 0 ),
					globalBrowser: convertBrowser( pkg, pkg.globalBrowser ),
					browser: convertBrowser( pkg,  pkg.browser )
				});
				packages[pkg.name+"@"+pkg.version] = true;
			}
		});
		return "define(['@loader'], function(loader){\n" +
			npmExtension.out()+
		    (pkg.main ? "if(!System.main){ System.main = "+JSON.stringify(npmExtension.pkgMain(pkg))+"; }\n" : "") + 
			"("+translateConfig.toString()+")(loader, "+JSON.stringify(packages, null, " ")+");\n" +
		"});";
	});
};


// CRAWLING HELPERS =========================
// Helpers that read through package.json

// processes a package.json text, but not its dependencies.
function processPkg(context, pkg, source) {
	var packageJSON = JSON.parse(source);
	extend(pkg, packageJSON);
	context.packages.push(pkg);
	return pkg;
}

function nodeModuleAddress(address) {
	if(!address) debugger;
	var nodeModules = "/node_modules/",
		nodeModulesIndex = address.lastIndexOf(nodeModules);
	if(nodeModulesIndex >= 0) {
		return address.substr(0, nodeModulesIndex+nodeModules.length - 1 );
	}
}
// processes a package.json's dependencies
function processDeps(context, pkg) {

	var deps = getDependencies(context.loader, pkg);
	return Promise.all(deps.map(function(childPkg){
		if(childPkg._isPeerDependency && nodeModuleAddress(pkg.fileUrl) ) {
			childPkg.origFileUrl = nodeModuleAddress(pkg.fileUrl)+"/"+childPkg.name+"/package.json";
		} else {
			childPkg.origFileUrl = npmExtension.childPackageAddress(pkg.fileUrl, childPkg.name);
		}
		
		
		// check if childPkg matches a parent's version ... if it does ... do nothing
		if(hasParentPackageThatMatches(context, childPkg)) {
			return;
		}
		
		if(isSameRequestedVersionFound(context, childPkg)) {
			return;
		}
		
		
		
		// otherwise go get child ... but don't process dependencies until all of these dependencies have finished
		return npmLoad(context, childPkg).then(function(source){
			if(source) {
				return processPkg(context, childPkg, source);
			} // else if there's no source, it's likely because this dependency has been found elsewhere
		});
		
	}).filter(truthy)).then(function(packages){
		// at this point all dependencies of pkg have been loaded, it's ok to get their children

		return Promise.all(packages.map(function(childPkg){
			if(childPkg) {
				return processDeps(context, childPkg);
			} 
		}).filter(truthy));
	});
}


function isSameRequestedVersionFound(context, childPkg) {
	if(!context.versions[childPkg.name]) {
		context.versions[childPkg.name] = {};
	}
	var versions = context.versions[childPkg.name];
	
	var requestedRange = childPkg.version;
	
	if( !SemVer.validRange(childPkg.version) ) {
		
		if(/^[\w_\-]+\/[\w_\-]+(#[\w_\-]+)?$/.test(requestedRange)  ) {
			
			requestedRange = "git+https://github.com/"+requestedRange;
			if(!/(#[\w_\-]+)?$/.test(requestedRange)) {
				requestedRange += "#master";
			}
		}
	}
	var version = versions[requestedRange];
	
	if(!version) {
		versions[requestedRange] = childPkg;
	} else {
		// add a placeholder at this path
		context.paths[childPkg.origFileUrl] = version;
		return true;
	}
}

function hasParentPackageThatMatches(context, childPkg){
	// check paths
	var parentAddress = npmExtension.parentNodeModuleAddress(childPkg.origFileUrl);
	while(parentAddress) {
		var packageAddress = parentAddress+"/"+childPkg.name+"/package.json";
		var parentPkg = context.paths[packageAddress];
		if(parentPkg) {
			if(SemVer.satisfies(parentPkg.version, childPkg.version)) {
				return parentPkg;
			}
		}
		parentAddress = npmExtension.parentNodeModuleAddress(packageAddress);
	}
}

function addDeps(packageJSON, dependencies, deps, defaultProps){
	for(var name in dependencies) {
		if(!packageJSON.system || !packageJSON.system.npmIgnore || !packageJSON.system.npmIgnore[name]) {
			deps[name] = extend(defaultProps || {}, {name: name, version: dependencies[name]});
		}
	}
}
function getDependencyMap(loader, packageJSON, isRoot){
	var deps = {};
	
	addDeps(packageJSON, packageJSON.peerDependencies || {}, deps, {_isPeerDependency: true});
	addDeps(packageJSON, packageJSON.dependencies || {}, deps);
	// Only get the devDependencies if this is the root bower and the 
	// `npmDev` option is enabled
	if(loader.npmDev && (isRoot || !loader._npmMainLoaded)) {
		addDeps(packageJSON, packageJSON.devDependencies || {}, deps);
		loader._npmMainLoaded = true;
	}
	return deps;
}
// Combines together dependencies and devDependencies (if npmDev option is enabled)
function getDependencies(loader, packageJSON){
	var deps = getDependencyMap(loader, packageJSON);
	
	var dependencies = [];
	for(var name in deps) {
		dependencies.push(deps[name]);
	}
	
	return dependencies;
};

// Loads package.json
// if it finds one, it sets that package in paths
// so it won't be loaded twice.
function npmLoad(context, pkg, fileUrl){
	fileUrl = fileUrl || pkg.origFileUrl;
	return System.fetch({
		address: fileUrl,
		name: fileUrl,
		metadata: {}
	}).then(function(source){
		context.paths[fileUrl || pkg.origFileUrl] = pkg;
		pkg.fileUrl = fileUrl;
		return source;
	},function(ex){
		return npmTraverseUp(context, pkg, fileUrl);
	});
};

function npmTraverseUp(context, pkg, fileUrl) {
	// make sure we aren't loading something we've already loaded
	var parentAddress = parentNodeModuleAddress(fileUrl);
	if(!parentAddress) {
		throw new Error('Did not find ' + pkg.origFileUrl);
	}
	var nodeModuleAddress = parentAddress+"/"+pkg.name+"/package.json";
	if(context.paths[nodeModuleAddress]) {
		// already processed
		return;
	} else {
		return npmLoad(context, pkg, nodeModuleAddress);
	}
}

// Translate helpers ===============
// Given all the package.json data, these helpers help convert it to a source.
function convertSystem(context, pkg, system, root) {
	if(!system) {
		return system;
	}
	if(system.meta) {
		system.meta = convertPropertyNames(context, pkg, system.meta, root);
	}
	if(system.map) {
		system.map = convertPropertyNamesAndValues(context, pkg, system.map, root);
	}
	// needed for builds
	if(system.buildConfig) {
		system.buildConfig = convertSystem(context, pkg, system.buildConfig, root);
	}
	return system;
}

// converts only the property name
function convertPropertyNames (context, pkg, map , root) {
	if(!map) {
		return map;
	}
	var clone = {};
	for( property in map ) {
		clone[convertName(context, pkg, map, root, property)] = map[property];
	}
	return clone;
}

// converts both property name and value
function convertPropertyNamesAndValues (context, pkg, map , root) {
	if(!map) {
		return map;
	}
	var clone = {};
	for( property in map ) {
		clone[convertName(context, pkg, map, root, property)] = convertName(context, pkg, map, root, map[property]);
	}
	return clone;
}

function convertName (context, pkg, map, root, name) {
	var parsed = parseModuleName(name, pkg.name);
	if(name.indexOf("#") >= 0) {
		
		if(parsed.packageName === pkg.name) {
			parsed.version = pkg.version;
		} else {
			// Get the requested version's actual version.
			var requestedVersion = getDependencyMap(context.loader, pkg)[parsed.packageName].version;
			var depPkg = context.versions[parsed.packageName][requestedVersion];
			parsed.version = depPkg.version;
		}
		return createModuleName(parsed);
		
	} else {
		
		if(root && property.substr(0,2) === "./" ) {
			return property.substr(2);
		} else {
			// this is for a module within the package
			if (property.substr(0,2) === "./" ) {
				return createModuleName({
					packageName: pkg.name,
					modulePath: name,
					version: pkg.version,
					plugin: parsed.plugin
				});
			} else {
				// TODO: share code better!
				var depPkg;
				if( pkg.name === parsed.packageName ) {
					depPkg = pkg;
				} else {
					var requestedVersion = getDependencyMap(context.loader, pkg, root)[parsed.packageName].version;
					var depPkg = context.versions[parsed.packageName][requestedVersion];
				}
				parsed.version = depPkg.version;
				if(!parsed.modulePath) {
					parsed.modulePath = npmExtension.pkgMain(depPkg);
				}
				return createModuleName(parsed);
			}
			
		}
		
	}
}


/**
 * Converts browser names into actual module names.
 * 
 * Example:
 * 
 * ```
 * {
 * 	 "foo": "browser-foo"
 *   "traceur#src/node/traceur": "./browser/traceur"
 *   "./foo" : "./foo-browser"
 * }
 * ```
 * 
 * converted to:
 * 
 * ```
 * {
 * 	 // any foo ... regardless of where
 *   "foo": "browser-foo"
 *   // this module ... ideally minus version
 *   "traceur#src/node/traceur": "transpile#./browser/traceur"
 *   "transpile#./foo" : "transpile#./foo-browser"
 * }
 * ```
 */
function convertBrowser(pkg, browser) {
	if(typeof browser === "string") {
		return browser;
	}
	var map = {};
	for(var fromName in browser) {
		convertBrowserProperty(map, pkg, fromName, browser[fromName]);
	}
	return map;
}


function convertBrowserProperty(map, pkg, fromName, toName) {
	var packageName = pkg.name;
	
	var fromParsed = parseModuleName(fromName, packageName),
		  toParsed = toName  ? parseModuleName(toName, packageName): "@empty";
	
	map[createModuleName(fromParsed)] = createModuleName(toParsed);
}



var translateConfig = function(loader, packages){
	var g;
	if(typeof window !== "undefined") {
		g = window;
	} else {
		g = global;
	}
	if(!g.process) {
		g.process = {
			cwd: function(){}
		};
	}
	
	if(!loader.npm) {
		loader.npm = {};
		loader.npmPaths = {};
		loader.globalBrowser = {};
	}
	loader.npmPaths.__default = packages[0];
	var lib = packages[0].system && packages[0].system.directories && packages[0].system.directories.lib;
	
	if(lib) {
		loader.paths["*"] = lib+"/"+"*.js";
	}
	var setGlobalBrowser = function(globals, pkg){
		for(var name in globals) {
			loader.globalBrowser[name] = {
				pkg: pkg,
				moduleName: globals[name]
			};
		}
	};
	
	packages.forEach(function(pkg){
		if(pkg.system) {
			// don't set system.main
			var main = pkg.system.main;
			delete pkg.system.main;
			loader.config(pkg.system);
			pkg.system.main = main;
			
		}
		if(pkg.globalBrowser) {
			setGlobalBrowser(pkg.globalBrowser, pkg);
		}
		if(!loader.npm[pkg.name]) {
			loader.npm[pkg.name] = pkg;
		}
		loader.npm[pkg.name+"@"+pkg.version] = pkg;
		var pkgAddress = pkg.fileUrl.replace(/\/package\.json.*/,"");
		loader.npmPaths[pkgAddress] = pkg;
	});
};


