System.config({
	paths: {
		// "steal/dev/*" : "../dev/*.js",
	},
	map: {
		"hello.js": "basics/commonjs/salute"
	},
	bundle: ["foo"],
	ext : {
		crazy : "extensions/text"
	}
});

System.ext.txt = "extensions/text";
