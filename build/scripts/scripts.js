steal(function(steal){
	
	/**
	 * Builds JavaScripts
	 * @param {Object} opener
	 * @param {Object} options
	 */
	var scripts = (steal.build.builders.scripts = function(opener, options){
		print("\nBUILDING SCRIPTS --------------- ");
		
		var compressor = scripts.compressors[options.compressor || "localClosure"](),
			packages = {},
			currentPackage = [],
			cssPackage;
		
		
		if(options.all){
			packages['production.js'] = currentPackage;
		}
		
		opener.each("script", function(script, text, i){
			
			if(script.getAttribute('ignore') == "true"){
				if(script.src){
					print('   ignoring '+script.src);
				}
				return;
			}
			
			//let people know we are adding it
			if(script.src){
				print("   " + script.src.replace(/\?.*$/,"").replace(/^(\.\.\/)+/,"")  );
			}
			var pack = script.getAttribute('package');
			
			if(pack){
				!packages[pack] && (packages[pack] = []);
				currentPackage = packages[pack];
			}
			
			text = scripts.clean(text);
			if(script.getAttribute('compress') == "true" || options.all){
				text =  compressor(text, true);
			}
			currentPackage.push(text);
		})
		print("")
		for(var p in packages){
			if(packages[p].length){
				var compressed = packages[p].join(";\n");
				new steal.File(options.to + p).save(compressed);           
				print("SCRIPT BUNDLE > " + options.to + p);
			}
		}
	})
	//removes  dev comments from text
	scripts.clean = function(text){
		return String(java.lang.String(text)
					.replaceAll("(?s)\/\/@steal-remove-start(.*?)\/\/@steal-remove-end","")
					.replaceAll("steal[\n\s\r]*\.[\n\s\r]*dev[\n\s\r]*\.[\n\s\r]*(\w+)[\n\s\r]*\([^\)]*\)",""))
	}
	
	//various compressors
	scripts.compressors =  {
			// needs shrinksafe.jar at steal/build/javascripts/shrinksafe.jar
			shrinksafe: function(){
				print("steal.compress - Using ShrinkSafe")
				// importPackages/Class doesn't really work
				var URLClassLoader = Packages.java.net.URLClassLoader,
					URL = java.net.URL,
					File = java.io.File,
					ss  = new File("steal/build/javascripts/shrinksafe.jar"),
					ssurl = ss.toURL(),
					urls = java.lang.reflect.Array.newInstance(URL,1)
				urls[0] = new URL(ssurl);
				
				var clazzLoader = new URLClassLoader(urls),
					mthds = clazzLoader.loadClass("org.dojotoolkit.shrinksafe.Compressor").getDeclaredMethods(),
					rawCompress = null;
				
				//iterate through methods to find the one we are looking for
				for(var i = 0; i < mthds.length; i++){
					var meth = mthds[i];
					if(meth.toString().match(/compressScript\(java.lang.String,int,int,boolean\)/))
						rawCompress = meth;
				}
				return function(src){
					var zero = new java.lang.Integer(0),
						one = new java.lang.Integer(1),
						tru = new java.lang.Boolean(false),
						script = new java.lang.String(src);
					return rawCompress.invoke(null,script, zero, one, tru );
				}    
			},
			closureService: function(){
		        print("steal.compress - Using Google Closure Service")
		
		    	return function(src){
					var xhr = new XMLHttpRequest();
			        xhr.open("POST", "http://closure-compiler.appspot.com/compile", false);
			        xhr.setRequestHeader["Content-Type"] = "application/x-www-form-urlencoded";
					var params = "js_code="+encodeURIComponent(src)+"&compilation_level=WHITESPACE_ONLY"+"&output_format=text&output_info=compiled_code";
		    		xhr.send(params);
		    		return ""+xhr.responseText;
		    	}
		    },
			localClosure: function(){  
				//was unable to use SS import method, so create a temp file
				print("steal.compress - Using Google Closure app")
				return function(src, quiet){
					var rnd = Math.floor( Math.random()*1000000+1 ),
						filename = "tmp" + rnd + ".js",
						tmpFile = new steal.File( filename );
						
					tmpFile.save( src );
					
					var outBaos = new java.io.ByteArrayOutputStream(),
						output = new java.io.PrintStream(outBaos);
					if(quiet){
						runCommand("java", "-jar", "steal/build/scripts/compiler.jar", "--compilation_level",
							"SIMPLE_OPTIMIZATIONS", "--warning_level","QUIET",  "--js", filename, {output: output});
					}else{
						runCommand("java", "-jar", "steal/build/scripts/compiler.jar", "--compilation_level",
							"SIMPLE_OPTIMIZATIONS", "--js", filename, {output: output});
					}
					tmpFile.remove();
					
					return outBaos.toString();
				}
			}
		}
})