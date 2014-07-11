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
		parse: {
			dumpLineNumbers: "comments" // default false
		},
		eval: {
			strictMath: true // default false
		}
	}
});

System.ext.txt = "extensions/text";
