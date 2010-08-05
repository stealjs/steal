//gets scripts
load('steal/compress/scripts.js');


(function(steal, window){
/**
 * gets scripts
 * @param {String} url
 * @param {Object} scriptProcessors
 * @return {Objec} an object with an each and getScriptContent function that returns scripts
 */
steal.scripts = function(url, scriptProcessors){
	scriptProcessors = steal.extend({}, scriptProcessors || steal.scripts);
	var types = {}, 
		name,
		scripts = [];
		
	for(name in scriptProcessors){
		types[name] = true;
	}
	var oldSteal = window.steal, 
		newSteal;
	delete window.steal;
	//load the page
	load('steal/rhino/env.js')
	Envjs(url, {scriptTypes: types, fireLoad: false, logLevel: 2,
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
	
	return {
		each : function(func, ths){
	        var scripts = document.getElementsByTagName('script');
			for(var i = 0 ; i < scripts.length; i++){
				func.call(ths,scripts[i], this.getScriptContent(scripts[i]), i)
			}
		},
		getScriptContent : function(script){
			return scriptProcessors[script.type] && scriptProcessors[script.type](script);
		},
		steal : newSteal
	}
}
/**
 * Loads a script from somewhere
 * @param {String} src the path to load
 * @param {HTMLElement} script a script to load
 */
var loadScriptText = function(src, script){
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
};


steal.extend(steal.scripts,{
	'text/javascript': function(script){
		if (script.src) {
			return loadScriptText(script.src, script);
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
		var text = oadScriptText(script.src);
		var id = script.getAttribute("id");
		return $.View.registerScript("jaml", id, text);
	},
	loadScriptText : loadScriptText
});


})(steal, this);
