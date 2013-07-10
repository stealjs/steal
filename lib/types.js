var fs = require('fs')
  , path = require('path');

var localStealConfig = path.resolve(__dirname, "../stealconfig.js")
  , localStealDev = path.resolve(__dirname, "../dev/dev.js");

/*
 * This is needed in a couple of occassions to grab the correct types.
 */
module.exports = {
	"js": function (options, success) {
		if (options.text) {
			eval(text);
		} else {
			var ret;
			if((ret = tryRequireCommonJS(options.id))) {
				success(null, ret);
				return;
			}

			var p = (options.src.path || options.src) + "";
			requireModule(p);
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
	var pathToRequire
	  , moduleRoot = steal.config().moduleRoot;

	if(partialPath.indexOf("stealconfig.js") === 0) {
		var rootConfig = path.resolve(moduleRoot, "stealconfig.js");
		pathToRequire = fs.existsSync(rootConfig)
			? rootConfig : localStealConfig;
	} else if(partialPath.indexOf("dev/dev.js") !== -1) {
		pathToRequire = localStealDev;
	} else {
		pathToRequire = path.resolve(moduleRoot, partialPath);
	}

	require(pathToRequire);
}
