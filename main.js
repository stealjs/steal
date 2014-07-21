(function(global){

	// helpers
	var camelize = function(str){
		return str.replace(/-+(.)?/g, function(match, chr){ 
			return chr ? chr.toUpperCase() : '' 
		});
	},
		each = function( o, cb){
			var i, len;

			// weak array detection, but we only use this internally so don't
			// pass it weird stuff
			if ( typeof o.length == 'number' && (o.length - 1) in o) {
				for ( i = 0, len = o.length; i < len; i++ ) {
					cb.call(o[i], o[i], i, o);
				}
			} else {
				for ( i in o ) {
					if(o.hasOwnProperty(i)){
						cb.call(o[i], o[i], i, o);
					}
				}
			}
			return o;
		},
		map = function(o, cb) {
			var arr = [];
			each(o, function(item, i){
				arr[i] = cb(item, i);
			});
			return arr;
		},
		isString = function(o) {
			return typeof o == "string";
		},
		extend = function(d,s){
			each(s, function(v, p){
				d[p] = v;
			});
			return d;
		},
		dir = function(uri){
			var lastSlash = uri.lastIndexOf("/");
			if(lastSlash !== -1) {
				return uri.substr(0, lastSlash);
			} else {
				return uri;
			}
		},
		last = function(arr){
			return arr[arr.length - 1];
		},
		parseURI = function(url) {
			var m = String(url).replace(/^\s+|\s+$/g, '').match(/^([^:\/?#]+:)?(\/\/(?:[^:@]*(?::[^:@]*)?@)?(([^:\/?#]*)(?::(\d*))?))?([^?#]*)(\?[^#]*)?(#[\s\S]*)?/);
				// authority = '//' + user + ':' + pass '@' + hostname + ':' port
				return (m ? {
				href     : m[0] || '',
				protocol : m[1] || '',
				authority: m[2] || '',
				host     : m[3] || '',
				hostname : m[4] || '',
				port     : m[5] || '',
				pathname : m[6] || '',
				search   : m[7] || '',
				hash     : m[8] || ''
			} : null);
		},
		  
		joinURIs = function(base, href) {
			function removeDotSegments(input) {
				var output = [];
				input.replace(/^(\.\.?(\/|$))+/, '')
					.replace(/\/(\.(\/|$))+/g, '/')
					.replace(/\/\.\.$/, '/../')
					.replace(/\/?[^\/]*/g, function (p) {
						if (p === '/..') {
							output.pop();
						} else {
							output.push(p);
						}
					});
				return output.join('').replace(/^\//, input.charAt(0) === '/' ? '/' : '');
			}

			href = parseURI(href || '');
			base = parseURI(base || '');

			return !href || !base ? null : (href.protocol || base.protocol) +
				(href.protocol || href.authority ? href.authority : base.authority) +
				removeDotSegments(href.protocol || href.authority || href.pathname.charAt(0) === '/' ? href.pathname : (href.pathname ? ((base.authority && !base.pathname ? '/' : '') + base.pathname.slice(0, base.pathname.lastIndexOf('/') + 1) + href.pathname) : base.pathname)) +
					(href.protocol || href.authority || href.pathname ? href.search : (href.search || base.search)) +
					href.hash;
		};


	var filename = function(uri){
		var lastSlash = uri.lastIndexOf("/"),
			matches = ( lastSlash == -1 ? uri : uri.substr(lastSlash+1) ).match(/^[\w-\s\.]+/);
		return matches ? matches[0] : "";
	};
	
	var ext = function(uri){
		var fn = filename(uri);
		var dot = fn.lastIndexOf(".");
		if(dot !== -1) {
			return fn.substr(dot+1);
		} else {
			return "";
		}
	};

	var pluginCache = {};
	
	var normalize = function(name, loader){

		// Detech if this name contains a plugin part like: app.less!steal/less
		// and catch the plugin name so that when it is normalized we do not perform
		// Steal's normalization against it.
		var pluginIndex = name.lastIndexOf('!');
		var pluginPart = "";
		if (pluginIndex != -1) {
			// argumentName is the part before the !
			var argumentName = name.substr(0, pluginIndex);
			var pluginName = name.substr(pluginIndex + 1);
			pluginPart = "!" + pluginName;

			// Set the name to the argument name so that we can normalize it alone.
			name = argumentName;
		} 
		
		var last = filename(name),
			extension = ext(name);
		// if the name ends with /
		if(	name[name.length -1] === "/" ) {
			return name+filename( name.substr(0, name.length-1) ) + pluginPart;
		} else if(	!/^(\w+(?:s)?:\/\/|\.|file|\/)/.test(name) &&
			// and doesn't end with a dot
			 last.indexOf(".") === -1 
			) {
			return name+"/"+last + pluginPart;
		} else {
			if(extension === "js") {
				return name.substr(0, name.lastIndexOf(".")) + pluginPart;
			} else {
				return name + pluginPart;
			}
		}
	};

var makeSteal = function(System){
	
		
	var configDeferred,
		devDeferred,
		appDeferred;

	var steal = function(){
		var args = arguments;
		var afterConfig = function(){
			var imports = [];
			var factory;
			each(args, function(arg){
				if(isString(arg)) {
					imports.push( steal.System['import']( normalize(arg) ) );
				} else if(typeof arg === "function") {
					factory = arg;
				}
			});
			
			var modules = Promise.all(imports);
			if(factory) {
				return modules.then(function(modules) {
			        return factory && factory.apply(null, modules);
			   });
			} else {
				return modules;
			}
		};
		if(System.env === "production") {
			return afterConfig();
		} else {
			// wait until the config has loaded
			return configDeferred.then(afterConfig,afterConfig);
		}
		
	};
	
	steal.System = System;
	steal.parseURI = parseURI;
	steal.joinURIs = joinURIs;
	steal.normalize = normalize;

	// System.ext = {bar: "path/to/bar"}
	// foo.bar! -> foo.bar!path/to/bar
	var addExt = function(loader) {
		
		loader.ext = {};
		
		var normalize = loader.normalize,
			endingExtension = /\.(\w+)!$/;
			
		loader.normalize = function(name, parentName, parentAddress){
			var matches = name.match(endingExtension),
				ext,
				newName = name;
			
			if(matches && loader.ext[ext = matches[1]]) {
				newName = name + loader.ext[ext];
			}
			return normalize.call(this, newName, parentName, parentAddress);
		};
	};

	if(typeof System){
		addExt(System);
	}
	

	// "path/to/folder/" -> "path/to/folder/folder"
	var addForwardSlash = function(loader) {
		var normalize = loader.normalize;

		loader.normalize = function(name, parentName, parentAddress) {
			var lastPos = name.length - 1,
				secondToLast,
				folderName;

			if (name[lastPos] === "/") {
				secondToLast = name.substring(0, lastPos).lastIndexOf("/");
				folderName = name.substring(secondToLast + 1, lastPos);
				name += folderName;
			}
			return normalize.call(this, name, parentName, parentAddress);
		};
	};

	if (typeof System) {
		addForwardSlash(System);
	}

	// Overwrites System.config with setter hooks
	var setterConfig = function(loader, configSpecial){
		var oldConfig = loader.config;
		
		loader.config =  function(cfg){
			
			var data = extend({},cfg);
			// check each special
			each(configSpecial, function(special, name){
				// if there is a setter and a value
				if(special.set && data[name]){
					// call the setter
					var res = special.set.call(loader,data[name], cfg);
					// if the setter returns a value
					if(res !== undefined) {
						// set that on the loader
						loader[name] = res;
					} 
					// delete the property b/c setting is done
					delete data[name];
				}
			});
			oldConfig.call(this, data);
		};
	};
	var setIfNotPresent = function(obj, prop, value){
		if(!obj[prop]) {
			obj[prop] = value;	
		}
	};
	
	// steal.js's default configuration values
	System.paths["@config"] = "stealconfig.js";
	System.env = "development";
	System.ext = {
		css: '$css',
		less: '$less'
	};
	var cssBundlesNameGlob = "bundles/*.css",
		jsBundlesNameGlob = "bundles/*";
	setIfNotPresent(System.paths,cssBundlesNameGlob, "dist/bundles/*css");
	setIfNotPresent(System.paths,jsBundlesNameGlob, "dist/bundles/*.js");
	
	
	var configSetter = {
		set: function(val){
			var name = filename(val),
				root = dir(val);
			this.paths["@config"] = name;
			this.baseURL =  (root === val ? "." : root)  +"/";
		}
	},
		mainSetter = {
			set: function(val){
				this.main = val;
				addProductionBundles.call(this);
			}
		};
		
	var setToSystem = function(prop){
		return {
			set: function(val){
				if(typeof val === "object" && typeof steal.System[prop] === "object") {
					this[prop] = extend(this[prop] || {},val || {});
				} else {
					this[prop] = val;
				}
			}
		};
	};
	

	

	
	var addProductionBundles = function(){
		if(this.env === "production" && this.main) {
			var main = this.main,
				bundlesDir = this.bundlesName || "bundles/",
				mainBundleName = bundlesDir+filename(main);
				
	
			setIfNotPresent(this.meta, mainBundleName, {format:"amd"});
			setIfNotPresent(this.bundles, mainBundleName, [main]);

		}
	};
	
	var isNode = typeof module != 'undefined' && module.exports;
	var LESS_ENGINE = "less-1.7.0";
	
	setterConfig(System,{
		env: {
			set: function(val){
				System.env =  val;
				addProductionBundles.call(this);
			}
		},
		baseUrl: setToSystem("baseURL"),
		root: setToSystem("baseURL"),
		config: configSetter,
		configPath: configSetter,
		startId: {
			set: function(val){
				mainSetter.set.call(this, normalize(val) );
			}
		},
		main: mainSetter,
		// this gets called with the __dirname steal is in
		stealPath: {
			set: function(dirname, cfg) {
				var parts = dirname.split("/");

				setIfNotPresent(this.paths,"@dev", dirname+"/dev.js");
				setIfNotPresent(this.paths,"$css", dirname+"/css.js");
				setIfNotPresent(this.paths,"$less", dirname+"/less.js");
				this.paths["@traceur"] = parts.slice(0,-1).join("/")+"/traceur/traceur.js";
				
				if(isNode) {
					System.register("less",[], false, function(){
						var r = require;
						return r('less');
					});
				} else {
					setIfNotPresent(this.paths,"less",  dirname+"/"+LESS_ENGINE+".js");
					
					// make sure we don't set baseURL if something else is going to set it
					if(!cfg.root && !cfg.baseUrl && !cfg.baseURL && !cfg.config && !cfg.configPath) {
						if ( last(parts) === "steal" ) {
							parts.pop();
							if ( last(parts) === "bower_components" ) {
								parts.pop();
							}
						}
						this.baseURL =  parts.join("/")+"/";
					}
				}
			}
		},
		// System.config does not like being passed arrays.
		bundle: {
			set: function(val){
				System.bundle = val;
			}
		},
		bundlesPath: {
			set: function(val){
				this.paths[cssBundlesNameGlob] = val+"/*css";
				this.paths[jsBundlesNameGlob]  = val+"/*.js";
				return val;
			}
		},
		instantiated: {
			set: function(val){
				var loader = this;
				
				each(val || {}, function(value, name){
					loader.set(name,  loader.newModule(value));
				});
			}
		}
	});
	
	steal.config = function(cfg){
		if(typeof cfg === "string") {
			return System[cfg];
		} else {
			System.config(cfg);
		}
		
	};
	


	var getScriptOptions = function () {

		var options = {},
			parts, src, query, startFile, env,
			scripts = document.getElementsByTagName("script");

		var script = scripts[scripts.length - 1];

		if (script) {

			// Split on question mark to get query
			parts = script.src.split("?");
			src = parts.shift();
			query = parts.join("?");

			// Split on comma to get startFile and env
			parts = query.split(",");

			if (src.indexOf("steal.production") > -1) {
				options.env = "production";
			}

			if (parts[0]) {
				options.startId = parts[0];
			}
			// Grab env
			if (parts[1]) {
				options.env = parts[1];
			}

			// Split on / to get rootUrl
			parts = src.split("/");
			var lastPart = parts.pop();
			
			options.stealPath = parts.join("/");

			each(script.attributes, function(attr){
				var optionName = 
					camelize( attr.nodeName.indexOf("data-") === 0 ?
						attr.nodeName.replace("data-","") :
						attr.nodeName );
				options[optionName] = attr.value;
			});

		}

		return options;
	};

	steal.startup = function(config){

		// Get options from the script tag
		if(global.document) {
			var urlOptions = getScriptOptions();
		} else {
			// or the only option is where steal is.
			var urlOptions = {
				stealPath: __dirname
			};
		}

		// B: DO THINGS WITH OPTIONS
		// CALCULATE CURRENT LOCATION OF THINGS ...
		System.config(urlOptions);
		
		if(config){
			System.config(config);
		}

		// Read the env now because we can't overwrite everything yet

		// immediate steals we do
		var steals = [];

		// we only load things with force = true
		if ( System.env == "production" && System.main ) {

			return appDeferred = System.import(System.main)["catch"](function(e){
				console.log(e);
			});

		} else if(System.env == "development"){

			configDeferred = System.import("@config");

			devDeferred = configDeferred.then(function(){
				// If a configuration was passed to startup we'll use that to overwrite
				// what was loaded in stealconfig.js
				// This means we call it twice, but that's ok
				if(config) {
					System.config(config);
				}

				return System.import("@dev");
			},function(e){
				console.log("steal - error loading @config.",e);
				return steal.System.import("@dev");
			});

			appDeferred = devDeferred.then(function(){

				// if there's a main, get it, otherwise, we are just loading
				// the config.
				return System.main ? 
					System.import(System.main):
					configDeferred;
			}).then(function(){
				if(steal.dev) {
					steal.dev.log("app loaded successfully")
				}
			}, function(error){
				console.log("error",error,  error.stack);
			});
			return appDeferred;
		}
	};

	return steal;


};
/*
  SystemJS Steal Format
  Provides the Steal module format definition.
*/
function addSteal(loader) {

  // Steal Module Format Detection RegEx
  // steal(module, ...)
  var stealRegEx = /(?:^\s*|[}{\(\);,\n\?\&]\s*)steal\s*\(\s*((?:"[^"]+"\s*,|'[^']+'\s*,\s*)*)/;

  // What we stole.
  var stealInstantiateResult;
  
  function createSteal(loader) {
    stealInstantiateResult = null;

    // ensure no NodeJS environment detection
    loader.global.module = undefined;
    loader.global.exports = undefined;

    function steal() {
      var deps = [];
      var factory;
      
      for( var i = 0; i < arguments.length; i++ ) {
        if (typeof arguments[i] === 'string') {
          deps.push( normalize(arguments[i]) );
        } else {
          factory = arguments[i];
        }
      }

      if (typeof factory !== 'function') {
        factory = (function(factory) {
          return function() { return factory; };
        })(factory);
      }

      stealInstantiateResult = {
        deps: deps,
        execute: function(require, exports, moduleName) {

          var depValues = [];
          for (var i = 0; i < deps.length; i++) {
            depValues.push(require(deps[i]));
          }

          var output = factory.apply(loader.global, depValues);

          if (typeof output !== 'undefined') {
            return output;
          }
        }
      };
    }

    loader.global.steal = steal;
  }

  var loaderInstantiate = loader.instantiate;
  loader.instantiate = function(load) {
    var loader = this;

    if (load.metadata.format === 'steal' || !load.metadata.format && load.source.match(stealRegEx)) {
      load.metadata.format = 'steal';

      var oldSteal = loader.global.steal;

      createSteal(loader);

      loader.__exec(load);

      loader.global.steal = oldSteal;

      if (!stealInstantiateResult) {
        throw "Steal module " + load.name + " did not call steal";
      }

      if (stealInstantiateResult) {
        load.metadata.deps = load.metadata.deps ? load.metadata.deps.concat(stealInstantiateResult.deps) : stealInstantiateResult.deps;
        load.metadata.execute = stealInstantiateResult.execute;
      }
    }
    return loaderInstantiate.call(loader, load);
  };

  return loader;
}

if (typeof System !== "undefined") {
  addSteal(System);
}

	if (typeof window != 'undefined') {
		var oldSteal = window.steal;
		window.steal = makeSteal(System);
		window.steal.startup(oldSteal && typeof oldSteal == 'object' && oldSteal  );
		window.steal.addSteal = addSteal;
		
	} else {
    	
		require('systemjs');
			
		global.steal = makeSteal(System);
		global.steal.System = System;
		global.steal.dev = require("./dev.js");
		steal.clone = makeSteal;
		module.exports = global.steal;
		global.steal.addSteal = addSteal;
	}
    
})(typeof window == "undefined" ? global : window);