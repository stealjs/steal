/*
 * Steal.js attaches itself to the `global` when we require it.
 * We'll put it on module.exports and remove it from global.
 */
require("../steal");

module.exports = global.steal;
delete global.steal;
