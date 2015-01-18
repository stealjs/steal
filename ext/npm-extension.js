"format cjs";

var utils = require("./npm-utils");
exports.includeInBuild = true;

exports.addExtension = function(System){
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
		
		// Get the current package
		var refPkg = utils.pkg.findByModuleNameOrAddress(this, parentName, parentAddress);
		
		// this isn't in a package, so ignore
		if(!refPkg) {
			return oldNormalize.call(this, name, parentName, parentAddress);
		}
		
		// Using the current package, get info about what it is probably asking for
		var parsedModuleName = utils.moduleName.parseFromPackage(this, refPkg, name, parentName);
		
		// Look for the dependency package specified by the current package
		var depPkg = utils.pkg.findDep(this, refPkg, parsedModuleName.packageName);
		
		// This really shouldn't happen, but lets find a package.
		if (!depPkg) {
			depPkg = utils.pkg.findByName(this, parsedModuleName.packageName);
		}
		// It could be something like `fs` so check in globals
		if(!depPkg) {
			var browserPackageName = this.globalBrowser[parsedModuleName.packageName];
			if(browserPackageName) {
				parsedModuleName.packageName = browserPackageName;
				depPkg = utils.pkg.findByName(this, parsedModuleName.packageName);
			}
		}
		
		if( depPkg && depPkg !== this.npmPaths.__default ) {
			parsedModuleName.version = depPkg.version;
			// add the main path
			if(!parsedModuleName.modulePath) {
				parsedModuleName.modulePath = utils.pkg.main(depPkg);
			}
			return oldNormalize.call(this, utils.moduleName.create(parsedModuleName), parentName, parentAddress);
		} else {
			if(depPkg === this.npmPaths.__default) {
				// if the current package, we can't? have the
				// module name look like foo@bar#./zed
				var localName = parsedModuleName.modulePath ? 
					parsedModuleName.modulePath+(parsedModuleName.plugin? parsedModuleName.plugin: "") : 
					utils.pkg.main(depPkg);
				return oldNormalize.call(this, localName, parentName, parentAddress);
			}
			return oldNormalize.call(this, name, parentName, parentAddress);
		}
		
	};
	
	
	var oldLocate = System.locate;
	System.locate = function(load){
		var parsedModuleName = utils.moduleName.parse(load.name),
			loader = this;
		
		// @ is not the first character
		if(parsedModuleName.version && this.npm) {
			var pkg = this.npm[parsedModuleName.packageName];
			if(pkg) {
				return oldLocate.call(this, load).then(function(address){
					
					var root = utils.pkg.rootDir(pkg, pkg === loader.npmPaths.__default);
					
					
					if(parsedModuleName.modulePath) {
						return utils.path.joinURIs( utils.path.addEndingSlash(root), utils.path.addJS(parsedModuleName.modulePath));
					} 
					
					return address;
				});
			}
		}
		return oldLocate.call(this, load);
	};

};