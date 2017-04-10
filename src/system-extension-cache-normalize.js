addStealExtension(function(loader){
	loader._normalizeCache = Object.create(null);

	loader._addCacheNormalize = function(normalize){
		loader.normalize = function(name, parentName){
			var cacheName = name + "+" + (parentName || "@none");
			var cache = this._normalizeCache;

			if(cacheName in cache) {
				var moduleName = cache[cacheName];
				if(moduleName in this._loader.modules) {
					return moduleName;
				}
			}

			return Promise.resolve(normalize.apply(this, arguments))
			.then(function(normalizedName) {
				cache[cacheName] = normalizedName;
				return normalizedName;
			})
		};
	};
});
