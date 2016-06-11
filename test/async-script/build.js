var stealTools = require("steal-tools");

var promise = stealTools.build({
	main: "main",
	config: "stealconfig.js"
},{
	bundleSteal: true,
	minify: false,
	debug: true
});