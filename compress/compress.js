//we need to get a reference to steal and remove it
load('steal/file/file.js');
load('steal/loader/loader.js');
(function(Steal){
	var options ={
        "-o" : {
            params: 1
        }
    }
	Steal.Compress = function(args){ 
	   //set options
       this.options = {};
       var i =0;
       while(i< args.length){
           if(args[i].indexOf('-') == 0){
               var opt = options[args[i]], 
                   optName = args[i].substr(1), 
                   vals;
               vals = args.splice(i,  1 +  ( (opt && opt.params) || 0 ))
               vals.shift();
               if(vals.length <= 1){
                   this.options[optName] = vals[0] || true ;
               }else{
                   this.options[optName] = vals;
               }
           }else{
               i++
           }
       }
       
       if (args.length == 0) {
	      print("USAGE: compress <URL> [<OUTPUT_FOLDER>] [<OPTIONS>]");
          print("options: -a        compress all scripts");
	      quit();
	   }
	   this.url = args[0];
	   this.outputFolder = args[1] || 
           (args[0].match(/https?:\/\//) ?  "" : args[0].substr(0, args[0].lastIndexOf('/'))  );

       if(this.outputFolder.match(/\\$/) == null && this.outputFolder != '') this.outputFolder += "/";
	   delete steal;
	   this.loader = new Steal.Loader(this.url)
	   this.init();
	   steal = Steal;
	};
	Steal.removeRemoveSteal = function(text){
		  return String(java.lang.String(text)
		  				.replaceAll("(?s)\/\/@steal-remove-start(.*?)\/\/@steal-remove-end","")
		  				.replaceAll("steal[\n\s\r]*\.[\n\s\r]*dev[\n\s\r]*\.[\n\s\r]*(\w+)[\n\s\r]*\([^\)]*\)",""))
	}
	Steal.Compress.prototype = {
	   
	    scripts:[],
	    scriptTypes: {"text/javascript" : true,"text/envjs" : true},
	    packages: {},
	    compressString: undefined,
		
	    init: function(){
	       //read arguments in ...
	       var self= this;
		    this.compressString = this["closureCompressor"]();    
			var currentPackage = [];
            if(this.options.o){
                print('package everything')
                this.packages[this.options.o || 'production.js'] = currentPackage;
            }
		   print("\nScripts ....")
		   this.loader.each(this, function(script, text, i){
		   		var name =  script.src ? script.src.replace(/\?.*$/,"").replace(/^(\.\.\/)+/,"") : text
				if(script.getAttribute('ignore') == "true"){
					print('   ignore '+script.src);
					return;
				}
				
				
				if(script.src)
					print("   " + name  );
				
				var p = script.getAttribute('package');
                if(p && !this.packages[p]) 
						this.packages[p] = [];
				if(p){
					currentPackage = this.packages[p];
				}
				text = Steal.removeRemoveSteal(text);
				if(script.getAttribute('compress') == "true" || this.options.o){
	                text =  this.compressString(text, true);
	            }
				currentPackage.push(text);
		   })
		  
		   var idx = 0;
	       print();
		   for(var p in this.packages){
	           var compressed = this.packages[p].join(";\n");
	           new Steal.File(this.outputFolder + p).save(compressed);           
	           print("Package #" + idx + ": " + this.outputFolder + p);
	           idx++;
	       }
	      
	       //print("Compression Finished.");
	       //if(!window.MVCDontQuit) quit();  
		   
		   
	     
	       
	       //send to output
	         
	    },
	    
	    
	
	    shrinksafeCompressor: function(){
	        var URLClassLoader = Packages.java.net.URLClassLoader
	        var URL = java.net.URL
	        var File = java.io.File
	        
	        var ss  = new File("steal/rhino/shrinksafe.jar")
	        var ssurl = ss.toURL()

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
	        return function(src, quiet){
	        	var rnd = Math.floor( Math.random()*1000000+1 );
	        	var filename = "tmp" + rnd + ".js";
	            var tmpFile = new Steal.File( filename );
	            tmpFile.save( src );
	            
	        	var outBaos = new java.io.ByteArrayOutputStream();
	        	var output = new java.io.PrintStream(outBaos);
	            if(quiet){
					runCommand("java", "-jar", "steal/rhino/compiler.jar", "--compilation_level",
	                	"SIMPLE_OPTIMIZATIONS", "--warning_level","QUIET",  "--js", filename, {output: output});
				}else{
					runCommand("java", "-jar", "steal/rhino/compiler.jar", "--compilation_level",
	                	"SIMPLE_OPTIMIZATIONS", "--js", filename, {output: output});
				}
				
	            
	            tmpFile.remove();
	            
	            return outBaos.toString();
	        }
	    }
	};
	
})(steal)








