steal('//steal/compress/scripts', function(steal){
	var opts = {};
	
	/**
	 * compresses an application
	 * @param {String} url an html page to compress
	 * @param {Object} options
	 */
	steal.compress = function(url, options){
		options = steal.opts(options || {}, {
			//compress everything, regardless of what you find
			all : 1,
			//compress to someplace
			to: 1
		})
		
		
		//out is the folder packages will be sent to
		options.out = options.out || (url.match(/https?:\/\//) ?  "" : url.substr(0, url.lastIndexOf('/'))  );
		if (options.out.match(/\\$/) == null && options.out != '') {
			options.out += "/";
		}
		print("Putting packages in "+options.out)
		var compressor = steal.compress.compressors[options.compressor || "localClosure"](),
			packages = {},
			currentPackage = [];
		
		if(options.all){
			packages[options.to || 'production.js'] = currentPackage;
		}
		
		steal.scripts(url).each(function(script, text, i){
			
			if(script.getAttribute('ignore') == "true"){
				print('   ignoring '+script.src);
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
			
			text = steal.compress.clean(text);
			if(script.getAttribute('compress') == "true" || options.all){
				text =  compressor(text, true);
			}
			currentPackage.push(text);
		});
		
		//now we should have all scripts sorted by whatever package they should be put in
		print();
		for(var p in packages){
			if(packages[p].length){
				var compressed = packages[p].join(";\n");
				new steal.File(options.out + p).save(compressed);           
				print("Package " + (/*++idx*/ p) + ": " + options.out + p);
			}
		}
		
	}
	
	steal.extend(steal.compress, {
		compressors : {
			// needs shrinksafe.jar at steal/compress/shrinksafe
			shrinksafe: function(){
				print("steal.compress - Using ShrinkSafe")
				// importPackages/Class doesn't really work
				var URLClassLoader = Packages.java.net.URLClassLoader,
					URL = java.net.URL,
					File = java.io.File,
					ss  = new File("steal/compress/shrinksafe.jar"),
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
						runCommand("java", "-jar", "steal/compress/compiler.jar", "--compilation_level",
							"SIMPLE_OPTIMIZATIONS", "--warning_level","QUIET",  "--js", filename, {output: output});
					}else{
						runCommand("java", "-jar", "steal/compress/compiler.jar", "--compilation_level",
							"SIMPLE_OPTIMIZATIONS", "--js", filename, {output: output});
					}
					tmpFile.remove();
					
					return outBaos.toString();
				}
			}
		},
		//cleans out any steal removes or steal.dev.log calls
		clean : function(text){
			return String(java.lang.String(text)
						.replaceAll("(?s)\/\/@steal-remove-start(.*?)\/\/@steal-remove-end","")
						.replaceAll("steal[\n\s\r]*\.[\n\s\r]*dev[\n\s\r]*\.[\n\s\r]*(\w+)[\n\s\r]*\([^\)]*\)",""))
		}
	})	
})








