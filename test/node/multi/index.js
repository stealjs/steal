var path = require("path");

global.steal = {
	root: path.resolve(__dirname, ".."),
	nodeRequire: require
};

var steal = require("steal");

steal("other", function(o){
	console.log("Worked?", o && o.value === "other");
});
