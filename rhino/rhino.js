// A Rhino-version of steal
(function(){
	
	var win = (function(){return this}).call(null)
		oldSteal = win.steal;
		
	win.steal = {
		startFiles : [],
		types : {
			"js" : function(options, orig, success){
				if(options.text){
					eval(text)
				}else{
					load(options.src)
				}
				success()
			}
		}
	}
	load("steal/steal.js");
})();

