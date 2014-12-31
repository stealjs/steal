"format cjs";


// HELPERS USED BY npm.js
function isRelative(path) {
	return  path.substr(0,1) === ".";
}


// Converts a parsed module name to a string
function createModuleName (descriptor, standard) {
	if(standard) {
		return descriptor.moduleName;
	} else {
		return descriptor.packageName
			+ (descriptor.version ? '@' + descriptor.version : '')
			+ (descriptor.modulePath ? '#' + descriptor.modulePath : '')
			+ (descriptor.plugin ? '!' + descriptor.plugin : '');
	}
};

// Breaks a string moduleName into parts.
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

function childPackageAddress(parentPackageAddress, childName){
	var packageFolderName = parentPackageAddress.replace(/\/package\.json.*/,"");
	return (packageFolderName ? packageFolderName+"/" : "")+"node_modules/" + childName + "/package.json";
}


function parentNodeModuleAddress(address) {
	var nodeModules = "/node_modules/",
		nodeModulesIndex = address.lastIndexOf(nodeModules),
		prevModulesIndex = address.lastIndexOf(nodeModules, nodeModulesIndex-1);
	if(prevModulesIndex >= 0) {
		return address.substr(0, prevModulesIndex+nodeModules.length - 1 );
	}
}

var extension = function(System){
	
	/**
	 * Normalize has to deal with a "tricky" situation.  There are module names like
	 * "css" -> "css" normalize like normal
	 * "./qunit" //-> "qunit"  ... could go to steal-qunit#qunit, but then everything would?
	 * 
	 * isRoot?
	 *   "can-slider" //-> "path/to/main"
	 * 
	 * else
	 * 
	 *   "can-slider" //-> "can-slider#path/to/main"
	 */
	var oldNormalize = System.normalize;
	System.normalize = function(name, parentName, parentAddress){
		
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
		
		if( depPkg && depPkg !== this.npmPaths.__default ) {
			parsedModuleName.version = depPkg.version;
			// add the main path
			if(!parsedModuleName.modulePath) {
				parsedModuleName.modulePath = pkgMain(depPkg);
			}
			return oldNormalize.call(this, createModuleName(parsedModuleName), parentName, parentAddress);
		} else {
			if(depPkg === this.npmPaths.__default) {
				var localName = parsedModuleName.modulePath ? parsedModuleName.modulePath : pkgMain(depPkg);
				return oldNormalize.call(this, localName, parentName, parentAddress);
			}
			return oldNormalize.call(this, name, parentName, parentAddress);
		}
		
	};
	function pkgMain(pkg) {
		return removeJS( (typeof pkg.browser === "string" && pkg.browser) || pkg.main || 'index' );
	}
	
	var oldLocate = System.locate;
	System.locate = function(load){
		
		var parsedModuleName = parseModuleName(load.name),
			loader = this;
		
		// @ is not the first character
		if(parsedModuleName.version && this.npm) {
			var pkg = this.npm[parsedModuleName.packageName];
			if(pkg) {
				return oldLocate.call(this, load).then(function(address){
					var root = pkg === loader.npmPaths.__default ?
						removePackage( pkg.fileUrl ) :
						packageFolderAddress(pkg.fileUrl);
					
					if(parsedModuleName.modulePath) {
						return joinURL( root, addJS(parsedModuleName.modulePath));
					} 
					
					return address;
				});
			}
		}
		return oldLocate.call(this, load);
	};

	var extend = function(d, s){
		for(var prop in s) {
			d[prop] = s[prop];
		}
		return d;
	};

	// PACKAGE HELPERS ========================
	// Help locate modules based on packages info
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

	function addJS(path){
		if(/\.\w+$/.test(path)) {
			return path;
		} else {
			return path+".js";
		}
	}
	function removeJS(path) {
		return path.replace(/\.js(!|$)/,function(whole, part){return part;});
	}
	function removePackage(path){
		return path.replace(/\/package\.json.*/,"");
	}
	
	function packageFolderAddress(address){
		var nodeModules = "/node_modules/",
			nodeModulesIndex = address.lastIndexOf(nodeModules),
			nextSlash = address.indexOf("/", nodeModulesIndex+nodeModules.length);
		if(nodeModulesIndex >= 0) {
			return nextSlash>=0 ? address.substr(0, nextSlash) : address;
		}
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
	function startsWithDotSlash( path ) {
		return path.substr(0,2) === "./";
	}
	function endsWithSlash(path){
		return path[path.length -1] === "/";
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
};


exports.createModuleName = createModuleName;
exports.parseModuleName = parseModuleName;
exports.childPackageAddress = childPackageAddress;
exports.parentNodeModuleAddress= parentNodeModuleAddress;

exports.out = function(){
	return [createModuleName,parseModuleName,isRelative, childPackageAddress, parentNodeModuleAddress].join("\n")+"\n"+
		"("+extension.toString()+")(loader);\n";
};
