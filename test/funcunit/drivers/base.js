S = function(s,c){
	return new S.init(s,c)
}
/**
 * Opens a page
 * @param {Object} url
 * @param {Object} callback
 * @param {Object} timeout
 */
S.open = function(url, callback, timeout){
	S.add(
		function(success, error){  //function that actually does stuff, if this doesn't call success by timeout, error will be called, or can call error itself
			//page = window.open(url);
			S._open(url, error);
			S._onload(success, error);
		},
		callback,
		"Page "+url+" not loaded in time!",
		timeout
	);
};
S.window = {document: {}};

(function(){
	var queue = [], incallback = false;
	S.add = function(f, callback, error, timeout){
		if(incallback){
			queue.unshift({
				method: f,
				callback: callback,
				error: error,
				timeout: timeout
			});
		}else{
			queue.push({
				method: f,
				callback: callback,
				error: error,
				timeout: timeout
			});
		}
		
		
		if(queue.length == 1){
			stop();
			setTimeout(S._done, 13)
			//();
		}
	}
	S._done = function(){
		if(queue.length > 0){
			var next = queue.shift();
			var timer = setTimeout(function(){
				ok(false, next.error);
				S._done();
			},next.timeout || 10000)
			
			next.method(function(){
				//mark in callback so the next set of add get added to the front
				clearTimeout(timer);
				incallback = true;
				if(next.callback) next.callback.apply(null, arguments);
				incallback = false;
				S._done();
			},function(message){
				clearTimeout(timer);
				ok(false, message);
				S._done();
			});
		}
		else{
			start();
		}
	}
	S.wait = function(time, cb){
		time = time || 10000
		S.add(function(success, error){
			setTimeout(success, time)
		},
		cb,
		"Couldn't wait!",
		time*2
		)
	}
	S.repeat = function(script, callback){
		var f = script;
		if(typeof script == "string"){
			script = script.replace(/\n/g,"\\n")
			f = function(){
				with(opener){ var result = eval("("+script+")")  } 
				return result;
			}
		}
		if(callback){
	        var interval = null;
			var time = new Date();
	        interval = setInterval(function(){
	            if(callback.failed){
	                clearInterval(interval);
	            }else{
	                var result = null;
					try {
						result = f()
					}catch(e){}
					
	                if( result ){
	                    clearInterval(interval);
	                    callback();
	                }
	            }
	        }, 1);
	        
	    }else{
	        var result = f();
			return result;//this.convert( result);
	    } 
	}
	
	S.makeArray = function(arr){
		var narr = [];
		for(var i=0;i < arr.length; i++){
			narr[i] = arr[i]
		}
		return narr;
	}
	S.convert = function(str){
          //if it is an object and not null, eval it
		  if(str !== null && typeof str == "object"){
		  	 return object;
		  }
		  str = String(str);
          switch(str){
              case "false": return false;
              case "null": return null;
              case "true": return true;
              case "undefined": return undefined;
              default: 
			  	if(/^\d+\.\d+$/.test(str) ||   /^\d+$/.test(str)){
						return 1*str;
			  	}
				
				return str;
          }
    }
	//list of jQuery functions we want
	S.funcs = ['synthetic','size', 'data','attr','removeAttr','addClass','hasClass','removeClass','toggleClass','html','text','val','empty',
	           'css','offset','offsetParent','position','scrollTop','scrollLeft','height','width','innerHeight','innerWidth','outerHeight','outerWidth']
	S.makeFunc = function(fname){
		S.init.prototype[fname] = function(){
			//assume last arg is callback
			var args = S.makeArray(arguments), callback;
			if(typeof args[args.length - 1] == "function"){
				callback = args.pop();
			}
			
			args.unshift(fname)
			args.unshift(this.context)
			args.unshift(this.selector)
			
			S.add(function(success, error){
				var ret = S.$.apply(S.$, args);//  (selector,fname)
				success(ret)
			},
			callback,
			"Can't get text of "+this.selector
			)
			return this;
		}
	}		   
})();





S.init = function(s, c){
	this.selector= s;
	this.context = c == null ?  S.window.document : c;
}
S.init.prototype = {
	exists : function(cb, timeout){
		var selector = this.selector, context = this.context;
		S.add(function(success, error){
			S.repeat(function(){
					//return jQuery(selector, page.document).length
					return S.$(selector, context,"size");
				},
				success
			)
		},
		cb,
		"Could not find "+this.selector,
		timeout
		)
	},
	missing : function(cb, timeout){
		var selector = this.selector, context= this.context;
		S.add(function(success, error){
			S.repeat(function(){
					//return jQuery(selector, page.document).length
					return !S.$(selector, context, "size");
				},
				success
			)
		},
		cb,
		"Could not find "+this.selector,
		timeout
		)
	},
	type : function(text, callback){
		var selector = this.selector, context= this.context;
		S.add(function(success, error){
			for(var c = 0; c<text.length; c++){
				S.$(selector,context,"synthetic","key",text.substr(c,1))
			}
			
			setTimeout(success, 13)
		},
		callback,
		"Could not type "+text+" into "+this.selector
		)
	},
    click : function(options, callback){
		var selector = this.selector, context= this.context;
		S.add(function(success, error){
			S.$(selector,context,"synthetic","click",options, S.window)
			setTimeout(success, 13)
		},
		callback,
		"Could not click "+this.selector
		)
		return this;
	}
};


(function(){
	for(var i=0; i < S.funcs.length; i++){
		S.makeFunc(S.funcs[i])
	}
})();
