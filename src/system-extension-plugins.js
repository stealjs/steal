
function applyModules(loader) {
	loader._extensions.push(applyModules);

	loader.plugins = {};
	loader._pluginValues = {};

	var slice = Array.prototype.slice;

	loader._installModules = function(){
		var loader = this;
		var pluginLoader = loader.pluginLoader || loader;
		var importPromises = [];

		var names;

		each(this.plugins, function(names, pattern){
			loader._pluginValues[pattern] = [];
			each(names, function(name){
				importPlugin(name, pattern);
			});
		});

		function importPlugin(name, pattern) {
			var p = pluginLoader["import"](name).then(function(value){
				loader._pluginValues[pattern].push(value);
			});
			importPromises.push(p);
		}

		return Promise.all(importPromises).then(function(){
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

	each(hooks, function(parent, hookName){
		addHook(hookName, parent);
	});

	function addHook(hookName, parent) {
		loader[hookName] = ifInstalled(function(loadOrName){
			var plugins = collectPlugins.call(this, loadOrName);
			if(!plugins.length) {
				return parent.apply(this, arguments);
			}

			var args = slice.call(arguments);
			var loader = this;

			return callAll.call(this, plugins, function(plugin, lastValue){
				var hook = plugin[hookName];
				if(hook) {
					if(hookName === "normalize" && lastValue) {
						args.shift();
						args.unshift(lastValue);
					}
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

	function collectPlugins(loadOrName) {
		var input = typeof loadOrName === "string" ? loadOrName : loadOrName.address;
		var out = [];

		each(this._pluginValues, function(plugins, pattern){
			if(steal.isMatch(input, pattern)) {
				out.push.apply(out, plugins);
			}
		});
		return out;
	}

	function callAll(plugins, callback, lastValue){
		if(!plugins.length) {
			return Promise.resolve(lastValue);
		}

		var plugin = plugins.shift();

		var value = callback(plugin, lastValue);
		return Promise.resolve(value).then(function(value){
			return callAll(plugins, callback, value || lastValue);
		});
	}
}

if(typeof System !== "undefined") {
	applyModules(System);
}
