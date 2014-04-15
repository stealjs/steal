steal.config({
	root: "./js",
	shim : {
		"three.js": {
			exports: "myObject"
		},
		"two.js": {
			exports: "myObject.level1",
			deps: [
				"three.js"
			]
		},
		"one.js": {
			exports: "myObject.level1.level2",
			deps: [
				"two.js"
			]
		}
	}
});

steal(
	"one.js",
	function() {
});

