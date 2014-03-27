steal.config({
	root: '../test/exports/',
	shim : {
		"mootools-core-1.4.5-full-nocompat.js": {
			exports: "MooTools"
		},
		"mootools-more-1.4.0.1.js": {
			deps: ["mootools-core-1.4.5-full-nocompat.js"],
			exports: "MooTools.More"
		}
	}
});
steal(
	"mootools-more-1.4.0.1.js",
	function(MooTools) {
// calling an object that is exported by MooTools.More
var myHash = new Hash({});
});
