	if( isNode ) {
		require('systemjs');
			
		global.steal = makeSteal(System);
		global.steal.System = System;
		global.steal.dev = require("./ext/dev.js");
		steal.clone = makeSteal;
		module.exports = global.steal;
		global.steal.addSteal = addSteal;
		require("system-json");
		
	} else {
		var oldSteal = window.steal;
		window.steal = makeSteal(System);
		window.steal.startup(oldSteal && typeof oldSteal == 'object' && oldSteal)
			.then(null, function(error){
				console.log("error",error,  error.stack);
				throw error;
			});
		window.steal.addSteal = addSteal;
	} 
    
})(typeof window == "undefined" ? (typeof global === "undefined" ? this : global) : window);
