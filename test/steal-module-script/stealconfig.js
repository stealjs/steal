if(typeof window === "undefined" || window.noConfig !== true)  {

	steal.config({
		paths: {
			"steal/*" : "../*.js",
			"@traceur": "../bower_components/traceur/traceur.js"
		}
	});

} else {
	throw "fake loading error";
}
