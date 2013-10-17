var oldSteal = steal;
steal = function(){
	/*
	 * Check to see if steal is a config object
	 */
	if(typeof global.steal === "object"){
		var config = global.steal;
		global.steal = oldSteal;
		oldSteal.config(config);
	}

	return oldSteal.apply(this, arguments);
};

// Copy all of oldSteal's properties.
for(var p in oldSteal) {
	steal[p] = oldSteal[p];
}
