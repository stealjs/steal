// A Rhino-version of steal
(function(win){
	
	
	win.steal = {
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
	load("steal/rhino/file.js");
})(this);

