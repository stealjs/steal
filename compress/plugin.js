//load("steal/compress/plugin.js");
var plugin = _args[0]

rhinoLoader = {
     callback : function(){steal.plugins(plugin.replace(/\./,"/"));}
};

(function(){
     
    load('steal/rhino/env.js');
    Envjs('steal/rhino/empty.html', {scriptTypes: {"text/javascript" : true,"text/envjs" : true}, fireLoad: true, logLevel: 2
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


var out = [];
for(var i = 0 ; i < steal.total.length; i++){
    if(typeof steal.total[i].func == "function"){
        out.push("\n("+steal.total[i].options.toString()+")();\n");
    }
}
new File(plugin+".js").save(out.join(""));

//grab every script except jquery