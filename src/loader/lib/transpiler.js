/*
 * Traceur and Babel transpile hook for Loader
 */
(function(Loader) {
	var g = __global;

	function getTranspilerModule(loader, globalName) {
		return loader.newModule({ 'default': g[globalName], __useDefault: true });
	}

	// use Traceur by default
	Loader.prototype.transpiler = 'babel';

	Loader.prototype.transpile = function(load) {
		var self = this;

		// pick up Transpiler modules from existing globals on first run if set
		if (!self.transpilerHasRun) {
			if (g.traceur && !self.has('traceur'))
				self.set('traceur', getTranspilerModule(self, 'traceur'));
			if (g.babel && !self.has('babel'))
				self.set('babel', getTranspilerModule(self, 'babel'));
			self.transpilerHasRun = true;
		}

		return self['import'](self.transpiler)
			.then(function(transpiler) {
				if (transpiler.__useDefault) {
					transpiler = transpiler['default'];
				}

				return (transpiler.Compiler ? traceurTranspile : babelTranspile)
					.call(self, load, transpiler);
			})
			.then(function(code) {
				return 'var __moduleAddress = "' + load.address + '";' + code;
			});
	};

	Loader.prototype.instantiate = function(load) {
		var self = this;
		return Promise.resolve(self.normalize(self.transpiler))
			.then(function(transpilerNormalized) {
				// load transpiler as a global (avoiding System clobbering)
				if (load.name === transpilerNormalized) {
					return {
						deps: [],
						execute: function() {
							var curSystem = g.System;
							var curLoader = g.Reflect.Loader;
							// ensure not detected as CommonJS
							__eval('(function(require,exports,module){' + load.source + '})();', g, load);
							g.System = curSystem;
							g.Reflect.Loader = curLoader;
							return getTranspilerModule(self, load.name);
						}
					};
				}
			});
	};

	function traceurTranspile(load, traceur) {
		var options = this.traceurOptions || {};
		options.modules = 'instantiate';
		options.script = false;
		options.sourceMaps = 'inline';
		options.filename = load.address;
		options.inputSourceMap = load.metadata.sourceMap;
		options.moduleName = false;

		var compiler = new traceur.Compiler(options);
		var source = doTraceurCompile(load.source, compiler, options.filename);

		// add "!eval" to end of Traceur sourceURL
		// I believe this does something?
		source += '!eval';

		return source;
	}
	function doTraceurCompile(source, compiler, filename) {
		try {
			return compiler.compile(source, filename);
		}
		catch(e) {
			// traceur throws an error array
			throw e[0];
		}
	}

	/**
	 * Whether the plugin name is already registered in babel-standalone
	 *
	 * @param {{}} babel The babel object exported by babel-standalone
	 * @param {string} pluginName The plugin name to be checked
	 * @return {boolean}
	 */
	function isPluginRegistered(babel, pluginName) {
		var availablePlugins = babel.availablePlugins || {};

		return !!availablePlugins[pluginName];
	}

	/**
	 * Returns babel full plugin name if shorthand was used or the path provided
	 *
	 * @param {string} name The entry in the plugin array
	 * @return {string} Relative/absolute path to plugin or babel npm plugin name
	 *
	 * If a babel plugin is on npm, it can be set in the `plugins` array using
	 * one of the following forms:
	 *
	 * 1) full plugin name, e.g `"plugins": ["babel-plugin-myPlugin"]`
	 * 2) relative/absolute path, e.g: `"plugins": ["./node_modules/asdf/plugin"]`
	 * 3) using a shorthand, e.g: `"plugins": ["myPlugin"]`
	 *
	 * Since plugins are loaded through steal, we need to make sure the full
	 * plugin name is passed to `steal.import` so the npm extension can locate
	 * the babel plugin. Relative/absolute paths should be loaded as any other
	 * module.
	 */
	function getBabelPluginPath(name) {
		var isPath = /\//;
		var isBabelPluginName = /^(?:babel-plugin-)/;

		return isPath.test(name) || isBabelPluginName.test(name) ?
			name : "babel-plugin-" + name;
	}

	/**
	 * Register the custom plugins found in `babelOptions` object
	 *
	 * babel-standalone requires custom plugins to be registered in order to
	 * be used, see https://github.com/babel/babel-standalone#customisation
	 *
	 * @param {{}} load The loader load
	 * @param {{}} babel The babel object exported by babel-standalone
	 * @param {array} plugins The babel plugins array
	 * @return {Promise} Promise that resolves to the plugins array to be used
	 *                   to transpile the load source code
	 */
	function registerCustomPlugins(load, babel, plugins) {
		var self = this;
		var promises = [];
		var clonedPlugins = plugins.slice(0)

		plugins.forEach(function(plugin, index) {
			/**
			 * `plugin` can be either a string or an array:
			 *
			 * ```
			 * {
			 *   plugins: [
			 *     "pluginName",
			 *     [ "pluginName", { ...pluginOptions }
			 *   ]
			 * }
			 * ```
			 */
			var name = typeof plugin === "string" ? plugin : plugin[0];
			var parent = self.configMain || "package.json!npm";

			if (!isPluginRegistered(babel, name)) {
				var pluginPromise = self.normalize(getBabelPluginPath(name), parent)
					.then(function(name) {
						// check if the load corresponds to a babel plugin,
						// otherwise a loading plugin could try to load itself
						if (load.name !== name) {
							return self["import"](name);
						}
						// do not use the plugin while transpiling its own source code
						else {
							clonedPlugins.splice(index, 1);
						}
					})
					.then(function(module) {
						if (module) {
							// handle ES2015 default exports
							var exported = typeof module === "function" ?
								module : module.default;

							babel.registerPlugin(name, exported);
						}
					});

				promises.push(pluginPromise);
			}
		});

		return Promise.all(promises)
			.then(function() {
				return clonedPlugins;
			});
	}

	function getBabelPlugins(current) {
		var plugins = current || [];
		var required = "transform-es2015-modules-systemjs";

		if (plugins.indexOf(required) === -1) {
			plugins.unshift(required);
		}

		return plugins;
	}

	function getBabelPresets(current) {
		var presets = current || [];
		var defaults = ["es2015-no-commonjs", "react", "stage-0"];

		if (presets.length) {
			for (var i = defaults.length - 1; i >=0; i -= 1) {
				var preset = defaults[i];

				if (presets.indexOf(preset) === -1) {
					presets.unshift(preset);
				}
			}
		}
		else {
			presets = defaults;
		}

		return presets;
	}

	function getBabelOptions(load, babel) {
		var options = this.babelOptions || {};

		options.sourceMap = 'inline';
		options.filename = load.address;
		options.code = true;
		options.ast = false;

		var babelVersion = babel.version ? +babel.version.split(".")[0] : 6;
		if (!babelVersion) babelVersion = 6;

		if (babelVersion >= 6) {
			// delete the old babel options if they are present in config
			delete options.optional;
			delete options.whitelist;
			delete options.blacklist;

			// make sure presents and plugins needed for Steal to work
			// correctly are set
			options.presets = getBabelPresets(options.presets);
			options.plugins = getBabelPlugins(options.plugins);
		}
		else {
			options.modules = 'system';

			if (!options.blacklist) {
				options.blacklist = ['react'];
			}
		}

		return options;
	}

	function babelTranspile(load, babel) {
		babel = babel.Babel || babel.babel || babel;

		var options = getBabelOptions.call(this, load, babel);
		var plugins = (options.plugins || []).slice(0);

		return registerCustomPlugins.call(this, load, babel, plugins)
			.then(function(registered) {
				// use the plugins array coming from the promise; custom plugins
				// loaded by Steal can't be used to tranpile the plugin's own code
				if (options.plugins && registered.length) {
					options.plugins = registered;
				}
				var source = babel.transform(load.source, options).code;

				// restore original plugins configuration
				if (options.plugins) {
					options.plugins = plugins;
				}

				// add "!eval" to end of Babel sourceURL
				// I believe this does something?
				return source + '\n//# sourceURL=' + load.address + '!eval';
			});
	}

})(__global.LoaderPolyfill);
