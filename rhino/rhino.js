// A Rhino-version of steal
(function(){
	
	var win = (function(){return this}).call(null)
		oldSteal = win.steal;
		
	win.steal = {
		pathToSteal : "steal/steal.js",
		location : "",
		useLoad : true,
		loadDev : false
	}
	load("steal/steal.js");
})();

