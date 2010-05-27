// usage: 
// js steal\scripts\pluginify.js funcunit/functional -destination funcunit/dist/funcunit.js
// js steal\scripts\pluginify.js jquery/controller
// js steal\scripts\pluginify.js jquery/event/drag -exclude ["jquery/lang/vector/vector.js","jquery/event/livehack/livehack.js"]

load('steal/rhino/options/options.js')

var plugin = _args[0],
	destination = plugin+".js", 
	exclude = [];
	
for(var i=1; i<_args.length; i+=2){
	if(_args[i] == "-destination")
		destination = _args[i+1];
	if(_args[i] == "-exclude"){
		exclude = options.getArray(_args[i+1])
	}
}
exclude.push("jquery.js")

rhinoLoader = {
	callback : function(){steal.plugins(plugin.replace(/\./,"/"));}
};

(function(){
     
    load('steal/rhino/env.js');
	window.build_in_progress = true;
    Envjs('steal/rhino/empty.html', 
		{scriptTypes: {"text/javascript" : true,"text/envjs" : true}, 
		//fireLoad: true, 
		logLevel: 2
    });
    
})();






File = function(path){ this.path = path };
File.prototype = {    
    save: function(src, encoding){
          var fout = new java.io.FileOutputStream(new java.io.File( this.path ));
    
          var out     = new java.io.OutputStreamWriter(fout, "UTF-8");
          var s = new java.lang.String(src || "");
        
          var text = new java.lang.String( (s).getBytes(), encoding || "UTF-8" );
                out.write( text, 0, text.length() );
                out.flush();
                out.close();
    }
};
removeRemoveSteal = function(text){
	  return String(java.lang.String(text)
	  				.replaceAll("(?s)\/\/@steal-remove-start(.*?)\/\/@steal-remove-end","")
	  				.replaceAll("steal[\n\s\r]*\.[\n\s\r]*dev[\n\s\r]*\.[\n\s\r]*(\w+)[\n\s\r]*\([^\)]*\)",""))
}

var out = [], str, i;
for(i = 0 ; i < steal.total.length; i++){
    if(typeof steal.total[i].func == "function"){
		filePath = steal.total[i].path;
		if (exclude.indexOf(filePath) == -1) {
			print("including "+filePath)
			file = readFile(filePath);
			match = file.match(/\.then\(\s*function\s*\([^\)]*\)\s*\{([\s\S]*)\}\s*\)\s*;*\s*/im)
			str = "// "+filePath+"\n\n"
			str += "(function($){\n"+removeRemoveSteal(match[1])+"\n})(jQuery);\n\n"
			out.push(str);
		}
	}
}
print("saving to "+destination)
new File(destination).save(out.join(""));
print("pluginified "+plugin)

//grab every script except jquery