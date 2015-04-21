var loader = require("@loader");

/**
 * A map of modules names to parents like:
 * {
 *   "child": {
 *     "parentA": true,
 *     "parentB": true
 *   },
 *   "parentA": false
 * }
 *
 * This is used to recursively delete parent modules
 *
 */
loader._liveMap = {};

// Put a hook on `normalize` so we can keep a reverse map of modules to parents.
// We'll use this to recursively reload modules.
var normalize = loader.normalize;
loader.normalize = function(name, parentName){
	var loader = this;
	var done = Promise.resolve(normalize.apply(this, arguments));
	
	if(!parentName) {
		return done.then(function(name){
			// We need to keep modules without parents to so we can know
			// if they need to have their `onLiveReload` callbacks called.
			loader._liveMap[name] = false;
			return name;
		});
	}
	
	// Once we have the fully normalized module name mark who its parent is.
	return done.then(function(name){
		var parents = loader._liveMap[name];
		if(!parents) {
			parents = loader._liveMap[name] = {};
		}

		parents[parentName] = true;

		return name;
	});
};

// Teardown a module name by deleting it and all of its parent modules.
function teardown(moduleName, needsImport, listeners) {
	var mod = loader.get(moduleName);
	if(mod) {
		var promise;
		var dispose = listeners.dispose[moduleName];
		// If this module has a `modLiveReloadTeardown` function call it.
		if(dispose) {
			promise = Promise.resolve(dispose());
		} else {
			promise = Promise.resolve();
		}
		loader.delete(moduleName);
		// If there's an interested listener add it to the needsImport.
		if(listeners.modules[moduleName]) {
			needsImport[moduleName] = true;
		}

		return promise.then(function(){
			// Delete the module and call teardown on its parents as well.
			var parents = loader._liveMap[moduleName];
			if(!parents) {
				needsImport[moduleName] = true;
				return Promise.resolve();
			}

			var promises = [];
			for(var parentName in parents) {
				promises.push(teardown(parentName, needsImport, listeners));
			}
			return Promise.all(promises);
		});
	}
	return Promise.resolve();
}

function defineReload(moduleName, listeners){
	function reload(moduleName, callback){
		// 3 forms
		// reload(callback); -> after full cycle
		// reload("foo", callback); -> after "foo" is imported.
		// reload("*", callback); -> after each module imports.
		var callbacks;
		if(arguments.length === 2) {
			callbacks = listeners.modules[moduleName] =
				listeners[moduleName] || [];
			callbacks.push(callback);
			return;
		}
		listeners.all.push(moduleName); // Actually the callback
	}

	// This allows modules to dispose themselves
	reload.dispose = function(callback){
		listeners.dispose[moduleName] = callback;
	};
	
	return reload;
}

function makeListeners(){
	return {
		modules: {},
		dispose: {},
		all: []
	};
}

function extend(a, b){
	for(var p in b) {
		a[p] = b[p];
	}
	return a;
}

function startCycle(){
	var listeners = makeListeners();
	extend(listeners.modules, loader._liveListeners.modules);
	extend(listeners.dispose, loader._liveListeners.dispose);

	var mod;
	for(moduleName in loader._liveMap) {
		mod = loader.get(moduleName);
		if(mod && mod.onReloadCycle) {
			mod.onReloadCycle(defineReload(moduleName, listeners));
		}
	}
	return listeners;
}

function reload(moduleName) {
	var listeners = startCycle();

	// Call teardown to recursively delete all parents, then call `import` on the
	// top-level parents.
	var parents = {};
	teardown(moduleName, parents, listeners).then(function(){
		var imports = [];
		var importPromise, callbacks;
		var eachCallbacks = listeners.modules["*"] || [];
		for(var parentName in parents) {
			importPromise = loader["import"](parentName);
			
			informListeners(importPromise, parentName, eachCallbacks, 
							listeners.modules[parentName]);

			imports.push(importPromise);
		}
		// Once everything is imported call the global listener callback functions.
		Promise.all(imports).then(function(){
			listeners.all.forEach(function(callback){
				callback();
			});
		});
	});
}

function informListeners(promise, moduleName, eachCallbacks, callbacks){
	if((callbacks && callbacks.length) || eachCallbacks.length) {
		promise.then(function(moduleValue){
			callbacks.forEach(function(cb){
				cb(moduleValue);
			});
			eachCallbacks.forEach(function(cb){
				cb(moduleName, moduleValue);
			});
		});
	}
}

function setup(){
	var port = loader.liveReloadPort || 8012;
	
	var host = window.document.location.host.replace(/:.*/, '');
	var ws = new WebSocket("ws://" + host + ":" + port);

	ws.onmessage = function(ev){
		var moduleName = ev.data;
		reload(moduleName);
	};
}

var isBrowser = typeof window !== "undefined";

if(isBrowser) {
	if(typeof steal !== "undefined") {
		steal.done().then(setup);
	} else {
		setTimeout(setup);
	}
}

loader._liveListeners = makeListeners();
exports = module.exports = defineReload(null, loader._liveListeners);

exports.includeInBuild = false;
