/**
 * @module system-npm/utils
 *
 * Helpers that are used by npm-extension and the npm plugin.
 * This should be kept small and not have helpers exclusive to npm.
 * However, it can have all npm-extension helpers.
 */

// A regex to test if a moduleName is npm-like.
var npmModuleRegEx = /.+@.+\..+\..+#.+/;
var slice = Array.prototype.slice;

var utils = {
	extend: function(d, s, deep){
		var val;
		for(var prop in s) {
			val = s[prop];

			if(deep) {
				if(utils.isArray(val)) {
					d[prop] = slice.call(val);
				} else if(utils.isObject(val)) {
					d[prop] = utils.extend({}, val, deep);
				} else {
					d[prop] = s[prop];
				}
			} else {
				d[prop] = s[prop];
			}
		}
		return d;
	},
	map: function(arr, fn){
		var i = 0, len = arr.length, out = [];
		for(; i < len; i++) {
			out.push(fn.call(arr, arr[i]));
		}
		return out;
	},
	filter: function(arr, fn){
		var i = 0, len = arr.length, out = [], res;
		for(; i < len; i++) {
			res = fn.call(arr, arr[i]);
			if(res) {
				out.push(res);
			}
		}
		return out;
	},
	forEach: function(arr, fn) {
		var i = 0, len = arr.length;
		for(; i < len; i++) {
			fn.call(arr, arr[i], i);
		}
	},
	isObject: function(obj){
		return typeof obj === "object";
	},
	isArray: Array.isArray || function(arr){
		return Object.prototype.toString.call(arr) === "[object Array]";
	},
	isEnv: function(name) {
		return this.isEnv ? this.isEnv(name) : this.env === name;
	},
	warnOnce: function(msg){
		var w = this._warnings = this._warnings || {};
		if(w[msg]) return;
		w[msg] = true;
		if(typeof steal !== "undefined" && typeof console !== "undefined" &&
		  console.warn) {
			steal.done().then(function(){
				console.warn(msg);
			});
		}
	},
	relativeURI: function(baseURL, url) {
		return typeof steal !== "undefined" ? steal.relativeURI(baseURL, url) : url;
	},
	moduleName: {
		/**
		 * @function moduleName.create
		 * Converts a parsed module name to a string
		 *
		 * @param {system-npm/parsed_npm} descriptor
		 */
		create: function (descriptor, standard) {
			if(standard) {
				return descriptor.moduleName;
			} else {
				if(descriptor === "@empty") {
					return descriptor;
				}
				var modulePath;
				if(descriptor.modulePath) {
					modulePath = descriptor.modulePath.substr(0,2) === "./" ? descriptor.modulePath.substr(2) : descriptor.modulePath;
				}
				return descriptor.packageName
					+ (descriptor.version ? '@' + descriptor.version : '')
					+ (modulePath ? '#' + modulePath : '')
					+ (descriptor.plugin ? descriptor.plugin : '');
			}
		},
		/**
		 * @function moduleName.isNpm
		 * Determines whether a moduleName is npm-like.
		 * @return {Boolean}
		 */
		isNpm: function(moduleName){
			return npmModuleRegEx.test(moduleName);
		},
		/**
		 * @function moduleName.isFullyConvertedModuleName
		 * Determines whether a moduleName is a fully npm name, not npm-like
		 * With a parsed module name we can make sure there is a package name,
		 * package version, and module path.
		 */
		isFullyConvertedNpm: function(parsedModuleName){
			return !!(parsedModuleName.packageName &&
					  parsedModuleName.version && parsedModuleName.modulePath);
		},
		/**
		 * @function moduleName.isScoped
		 * Determines whether a moduleName is from a scoped package.
		 * @return {Boolean}
		 */
		isScoped: function(moduleName){
			return moduleName[0] === "@";
		},
		/**
		 * @function moduleName.parse
		 * Breaks a string moduleName into parts.
		 * packageName@version!plugin#modulePath
		 * "./lib/bfs"
		 *
		 * @return {system-npm/parsed_npm}
		 */
		parse: function (loader, moduleName, pkg, global) {
			//moduleName = "@gulp-steal@1.0.0#app_a";
			//moduleName = "@empty";
			//moduleName = "foo@1.2#./path";
			//moduleName = "@1.2#./path";
			//moduleName = "./path";
			//moduleName = "app_a";

			var pluginParts,
				modulePathParts,
				versionParts,
				plugin,
				modulePath,
				version;


			if (moduleName in loader.paths){
				return {
					plugin: '',
					version: '',
					modulePath: '',
					packageName: moduleName,
					moduleName: moduleName,
					isGlobal: global
				};
			}

			// set default
			var packageName = (pkg && pkg.name) ? pkg.name : undefined;
			var packageVersion = (pkg && pkg.version) ? pkg.version : undefined;

			if(packageName && moduleName.indexOf(packageName+'/') === 0) {
				moduleName = moduleName.substr((packageName+'/').length);
			}

			if (moduleName.indexOf('!') !== -1) {
				pluginParts = moduleName.split('!');
				plugin = pluginParts[1];
			}

			if(moduleName.indexOf('#') !== -1) {
				try {
					modulePathParts = pluginParts[0].split('#');
				}catch (e){
					modulePathParts = moduleName.split('#');
				}
				modulePath = modulePathParts[1];
			}

			if(moduleName.indexOf('@') !== -1) {
				try {
					versionParts = modulePathParts[0].split('@');
				}catch (e){
					versionParts = moduleName.split('@');
				}
				version = versionParts[1];
			}


			// it could be something like `@empty`
			if(!modulePath && versionParts && !versionParts[0]) {
				version = undefined;
			}

			// it could be a scope package
			if(versionParts && versionParts.length === 3 && utils.moduleName.isScoped(moduleName)) {
				versionParts.splice(0, 1);
				version = versionParts[1];
				packageName = versionParts[0];
			}

			// if relative, use currentPackageName
			if( packageName && utils.path.isRelative(moduleName) ) {
				modulePath = moduleName;
			} else {
				if(modulePath && version) { // foo@1.2#./path
					packageName = versionParts[0];
				} else {
					// test/abc
					var folderParts = moduleName.split("/");
					// Detect scoped packages
					if(folderParts.length && folderParts[0][0] === "@") {
						packageName = folderParts.splice(0, 2).join("/");
					} else if(folderParts.length > 1) {
						packageName = folderParts.shift();
					}
					modulePath = folderParts.join("/");
					if(!version) {
						version = packageVersion;
					}
				}
			}

			return {
				plugin: plugin,
				version: version,
				modulePath: modulePath,
				packageName: packageName,
				moduleName: moduleName,
				isGlobal: global
			};
		},
		/**
		 * @function moduleName.parseFromPackage
		 *
		 * Given the package that loads the dependency, the dependency name,
		 * and the moduleName of what loaded the package, return
		 * a [system-npm/parsed_npm].
		 *
		 * @param {Loader} loader
		 * @param {NpmPackage} refPkg The package `name` is a dependency of.
		 * @param {moduleName} name
		 * @param {moduleName} parentName
		 * @return {system-npm/parsed_npm}
		 *
		 */
		parseFromPackage: function(loader, refPkg, name, parentName) {
			// Get the name of the
			var packageName = utils.pkg.name(refPkg),
					packageVersion = refPkg.version,
			    parsedModuleName = utils.moduleName.parse(loader, name, {name: packageName, version: packageVersion}),
				isRelative = utils.path.isRelative(parsedModuleName.modulePath);

			if(isRelative && !parentName) {
				throw new Error("Cannot resolve a relative module identifier " +
								"with no parent module:", name);
			}

			// If the module needs to be loaded relative.
			if(isRelative) {
				// get the location of the parent
				var parentParsed = utils.moduleName.parse(loader, parentName, {name: packageName, version: packageVersion});
				// If the parentModule and the currentModule are from the same parent
				if( parentParsed.packageName === parsedModuleName.packageName && parentParsed.modulePath ) {
					// Make the path relative to the parentName's path.
					parsedModuleName.modulePath = utils.path.makeRelative(
						utils.path.joinURIs(parentParsed.modulePath, parsedModuleName.modulePath) );
				}
			}

			// we have the moduleName without the version
			// we check this against various configs
			var mapName = utils.moduleName.create(parsedModuleName),
			    mappedName;

			// The refPkg might have a browser [https://github.com/substack/node-browserify#browser-field] mapping.
			// Perform that mapping here.
			if(refPkg.browser && (typeof refPkg.browser !== "string") && (mapName in refPkg.browser)  && (!refPkg.system || !refPkg.system.ignoreBrowser)) {
				mappedName = refPkg.browser[mapName] === false ? "@empty" : refPkg.browser[mapName];
			}
			// globalBrowser looks like: {moduleName: aliasName, pgk: aliasingPkg}
			var global = loader && loader.globalBrowser && loader.globalBrowser[mapName];
			if(global) {
				mappedName = global.moduleName === false ? "@empty" : global.moduleName;
			}

			if(mappedName) {
				return utils.moduleName.parse(loader, mappedName, {name: packageName, version: packageVersion}, !!global);
			} else {
				return parsedModuleName;
			}
		},
		nameAndVersion: function(parsedModuleName){
			return parsedModuleName.packageName + "@" + parsedModuleName.version;
		}
	},
	pkg: {
		/**
		 * Returns a package's name.  The system config allows one to set this to
		 * something else.
		 * @return {String}
		 */
		name: function(pkg){
			return (pkg.system && pkg.system.name) || pkg.name;
		},
		main: function(pkg) {
			return  utils.path.removeJS( 
				(pkg.system && pkg.system.main) 
				|| (typeof pkg.browser === "string" && pkg.browser) 
				|| (typeof pkg.jspm === "string" && pkg.jspm) 
				|| (typeof pkg.jspm === "object" && pkg.jspm.main) 
				|| pkg.main || 'index' ) ;
		},
		rootDir: function(pkg, isRoot) {
			var root = isRoot ?
				utils.path.removePackage( pkg.fileUrl ) :
				utils.path.pkgDir(pkg.fileUrl);

			var lib = pkg.system && pkg.system.directories && pkg.system.directories.lib;
			if(lib) {
				root = utils.path.joinURIs(utils.path.addEndingSlash(root), lib);
			}
			return root;
		},
		/**
		 * @function pkg.isRoot
		 * Determines whether a module is the loader's root module.
		 * @return {Boolean}
		 */
		isRoot: function(loader, pkg) {
			var root = utils.pkg.getDefault(loader);
			return pkg.name === root.name && pkg.version === root.version;
		},
		getDefault: function(loader) {
			return loader.npmPaths.__default;
		},
		/**
		 * Returns packageData given a module's name or module's address.
		 *
		 * Given a moduleName, it tries to return the package it belongs to.
		 * If a moduleName isn't provided, but a moduleA
		 *
		 * @param {Loader} loader
		 * @param {String} [moduleName]
		 * @param {String} [moduleAddress]
		 * @return {NpmPackage|undefined}
		 */
		findByModuleNameOrAddress: function(loader, moduleName, moduleAddress) {
			if(loader.npm) {
				if(moduleName) {
					var parsed = utils.moduleName.parse(loader, moduleName);
					if(parsed.version && parsed.packageName) {
						var name = parsed.packageName+"@"+parsed.version;
						if(name in loader.npm) {
							return loader.npm[name];
						}
					}
				}
				if(moduleAddress) {
					var packageFolder = utils.pkg.folderAddress(moduleAddress);
					return packageFolder ? loader.npmPaths[packageFolder] : loader.npmPaths.__default;
				} else {
					return loader.npmPaths.__default;
				}
			}
		},
		folderAddress: function (address){
			var nodeModules = "/node_modules/",
				nodeModulesIndex = address.lastIndexOf(nodeModules),
				nextSlash = address.indexOf("/", nodeModulesIndex+nodeModules.length);
			if(nodeModulesIndex >= 0) {
				return nextSlash>=0 ? address.substr(0, nextSlash) : address;
			}
		},
		/**
		 * Walks up npmPaths looking for a [name]/package.json.  Returns
		 * the package data it finds.
		 *
		 * @param {Loader} loader
		 * @param {NpmPackage} refPackage
		 * @param {packgeName} name the package name we are looking for.
		 *
		 * @return {undefined|NpmPackage}
		 */
		findDep: function (loader, refPackage, name) {
			if(loader.npm && refPackage && !utils.path.startsWithDotSlash(name)) {
				// Todo .. first part of name
				var curPackage = utils.path.depPackageDir(refPackage.fileUrl, name);
				while(curPackage) {
					var pkg = loader.npmPaths[curPackage];
					if(pkg) {
						return pkg;
					}
					var parentAddress = utils.path.parentNodeModuleAddress(curPackage);
					if(!parentAddress) {
						return;
					}
					curPackage = parentAddress+"/"+name;
				}
			}
		},
		findByName: function(loader, name) {
			if(loader.npm && !utils.path.startsWithDotSlash(name)) {
				return loader.npm[name];
			}
		},
		findByUrl: function(loader, url) {
			if(loader.npm) {
				url = utils.pkg.folderAddress(url);
				return loader.npmPaths[url];
			}
		},
		hasDirectoriesLib: function(pkg) {
			var system = pkg.system;
			return system && system.directories && !!system.directories.lib;
		},
		findPackageInfo: function(context, pkg){
			var pkgInfo = context.pkgInfo;
			if(pkgInfo) {
				var out;
				utils.forEach(pkgInfo, function(p){
					if(pkg.name === p.name && pkg.version === p.version) {
						out = p;
					}
				});
				return out;
			}
		}
	},
	path: {
		makeRelative: function(path){
			if( utils.path.isRelative(path) && path.substr(0,1) !== "/" ) {
				return path;
			} else {
				return "./"+path;
			}
		},
		removeJS: function(path) {
			return path.replace(/\.js(!|$)/,function(whole, part){return part;});
		},
		removePackage: function (path){
			return path.replace(/\/package\.json.*/,"");
		},
		addJS: function(path){
			// Don't add `.js` for types that need to work without an extension.
			if(/\.js(on)?$/.test(path)) {
				return path;
			} else {
				return path+".js";
			}
		},
		isRelative: function(path) {
			return  path.substr(0,1) === ".";
		},
		joinURIs: function(base, href) {
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
		},
		startsWithDotSlash: function( path ) {
			return path.substr(0,2) === "./";
		},
		endsWithSlash: function(path){
			return path[path.length -1] === "/";
		},
		addEndingSlash: function(path){
			return utils.path.endsWithSlash(path) ? path : path+"/";
		},
		// Returns a package.json path one node_modules folder deeper than the
		// parentPackageAddress
		depPackage: function (parentPackageAddress, childName){
			var packageFolderName = parentPackageAddress.replace(/\/package\.json.*/,"");
			return (packageFolderName ? packageFolderName+"/" : "")+"node_modules/" + childName + "/package.json";
		},
		peerPackage: function(parentPackageAddress, childName){
			var packageFolderName = parentPackageAddress.replace(/\/package\.json.*/,"");
			return packageFolderName.substr(0, packageFolderName.lastIndexOf("/"))
				+ "/" + childName + "/package.json";
		},
		// returns the package directory one level deeper.
		depPackageDir: function(parentPackageAddress, childName){
			return utils.path.depPackage(parentPackageAddress, childName).replace(/\/package\.json.*/,"");
		},
		peerNodeModuleAddress: function(address) {
			var nodeModules = "/node_modules/",
				nodeModulesIndex = address.lastIndexOf(nodeModules);
			if(nodeModulesIndex >= 0) {
				return address.substr(0, nodeModulesIndex+nodeModules.length - 1 );
			}
		},
		// /node_modules/a/node_modules/b/node_modules/c -> /node_modules/a/node_modules/
		parentNodeModuleAddress: function(address) {
			var nodeModules = "/node_modules/",
				nodeModulesIndex = address.lastIndexOf(nodeModules),
				prevModulesIndex = address.lastIndexOf(nodeModules, nodeModulesIndex-1);
			if(prevModulesIndex >= 0) {
				return address.substr(0, prevModulesIndex+nodeModules.length - 1 );
			}
		},
		pkgDir: function(address){
			var nodeModules = "/node_modules/",
				nodeModulesIndex = address.lastIndexOf(nodeModules),
				nextSlash = address.indexOf("/", nodeModulesIndex+nodeModules.length);
			// Scoped packages
			if(address[nodeModulesIndex+nodeModules.length] === "@") {
				nextSlash = address.indexOf("/", nextSlash+1);
			}
			if(nodeModulesIndex >= 0) {
				return nextSlash>=0 ? address.substr(0, nextSlash) : address;
			}
		},
		basename: function(address){
			var parts = address.split("/");
			return parts[parts.length - 1];
		}
	},
	includeInBuild: true
};


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

module.exports = utils;
