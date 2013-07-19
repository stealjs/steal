var path = require("path");

global.steal = {
	root: path.resolve(__dirname, ".."),
	nodeRequire: require
};

var steal = require("stealjs");

steal("other", function(o){
	console.log("Worked?", o && o.value === "other");
});
