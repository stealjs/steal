System.config({
	paths: {
		// "steal/dev/*" : "../dev/*.js",
	},
	bundle: ["foo"],
	ext : {
		crazy : "extensions/text"
	},
	transpiler: "traceur"
});

System.ext.txt = "extensions/text";
