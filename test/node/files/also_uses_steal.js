var path = require("path");

global.steal = {
	nodeRequire: require,
	root: path.resolve(__dirname, "../../..")
};

var steal = require("../../../lib");

steal(function(){
	return "it worked";
});
