System.config({
	paths: {
		// "steal/dev/*" : "../dev/*.js",
		"@traceur": "../bower_components/traceur/traceur.js",
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
