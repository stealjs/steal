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
		});

		// Only walk the export tree if all are not being used.
		// This saves not needing to do the traversal.
		if(!allUsed) {
			walkExports.call(loader, load, function(exps){
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

		do {
			index++;
			var parentName = stack[index];

			if(parentName === null) {
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

			var parentImportNames = parentLoad.metadata.importNames;
			var parentExportNames = parentLoad.metadata.exportNames;

			if(parentImportNames[parentSpecifier]) {
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

			if(parentExportNames[parentSpecifier]) {
				var names = parentExportNames[parentSpecifier];
				// Named exports
				if(isNaN(names)) {
					namesMap = names;
				}

				stack.push(null);
				stack.push(parentName);
				stack.push.apply(stack, this.getDependants(parentName));
			}

			cont = cont !== false && index < stack.length - 1;
		} while(cont);
	}

	/**
	 * Determine if the new parent has resulted in new used export names
	 * If so, redefine this module so that it goes into the registry correctly.
	 */
	function reexecuteIfNecessary(load, parentName) {
		var usedExports = [];
		walkExports.call(this, load, function(exps) {
			usedExports.push.apply(usedExports, exps);
		});

		// Given the parent's used exports, loop over and see if any are not
		// within the usedExports set.
		var hasNewExports = false;

		// If there isn't a usedExports Set, we have yet to check.
		if(load.metadata.usedExports) {
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
				var code = babel.transform(load.source, {
					plugins: [
						loader._getImportSpecifierPositionsPlugin.bind(null, load),
						treeShakePlugin.bind(null, loader, load)
					]
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
