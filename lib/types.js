var fs = require('fs')
  , path = require('path');

var localStealConfig = path.resolve(__dirname, "../stealconfig.js")
  , localStealDev = path.resolve(__dirname, "../dev/dev.js");

var ourSteal;
exports.setSteal = function(steal){
	ourSteal = steal;
};

/*
 * This is needed in a couple of occassions to grab the correct types.
 */
exports.types = {
	"js": function (options, success) {
		if (options.text) {
			eval(text);
		} else {
			var p = options.src+"";
			var result = requireModule(p);
			
			if(result) {
				return success(null, result);
			}
		}
		success();
	},
	win: global
};

/*
 * Try to grab a CommonJS module by
 * resolving from a uri's name property.
 * Returns null if unable to resolve.
 */
function tryRequireCommonJS(uri){
	var name = uri.name;

	// Return null if this uri doesn't have a name property.
	if(!name) return null;

	try {
		require.resolve(name);
		return require(name);
	} catch(err){
		// Unable to resolve, return null.
		return null;
	}
}

/*
 * Perform the actual requiring of the module.
 * always serve our own copy of `dev.js`, and serve
 * our local `stealconfig.js` if there isn't own present
 * in the project's root folder.
 */
function requireModule(partialPath){
	var pathToRequire;
	var nodeRequire = (ourSteal && ourSteal.config("nodeRequire"))
		|| require;

	if(partialPath.indexOf("dev/dev.js") !== -1) {
		pathToRequire = localStealDev;
	} else if(partialPath.indexOf("stealconfig.js") !== -1
			&& !fs.existsSync(partialPath)) {
		pathToRequire = localStealConfig;
	} else {
		pathToRequire = partialPath;
	}

	if(ourSteal) {
		var oldSteal = global.steal;
		global.steal = ourSteal;

		/*var modulePath = nodeRequire.resolve(pathToRequire);
		delete nodeRequire.cache[modulePath];*/

		return nodeRequire(pathToRequire);
		global.steal = oldSteal;
	} else {
		return nodeRequire(pathToRequire);
	}
}
