// Returns a Promise that will resolve once the module is set on the loader
function setModule(moduleName, parentName, moduleOverrides) {
	let newLoader = this;
	return new Promise(function(resolve) {
		newLoader.normalize(moduleName, parentName)
		.then(function(normalizedModuleName) {
			let moduleObject = moduleOverrides[moduleName];

			// if overriding default export, make sure __useDefault is set
			if (moduleObject.hasOwnProperty('default') && !moduleObject.hasOwnProperty('__useDefault')) {
				moduleObject.__useDefault = true;
			}

			// set module overrides
			newLoader.set(normalizedModuleName, newLoader.newModule(moduleObject));
			resolve();
		});
	});
}

let excludedConfigProps = {
	'_extensions': true,
	'_loader': true,
	'defined': true
};
// Recursively copy a config object
function cloneConfig(obj, isTopLevel) {
	let clone;
	let toString = Object.prototype.toString;
	let hasOwnProperty = Object.prototype.hasOwnProperty;

	if (obj == null || typeof obj !== "object" || obj['isCloned']) {
		return obj;
	}

	if (obj instanceof Array) {
		clone = [];
		for (let i = 0, len = obj.length; i < len; i++) {
			clone[i] = cloneConfig(obj[i]);
		}
		return clone;
	}

	if(obj instanceof Set) {
		clone = new Set();
		obj.forEach(function(item) {
			clone.add(item);
		});
		return clone;
	}

	// instanceof fails to catch objects created with `null` as prototype
	if (obj instanceof Object || toString.call(obj) === "[object Object]") {
		clone = {};
		for (let attr in obj) {
			obj['isCloned'] = true; // prevent infinite recursion
			if (
				hasOwnProperty.call(obj, attr) &&
				typeof Object.getOwnPropertyDescriptor(obj, attr).get !== 'function' // safari/iOS returns true for hasOwnProperty on getter properties in objects
			) {
				if (isTopLevel) {
					// exclude specific props and functions from top-level of config
					if (typeof obj[attr] !== 'function' &&
						!excludedConfigProps[attr]) {
						clone[attr] = cloneConfig(obj[attr]);
					}
				} else {
					clone[attr] = cloneConfig(obj[attr]);
				}
			}
			delete obj['isCloned'];
		}
		return clone;
	}

	throw new Error("Unable to copy obj! Its type isn't supported.");
}

module.exports = function(parentName) {
	let loader = this;
	return {
		'default': function clone(moduleOverrides) {
			let newLoader = loader.clone();
			newLoader.cloned = true;

			// prevent import from being called before module overrides are complete
			let _import = newLoader['import'];
			newLoader['import'] = function() {
				let args = arguments;
				if(this._overridePromises) {
					// call import once all module overrides are complete
					return Promise.all(this._overridePromises).then(function(){
						delete newLoader._overridePromises;
						// ensure parentName is set on import calls
						return _import.call(newLoader, args[0], { name: parentName });
					});
				}
				// ensure parentName is set on import calls
				return _import.call(this, args[0], { name: parentName });
			};

			let _fetch = newLoader.fetch;
			newLoader.fetch = function() {
				let name = arguments[0].name;
				let cached = newLoader._traceData.loads[name];
				if (cached) {
					return Promise.resolve(cached.source);
				}
				return _fetch.apply(this, arguments);
			};

			// copy module config
			let newConfig = cloneConfig(loader, true);
			newLoader.config(newConfig);
			if (newLoader.npmContext) {
				newLoader.npmContext.loader = newLoader;
			}

			// copy module registry
			newLoader.set('@loader', newLoader.newModule({
				'default':newLoader, __useDefault: true
			}));

			// set module overrides
			if (moduleOverrides) {
				newLoader._overridePromises = [];
				for (let moduleOverrideName in moduleOverrides) {
					newLoader._overridePromises.push(
						setModule.call(newLoader, moduleOverrideName, parentName, moduleOverrides)
					);
				}
			}

			return newLoader;
		},
		__useDefault: true
	};
};
