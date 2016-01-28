

var addTilde = function(loader){
	// Define tilde, as a concept

	/**
	 * @function getMatches
	 * @description Given a set of regular expressions, find matches.
	 * @param {Array<RegExp>} exprs An array of regular expressions.
	 * @param {String} source The load.source for the module.
	 * @return {Array<String>} An array of string module names.
	 */
	var getMatches = function(exprs, source){
		exprs = Object.prototype.toString.call(exprs) === "[object Array]" ?
			exprs : [exprs];
		var expr, match, matches = [];
		for(var i = 0, len = exprs.length; i < len; i++) {
			expr = exprs[i];
			expr.lastIndex = 0;
			do {
				match = expr.exec(source);
				if(match) {
					matches.push({name: match[2], replace: match[1]});
				}
			} while(match);
		}
		return matches;
	};

	/**
	 * @function normalizeAndLocate
	 * @description Run a tilded moduleName through Normalize and Locate hooks.
	 * @param {String} moduleName The module to run through normalize and locate.
	 * @return {Promise} A promise to resolve when the address is found.
	 */
	var normalizeAndLocate = function(moduleName, parentName){
		var loader = this;
		return Promise.resolve(loader.normalize(moduleName, parentName))
			.then(function(name){
				return loader.locate({name: name, metadata: {}});
			}).then(function(address){
				if(address.substr(address.length - 3) === ".js") {
					address = address.substr(0, address.length - 3);
				}
				return address;
			});
	};

	var translate = loader.translate;
	loader.translate = function(load){
		var loader = this;

		// This only applies to plugin resources.
		if(!load.metadata.plugin) {
			return translate.call(this, load);
		}

		// Get the translator RegExp if this is a supported type.
		var expression = load.metadata.plugin.tildeModules;

		if(!expression) {
			return translate.call(this, load);
		}

		// Gets an array of moduleNames like ~/foo
		var tildeModules = getMatches(expression, load.source);
		if(!tildeModules.length) {
			return translate.call(this, load);
		}

		// This load is a supported type and there are ~/ being used, so get
		// normalize and locate all of the modules found and then replace those
		// instances in the source.
		var promises = [];
		for(var i = 0, len = tildeModules.length; i < len; i++) {
			promises.push(
				normalizeAndLocate.call(this, tildeModules[i].name, load.name)
			);
		}
		return Promise.all(promises).then(function(addresses){
			for(var i = 0, len = tildeModules.length; i < len; i++) {
				// Replace the tilde names with the fully located address
				load.source = load.source.replace(
					tildeModules[i].replace, addresses[i]
				);
			}
			return translate.call(loader, load);
		});
	};
};

if(typeof System !== "undefined") {
	addTilde(System);
}
