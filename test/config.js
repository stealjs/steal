System.config({
	paths: {
		// "steal/dev/*" : "../dev/*.js",
		"@traceur": "../bower_components/traceur/traceur.js",
		'json/my.json': 'json/my.json'
	},
	bundle: ["foo"],
	ext : {
		crazy : "extensions/text"
	}
});

System.ext.txt = "extensions/text";
