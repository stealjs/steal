/*
 * Steal.js attaches itself to the `global` when we require it.
 * We'll put it on module.exports.
 */
var types = require("./types");

var globalSteal = global.steal;
global.steal = {
	types: types.types
};

// If the module requiring stealjs
// has set its own global config options
// we override our own here.
if(globalSteal){
	for(var p in globalSteal) {
		global.steal[p] = globalSteal[p];
	}
}

require("../steal");
require("./opts");
require("./file");
require("./idtouri");

// Types needs to have a reference to its own steal.
types.setSteal(global.steal);

module.exports = global.steal;
