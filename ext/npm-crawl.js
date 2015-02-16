var utils = require("./npm-utils");
var SemVer = require('./semver');
/**
 * @module {{}} system-npm/crawl
 * Exports helpers used for crawling package.json
 */
var crawl = {
	/**
	 * Adds the properties read from a package's source to the `pkg` object.
	 * @param {Object} context
	 * @param {NpmPackage} pkg - 
	 * @param {String} source
	 * @return {NpmPackage}
	 */
	processPkgSource: function(context, pkg, source) {
		var packageJSON = JSON.parse(source);
		utils.extend(pkg, packageJSON);
		context.packages.push(pkg);
		return pkg;
	},
	/**
	 * Crawls the packages dependencies
	 * @param {Object} context
	 * @param {NpmPackage} pkg
	 * @param {Boolean} [isRoot] If the root module's dependencies shoudl be crawled.
	 * @return {Promise} A promise when all packages have been loaded
	 */
	deps: function(context, pkg, isRoot) {
	
		var deps = crawl.getDependencies(context.loader, pkg, isRoot);
		return Promise.all(deps.map(function(childPkg){
			// if a peer dependency, and not isRoot
			if(childPkg._isPeerDependency && !isRoot ) {
				// check one node_module level higher
				childPkg.origFileUrl = nodeModuleAddress(pkg.fileUrl)+"/"+childPkg.name+"/package.json";
			} else {
				childPkg.origFileUrl = utils.path.depPackage(pkg.fileUrl, childPkg.name);
			}
			
			// check if childPkg matches a parent's version ... if it does ... do nothing
			if(crawl.hasParentPackageThatMatches(context, childPkg)) {
				return;
			}
			
			if(crawl.isSameRequestedVersionFound(context, childPkg)) {
				return;
			}
			
			// otherwise go get child ... but don't process dependencies until all of these dependencies have finished
			return npmLoad(context, childPkg).then(function(source){
				if(source) {
					return crawl.processPkgSource(context, childPkg, source);
				} // else if there's no source, it's likely because this dependency has been found elsewhere
			});
			
		}).filter(truthy)).then(function(packages){
			// at this point all dependencies of pkg have been loaded, it's ok to get their children
	
			return Promise.all(packages.map(function(childPkg){
				if(childPkg) {
					return crawl.deps(context, childPkg);
				} 
			}).filter(truthy));
		});
	},
	/**
	 * Returns an array of the dependency names that should be crawled.
	 * @param {Object} loader
	 * @param {NpmPackage} packageJSON
	 * @param {Boolean} [isRoot]
	 * @return {Array<String>}
	 */
	getDependencies: function(loader, packageJSON, isRoot){
		var deps = crawl.getDependencyMap(loader, packageJSON, isRoot);
		
		var dependencies = [];
		for(var name in deps) {
			dependencies.push(deps[name]);
		}
		
		return dependencies;
	},
	/**
	 * Returns a map of the dependencies and their ranges.
	 * @param {Object} loader
	 * @param {Object} packageJSON
	 * @param {Boolean} isRoot
	 * @return {Object<String,Range>} A map of dependency names and requested version ranges.
	 */
	getDependencyMap: function(loader, packageJSON, isRoot){
		// convert npmIgnore
		var npmIgnore = packageJSON.system && packageJSON.system.npmIgnore;
		if(npmIgnore && typeof npmIgnore.length === 'number') {
			var npmMap = {};
			for(var i = 0; i < npmIgnore.length; i++) {
				npmMap[npmIgnore[i]] = true;
			}
			npmIgnore = packageJSON.system.npmIgnore = npmMap;
		}
		npmIgnore = npmIgnore || {};
		
		var deps = {};
		
		if(!npmIgnore.peerDependencies) {
			addDeps(packageJSON, packageJSON.peerDependencies || {}, deps, {_isPeerDependency: true});
		}
		if(!npmIgnore.dependencies) {
			addDeps(packageJSON, packageJSON.dependencies || {}, deps);
		}
		if( isRoot && !npmIgnore.devDependencies) {
			addDeps(packageJSON, packageJSON.devDependencies || {}, deps);
		}
		return deps;
	},
	isSameRequestedVersionFound: function(context, childPkg) {
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
	},
	hasParentPackageThatMatches: function(context, childPkg){
		// check paths
		var parentAddress = utils.path.parentNodeModuleAddress(childPkg.origFileUrl);
		while( parentAddress ) {
			var packageAddress = parentAddress+"/"+childPkg.name+"/package.json";
			var parentPkg = context.paths[packageAddress];
			if(parentPkg) {
				if(SemVer.satisfies(parentPkg.version, childPkg.version)) {
					return parentPkg;
				}
			}
			parentAddress = utils.path.parentNodeModuleAddress(packageAddress);
		}
	}
};


module.exports = crawl;

function nodeModuleAddress(address) {
	var nodeModules = "/node_modules/",
		nodeModulesIndex = address.lastIndexOf(nodeModules);
	if(nodeModulesIndex >= 0) {
		return address.substr(0, nodeModulesIndex+nodeModules.length - 1 );
	}
}

function truthy(x) {
	return x;
}

var alwaysIgnore = {"steal": 1,"steal-tools":1,"bower":1,"grunt":1, "grunt-cli": 1};

function addDeps(packageJSON, dependencies, deps, defaultProps){
	// convert an array to a map
	var npmIgnore = packageJSON.system && packageJSON.system.npmIgnore;
	
	for(var name in dependencies) {
		if(!alwaysIgnore[name] &&  (!npmIgnore || !npmIgnore[name])  ) {
			deps[name] = utils.extend(defaultProps || {}, {name: name, version: dependencies[name]});
		}
	}
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
	var parentAddress = utils.path.parentNodeModuleAddress(fileUrl);
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