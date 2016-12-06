	steal["import"] = function(){
		var names = arguments;
		var loader = this.System;

		function afterConfig(){
			var imports = [];
			each(names, function(name){
				imports.push(loader["import"](name));
			});
			if(imports.length > 1) {
				return Promise.all(imports);
			} else {
				return imports[0];
			}
		}

		if(!configPromise) {
			// In Node a main isn't required, but we still want
			// to call startup() to do autoconfiguration,
			// so setting to empty allows this to work.
			if(!loader.main) {
				loader.main = "@empty";
			}
			steal.startup();
		}

		return configPromise.then(afterConfig);
	};
	steal.setContextual = fBind.call(System.setContextual, System);
	steal.isEnv = fBind.call(System.isEnv, System);
	steal.isPlatform = fBind.call(System.isPlatform, System);
	return steal;
