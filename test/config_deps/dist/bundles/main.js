/*[system-bundles-config]*/
System.bundles = {};
/*other*/
System.define('other','\nSystem.config({\n	paths: {\n		two: \"three.js\"\n	}\n});\n',{"address":"other","metadata":{"deps":[],"format":"global"}});
/*@config*/
define('@config', function(require, exports, module) {
require("./other");

System.config({
	map: {
		one: "two"
	}
});

});
/*two*/
define('two', function(require, exports, module) {

module.exports = function() {
	return "three";
};

});
/*main*/
define('main', function(require, exports, module) {
var one = require("one");

window.moduleValue = one();

});
