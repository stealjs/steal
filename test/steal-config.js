steal.config({
	paths: {
		// "steal/dev/*" : "../dev/*.js",
		"@traceur": "../bower_components/traceur/traceur.js"
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
