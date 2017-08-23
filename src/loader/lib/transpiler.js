/*
 * Traceur and Babel transpile hook for Loader
 */
(function(Loader) {
	var g = __global;

	var isNode = typeof self === "undefined" &&
		typeof process !== "undefined" &&
		{}.toString.call(process) === '[object process]';

	function getTranspilerModule(loader, globalName) {
		return loader.newModule({
			__useDefault: true,
			"default": g[globalName]
		});
	}

	function getTranspilerGlobalName(loadName) {
		return loadName === "babel" ? "Babel" : loadName;
	}

	// Use Babel by default
	Loader.prototype.transpiler = 'babel';

	Loader.prototype.transpile = function(load) {
		var self = this;

		// pick up Transpiler modules from existing globals on first run if set
		if (!self.transpilerHasRun) {
			if (g.traceur && !self.has('traceur')) {
				self.set('traceur', getTranspilerModule(self, 'traceur'));
			}
			if (g.Babel && !self.has("babel")) {
				self.set("babel", getTranspilerModule(self, "Babel"));
			}
			self.transpilerHasRun = true;
		}

		return self['import'](self.transpiler)
			.then(function(transpilerMod) {
				var transpiler = transpilerMod;
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
							return getTranspilerModule(self, getTranspilerGlobalName(load.name));
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
	 * Gets the babel environment name
	 * return {string} The babel environment name
	 */
	function getBabelEnv() {
		var loader = this;
		var defaultEnv = "development";
		var loaderEnv = typeof loader.getEnv === "function" && loader.getEnv();

		if (isNode) {
			return process.env.BABEL_ENV ||
				process.env.NODE_ENV ||
				loaderEnv ||
				defaultEnv;
		}
		else {
			return loaderEnv || defaultEnv;
		}
	}

	/**
	 * Gets the babel preset or plugin name
	 * @param {BabelPreset|BabelPlugin} presetOrPlugin A babel plugin or preset
	 * @return {?string} The preset/plugin name
	 */
	function getPresetOrPluginName(presetOrPlugin) {
		if (includesPresetOrPluginName(presetOrPlugin)) {
			return typeof presetOrPlugin === "string" ? presetOrPlugin : presetOrPlugin[0];
		}
		else {
			return null;
		}
	}

	/**
	 * Whether the babel plugin/preset name was provided
	 *
	 * @param {BabelPreset|BabelPlugin} presetOrPlugin
	 * @return {boolean}
	 */
	function includesPresetOrPluginName(presetOrPlugin) {
		return typeof presetOrPlugin === "string" ||
			presetOrPlugin.length && typeof presetOrPlugin[0] === "string";
	}

	/**
	 * A Babel plugins as defined in `babelOptions.plugins`
	 * @typedef {string|Function|<string, Object>[]|<Function, Object>[]} BabelPlugin
	 */

	var processBabelPlugins = (function() {
		/**
		 * Returns a list of babel plugins to be used during transpilation
		 *
		 * Collects the babel plugins defined in `babelOptions.plugins` plus
		 * the environment dependant plugins.
		 *
		 * @param {Object} babel The babel object exported by babel-standalone
		 * @param {babelOptions} babelOptions The babel configuration object
		 * @return {Promise.<BabelPlugin[]>} Promise that resolves to a list of babel plugins
		 */
		return function processBabelPlugins(babel, babelOptions) {
			var babelEnv = getBabelEnv.call(this);
			var babelEnvConfig = babelOptions.env || {};

			var pluginsPromises = [
				doProcessPlugins.call(this, babel, babelOptions.plugins)
			];

			for (var envName in babelEnvConfig) {
				// do not process plugins if the current environment does not match
				// the environment in which the plugins are set to be used
				if (babelEnv === envName) {
					var plugins = babelEnvConfig[envName].plugins || [];
					pluginsPromises.push(doProcessPlugins.call(this, babel, plugins));
				}
			}

			return Promise.all(pluginsPromises)
				.then(function(results) {
					var plugins = [];

					// results is an array of arrays, flatten it out!
					results.forEach(function(processedPlugins) {
						plugins = plugins.concat(processedPlugins);
					});

					return plugins;
				});
		}

		/**
		 * Collects builtin plugin names and non builtins functions
		 *
		 * @param {Object} babel The babel object exported by babel-standalone
		 * @param {BabelPlugin[]} babelPlugins A list of babel plugins
		 * @return {Promise.<BabelPlugin[]>} A promise that resolves to a list
		 *		of babel-standalone builtin plugin names and non-builtin plugin
		 *		functions
		 */
		function doProcessPlugins(babel, babelPlugins) {
			var promises = [];

			var plugins = babelPlugins || [];

			plugins.forEach(function(plugin) {
				var name = getPresetOrPluginName(plugin);

				if (!includesPresetOrPluginName(plugin) || isBuiltinPlugin(babel, name)) {
					promises.push(plugin);
				}
				else if (!isBuiltinPlugin(babel, name)) {
					var parent = this.configMain || "package.json!npm";
					var npmPluginNameOrPath = getNpmPluginNameOrPath(name);

					// import the plugin!
					promises.push(this["import"](npmPluginNameOrPath, { name: parent })
						.then(function(mod) {
							var exported = mod.__esModule ? mod["default"] : mod;

							if (typeof plugin === "string") {
								return exported;
							}
							// assume the array form was provided
							else {
								// [ pluginFunction, pluginOptions ]
								return [exported, plugin[1]];
							}
						}));
				}
			}, this);

			return Promise.all(promises);
		}

		/**
		 * Whether the plugin is built in babel-standalone
		 *
		 * @param {Object} babel The babel object exported by babel-standalone
		 * @param {string} pluginName The plugin name to be checked
		 * @return {boolean}
		 */
		function isBuiltinPlugin(babel, pluginName) {
			var isNpmPluginName = /^(?:babel-plugin-)/;
			var availablePlugins = babel.availablePlugins || {};

			// babel-standalone registers its bundled plugins using the shorthand name
			var shorthand = isNpmPluginName.test(pluginName) ?
				pluginName.replace("babel-plugin-", "") :
				pluginName;

			return !!availablePlugins[shorthand];
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
		function getNpmPluginNameOrPath(name) {
			var isPath = /\//;
			var isBabelPluginName = /^(?:babel-plugin-)/;

			return isPath.test(name) || isBabelPluginName.test(name) ?
				name : "babel-plugin-" + name;
		}
	}());

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
		var required = ["es2015-no-commonjs"];

		if (presets.length) {
			for (var i = required.length - 1; i >=0; i -= 1) {
				var preset = required[i];

				if (presets.indexOf(preset) === -1) {
					presets.unshift(preset);
				}
			}
		}
		else {
			presets = ["es2015-no-commonjs", "react", "stage-0"];
		}

		return presets;
	}

	/**
	 * Returns the babel version
	 * @param {Object} babel The babel object
	 * @return {number} The babel version
	 */
	function getBabelVersion(babel) {
		var babelVersion = babel.version ? +babel.version.split(".")[0] : 6;

		return babelVersion || 6;
	}

	function getBabelOptions(load, babel) {
		var options = this.babelOptions || {};

		options.sourceMap = 'inline';
		options.filename = load.address;
		options.code = true;
		options.ast = false;

		if (getBabelVersion(babel) >= 6) {
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

	/**presets
	 * A Babel preset as defined in `babelOptions.presets`
	 * @typedef {string|Function|Object|<string, Object>[]|<Function, Object>[]|<Object, Object>} BabelPreset
	 */

	var processBabelPresets = (function() {
		/**
		 * Returns a list of babel presets to be used during transpilation
		 *
		 * Collects the babel presets defined in `babelOptions.presets` plus
		 * the environment dependant presets.
		 *
		 * @param {Object} babel The babel object exported by babel-standalone
		 * @param {babelOptions} babelOptions The babel configuration object
		 * @return {Promise.<BabelPreset[]>} Promise that resolves to a list of babel presets
		 */
		return function processBabelPresets(babel, babelOptions) {
			var babelEnv = getBabelEnv.call(this);
			var babelEnvConfig = babelOptions.env || {};

			var presetsPromises = [
				doProcessPresets.call(this, babel, babelOptions.presets)
			];

			for (var envName in babelEnvConfig) {
				// do not process presets if the current environment does not match
				// the environment in which the presets are set to be used
				if (babelEnv === envName) {
					var presets = babelEnvConfig[envName].presets || [];
					presetsPromises.push(doProcessPresets.call(this, babel, presets));
				}
			}

			return Promise.all(presetsPromises)
				.then(function(results) {
					var presets = [];

					// results is an array of arrays, flatten it out!
					results.forEach(function(processedPresets) {
						presets = presets.concat(processedPresets);
					});

					return presets;
				});
		};

		/**
		 * Collects builtin presets names and non builtins objects/functions
		 *
		 * @param {Object} babel The babel object exported by babel-standalone
		 * @param {BabelPreset[]} babelPresets A list of babel presets
		 * @return {Promise.<BabelPreset[]>} A promise that resolves to a list
		 *		of babel-standalone builtin preset names and non-builtin preset
		 *		definitions (object or function).
		 */
		function doProcessPresets(babel, babelPresets) {
			var promises = [];
			var presets = babelPresets || [];

			presets.forEach(function(preset) {
				var name = getPresetOrPluginName(preset);

				if (!includesPresetOrPluginName(preset) || isBuiltinPreset(babel, name)) {
					promises.push(preset);
				}
				else if (!isBuiltinPreset(babel, name)) {
					var parent = this.configMain || "package.json!npm";
					var npmPresetNameOrPath = getNpmPresetNameOrPath(name);

					// import the preset!
					promises.push(this["import"](npmPresetNameOrPath, { name: parent })
						.then(function(mod) {
							var exported = mod.__esModule ? mod["default"] : mod;

							if (typeof preset === "string") {
								return exported;
							}
							// assume the array form was provided
							else {
								// [ presetDefinition, presetOptions ]
								return [exported, preset[1]];
							}
						}));
				}
			}, this);

			return Promise.all(promises);
		}

		/**
		 * Whether the preset is built in babel-standalone
		 * @param {Object} babel The babel object exported by babel-standalone
		 * @param {string} pluginName The plugin name to be checked
		 * @return {boolean}
		 */
		function isBuiltinPreset(babel, presetName) {
			var isNpmPresetName = /^(?:babel-preset-)/;
			var availablePresets = babel.availablePresets || {};

			// babel-standalone registers its builtin presets using the shorthand name
			var shorthand = isNpmPresetName.test(presetName) ?
				presetName.replace("babel-preset-", "") :
				presetName;

			return !!availablePresets[shorthand];
		}

		function getNpmPresetNameOrPath(name) {
			var isPath = /\//;
			var isNpmPresetName = /^(?:babel-preset-)/;

			if (!isPath.test(name) && !isNpmPresetName.test(name)) {
				return "babel-preset-" + name;
			}

			return name;
		}
	}());

	/**
	 * Babel plugin that sets `__esModule` to true
	 *
	 * This flag is needed to interop the SystemJS format used by steal on the
	 * browser in development with the CJS format used for built modules.
	 *
	 * With dev bundles is possible to load a part of the app already built while
	 * other modules are being transpiled on the fly, with this flag, transpiled
	 * amd modules will be able to load the modules transpiled on the browser.
	 */
	function addESModuleFlagPlugin(babel) {
		var t = babel.types;

		return {
			visitor: {
				Program: function(path, state) {
					path.unshiftContainer("body", [
						t.exportNamedDeclaration(null, [
							t.exportSpecifier(t.identifier("true"),
								t.identifier("__esModule"))
						])
					]);
				}
			}
		};
	}

	function babelTranspile(load, babelMod) {
		var babel = babelMod.Babel || babelMod.babel || babelMod;

		var babelVersion = getBabelVersion(babel);
		var options = getBabelOptions.call(this, load, babel);

		return Promise.all([
			processBabelPlugins.call(this, babel, options),
			processBabelPresets.call(this, babel, options)
		])
		.then(function(results) {
			// might be running on an old babel that throws if there is a
			// plugins array in the options object
			if (babelVersion >= 6) {
				options.plugins = [addESModuleFlagPlugin].concat(results[0]);
				options.presets = results[1];
			}

			var source = babel.transform(load.source, options).code;

			// add "!eval" to end of Babel sourceURL
			// I believe this does something?
			return source + '\n//# sourceURL=' + load.address + '!eval';
		});
	}

})(__global.LoaderPolyfill);
