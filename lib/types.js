var fs = require('fs'),
	path = require('path'),
// We can hardcode this for now
	root = (function(){
		var parts = __dirname.split("/");

		var part;
		while(parts.length) {
			part = parts.pop();
			// If this is the `stealjs` folder, look ahead
			// and see if we are used as a module.
			if(part === "stealjs") {
				if(parts[parts.length - 1] !== "node_modules") {
					return parts.join("/");
				} else {
					// We are used as a node module, go up a couple
					return path.resolve(parts.join("/"), "../..");
				}
			}
		}
	})();


/*
 * This is needed in a couple of occassions to grab the correct types.
 */
module.exports = {
	"js": function (options, success) {
		if (options.text) {
			eval(text);
		} else {
			require(path.join(root, options.src.path || options.src));
		}
		success();
	},
	win: global
};
