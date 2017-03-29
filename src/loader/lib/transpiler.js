/*
 * Traceur and Babel transpile hook for Loader
 */
(function(Loader) {
	var g = __global;

	var isNode = typeof self === "undefined" &&
		typeof process !== "undefined" &&
		{}.toString.call(process) === '[object process]'

	function getTranspilerModule(loader, globalName) {
		return loader.newModule({ 'default': g[globalName], __useDefault: true });
	}

	// Use Babel by default
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
	 * Whether the plugin name is already registered in babel-standalone
	 *
	 * @param {{}} babel The babel object exported by babel-standalone
	 * @param {string} pluginName The plugin name to be checked
	 * @return {boolean}
	 */
	function isPluginRegistered(babel, pluginName) {
		var isBabelPluginName = /^(?:babel-plugin-)/;
		var availablePlugins = babel.availablePlugins || {};

		// babel-standalone registers its bundled plugins using the shorthand name
		var shorthand = isBabelPluginName.test(pluginName) ?
			pluginName.replace("babel-plugin-", "") :
			pluginName;

		return !!availablePlugins[shorthand] || !!availablePlugins[pluginName];
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
	 * @param {{}} babel The babel object exported by babel-standalone
	 * @param {array} plugins An array of objects with plugin names, and
	 *				  options/env if available
	 * @return {Promise} Promise that resolves to the plugins array to be used
	 *                   to transpile the load source code
	 */
	function registerCustomPlugins(babel, plugins) {
		var promises = [];
		var registered = [];

		var babelEnv = getBabelEnv.call(this);

		plugins.forEach(function(plugin) {
			var canUsePlugin = plugin.env == null || plugin.env === babelEnv;

			if (canUsePlugin) {
				var name = plugin.name;
				var parent = this.configMain || "package.json!npm";

				registered.push(plugin.options ?
					[plugin.name, plugin.options] : plugin.name);

				if (!isPluginRegistered(babel, name)) {
					var path = getBabelPluginPath(name);

					promises.push(this["import"](path, { name: parent })
						.then(function(module) {
							if (module) {
								// handle ES2015 default exports
								var exported = typeof module === "function" ?
									module : module.default;

								babel.registerPlugin(name, exported);
							}
						}));
				}
			}
		}, this);

		return Promise.all(promises).then(function() {
			return registered;
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

	/**
	 * An object with babel plugin properties
	 *
	 * @typedef {Object} PluginData
	 * @property {string} name The plugin name
	 * @property {?string} env The environment name
	 * @property {?object} options Options object pass to babel plugin
	 */

	/**
	 * Ruturns an object with babel plugin properties
	 *
	 * @param {string|array} plugin The plugin entry found in babelOptions
	 * @param {?string} env The environment name if defined
	 * @return {PluginData}
	 */
	function collectPluginData(plugin, env) {
		var data = {};

		if (typeof plugin === "string") {
			data.name = plugin;
		}
		else {
			data.name = plugin[0];
			data.options = plugin[1];
		}

		data.env = env;
		return data;
	}

	/**
	 * Returns an array of plugin data objects
	 *
	 * Collects the plugins found in `babelOptions.env` concatenated with the
	 * plugin defined in `babelOptions.plugins`
	 *
	 * @param {{}} babelOptions The babel configuration object
	 * @return {Array.<PluginData>}
	 */
	function collectBabelPlugins(babelOptions) {
		var plugins = [];
		var env = babelOptions.env || {};

		(babelOptions.plugins || []).forEach(function(p) {
			plugins.push(collectPluginData(p));
		});

		for (var envName in env) {
			(env[envName].plugins || []).forEach(function(p) {
				plugins.push(collectPluginData(p, envName));
			});
		}

		return plugins;
	}

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

	function babelTranspile(load, babel) {
		babel = babel.Babel || babel.babel || babel;

		var options = getBabelOptions.call(this, load, babel);
		var plugins = collectBabelPlugins(options);
		var babelVersion = getBabelVersion(babel);

		return registerCustomPlugins.call(this, babel, plugins)
			.then(function(registered) {
				// might be running on an old babel that throws if there is a
				// plugins array in the options object
				if (babelVersion >= 6) {
					options.plugins = [addESModuleFlagPlugin].concat(registered);
				}

				var source = babel.transform(load.source, options).code;

				// add "!eval" to end of Babel sourceURL
				// I believe this does something?
				return source + '\n//# sourceURL=' + load.address + '!eval';
			});
	}

})(__global.LoaderPolyfill);
