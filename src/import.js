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
	steal.setContextual = System.setContextual.bind(System);
	steal.isEnv = System.isEnv.bind(System);
	steal.isPlatform = System.isPlatform.bind(System);
	return steal;
