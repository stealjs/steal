steal(function(steal){
	var opts = {},
		window = (function(){return this}).call(null,0);
	
	/**
	 * @parent stealtools
	 * builds an html pages JavaScript and CSS files by compressing and concatenating them into
	 * a single or several files.
	 * @param {String} url an html page to compress
	 * @param {Object} options
	 */
	steal.build = function(url, options){
		options = steal.opts(options || {}, {
			//compress everything, regardless of what you find
			all : 1,
			//folder to build to, defaults to the folder the page is in
			to: 1
		})
		
		
		//out is the folder packages will be sent to
		options.to = options.to || (url.match(/https?:\/\//) ?  "" : url.substr(0, url.lastIndexOf('/'))  );
		if (options.to.match(/\\$/) == null && options.to != '') {
			options.to += "/";
		}
		
		print("Building to "+options.to);
		
		var opener = steal.build.open(url)
		for(var builder in steal.build.builders){
			steal.build.builders[builder](opener, options)
		}
	}
	steal.build.builders = {}; //builders
	
	var loadScriptText = function(src){
		var text = "",
			base = "" + window.location,
			url = src.match(/([^\?#]*)/)[1];
	
		if (url.match(/^\/\//)){
			url = steal.root.join( url.substr(2) ); //can steal be removed?
		}
		url = Envjs.uri(url, base);
	    
	    if(url.match(/^file\:/)) {
	        url = url.replace("file:/","");
	        text = readFile("/"+url);
	    }
	    
	    if(url.match(/^http\:/)) {
	        text = readUrl(url);
	    }
	
	    return text;
	};
	
	// types conversion
	steal.build.types = {
		'text/javascript': function(script){
			if (script.src) {
				return loadScriptText(script.src, script);
			}
			else {
				return script.text
			}
		},
		'text/css' : function(script){
			if (script.href) {
				return loadScriptText(script.href, script);
			}
			else {
				return script.text
			}
		},
		'text/ejs': function(script){
			var text = loadScriptText(script.src);
			var id = script.getAttribute("id");
			return $.View.registerScript("ejs", id, text);
		},
		'text/micro': function(script){
			var text = loadScriptText(script.src);
			var id = script.getAttribute("id");
			return $.View.registerScript("micro", id, text);
		},
		'text/jaml': function(script){
			var text = loadScriptText(script.src);
			var id = script.getAttribute("id");
			return $.View.registerScript("jaml", id, text);
		},
		loadScriptText : loadScriptText
	}
	
	
	steal.build.open = function(url ){
		scriptProcessors = steal.extend({}, steal.build.types);
		var types = {}, 
			name,
			scripts = [];
			
		for(name in scriptProcessors){
			types[name] = true;
		}
		var oldSteal = window.steal || steal, 
			newSteal;
		delete window.steal;
		//load the page
		load('steal/rhino/env.js'); //reload every time
		Envjs(url, {scriptTypes: {"text/javascript" : true,"text/envjs" : true}, fireLoad: false, logLevel: 2,
	        afterScriptLoad: {".*": function(script){ 
	                scripts.push(script);
	            }
	        },
	        onLoadUnknownTypeScript: function(script){
	            self.scripts.push(script);   
	        },
			afterInlineScriptLoad : function(script){
				scripts.push(script);   
	        }
	    }); 
		//set back steal
		newSteal = window.steal;
		window.steal = oldSteal;
		window.steal._steal = newSteal;
		//check if newSteal added any build types
		for(var buildType in newSteal.build.types){
			oldSteal.build.types[buildType] = newSteal.build.types[buildType];
		}
		
		
		return {
			each : function(type , func, ths){
				if(typeof type == 'function'){
					ths = func;
					func = type;
					type = 'script'
				}
		        var scripts = document.getElementsByTagName(type);
				for(var i = 0 ; i < scripts.length; i++){
					func.call(ths,scripts[i], this.getScriptContent(scripts[i]), i)
				}
			},
			getScriptContent : function(script){
				return steal.build.types[script.type] && steal.build.types[script.type](script, loadScriptText);
			},
			steal : newSteal,
			url : url
		}
	}
	
})








