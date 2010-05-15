(function(){
	var oldSteal = self.steal;
	steal = function(){
		for(var i=0; i < arguments.length; i++){
			var inc = arguments[i];
			if(typeof inc == 'string'){
				load(inc.substr(2)+".js")
			}else{
				inc(steal)
			}
		}
	}
	if(oldSteal){
		oldSteal.extend(steal, oldSteal)
	}
})()


