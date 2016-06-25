
function addScopedMeta(loader) {
	loader._extensions.push(addScopedMeta);

	var KEY = function(a, b) { return a + ":" + (b || ""); };

	loader._scopedMetaLookup = {};
	loader._scopedMetaNameToKeys = {};

	loader.addScopedMeta = function(name, parentName, metaKey, metaValue){
		var key = KEY(name, parentName);
		this._scopedMetaLookup[key] = [metaKey, metaValue];
	};

	var normalize = loader.normalize;
	loader.normalize = function(name, parentName){
		var p = normalize.apply(this, arguments);

		var key = KEY(name, parentName);

		if(this._scopedMetaNameToKeys[parentName] &&
		  !this._scopedMetaLookup[key]) {
			var parentKey = this._scopedMetaNameToKeys[parentName][0];
			var data = this._scopedMetaLookup[parentKey];
			this.addScopedMeta(name, parentName, data[0], data[1]);
		}

		if(this._scopedMetaLookup[key]) {
			var loader = this;
			return p.then(function(moduleName){
				//
				var keys = loader._scopedMetaNameToKeys[moduleName];
				if(!keys) {
					keys = loader._scopedMetaNameToKeys[moduleName] = [];
				}
				if(keys.indexOf(key) === -1) {
					keys.push(key);
				}

				return moduleName;
			});
		}

		return p;
	};

	var locate = loader.locate;
	loader.locate = function(load){
		var name = load.name;

		// Apply meta configuration values
		var keys = this._scopedMetaNameToKeys[name];
		if(keys) {
			var key, arr;
			for(var i = 0, len = keys.length; i < len; i++) {
				key = keys[i];
				arr = this._scopedMetaLookup[key];
				load.metadata[arr[0]] = arr[1];
			}
		}

		return locate.apply(this, arguments);
	};
}

if(typeof System !== "undefined") {
	addScopedMeta(System);
}
