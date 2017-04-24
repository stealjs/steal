	// Overwrites System.config with setter hooks
	var setterConfig = function(loader, configOrder, configSpecial){
		var oldConfig = loader.config;

		loader.config =  function(cfg){

			var data = extend({},cfg);
			// check each special
			each(configOrder, function(name){
				var special = configSpecial[name];
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
	System.configMain = "@config";
	System.devBundle = "@empty";
	System.depsBundle = "@empty";
	System.paths[System.configMain] = "stealconfig.js";
	System.env = (isWebWorker ? "worker" : "window") + "-development";
	System.ext = Object.create(null);
	System.logLevel = 0;
	var cssBundlesNameGlob = "bundles/*.css",
		jsBundlesNameGlob = "bundles/*";
	setIfNotPresent(System.paths,cssBundlesNameGlob, "dist/bundles/*css");
	setIfNotPresent(System.paths,jsBundlesNameGlob, "dist/bundles/*.js");

	var configSetter = function(order){
		return {
			order: order,
			set: function(val){
				var name = filename(val),
					root = dir(val);

				if(!isNode) {
					System.configPath = joinURIs( location.href, val);
				}
				System.configMain = name;
				System.paths[name] = name;
				this.config({ baseURL: (root === val ? "." : root) + "/" });
			}
		}
	},
		valueSetter = function(prop, order) {
			return {
				order: order,
				set: function(val) {
					this[prop] = val;
				}
			}
		},
		booleanSetter = function(prop, order) {
			return {
				order: order,
				set: function(val) {
					this[prop] = !!val;
				}
			}
		},
		fileSetter = function(prop, order) {
			return {
				order: order,
				set: function(val) {
					this[prop] = envPath(val);
				}
			};
		};

	// checks if we're running in node, then prepends the "file:" protocol if we are
	var envPath = function(pathVal) {
		var val = pathVal;
		if(isNode && !/^file:/.test(val)) {
			// If relative join with the current working directory
			if(val[0] === "." && (val[1] === "/" ||
								 (val[1] === "." && val[2] === "/"))) {
				val = require("path").join(process.cwd(), val);
			}
			if(!val) return val;

			return "file:" + val;
		}
		return val;
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

	var pluginPart = function(name) {
		var bang = name.lastIndexOf("!");
		if(bang !== -1) {
			return name.substr(bang+1);
		}
	};

	var pluginResource = function(name){
		var bang = name.lastIndexOf("!");
		if(bang !== -1) {
			return name.substr(0, bang);
		}
	};

	var addProductionBundles = function(){
		// we don't want add the main bundled module if steal is bundled inside!
		if(this.loadBundles && this.main && !this.stealBundled) {
			var main = this.main,
				bundlesDir = this.bundlesName || "bundles/",
				mainBundleName = bundlesDir+main;

			setIfNotPresent(this.meta, mainBundleName, {format:"amd"});

			// If the configMain has a plugin like package.json!npm,
			// plugin has to be defined prior to importing.
			var plugin = pluginPart(System.configMain);
			var bundle = [main, System.configMain];
			if(plugin){
				System.set(plugin, System.newModule({}));
			}
			plugin = pluginPart(main);
			if(plugin) {
				var resource = pluginResource(main);
				bundle.push(plugin);
				bundle.push(resource);

				mainBundleName = bundlesDir+resource.substr(0, resource.indexOf("."));
			}

			this.bundles[mainBundleName] = bundle;
		}
	};

	var setEnvsConfig = function(){
		if(this.envs) {
			var envConfig = this.envs[this.env];
			if(envConfig) {
				this.config(envConfig);
			}
		}
	};

	var setupLiveReload = function(){
		if(this.liveReloadInstalled) {
			var loader = this;
			this["import"]("live-reload", {
				name: "@@steal"
			}).then(function(reload){
				reload(loader.configMain, function(){
					setEnvsConfig.call(loader);
				});
			});
		}
	};

	var specialConfigOrder = [];
	var envsSpecial = { map: true, paths: true, meta: true };
	var specialConfig = {
		instantiated: {
			order: 1,
			set: function(val){
				var loader = this;

				each(val || {}, function(value, name){
					loader.set(name,  loader.newModule(value));
				});
			}
		},
		envs: {
			order: 2,
			set: function(val){
				// envs should be set, deep
				var envs = this.envs;
				if(!envs) envs = this.envs = {};
				each(val, function(cfg, name){
					var env = envs[name];
					if(!env) env = envs[name] = {};

					each(cfg, function(val, name){
						if(envsSpecial[name] && env[name]) {
							extend(env[name], val);
						} else {
							env[name] = val;
						}
					});
				});
			}
		},
		env: {
			order: 3,
			set: function(val){
				this.env = val;

				if(this.isEnv("production")) {
					this.loadBundles = true;
				}
			}
		},
		loadBundles: booleanSetter("loadBundles", 4),
		stealBundled: booleanSetter("stealBundled", 5),
		// System.config does not like being passed arrays.
		bundle: {
			order: 6,
			set: function(val){
				System.bundle = val;
			}
		},
		bundlesPath: {
			order: 7,
			set: function(val){
				this.paths[cssBundlesNameGlob] = val+"/*css";
				this.paths[jsBundlesNameGlob]  = val+"/*.js";
				return val;
			}
		},
		meta: {
			order: 8,
			set: function(cfg){
				var loader = this;
				each(cfg || {}, function(value, name){
					if(typeof value !== "object") {
						return;
					}
					var cur = loader.meta[name];
					if(cur && cur.format === value.format) {
						// Keep the deps, if we have any
						var deps = value.deps;
						extend(value, cur);
						if(deps) {
							value.deps = deps;
						}
					}
				});
				extend(this.meta, cfg);
			}
		},
		configMain: valueSetter("configMain", 9),
		config: configSetter(10),
		configPath: configSetter(11),
		baseURL: fileSetter("baseURL", 12),
		main: valueSetter("main", 13),
		// this gets called with the __dirname steal is in
		// directly called from steal-tools
		stealPath: {
			order: 14,
			set: function(identifier, cfg) {
				var dirname = envPath(identifier);
				var parts = dirname.split("/");

				// steal keeps this around to make things easy no matter how you are using it.
				setIfNotPresent(this.paths,"@dev", dirname+"/ext/dev.js");
				setIfNotPresent(this.paths,"npm", dirname+"/ext/npm.js");
				setIfNotPresent(this.paths,"npm-extension", dirname+"/ext/npm-extension.js");
				setIfNotPresent(this.paths,"npm-utils", dirname+"/ext/npm-utils.js");
				setIfNotPresent(this.paths,"npm-crawl", dirname+"/ext/npm-crawl.js");
				setIfNotPresent(this.paths,"npm-load", dirname+"/ext/npm-load.js");
				setIfNotPresent(this.paths,"npm-convert", dirname+"/ext/npm-convert.js");
				setIfNotPresent(this.paths,"semver", dirname+"/ext/semver.js");
				setIfNotPresent(this.paths,"bower", dirname+"/ext/bower.js");
				setIfNotPresent(this.paths,"live-reload", dirname+"/ext/live-reload.js");
				setIfNotPresent(this.paths,"steal-clone", dirname+"/ext/steal-clone.js");
				this.paths["traceur"] = dirname+"/ext/traceur.js";
				this.paths["traceur-runtime"] = dirname+"/ext/traceur-runtime.js";
				this.paths["babel"] = dirname+"/ext/babel.js";
				this.paths["babel-runtime"] = dirname+"/ext/babel-runtime.js";
				setIfNotPresent(this.meta,"traceur",{"exports":"traceur"});

				// steal-clone is contextual so it can override modules using relative paths
				this.setContextual('steal-clone', 'steal-clone');

				if(isNode) {
					if(this.configMain === "@config" && last(parts) === "steal") {
						parts.pop();
						if(last(parts) === "node_modules") {
							this.configMain = "package.json!npm";
							parts.pop();
						}
					}
					if(this.isEnv("production") || this.loadBundles) {
						addProductionBundles.call(this);
					}
				} else {
					// make sure we don't set baseURL if it already set
					if(!cfg.baseURL && !cfg.config && !cfg.configPath) {

						// if we loading steal.js and it is located in node_modules or bower_components
						// we rewrite the baseURL relative to steal.js (one directory up!)
						// we do this because, normaly our app is located as a sibling folder to
						// node_modules or bower_components
						if ( last(parts) === "steal" ) {
							parts.pop();
							var isFromPackage = false;
							if ( last(parts) === cfg.bowerPath || last(parts) === "bower_components" ) {
								System.configMain = "bower.json!bower";
								addProductionBundles.call(this);
								parts.pop();
								isFromPackage = true;
							}
							if (last(parts) === "node_modules") {
								System.configMain = "package.json!npm";
								addProductionBundles.call(this);
								parts.pop();
								isFromPackage = true;
							}
							if(!isFromPackage) {
								parts.push("steal");
							}
						}
						this.config({ baseURL: parts.join("/")+"/"});
					}
				}
				System.stealPath = dirname;
			}
		},
		stealURL: {
			order: 15,
			// http://domain.com/steal/steal.js?moduleName,env&
			set: function(url, cfg)	{
				var urlParts = url.split("?"),
					path = urlParts.shift(),
					paths = path.split("/"),
					lastPart = paths.pop(),
					stealPath = paths.join("/"),
					platform = this.getPlatform() || (isWebWorker ? "worker" : "window");

				System.stealURL = path;

				// if steal is bundled or we are loading steal.production
				// we always are in production environment
				if((this.stealBundled && this.stealBundled === true) ||
					((lastPart.indexOf("steal.production") > -1) ||
						(lastPart.indexOf("steal-sans-promises.production") > -1)
					 	&& !cfg.env)) {
					this.config({ env: platform+"-production" });
				}

				if(this.isEnv("production") || this.loadBundles) {
					addProductionBundles.call(this);
				}

				specialConfig.stealPath.set.call(this,stealPath, cfg);

			}
		},
		devBundle: {
			order: 16,

			set: function(dirname, cfg) {
				var path = (dirname === true) ? "dev-bundle" : dirname;

				if (path) {
					this.devBundle = path;
				}
			}
		},
		depsBundle: {
			order: 17,

			set: function(dirname, cfg) {
				var path = (dirname === true) ? "dev-bundle" : dirname;

				if (path) {
					this.depsBundle = path;
				}
			}
		}
	};

	/*
	 make a setter order
	 currently:

	 instantiated
	 envs
	 env
	 loadBundles
	 stealBundled
	 bundle
	 bundlesPath
	 meta
	 config
	 configPath
	 baseURL
	 main
	 stealPath
	 stealURL
	 */
	each(specialConfig, function(setter, name){
		if(!setter.order) {
			specialConfigOrder.push(name)
		}else{
			specialConfigOrder.splice(setter.order, 0, name);
		}
	});

	// special setter config
	setterConfig(System, specialConfigOrder, specialConfig);

	steal.config = function(cfg){
		if(typeof cfg === "string") {
			return this.loader[cfg];
		} else {
			this.loader.config(cfg);
		}
	};
