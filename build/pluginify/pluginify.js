// usage: 
// js steal\scripts\pluginify.js funcunit/functional -out funcunit/dist/funcunit.js
// js steal\scripts\pluginify.js jquery/controller
// js steal\scripts\pluginify.js jquery/event/drag -exclude jquery/lang/vector/vector.js jquery/event/livehack/livehack.js

// _args = ['jquery/controller']; load('steal/pluginifyjs')

steal('steal', 'steal/parse','steal/build',
 function(s, parse) {
	var isArray = function(arr){
		return Object.prototype.toString.call(arr)=== "[object Array]"
	}
	/**
	 * @function steal.build.pluginify
	 * @parent steal.build
	 *
	 * @signature `steal.build.pluginify(moduleId, opts)`
	 * 
	 * @param {{}} moduleId The moduleId of the plugin to be built.
	 * @param {{}} opts An object map of the following optional configuration
	 * properties:
	 * 
	 * @option {String }[out] Specifies the location of the generated file. The default filename is the 
	 * moduleId with `.` replacing all `/` in the moduleId's folder. For example,
	 * pluginifying `"foo/bar"` will create `"foo/bar/foo.bar.js"
	 * 
	 *     steal.build.pluginify("foo/bar",{
	 *       out: "bar.js"
	 *     })
	 * 
	 * @option  {Array} exclude An array of moduleIds to exclude. If the moduleId ends with a 
	 * slash (ex: `"can/"`) all modules within that folder will be ignored.
	 * 
	 * @option {Boolean|String} standAlone Set to `true` to only build the moduleId resource, everything
	 * else will be excluded. `standAlone` can also be set to a specific module or 
	 * folder.
	 * 
	 * @option {Boolean} nojquery Excludes jQuery and adds `jquery: "jQuery"` to the shim. Example:
	 * 
	 *     steal.build.pluginify("foo/bar",{
	 *       nojquery: true
	 *     })
	 * 
	 * @option {Boolean} nocanjs Exclude all CanJS files and adds corresponding shims.
	 * 
	 * @option {Boolean} minify Set to `true` to minify the build.  
	 * 
	 * @option {Array} wrapInner An array containing code you want to wrap the output in 
	 * like `[before, after]`. Example:
	 * 
	 *     steal.build.pluginify("foo/bar",{
	 *       wrapInner: ["(function($,can){","})(jQuery, can)"]
	 *     })
	 * 
	 * @option {{}} shim Specifies a mappings between an excluded moduleId and
	 * it's global value.  For example:
	 * 
	 *     steal.build.pluginify("foo/bar",{
	 *       exclude: ["jquery","can/"],
	 *       shim: {
	 *         jquery: "jQuery",
	 *         "can/util": "can",
	 *         "can/control": "can.Control"
	 *       }
	 *     })
	 * 
	 * 
	 * @option {Boolean} skipAll - Don't run any of the code in steal callbacks (used for canjs build)
	 *
	 * @body
	 *
	 * `steal.build.pluginify(moduleId, options)` builds a 'steal-less' version 
	 * of a module. It can called programatically in JavaScript like:
	 * 
	 *     steal.build.pluginify('widgets/chart',{
	 *       nojquery: true,
	 *       nocanjs: true,
	 *       exclude: ["underscore"],
	 *       shim: { "underscore" : "_" }
	 *     })
	 *     
	 * Basic examples can be called from the command line like:
	 * 
	 *     ./js steal/pluginifyjs widgets/chart -nojquery -nocanjs
	 *   
	 * 
	 */
	s.build.pluginify = function(moduleId, opts){
		s.print("" + moduleId + " >");
		
		// figure out options
		var othervar, 
			opts = s.opts(opts, {
				"out": 1,
				"exclude": -1,
				"nojquery": 0,
				"minify": 0,
				"onefunc": 0,
				"wrapInner": 0,
				"skipAll": 0,
				"standAlone": 0,
				"nocanjs": 0,
				"shim": {},
				"exports": {}
			}),
			where = opts.out || moduleId + "/" + moduleId.replace(/\//g, ".") + ".js";

		opts.shim = opts.shim || {};
		
		opts.exclude = !opts.exclude ? [] : (isArray(opts.exclude) ? opts.exclude : [opts.exclude]);

		if (opts.nojquery) {
			opts.exclude.push("jquery");
			if(!opts.shim.jquery){
				opts.shim.jquery = "jQuery"
			}
		}
		if(opts.nocanjs){
			// TODO: change it so modules that
			// are ignored, but expected to have a value
			// will be shown
			"Construct Control Model Observe route".split(" ").forEach(function(name){
				var lower = name.toLowerCase();
				opts.shim["can/"+lower+"/"+lower+".js"] = "can."+name
			})
			"view/ejs view/mustache".split(" ").forEach(function(name){
				var last = name.split("/").pop();
				opts.shim["can/"+name+"/"+last+".js"] = "can";
			});
			opts.shim["can/can.js"] = "can";
			opts.exclude.push("can/");
		}
		
		opts.exclude.push("steal/dev/");
		opts.exclude.push("stealconfig.js");
		
		// helper function used to tell if a steal should be excluded
		var inExclude = function(stl){
				var path = ""+stl.id;
				for (var i = 0; i < opts.exclude.length; i++) {
					if ((opts.exclude[i].substr(-1) === "/" && path.indexOf(opts.exclude[i]) === 0
						|| path == opts.exclude[i])
						|| stl._skip) {
						return true;
					}
				}
				return false;
			}, 
			// the js output of the plugin
			jsOut = '', 
			cssOut = '',
			// a mapping of ids we've already seen
			fns = {};
			
			

		// Open a page and load the plugin and dependencies
		s.build.open("steal/rhino/blank.html", {
			startId : moduleId, 
			skipAll: opts.skipAll
		}, function(opener){
			
			// go through each module and get it's content
			opener.each(function(moduleOptions, module, i){
				
				
				// mark this file as processed, continue no matter
				// what if it's a function because some files have two function callbacks
				if(moduleOptions.buildType === "fn") {
					fns[moduleOptions.id] = ( fns[moduleOptions.id] !== undefined ? fns[moduleOptions.id] + 1 : 0 );
				}
				// if this module has already been processed as a function
				else if(fns[moduleOptions.id] !== undefined && moduleOptions.buildType === "js"){ 
					return;
				}
				
				
				var id = ( ""+moduleOptions.id );
				
				
				var inStandAlone = (opts.standAlone &&  id === moduleId) ||
					(opts.standAlone && opts.standAlone.indexOf && opts.standAlone.indexOf(id) !== -1);
					
				if ( inStandAlone || (!opts.standAlone && !inExclude(moduleOptions)) ) {
					s.print("  + "+id)
					// get the content for the module
					if( moduleOptions.buildType === "css" ) {
						cssOut += moduleOptions.text || readFile( opener.steal.idToUri( moduleOptions.id, true) )
					} else {
						
						// get the "js" file this "fn" module represents
						var rootJsModule = opener.steal.resources[moduleOptions.id],
						
							content = s.build.pluginify.content(rootJsModule, opts, fns[moduleOptions.id]);
						
						if (content) {
							// add a comment
							jsOut += '// ## ' + moduleOptions.id + '\n';
							
							// if it's a function, create a module that will get the result of 
							// calling the function
							if(moduleOptions.buildType === 'fn' && !opts.onefunc) {
								jsOut += '\nmodule[\'' + moduleOptions.id + '\'] = ';
							}
	
							// if there should only be one func, remove the last return
							if(opts.onefunc) {
								content = content.substring(0, content.lastIndexOf('return'));
							}
	
							// clean the content and add that to jsOut
							jsOut += s.build.js.clean(content);
						}
						
					}
					
					
					
					
					
				}
				else {
					s.print("  x " +id )
				}
			}, true);
		}, false);

		var output = '';

		if(opts.onefunc) {
			output = opts.wrapInner && opts.wrapInner.length ? opts.wrapInner[0] : '(function(window, undefined) {';
			output += jsOut;
			output += opts.wrapInner && opts.wrapInner.length ? opts.wrapInner[1] : '\n\n})(this);';
		}
		else {
			output = 'module = { _orig: window.module, _define: window.define };\n';

			for(key in opts.shim) {
				output += 'module[\'' + key + '\'] = ' + opts.shim[key] + ';\n';
			}

			output += 'define = function(id, deps, value) {\n';
			output += '\tif(value) module[id] = value();\n';
			output += '};\ndefine.amd = { jQuery: true };\n' + jsOut + '\n';

			for(key in opts.exports) {
				output += 'window[\'' + opts.exports[key] + '\'] = module[\'' + key + '\'];\n';
			}

			output += '\nwindow.define = module._define;\n';
			output += '\nwindow.module = module._orig;';
		}

		if (opts.minify) {
			var compressorName = (typeof(opts.minify) == "string") ? opts.minify : "localClosure";
			var compressor = s.build.js.minifiers[compressorName]()
			output = compressor(output);
		}

		s.print("> " + where);
		new s.URI(where).save(output);
		if(cssOut){
			var cssLocation = where.replace(/\.js$/,".css")
			s.print("> " + cssLocation);
			new s.URI(cssLocation).save(cssOut);
		}
	}
	var funcCount = {};
	var strip = function(output) {
		if(!output) {
			return '';
		}
		// Remove all //!steal-pluginify-remove-* section
		return output.replace(/(\/\/\!steal-pluginify-remove-start)(.|\s)*?(\/\/\!steal-pluginify-remove-end).*/mg, '');
	}
	
	
	//gets content from a steal
	s.build.pluginify.content = function(module, opts, funcCount){
		var param = [],
			deps = module.dependencies;

		for(var i = 0; i < deps.length - 1; i++) {
			if(deps[i]) {
				param.push(deps[i].options.id);
			}
		}

		if(param.length) {
			param = 'module["' + param.join('"], module["') + '"]';
		}
		var content = module.options.text || readFile( s.idToUri( module.options.id, true)   )
		
		if (/steal[.\(]/.test(content)) {
			content = s.build.pluginify.getFunction(content, funcCount, opts.onefunc);
			if(content && !opts.onefunc){
				content =  "(" + content + ")(" + param + ");";
			}
		}
		return content;
		/*
		if ( resourceOpts.buildType !== resourceOpts.type) {
			console.log("   -"+resourceOpts.type)
		}
		if (resourceOpts.buildType == "fn") {
			// if it's a function, go to the file it's in ... pull out the content
			var index = funcCount[resourceOpts.id] || 0, 
				contents = readFile(resourceOpts.id);
			funcCount[resourceOpts.id]++;


			contents = s.build.pluginify.getFunction(contents, index, opts.onefunc);

			return opts.onefunc ? contents : "(" + contents + ")(" + param + ");";
		}
		else {
			var content = readFile( s.idToUri( resourceOpts.id, true)   );
			if (/steal[.\(]/.test(content)) {
				content = s.build.pluginify.getFunction(content, 0, opts.onefunc)
				if(content && !opts.onefunc){
					content =  "(" + content + ")(" + param + ");";
				}
			}
			//make sure steal isn't in here
			return content;
		}*/
	};
	s.build.pluginify.getFunction = function(content, ith, onewrap){
		var p = parse(content), 
			token, 
			funcs = [];
		while (token = p.moveNext()) {
			//print(token.value)
			if (token.type !== "string") {
				switch (token.value) {
					case "steal":
						stealPull(p, content, function(func){
							funcs.push(func)
						}, onewrap);
						break;
				}
			}
		}

		return strip(funcs[ith || 0]);
	};
	//gets a function from steal
	var stealPull = function(p, content, cb, onewrap){
		var token = p.next(), startToken, endToken;
		if (!token || (token.value != "." && token.value != "(")) {
			// we said steal .. but we don't care
			return;
		}
		else {
			p.moveNext();
		}
		if (token.value == ".") {
			p.until("(")
		}
		var tokens = p.until("function", ")");
		if (tokens && tokens[0].value == "function") {
			
			token = tokens[0];
			
			startToken = p.until("{")[0];
			
			endToken = p.partner("{");
			cb(content.substring(onewrap ? startToken.from+1 :token.from, onewrap ? endToken.to-1 : endToken.to))
			//print("CONTENT\n"+  );
			p.moveNext();
		}
		else {
		
		}
		stealPull(p, content, cb, onewrap);
		
	};
	return steal.build.pluginify
});
