"format cjs";

// TODO: cleanup removing package.json
var SemVer = require('./semver');

// Add @loader, for SystemJS
if(!System.has("@loader")) {
	System.set('@loader', System.newModule({'default':System, __useDefault: true}));
}

// Don't bother loading these dependencies
System.npmDev = true;


// module name and path helpers
function createModuleName (descriptor, standard) {
	if(standard) {
		return descriptor.moduleName;
	} else {
		return descriptor.packageName
			+ (descriptor.version ? '@' + descriptor.version : '')
			+ (descriptor.modulePath ? '#' + descriptor.modulePath : '')
			+ (descriptor.plugin ? '!' + descriptor.plugin : '');
	}
	
}

// packageName@version!plugin#modulePath
// "./lib/bfs"
function parseModuleName (moduleName, currentPackageName) {
	var pluginParts = moduleName.split('!');
	var modulePathParts = pluginParts[0].split("#");
	var versionParts = modulePathParts[0].split("@");
	// it could be something like `@empty`
	if(!modulePathParts[1] && !versionParts[0]) {
		versionParts = ["@"+versionParts[0]];
	}
	var packageName, 
		modulePath;
	
	// if relative, use currentPackageName
	if( currentPackageName && isRelative(moduleName) ) {
		packageName= currentPackageName;
		modulePath = versionParts[0];
	} else {
		
		if(modulePathParts[1]) { // foo@1.2#./path
			packageName = versionParts[0];
			modulePath = modulePathParts[1];
		} else {
			// test/abc
			var folderParts = versionParts[0].split("/");
			packageName = folderParts.shift();
			modulePath = folderParts.join("/");
		}
		
	}
	
	return {
		plugin: pluginParts[1],
		version: versionParts[1],
		modulePath: modulePath,
		packageName: packageName,
		moduleName: moduleName
	};
}

function parseURI(url) {
	var m = String(url).replace(/^\s+|\s+$/g, '').match(/^([^:\/?#]+:)?(\/\/(?:[^:@]*(?::[^:@]*)?@)?(([^:\/?#]*)(?::(\d*))?))?([^?#]*)(\?[^#]*)?(#[\s\S]*)?/);
		// authority = '//' + user + ':' + pass '@' + hostname + ':' port
		return (m ? {
		href     : m[0] || '',
		protocol : m[1] || '',
		authority: m[2] || '',
		host     : m[3] || '',
		hostname : m[4] || '',
		port     : m[5] || '',
		pathname : m[6] || '',
		search   : m[7] || '',
		hash     : m[8] || ''
	} : null);
}
// TODO: merge with joinURL
function joinURIs(base, href) {
	function removeDotSegments(input) {
		var output = [];
		input.replace(/^(\.\.?(\/|$))+/, '')
			.replace(/\/(\.(\/|$))+/g, '/')
			.replace(/\/\.\.$/, '/../')
			.replace(/\/?[^\/]*/g, function (p) {
				if (p === '/..') {
					output.pop();
				} else {
					output.push(p);
				}
			});
		return output.join('').replace(/^\//, input.charAt(0) === '/' ? '/' : '');
	}

	href = parseURI(href || '');
	base = parseURI(base || '');

	return !href || !base ? null : (href.protocol || base.protocol) +
		(href.protocol || href.authority ? href.authority : base.authority) +
		removeDotSegments(href.protocol || href.authority || href.pathname.charAt(0) === '/' ? href.pathname : (href.pathname ? ((base.authority && !base.pathname ? '/' : '') + base.pathname.slice(0, base.pathname.lastIndexOf('/') + 1) + href.pathname) : base.pathname)) +
			(href.protocol || href.authority || href.pathname ? href.search : (href.search || base.search)) +
			href.hash;
}

function endsWithSlash(path){
	return path[path.length -1] === "/";
}
function startsWithDotSlash( path ) {
	return path.substr(0,2) === "./";
}
function isRelative(path) {
	return  path.substr(0,1) === ".";
}
function removeTrailingSlash( path ) {
	if(endsWithSlash(path)) {
		return path.substr(0, path.length -1);
	} else {
		return path;
	}
}
function removeLeadingDotSlash( path ) {
	if(startsWithDotSlash(path)) {
		return path.substr(2);
	} else {
		return path;
	}
}
// TODO: merge joinURIs
function joinURL(baseURL, url){
	baseURL = removeTrailingSlash(baseURL);
	url = removeLeadingDotSlash(url);
	return baseURL+"/"+url;
}
function addJS(path){
	if(/\.\w+$/.test(path)) {
		return path;
	} else {
		return path+".js";
	}
}

function packageFolderAddress(address){
	var nodeModules = "/node_modules/",
		nodeModulesIndex = address.lastIndexOf(nodeModules),
		nextSlash = address.indexOf("/", nodeModulesIndex+nodeModules.length);
	if(nodeModulesIndex >= 0) {
		return nextSlash>=0 ? address.substr(0, nextSlash) : address;
	}
}
// gives the parent node_module folder address
function parentNodeModuleAddress(address) {
	var nodeModules = "/node_modules/",
		nodeModulesIndex = address.lastIndexOf(nodeModules),
		prevModulesIndex = address.lastIndexOf(nodeModules, nodeModulesIndex-1);
	if(prevModulesIndex >= 0) {
		return address.substr(0, prevModulesIndex+nodeModules.length - 1 );
	}
}
function childPackageAddress(parentPackageAddress, childName){
	var packageFolderName = parentPackageAddress.replace(/\/package\.json.*/,"");
	return (packageFolderName ? packageFolderName+"/" : "")+"node_modules/" + childName + "/package.json";
}


/**
 * @function fetch
 * @description Implement fetch so that we can warn the user in case of a 404.
 * @signature `fetch(load)`
 * @param {Object} load Load object
 * @return {Promise} a promise to resolve with the load's source
 */
exports.fetch = function(load){
	var loader = this;
	return Promise.resolve(this.fetch(load)).then(null, function(msg){
		if(/Not Found/.test(msg)) {
			var packageName = /\/(.+?)\/bower\.json/.exec(load.name)[1];
			console.log("Unable to load the bower.json for", packageName);
		}
		return "";
	});
};


System.npmPackages = {};
function findPackageByAddress(loader, parentName, parentAddress) {
	if(loader.npm) {
		if(parentName) {
			var parsed = parseModuleName(parentName);
			if(parsed.version && parsed.packageName) {
				var name = parsed.packageName+"@"+parsed.version;
				if(name in loader.npm) {
					return loader.npm[name];
				}
			}
		}
		if(parentAddress) {
			var packageFolder = packageFolderAddress(parentAddress);
			return packageFolder ? loader.npmPaths[packageFolder] : loader.npmPaths.__default;
		} else {
			return loader.npmPaths.__default;
		}
	}
	
}
function findPackage(loader, name) {
	if(loader.npm && !startsWithDotSlash(name)) {
		return loader.npm[name];
	}
}
function findDepPackage(loader, refPackage, name) {
	if(loader.npm && refPackage && !startsWithDotSlash(name)) {
		// Todo .. first part of name
		var curPackage = childPackageAddress(refPackage.fileUrl, name).replace(/\/package\.json.*/,"");
		while(curPackage) {
			var pkg = loader.npmPaths[curPackage];
			if(pkg) {
				return pkg;
			}
			var parentAddress = parentNodeModuleAddress(curPackage);
			if(!parentAddress) {
				return;
			}
			curPackage = parentAddress+"/"+name;
		}
	}
}

function parsedModuleNameFromPackage(loader, refPkg, name, parentName) {
	var packageName = refPkg.name,
	    parsedModuleName = parseModuleName(name, packageName);
	    
	if( isRelative( parsedModuleName.modulePath ) ) {
		var parentParsed = parseModuleName( parentName, packageName );
		if( parentParsed.packageName === parsedModuleName.packageName && parentParsed.modulePath ) {
			parsedModuleName.modulePath = joinURIs(parentParsed.modulePath, parsedModuleName.modulePath);
		}
	}
	var mapName = createModuleName(parsedModuleName),
	    mappedName;
	
	// The refPkg might have a browser [https://github.com/substack/node-browserify#browser-field] mapping.
	// Perform that mapping here.
	if(refPkg.browser && (mapName in refPkg.browser)) {
		mappedName = refPkg.browser[mapName] === false ? "@empty" : refPkg.browser[mapName];
	}
	// globalBrowser looks like: {moduleName: aliasName, pgk: aliasingPkg}
	var global = loader && loader.globalBrowser && loader.globalBrowser[mapName];
	if(global) {
		mappedName = global.moduleName === false ? "@empty" : global.moduleName;
	}
	
	if(mappedName) {
		return parseModuleName(mappedName, packageName);
	} else {
		return parsedModuleName;
	}
}

var oldNormalize = System.normalize;
System.normalize = function(name, parentName, parentAddress){
	
	console.log("normalize",name, parentName, parentAddress);

	var refPkg = findPackageByAddress(this, parentName, parentAddress);
	
	// this isn't in a package, so ignore
	if(!refPkg) {
		return oldNormalize.call(this, name, parentName, parentAddress);
	}
	// TODO: joining ...
	var parsedModuleName = parsedModuleNameFromPackage(this, refPkg, name, parentName);
	
	var depPkg = findDepPackage(this, refPkg, parsedModuleName.packageName);
	
	// This really shouldn't happen, but lets find a package.
	if (!depPkg) {
		depPkg = findPackage(this, parsedModuleName.packageName);
	}
	// It could be something like `fs` so check in globals
	if(!depPkg) {
		var browserPackageName = this.globalBrowser[parsedModuleName.packageName];
		if(browserPackageName) {
			parsedModuleName.packageName = browserPackageName;
			depPkg = findPackage(this, parsedModuleName.packageName);
		}
	}
	
	if( depPkg ) {
		parsedModuleName.version = depPkg.version;
		// add the main path
		if(!parsedModuleName.modulePath) {
			parsedModuleName.modulePath = (typeof depPkg.browser === "string" && depPkg.browser) || depPkg.main || 'index';
		}
		return createModuleName(parsedModuleName);
	} else {
		// it could be a local module like components/foo
		return oldNormalize.call(this, createModuleName(parsedModuleName, true), parentName, parentAddress);
	}
	
};

var oldLocate = System.locate;
System.locate = function(load){
	console.log("locate", load.name);

	var parsedModuleName = parseModuleName(load.name);
	
	// @ is not the first character
	if(parsedModuleName.version && this.npm) {
		var pkg = this.npm[parsedModuleName.packageName];
		if(pkg === this.npmPaths.__default) {
			var loadCopy = extend({},load);
			loadCopy.name = parsedModuleName.modulePath;
			return oldLocate.call(this, loadCopy);
		} else if(pkg) {
			if(parsedModuleName.modulePath) {
				return joinURL( packageFolderAddress(pkg.fileUrl), addJS(parsedModuleName.modulePath));
			} 
		}
	}
	return oldLocate.call(this, load);
};


function addDeps(packageJSON, dependencies, deps){
	for(var name in dependencies) {
		if(!packageJSON.system || !packageJSON.system.npmIgnore || !packageJSON.system.npmIgnore[name]) {
			deps[name] = {name: name, version: dependencies[name]};
		}
	}
}

// Combines together dependencies and devDependencies (if npmDev option is enabled)
function getDependencies(loader, packageJSON){
	var deps = {};
	
	addDeps(packageJSON, packageJSON.peerDependencies || {}, deps);
	addDeps(packageJSON, packageJSON.dependencies || {}, deps);
	// Only get the devDependencies if this is the root bower and the 
	// `npmDev` option is enabled
	if(loader.npmDev && !loader._npmMainLoaded) {
		addDeps(packageJSON, packageJSON.devDependencies || {}, deps);
		loader._npmMainLoaded = true;
	}
	
	var dependencies = [];
	for(var name in deps) {
		dependencies.push(deps[name]);
	}
	
	return dependencies;
};

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
	// 
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
		context.packages.forEach(function(pkg){
			if(!packages[pkg.name+"@"+pkg.version]) {
				packages.push({
					name: pkg.name,
					version: pkg.version,
					fileUrl: pkg.fileUrl,
					main: pkg.main,
					system: pkg.system,
					globalBrowser: convertBrowser(pkg, pkg.globalBrowser ),
					browser: convertBrowser(pkg,  pkg.browser )
				});
				packages[pkg.name+"@"+pkg.version] = true;
			}
		});
		return "define(['@loader'], function(loader){\n" +
		    (pkg.main ? "if(!System.main){ System.main = "+JSON.stringify(pkg.main)+"; }\n" : "") + 
			"("+translateConfig.toString()+")(loader, "+JSON.stringify(packages, null, " ")+");\n" +
		"});";
	});
};

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
function convertBrowserProperty(map, pkg, fromName, toName) {
	var packageName = pkg.name;
	
	var fromParsed = parseModuleName(fromName, packageName),
		  toParsed = parseModuleName(toName, packageName);
	
	map[createModuleName(fromParsed)] = createModuleName(toParsed);
}


var extend = function(d, s){
	for(var prop in s) {
		d[prop] = s[prop];
	}
	return d;
};

function isSameRequestedVersionFound(context, childPkg) {
	if(!context.versions[childPkg.name]) {
		context.versions[childPkg.name] = {};
	}
	var versions = context.versions[childPkg.name];
	if(!versions[childPkg.version]) {
		versions[childPkg.version] = childPkg;
	} else {
		// add a placeholder at this path
		context.paths[childPkg.origFileUrl] = versions[childPkg.version];
		return true;
	}
}

function hasParentPackageThatMatches(context, childPkg){
	// check paths
	var parentAddress = parentNodeModuleAddress(childPkg.origFileUrl);
	while(parentAddress) {
		var packageAddress = parentAddress+"/"+childPkg.name+"/package.json";
		var parentPkg = context.paths[packageAddress];
		if(parentPkg) {
			if(SemVer.satisfies(parentPkg.version, childPkg.version)) {
				return parentPkg;
			}
		}
		parentAddress = parentNodeModuleAddress(packageAddress);
	}
}

function truthy(x) {
	return x;
}
function processDeps(context, pkg) {
	var deps = getDependencies(context.loader, pkg);
	return Promise.all(deps.map(function(childPkg){

		childPkg.origFileUrl = childPackageAddress(pkg.fileUrl, childPkg.name);
		
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

function processPkg(context, pkg, source) {
	var packageJSON = JSON.parse(source);
	extend(pkg, packageJSON);
	context.packages.push(pkg);
	return pkg;
}


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
			loader.config(pkg.system);
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


