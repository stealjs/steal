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
		}
	});
	
	steal.config = function(cfg){
		if(typeof cfg === "string") {
			return System[cfg];
		} else {
			System.config(cfg);
		}
		
	};
	

