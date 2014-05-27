
	if (typeof window != 'undefined') {
		window.steal = makeSteal(System);
		window.steal.startup();
		window.steal.addFormat = addFormat;
    }
    else {
    	var steal = makeSteal(System);
		steal.System = System;
		steal.dev = require("./dev/dev.js");
		steal.clone = makeSteal;
		module.exports = steal;
		global.steal = steal;
		global.steal.addFormat = addFormat;
    }
    
})(typeof window == "undefined" ? global : window);