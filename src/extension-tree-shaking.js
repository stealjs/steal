addStealExtension(function addTreeShaking(loader) {
	function treeShakingEnabled(loader, load) {
		return !loader.noTreeShaking && loader.treeShaking !== false;
	}

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
		});

		// Only walk the export tree if all are not being used.
		// This saves not needing to do the traversal.
		if(!allUsed) {
			allUsed = walkExports.call(loader, load, function(exps){
				exps.forEach(function(name){
					usedExports.add(name);
				});
			});
		}

		// Copy over existing exports
		if(load.metadata.usedExports) {
			load.metadata.usedExports.forEach(function(name){
				usedExports.add(name);
			});
		}

		if(!loader.treeShakeConfig[load.name]) {
			loader.treeShakeConfig[load.name] = Object.create(null);
		}

		load.metadata.usedExports = loader.treeShakeConfig[load.name].usedExports = usedExports;
		load.metadata.allExportsUsed = loader.treeShakeConfig[load.name].allExportsUsed = allUsed;

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

	function walkExports(load, cb) {
		var moduleName = load.name;
		var name = moduleName;
		var visited = new this.Set();

 		// The stack is an array containing stuff we are traversing.
		// It looks like:
		// [moduleName, parentA, parentB, null]
		var stack = [name].concat(this.getDependants(name));
		var namesMap = null;
		var index = 0;
		var cont = true;

		// If there is only one item in the stack, this module has no parents yet.
		if(stack.length === 1) {
			return true;
		}

		// Special case for immediate parents, as these are the ones
		// That determine when all exports are used.
		var immediateParents = Object.create(null);
		stack.forEach(function(name) {
			immediateParents[name] = true;
		});

		do {
			index++;
			var parentName = stack[index];

			if(parentName == null) {
				name = stack[++index];
				cont = index < stack.length - 1;
				continue;
			}

			if(visited.has(parentName)) {
				continue;
			}

			visited.add(parentName);
			var parentLoad = this.getModuleLoad(parentName);
			var parentSpecifier = this.moduleSpecifierFromName(
				parentLoad,
				name
			);

			var parentIsESModule = parentLoad.metadata.format === "es6";
			var parentImportNames = parentLoad.metadata.importNames;
			var parentExportNames = parentLoad.metadata.exportNames;

			// If this isn't an ES module then return true (indicating all are used)
			if(!parentIsESModule && immediateParents[parentName]) {
				return true;
			}

			if(parentImportNames && parentImportNames[parentSpecifier]) {
				var names = parentImportNames[parentSpecifier];
				if(namesMap) {
					var parentsNames = names;
					names = [];
					parentsNames.forEach(function(name){
						if(namesMap.has(name)) {
							names.push(namesMap.get(name));
						}
					});
				}


				cont = cb(names) !== false;
			}

			if(parentExportNames && parentExportNames[parentSpecifier]) {
				var names = parentExportNames[parentSpecifier];
				var parentDependants = this.getDependants(parentName);
				// Named exports
				if(isNaN(names)) {
					namesMap = names;
				}
				// export * with no dependants should result in no tree-shaking
				else if(!parentDependants.length) {
					return true;
				}

				stack.push(null);
				stack.push(parentName);
				stack.push.apply(stack, parentDependants);
			}

			cont = cont !== false && index < stack.length - 1;
		} while(cont);

		return false;
	}

	/**
	 * Determine if the new parent has resulted in new used export names
	 * If so, redefine this module so that it goes into the registry correctly.
	 */
	function reexecuteIfNecessary(load, parentName) {
		var usedExports = [];
		var allExportsUsed = walkExports.call(this, load, function(exps) {
			usedExports.push.apply(usedExports, exps);
		});

		// Given the parent's used exports, loop over and see if any are not
		// within the usedExports set.
		var hasNewExports = allExportsUsed;

		// If there isn't a usedExports Set, we have yet to check.
		if(!allExportsUsed && load.metadata.usedExports) {
			for (var i = 0; i < usedExports.length; i++) {
				if (!load.metadata.usedExports.has(usedExports[i])) {
					hasNewExports = true;
					break;
				}
			}
		}

		if (hasNewExports) {
			var source = load.metadata.originalSource || load.source;
			this.provide(load.name, source, load);
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

	function treeShakePlugin(loader, load) {
		// existence of this type of Node means the module is not tree-shakable
		var notShakable = {
			exit: function(path, state) {
				state.treeShakable = false;
			}
		};

		// "bare" imports like `import "foo";` do not affect tree-shaking
		// any non-"bare" import means module cannot be tree-shaken
		var checkImportForShakability = {
			exit: function(path, state) {
				state.treeShakable = path.node.specifiers.length === 0;
			}
		};

		var notShakeableVisitors = {
			ImportDeclaration: checkImportForShakability,
			FunctionDeclaration: notShakable,
			VariableDeclaration: notShakable
		};

		var usedResult;
		// Call determineUsedExports, caching the result.
		function _determineUsedExports() {
			if(usedResult) {
				return usedResult;
			}
			usedResult = determineUsedExports.call(
				loader,
				load
			);
			return usedResult;
		}

		return {
			visitor: {
				Program: {
					enter: function(path) {
						var state = {};
						path.traverse(notShakeableVisitors, state);

						load.metadata.treeShakable = state.treeShakable !== false;
						if(!loader.treeShakeConfig[load.name]) {
							loader.treeShakeConfig[load.name] = Object.create(null);
						}
						loader.treeShakeConfig[load.name].treeShakable = load.metadata.treeShakable;
					}
				},

				ExportNamedDeclaration: function(path, state) {
					if (load.metadata.treeShakable) {
						var usedResult = _determineUsedExports();
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
				},

				ExportAllDeclaration: function(path, state) {
					if(load.metadata.treeShakable) {
						// This forces the load.metadata.usedExports property to be set
						// This is needed in modules that *only* have `export *` declarations.
						_determineUsedExports();
					}
				}
			}
		};
	}

	// Collect syntax plugins, because we need to always include these.
	var getSyntaxPlugins = (function(){
		var plugins;
		return function(babel) {
			if(!plugins) {
				plugins = [];
				for(var p in babel.availablePlugins) {
					if(p.indexOf("syntax-") === 0) {
						plugins.push(babel.availablePlugins[p]);
					}
				}
			}
			return plugins;
		};
	})();




	function applyBabelPlugin(load) {
		var loader = this;
		var pluginLoader = loader.pluginLoader || loader;

		return pluginLoader.import("babel").then(function(mod) {
			var transpiler = mod.__useDefault ? mod.default : mod;
			var babel = transpiler.Babel || transpiler.babel || transpiler;

			try {
				var babelPlugins = [].concat(getSyntaxPlugins(babel));
				babelPlugins.push(loader._getImportSpecifierPositionsPlugin.bind(null, load));
				if(treeShakingEnabled(loader, load)) {
					babelPlugins.push(treeShakePlugin.bind(null, loader, load));
				}
				var code = babel.transform(load.source, {
					plugins: babelPlugins,
					compact: false,
					filename: load && load.address
				}).code;

				// If everything is tree shaken still mark as ES6
				// Not doing this and steal won't accept the transform.
				if(code === "") {
					return '"format es6";';
				}

				return code;
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
					if(!load.metadata.originalSource)
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
	loader.treeShakeConfig = Object.create(null);
	var newLoader = loader._newLoader || Function.prototype;
	loader._newLoader = function(loader){
		var treeShakeConfig = this.treeShakeConfig;
		loader.treeShakeConfig = this.treeShakeConfig;

		for(var moduleName in treeShakeConfig) {
			var moduleTreeShakeConfig = treeShakeConfig[moduleName];

			var metaConfig = Object.create(null);
			metaConfig.treeShakable = moduleTreeShakeConfig.treeShakable;
			metaConfig.usedExports = new this.Set(moduleTreeShakeConfig.usedExports);
			metaConfig.allExportsUsed = moduleTreeShakeConfig.allExportsUsed;

			var config = {meta:{}};
			config.meta[moduleName] = metaConfig;
			loader.config(config);
		}
	};
});
