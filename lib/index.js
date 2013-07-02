/*
 * Steal.js attaches itself to the `global` when we require it.
 * We'll put it on module.exports.
 */
global.steal = {
	moduleRoot: require("./root").moduleRoot,
	types: require("./types")
};

require("../steal");
require("./opts");
require("./file");
module.exports = global.steal;
