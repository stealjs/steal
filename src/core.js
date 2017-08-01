var cloneSteal = function(System){
	var loader = System || this.System;
	var steal = makeSteal(loader.clone());
	steal.loader.set("@steal", steal.loader.newModule({
		"default": steal,
		__useDefault: true
	}));
	steal.clone = cloneSteal;
	return steal;
};

var makeSteal = function(System){
	var addStealExtension = function (extensionFn) {
		if (typeof System !== "undefined" && isFunction(extensionFn)) {
			if (System._extensions) {
				System._extensions.push(extensionFn);
			}
			extensionFn(System);
		}
	};

	System.set('@loader', System.newModule({
		'default': System,
		__useDefault: true
	}));


	System.set("less", System.newModule({
		__useDefault: true,
		default: {
			fetch: function() {
				throw new Error(
					[
						"steal-less plugin must be installed and configured properly",
						"See https://stealjs.com/docs/steal-less.html"
					].join("\n")
				);
			}
		}
	}));

	System.config({
		map: {
			"@loader/@loader": "@loader",
			"@steal/@steal": "@steal"
		}
	});

	var configPromise,
		devPromise,
		appPromise;

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
		if(System.isEnv("production")) {
			return afterConfig();
		} else {
			// wait until the config has loaded
			return configPromise.then(afterConfig,afterConfig);
		}

	};

	System.set("@steal", System.newModule({
		"default": steal,
		__useDefault:true
	}));

	var loaderClone = System.clone;
	System.clone = function(){
		var loader = loaderClone.apply(this, arguments);
		loader.set("@loader", loader.newModule({
			"default": loader,
			__useDefault: true
		}));
		loader.set("@steal", loader.newModule({
			"default": steal,
			__useDefault: true
		}));
		return loader;
	};

	// steal.System remains for backwards compat only
	steal.System = steal.loader = System;
	steal.parseURI = parseURI;
	steal.joinURIs = joinURIs;
	steal.normalize = normalize;
	steal.relativeURI = relativeURI;
	steal.addExtension = addStealExtension;
