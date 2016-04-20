
function applyModules(loader) {
	loader._extensions.push(applyModules);

	loader.extensions = [];
	loader._modulePlugins = [];

	var slice = Array.prototype.slice;

	loader._installModules = function(){
		var loader = this;
		var p = this.extensions.map(function(name){
			return loader["import"](name);
		});
		return Promise.all(p).then(function(values){
			loader._modulePlugins = values;
			loader._modulesInstalled = true;
		});
	};

	var hooks = {
		normalize: loader.normalize,
		locate: loader.locate,
		fetch: loader.fetch,
		translate: loader.translate,
		instantiate: loader.instantiate
	};

	for(var hookName in hooks) {
		addHook(hookName, hooks[hookName]);
	}

	function addHook(hookName, parent) {
		loader[hookName] = ifInstalled(function(){
			if(!this._modulePlugins.length) {
				return parent.apply(this, arguments);
			}

			var plugins = slice.call(this._modulePlugins);
			var args = slice.call(arguments);
			var loader = this;

			return callAll.call(this, plugins, function(plugin){
				var hook = plugin[hookName];
				if(hook) {
					return hook.apply(loader, [parent].concat(args));
				}
			}).then(function(value){
				if(value) {
					return value;
				} else {
					return parent.apply(loader, args);
				}
			});

		}, parent);
	}

	function ifInstalled(fn, parent){
		return function(){
			if(this._modulesInstalled) {
				return fn.apply(this, arguments);
			}
			return parent.apply(this, arguments);
		};
	}

	function callAll(plugins, callback){
		if(!plugins.length) {
			return Promise.resolve();
		}

		var plugin = plugins.shift();

		var value = callback(plugin);
		if(value) {
			return Promise.resolve(value);
		} else {
			return callAll(plugins, callback);
		}
	}
}

if(typeof System !== "undefined") {
	applyModules(System);
}
