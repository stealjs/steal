(function(Steal){
	
Steal.Loader = function(url, scriptTypes){
	this.url = url;
	this.scripts = [];
	this.scriptTypes = scriptTypes || {"text/javascript" : true,"text/envjs" : true};
	this.load();
	
}
Steal.Loader.prototype = {
	load : function(){
		var self = this;
        load('steal/rhino/env.js');
		Envjs(this.url, {scriptTypes: this.scriptTypes, fireLoad: false, logLevel: 2,
            afterScriptLoad: {".*": function(script){ 
                    self.scripts.push(script);
                }
            },
            onLoadUnknownTypeScript: function(script){
                self.scripts.push(script);   
            },
			afterInlineScriptLoad : function(script){
				self.scripts.push(script);   
            }
        }); 
		
		
	},
	loadScriptText: function(src, isView, script){
    	var text = "";
        var base = "" + window.location;

        var url = src.match(/([^\?#]*)/)[1];

		if (url.match(/^\/\//))
		    url = steal.root.join( url.substr(2) ); //can steal be removed?
		url = Envjs.uri(url, base);
        
        if(url.match(/^file\:/)) {
            url = url.replace("file:/","");
            text = readFile("/"+url);
        }
        
        if(url.match(/^http\:/)) {
            text = readUrl(url);
        }

        return text;
    },
	each : function(ths, func){
        var scripts = document.getElementsByTagName('script')
		
        //if(this.scripts.length >= scripts.length){
        //    scripts = this.scripts;
        //}
		for(var i = 0 ; i < scripts.length; i++){
			func.call(ths,scripts[i], this.getScriptContent(scripts[i]), i)
		}
	},
	getScriptContent : function(script){
		return this[script.type] && this[script.type](script);
	},
	getContent : function(){
		var scripts = [], script;
		for(var i =0; i < this.scripts.length; i++){
			script = this.getScriptContent(this.scripts[i]);
			if(script)
				scripts.push(script)
		}
		return scripts;
	},
	'text/javascript': function(script){
        if(script.src){
            return this.loadScriptText(script.src, false, script);
        }else{
			return script.text
		}
    },
    
    'text/ejs': function(script){
        var text = this.loadScriptText(script.src, true);
        var id = script.getAttribute("id");
		return $.View.registerScript("ejs",id, text);           
    },
    'text/micro': function(script){
        var text = this.loadScriptText(script.src, true);
        var id = script.getAttribute("id");
		return $.View.registerScript("micro",id, text);     
    },
	'text/jaml': function(script){
        var text = this.loadScriptText(script.src, true);
        var id = script.getAttribute("id");
		return $.View.registerScript("jaml",id, text);     
    }
}

	
})(typeof steal == 'undefined' ? (steal = {}) : steal);

