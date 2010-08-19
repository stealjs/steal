steal({path: "coffee-script.js",ignore: true},function(){
	
	
	steal.coffee = function(){
		//if production, 
		if(steal.options.env == 'production'){
			return this;
		}
		//@steal-remove-start
		var current, path;
		for(var i=0; i < arguments.length; i++){
			steal({path: arguments[0]+".coffee", type: "text/coffee", process : function(text){
				return CoffeeScript.compile(text)
			}})
		}
		//@steal-remove-end
		return this;
	}
	
})

