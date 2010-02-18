if (typeof Steal == 'undefined') Steal = {};

Steal.Compress = function(args){ this.args = args };
Steal.Compress.prototype = {
   
    scripts:[],
    scriptTypes: {"text/javascript" : true,"text/envjs" : true},
    packages: {},
    compressString: undefined,

    init: function(){
       //read arguments in ...
       if (this.args.length == 0 || this.args.length > 2) {
          print("USAGE: compress <URL> [<OUTPUT_FOLDER>]");
          quit();
       }
       this.url = this.args[0]; 
       this.outputFolder = this.args[1] ? this.args[1] : '';
       if(this.outputFolder.match(/\\$/) == null && this.outputFolder != '') this.outputFolder += "\\";

       this.loadEnvjs(this.url);   
       
//       this.compressString = this["shrinksafeCompressor"]();
       this.compressString = this["closureCompressor"]();       
       
       for(var idx=0;idx<this.scripts.length;idx++){
           var script = this.scripts[idx];
           var p = script.getAttribute('package');
           if(!this.packages[p]) this.packages[p] = [];        
           this.packages[p].push(this[script.type] && this[script.type](script));
           print("Script #" + idx + ": " + script.src);
       }
       
       print("\n");
       
       //send to output
       idx = 0;
       for(var p in this.packages){
           var compressed = "steal.end();\n"+this.packages[p].join("\nsteal.end();\n")+";\nsteal.end();";
           new Steal.File(this.outputFolder + p).save(compressed);           
           print("Package #" + idx + ": " + this.outputFolder + p);
           idx++;
       }
      
       print("Compression Finished.");
       if(!window.MVCDontQuit) quit();    
    },
    
    loadEnvjs: function(url){
        //load html
        var self = this;
        load('steal/rhino/env.js');
        Envjs(url, {scriptTypes: this.scriptTypes, fireLoad: true, logLevel: 2,
            afterScriptLoad: {".*": function(script){ 
                    self.scripts.push(script);
                }
            },
            onLoadUnknownTypeScript: function(script){
                self.scripts.push(script);   
            }
        });    
    },
    
    loadScriptText: function(src, isView){
    	var text = "";
        var base = "" + window.location;
        var url = Envjs.location(src.match(/([^\?#]*)/)[1], base);
        
        if(isView){
        	// FIXME assumes view paths start one folder deep from root
            url = url.replace(/file:\/\//,"../");
            url = Envjs.location(url, base);
        }
        
        if(url.match(/^file\:/)) {
            url = url.replace("file:/","").replace("\\", "/");
            text = readFile(url);
        }
        
        if(url.match(/^http\:/)) {
            text = readUrl(url);
        }

        return text;
    },
    
    'text/javascript': function(script){
        if(script.src){
            var text = this.loadScriptText(script.src, false);
            if(script.getAttribute('compress') == "true"){
                return this.compressString(text);
            }
            return text;
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
    },

    shrinksafeCompressor: function(){
        var URLClassLoader = Packages.java.net.URLClassLoader
        var URL = java.net.URL
        var File = java.io.File
        
        var ss  = new File("steal/rhino/shrinksafe.jar")
        var ssurl = ss.toURL()
        //print(ssurl);
        //quit();
        var urls = java.lang.reflect.Array.newInstance(URL,1)
        urls[0] = new URL(ssurl);
        var clazzLoader = new URLClassLoader(urls);
        //importPackage(Packages.org.dojotoolkit.shrinksafe);
        //importClass(Packages.org.dojotoolkit.shrinksafe.Compressor)
        var Compressor = clazzLoader.loadClass("org.dojotoolkit.shrinksafe.Compressor")
        
        var mthds = Compressor.getDeclaredMethods()
        CompressorMethod = null;
        var rawCompress = null;
        for(var i = 0; i < mthds.length; i++){
              var meth = mthds[i];
            if(meth.toString().match(/compressScript\(java.lang.String,int,int,boolean\)/))
            rawCompress = meth;
          }
        return function(src){
            var zero = new java.lang.Integer(0);
            var one = new java.lang.Integer(1);
            var tru = new java.lang.Boolean(false);
            var script = new java.lang.String(src);
            return rawCompress.invoke(null,script, zero, one, tru );
            //return Compressor.compressScript(script, zero, one, tru); 
        }    
    },
   
    
// FIXME: 1st attempt. Google Closure Service API has a limit of 200k on POSTs.
// The jquery.js script exceeds this limit.
//    closureCompressor: function(){
//        var xhr = new XMLHttpRequest();
//        xhr.open("POST", "http://closure-compiler.appspot.com/compile", false);
//        xhr.setRequestHeader["Content-Type"] = "application/x-www-form-urlencoded";
//
//    	return function(src){
//    		var params = "js_code="+encodeURIComponent(src)+"&compilation_level=WHITESPACE_ONLY"+"&output_format=text&output_info=compiled_code";
//    		this.response = "";
//
//    		var self = this;
//    		xhr.onreadystatechange = function(){
//    			self.response = xhr.responseText;
//    		}
//    		
//    		xhr.send(params);
//    		
//    		return self.response;
//    	}
//    }


// FIXME: 2nd attempt using reflection. Kept getting this error:
// java.lang.IllegalArgumentException: wrong number of arguments (steal/compress/compress.js#191)
//      closureCompressor: function(){
//          var URLClassLoader = Packages.java.net.URLClassLoader
//          var URL = java.net.URL
//          var File = java.io.File
//    
//          var compiler  = new File("steal/rhino/compiler.jar");          
//          var compilerUrl = compiler.toURL();
//
//	      var urls = java.lang.reflect.Array.newInstance(URL,1);
//	      urls[0] = new URL(compilerUrl);
//	      var clazzLoader = new URLClassLoader(urls);
//	      
//	      var CompilerRunner = clazzLoader.loadClass("com.google.javascript.jscomp.CompilerRunner");
//	      var args = java.lang.reflect.Array.newInstance(java.lang.String, 256);
//	      var main = CompilerRunner.getMethod("main", args.getClass());
//	      
//	      return function(src){
//              (new Steal.File("tmp.js")).save(src);
//              
//	    	  args[0] = new java.lang.String("--compilation_level");
//	    	  args[1] = new java.lang.String("WHITESPACE_ONLY");
//	    	  args[1] = new java.lang.String("--js");
//	    	  args[3] = new java.lang.String("tmp.js");	    	 
//
//	          return main.invoke(null, args); 
//	      }
//      }

    closureCompressor: function(){  
        return function(src){
        	var rnd = Math.floor( Math.random()*1000000+1 );
        	var filename = "tmp" + rnd + ".js";
            var tmpFile = new Steal.File( filename );
            tmpFile.save( src );
            
        	var outBaos = new java.io.ByteArrayOutputStream();
        	var output = new java.io.PrintStream(outBaos);
            runCommand("java", "-jar", "steal/rhino/compiler.jar", "--compilation_level",
                "SIMPLE_OPTIMIZATIONS", "--js", filename, {output: output});
            
            tmpFile.remove();
            
            return outBaos.toString();
        }
    }
};

Steal.File = function(path){ this.path = path };
Steal.File.prototype = {    
    save: function(src, encoding){
          var fout = new java.io.FileOutputStream(new java.io.File( this.path ));
    
          var out     = new java.io.OutputStreamWriter(fout, "UTF-8");
          var s = new java.lang.String(src || "");
        
          var text = new java.lang.String( (s).getBytes(), encoding || "UTF-8" );
                out.write( text, 0, text.length() );
                out.flush();
                out.close();
    },
    
    remove: function(){
        var file = new java.io.File( this.path );
        file["delete"]();
    }
};




