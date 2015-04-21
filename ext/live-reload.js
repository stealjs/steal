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

// This is a map of listeners, those who have registered reload callbacks.
loader._liveListeners = {};

// Put a hook on `normalize` so we can keep a reverse map of modules to parents.
// We'll use this to recursively reload modules.
var normalize = loader.normalize;
loader.normalize = function(name, parentName){
	var loader = this;

	if(name === "live-reload") {
		name = "live-reload/" + parentName;
		loader.set(name, loader.newModule({
			default: makeReload(parentName),
			__useDefault: true
		}));
		return name;
	}

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
		var dispose = listeners.disposers[moduleName];
		// If this module has a `modLiveReloadTeardown` function call it.
		if(dispose) {
			dispose();
		}
		loader.delete(moduleName);
		if(loader._liveListeners[moduleName]) {
			loader.delete("live-reload/" + moduleName);
			delete loader._liveListeners[moduleName];
		}
		
		// If there's an interested listener add it to the needsImport.
		if(listeners.reloads[moduleName]) {
			needsImport[moduleName] = true;
		}

		// Delete the module and call teardown on its parents as well.
		var parents = loader._liveMap[moduleName];
		if(!parents) {
			needsImport[moduleName] = true;
			return;
		}

		for(var parentName in parents) {
			teardown(parentName, needsImport, listeners);
		}
	}
}

function makeReload(moduleName, listeners){
	loader._liveListeners[moduleName] = true;

	function reload(moduleName, callback){
		// 3 forms
		// reload(callback); -> after full cycle
		// reload("foo", callback); -> after "foo" is imported.
		// reload("*", callback); -> after each module imports.
		var callbacks;
		if(arguments.length === 2) {
			var reloads = reload.reload;
			if(!reloads) reloads = reload.reload = {};
			callbacks = reloads[moduleName] =
				reloads[moduleName] || [];
			callbacks.push(callback);
			return;
		}
		if(!reload.cycleComplete) reload.cycleComplete = [];
		reload.cycleComplete.push(moduleName); // Actually the callback
	}

	// This allows modules to dispose themselves
	reload.dispose = function(callback){
		reload.onDispose = callback;
	};
	
	return reload;
}

function mergeCallbacks(reloads, reload){
	var callbacks;
	for(moduleName in reload) {
		callbacks = reloads[moduleName];
		if(!callbacks) callbacks = reloads[moduleName] = [];
		callbacks.push.apply(callbacks, reload[moduleName]);
	}
}

function startCycle(){
	var reloads = {};
	var cycleComplete = [];
	var disposers = {};

	var mod;
	for(var moduleName in loader._liveListeners) {
		mod = loader.get("live-reload/" + moduleName);
		if(mod) {
			mod = mod["default"];
			if(mod.reload) {
				mergeCallbacks(reloads, mod.reload);
			}
			if(mod.cycleComplete) {
				cycleComplete.push.apply(cycleComplete, mod.cycleComplete);
			}
			if(mod.onDispose) {
				disposers[moduleName] = mod.onDispose;
			}
		}
	}

	return {
		reloads: reloads,
		cycleComplete: cycleComplete,
		disposers: disposers
	};
}

function reload(moduleName) {
	var listeners = startCycle();

	// Call teardown to recursively delete all parents, then call `import` on the
	// top-level parents.
	var parents = {};
	teardown(moduleName, parents, listeners);

	var imports = [];
	var importPromise, callbacks;
	var eachCallbacks = listeners.reloads["*"] || [];
	for(var parentName in parents) {
		importPromise = loader["import"](parentName);
		
		informListeners(importPromise, parentName, eachCallbacks, 
						listeners.reloads[parentName]);

		imports.push(importPromise);
	}
	// Once everything is imported call the global listener callback functions.
	Promise.all(imports).then(function(){
		listeners.cycleComplete.forEach(function(callback){
			callback();
		});
	});
}

function informListeners(promise, moduleName, eachCallbacks, callbacks){
	if((callbacks && callbacks.length) || eachCallbacks.length) {
		if(!callbacks) callbacks = [];
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
	if(loader.liveReload === "false") {
		return;
	}

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
} else {
	var metaConfig = loader.meta["live-reload"];
	if(!metaConfig) {
		metaConfig = loader.meta["live-reload"] = {};
	}
	// For the build, translate to a noop.
	metaConfig.translate = function(load){
		load.metadata.format = "amd";
		return "def" + "ine([], function(){\n" +
			"return function(){};\n});";
	};
}
