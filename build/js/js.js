if(!steal.build){
	steal.build = {};	
}
steal('steal','steal/build/css',function( steal ) {
	/**
	 * @class steal.build.js
	 * @parent steal.build
	 * @hide
	 * 
	 * An object that contains functions for creating a package of scripts, minifying it,
	 * and cleaning it.
	 */
	var js = steal.build.js = {};
	/**
	 * @function makePackage
	 * 
	 * `steal.build.js.makePackage(moduleOptions, dependencies, cssPackage, buildOptions)`
	 * creates JavaScript and CSS packages. For example:
	 * 
	 *     steal.build.js.makePackage( [
	 *        { buildType : "js", id : "a.js", text: "a" },
	 *        { buildType : "js", id : "b.js", text: "b" },
	 *        { buildType : "css", id : "c.css", text: "c" }
	 *       ],
	 *       { "package/1.js" : ["jquery/jquery.js"] },
	 *       "package/css.css",
	 *       {stealOwnModules: true}
	 *     )
	 * 
	 * ... produces an object with minified js that looks like the following
	 * unminified source:
	 * 
	 *     // indicates these modules are loading
	 *     steal.has("a.js","b.js");
	 *     
	 *     // steal any packages this package depends on
	 *     // waits makes them wait until the prior steal has finished
	 *     steal({id:"package/1.js",waits:true,has:["jquery/jquery.js"]});
	 *     steal({id:"package/css.css",waits:true,has:["c.css"]});
	 * 
	 *     // steal the modules required by production.js
	 *     // so that it can be marked completed
	 *     // at the right time
	 *     steal("a.js","b.js");
	 * 
	 *     // temporarily saves and empties the pending
	 *     // queue because the content's of other files
	 *     // will add to it and steal.excuted will clear it.
	 *     steal.pushPending();
	 *     // the files and executed contexts
	 *     a;
	 *     steal.executed("a.js");
	 *     b;
	 *     steal.executed("b.js");
	 *   
	 *     // pop production.js's pending state back into
	 *     // the pending queue.  
	 *     // When production.js is done loading, steal
	 *     // will use pending as production.js's dependencies.
	 *     steal.popPending();
	 * 
	 * 
	 * 
	 * @param {Array} moduleOptions like:
	 * 
	 *     [{id: "jquery/jquery.js", text: "var a;", baseType: "js"}]
	 * 
	 * Each moduleOption should have:
	 * 
	 * - id - the moduleId
	 * - text - the JS or CSS text of the module
	 * - baseType - either "css" or "js" 
	 * 
	 * @param {Object} dependencies An object of dependency moduleIds mapped
	 * to the moduleIds of the modules they contain:
	 * 
	 *      {"package/package.js": ['jquery/jquery.js']}
	 *      
	 * The package being created will wait until all dependencies in this
	 * object have been [steal.Module.states].
	 * 
	 * @param {String} cssPackage the css package name, added as dependency if
	 * there is css in files.
	 * 
	 * @param {Array} buildOptions An object that indicates certain behavior
	 * patterns.  For example:
	 * 
	 *     {
	 *       exclude: ["jquery/jquery.js"],
	 *       stealOwnModules: true
	 *     }
	 * 
	 * Supported options are:
	 * 
	 *  - exclude - exclude these modules from any build
	 *  - stealOwnModules - if the package should steal the modules it contains.
	 * 
	 * @return {Object} an object with the css and js 
	 * code that make up this package unminified
	 * 
	 *     {
	 *       js: "steal.has('plugin1','plugin2', ... )"+
	 *           "steal({src: 'package/package.js', has: ['jquery/jquery.js']})"+
	 *           "plugin1 content"+
	 *           "steal.executed('plugin1')",
	 *       css : "concated css content"
	 *     }
	 * 
	 */
	js.makePackage = function(moduleOptions, dependencies, cssPackage, buildOptions){
		// put it somewhere ...
		// add to dependencies ...
		// seperate out css and js
		buildOptions = buildOptions || {};
		var excludes = buildOptions.exclude || [];
		var jses = [],
			csses = [],
			lineMap = {},
			lineNum = 0,
			numLines = function(text){
				var matches = text.match(/\n/g);
				return matches? matches.length + 1 : 1
			};
				
		// if even one file has compress: false, we can't compress the whole package at once
		var canCompressPackage = true;
		moduleOptions.forEach(function(file){
			if(file.minify === false){
				canCompressPackage = false;
			}
		});
		if(!canCompressPackage){
			moduleOptions.forEach(function(file){
				if(file.buildType == 'js'){
					var source = steal.build.js.clean(file.text);
					if(file.minify !== false && buildOptions.minify !== false){
						try{
							source = steal.build.js.minify(source);
						} catch(error){
							print("ERROR minifying "+file.id+"\n"+error.err)
						}
						
					}
					file.text = source;
				}
			});
		}
		
		moduleOptions.forEach(function(file){
			if ( file.packaged === false ) {
				steal.print('   not packaging ' + file.id);
				return;
			}
			
			// ignore
			if ( file.ignore ) {
				steal.print('   ignoring ' + file.id);
				return;
			}

			/**
			 * Match the strings in the array and return result.
			 */
			var matchStr = function(str){
				var has = false;
				if(excludes.length){
					for(var i=0;i<excludes.length;i++){
						//- Match wildcard strings if they end in '/'
						//- otherwise match the string exactly
						//- Example `exclude: [ 'jquery/' ]` would exclude all of jquery++
						//- however `exclude: [ 'jquery' ]` would only exclude the file
						var exclude = excludes[i];
						if((exclude[exclude.length - 1] === "/" && 
							str.indexOf(exclude) === 0) || str === exclude){
							has = true;
							break;
						}
					}
				}
				return has;
			};

			if ( file.exclude || matchStr(''+file.id)){
				steal.print('   excluding '+file.id)
				return;
			}

			if(file.buildType == 'js'){
				jses.push(file)
			} else if(file.buildType == 'css'){
				csses.push(file)
			}
		})
		// add to dependencies
		if(csses.length && dependencies){
			dependencies[cssPackage] = csses.map(function(css){
				return css.id;
			})
		}
		
		// this now needs to handle css and such
		var loadingCalls = jses.map(function(file){
			return file.id;
		});
		//create the dependencies ...
		var dependencyCalls = [];
		for (var key in dependencies){
			dependencyCalls.push( 
				"steal({id: '"+key+"', waits: true, has: ['"+dependencies[key].join("','")+"']})"
			)
		}
		// make 'loading'
		var code = ["steal.has('"+loadingCalls.join("','")+"');"];
		
		
		
		// add dependencies
		code.push.apply(code,dependencyCalls);
		
		if(buildOptions.stealOwnModules){
			// this makes production.js wait for these moduleOptions to complete
			// this was removing the rootSteal and causing problems
			
			// but having it might cause a circular dependency in
			// the apps scenario
			code.push("steal('"+loadingCalls.join("','")+"')")
		}
		
		code.push("steal.pushPending()")
		
		lineNum += code.length
		// add js code
		jses.forEach(function(file){
			
			code.push( file.text, "steal.executed('"+file.id+"')" );
			lineMap[lineNum] = file.id+"";
			var linesCount = numLines(file.text)+1;
			lineNum += linesCount;
		});
		
		var jsCode = code.join(";\n") + ";\nsteal.popPending();\n";
		
		if(canCompressPackage){
			jsCode = steal.build.js.clean(jsCode);
			if(buildOptions.minify !== false){
				jsCode = steal.build.js.minify(jsCode,{currentLineMap: lineMap, compressor: buildOptions.compressor});
			}
			
		}
		
		var csspackage = steal.build.css.makePackage(csses, cssPackage);
		
		return {
			js: jsCode,
			css: csspackage
		}
	}
}).then('./jsminify');
