System.config({
	paths: {
		// "steal/dev/*" : "../dev/*.js",
		'json/my.json': 'json/my.json'
	},
	bundle: ["foo"],
	ext : {
		crazy : "extensions/text"
	},
	lessOptions: {
		dumpLineNumbers: "comments", // default false
		strictMath: true, // default false
	}
});

System.ext.txt = "extensions/text";
