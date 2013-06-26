var fs = require('fs'),
	path = require('path'),
	isCalledBySteal = module.parent
		&& module.parent.parent
		&& module.parent.parent.filename.indexOf("/steal/") !== -1,
// We can hardcode this for now
	root = (function(){
		if(isCalledBySteal) {
			var parts = module.parent.parent.filename.split("/");

			var stealIndex = parts.indexOf("steal");
			parts.splice(stealIndex, parts.length - stealIndex);
			return parts.join("/");
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
			// I hate myself for doing this.
			var p = (options.src.path || options.src) + "";
			if(p === "stealconfig.js") {
				p = "steal/" + p;
			}
			if(p.indexOf("steal/") === 0) {
				require(path.join(root, p));
			} else {
				require(path.resolve(process.cwd(), options.src.path || options.src));
			}
		}
		success();
	},
	win: global
};
