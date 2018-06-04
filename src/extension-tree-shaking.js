addStealExtension(function(loader) {
	function determineUsedExports(load) {
		var loader = this;

		// 1. Get any new dependencies that haven't been accounted for.
		var newDeps = newDependants.call(this, load);
		var usedExports = new loader.Set();
		var allUsed = false;
		newDeps.forEach(function(depName) {
			var depLoad = loader.getModuleLoad(depName);
			var specifier = loader.moduleSpecifierFromName(depLoad, load.name);
			if (depLoad.metadata.format !== "es6") {
				allUsed = true;
				return;
			}

			var usedNames = depLoad.metadata.importNames[specifier] || [];
			usedNames.forEach(function(name) {
				usedExports.add(name);
			});
		});

		if(load.metadata.usedExports) {
			load.metadata.usedExports.forEach(function(name){
				usedExports.add(name);
			});
		}
		load.metadata.usedExports = usedExports;
		load.metadata.allExportsUsed = allUsed;

		return {
			all: allUsed,
			used: usedExports
		};
	}

	// Determine if this load's dependants have changed,
	function newDependants(load) {
		var out = [];
		var deps = this.getDependants(load.name);
		var shakenParents = load.metadata.shakenParents;
		if (!shakenParents) {
			out = deps;
		} else {
			for (var i = 0; i < deps.length; i++) {
				if (shakenParents.indexOf(deps[i]) === -1) {
					out.push(deps[i]);
				}
			}
		}
		return out;
	}

	/**
	 * Look at a parent (dependant) module and get which exports it uses for a load.
	 */
	function getUsedExportsFromParent(load, parentName) {
		var parentLoad = this.getModuleLoad(parentName);
		var parentImportNames = parentLoad.metadata.importNames;
		if (parentImportNames) {
			var parentSpecifier = this.moduleSpecifierFromName(
				parentLoad,
				load.name
			);

			var usedNames = parentImportNames[parentSpecifier];
			return usedNames || [];
		}
		return [];
	}

	/**
	 * Determine if the new parent has resulted in new used export names
	 * If so, redefine this module so that it goes into the registry correctly.
	 */
	function reexecuteIfNecessary(load, parentName) {
		var usedExports = getUsedExportsFromParent.call(this, load, parentName);

		// Given the parent's used exports, loop over and see if any are not
		// within the usedExports set.
		var hasNewExports = false;

		// If there isn't a usedExports Set, we have yet to check.
		if(load.metadata.usedExports) {
			for (var i = 0; i < usedExports.length; i++) {
				if (!load.metadata.usedExports.has(usedExports[i])) {
					hasNewExports = true;
				}
			}
		}

		if (hasNewExports) {
			var isCurrentlyLoading = this._loader.modules[load.name] || this._loader.importPromises[load.name];
			if(isCurrentlyLoading) {
				this["delete"](load.name);
			}

			// If there's an existing load object, zero it out.
			for(var i = 0; i < this._loader.loads.length; i++) {
				var existingLoad;
				if(this._loader.loads[i].name === load.name) {
					existingLoad = this._loader.loads[i];
					existingLoad.source = undefined;
					break;
				}
			}

			var source = load.metadata.originalSource || load.source;
			this.define(load.name, source, load);

			return this.whenInstantiated(load.name);
		}

		return Promise.resolve();
	}

	// Check if a module has already been tree-shaken.
	// And if so, re-execute it if there are new dependant modules.
	var notifyLoad = loader.notifyLoad;
	loader.notifyLoad = function(specifier, name, parentName){
		var load = loader.getModuleLoad(name);

		// If this module is already marked as tree-shakable it means
		// it has been loaded before. Determine if it needs to be reexecuted.
		if (load && load.metadata.treeShakable) {
			return reexecuteIfNecessary.call(this, load, parentName);
		}
		return notifyLoad.apply(this, arguments);
	};

	function getImportSpecifierPositionsPlugin(load) {
		load.metadata.importSpecifiers = Object.create(null);
		load.metadata.importNames = Object.create(null);

		return {
			visitor: {
				ImportDeclaration: function(path, state) {
					var node = path.node;
					var specifier = node.source.value;
					var loc = node.source.loc;
					load.metadata.importSpecifiers[specifier] = loc;

					var specifiers = load.metadata.importNames[specifier];
					if(!specifiers) {
						specifiers = load.metadata.importNames[specifier] = [];
					}

					specifiers.push.apply(specifiers, (
						node.specifiers || []
					).map(function(spec) {
						if(spec.type === "ImportDefaultSpecifier") {
							return "default";
						}
						return spec.imported && spec.imported.name;
					}));
				}
			}
		};
	}

	function treeShakePlugin(loader, load) {
		var notShakable = {
			exit: function(path, state) {
				state.treeShakable = false;
			}
		};

		var notShakeableVisitors = {
			ImportDeclaration: notShakable,
			FunctionDeclaration: notShakable,
			VariableDeclaration: notShakable
		};

		return {
			visitor: {
				Program: {
					enter: function(path) {
						var state = {};
						path.traverse(notShakeableVisitors, state);

						load.metadata.treeShakable = state.treeShakable !== false;
					}
				},

				ExportNamedDeclaration: function(path, state) {
					if (load.metadata.treeShakable) {
						var usedResult = determineUsedExports.call(
							loader,
							load
						);

						var usedExports = usedResult.used;
						var allUsed = usedResult.all;

						if (!allUsed) {
							path.get("specifiers").forEach(function(path) {
								var name = path.get("exported.name").node;
								if (
									!usedExports.has(name) &&
									name !== "__esModule"
								) {
									path.remove();
								}
							});

							if (path.get("specifiers").length === 0) {
								path.remove();
							}
						}
					}
				}
			}
		};
	}

	function applyBabelPlugin(load) {
		var loader = this;
		var pluginLoader = loader.pluginLoader || loader;

		return pluginLoader.import("babel").then(function(mod) {
			var transpiler = mod.__useDefault ? mod.default : mod;
			var babel = transpiler.Babel || transpiler.babel || transpiler;

			try {
				return babel.transform(load.source, {
					plugins: [
						getImportSpecifierPositionsPlugin.bind(null, load),
						treeShakePlugin.bind(null, loader, load)
					]
				}).code;
			} catch (e) {
				// Probably using some syntax that requires additional plugins.
				if(e instanceof SyntaxError) {
					return Promise.resolve();
				}
				return Promise.reject(e);
			}
		});
	}

	var translate = loader.translate;
	var es6RegEx = /(^\s*|[}\);\n]\s*)(import\s+(['"]|(\*\s+as\s+)?[^"'\(\)\n;]+\s+from\s+['"]|\{)|export\s+\*\s+from\s+["']|export\s+(\{|default|function|class|var|const|let|async\s+function))/;
	loader.translate = function treeshakeTranslate(load) {
		var loader = this;
		return Promise.resolve()
			.then(function() {
				if (es6RegEx.test(load.source)) {
					load.metadata.originalSource = load.source;
					return applyBabelPlugin.call(loader, load);
				}
			})
			.then(function(source) {
				if (source) {
					load.source = source;
				}
				return translate.call(loader, load);
			});
	};

	// For the build, wrap the _newLoader hook. This is to copy config over
	// that needs to exist for all loaders.
	var newLoader = loader._newLoader || Function.prototype;
	loader._newLoader = function(loader){
		var loads = this._traceData.loads || {};
		for(var moduleName in loads) {
			var load = loads[moduleName];
			if(load.metadata && load.metadata.usedExports) {
				var metaConfig = Object.create(null);
				metaConfig.treeShakable = load.metadata.treeShakable;
				metaConfig.usedExports = new this.Set(load.metadata.usedExports);
				metaConfig.allExportsUsed = load.metadata.allExportsUsed;

				var config = {meta:{}};
				config.meta[moduleName] = metaConfig;
				loader.config(config);
			}
		}
	};
});
