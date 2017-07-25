	if( isNode && !isNW && !isElectron ) {

		global.steal = makeSteal(System);
		global.steal.System = System;
		global.steal.dev = require("./ext/dev.js");
		steal.clone = cloneSteal;
		module.exports = global.steal;

	} else {
		var oldSteal = global.steal;
		global.steal = makeSteal(System);
		global.steal.startup(oldSteal && typeof oldSteal == 'object' && oldSteal)
			.then(null, function(error){
				if(typeof console !== "undefined") {
					// Hide from uglify
					var c = console;
					var type = c.error ? "error" : "log";
					c[type](error);
				}
			});
		global.steal.clone = cloneSteal;
	}

})(typeof window == "undefined" ? (typeof global === "undefined" ? this : global) : window);
