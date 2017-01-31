// Steal Cache-Bust Extension
// if enabled, Steal Cache-Bust will add a
// cacheKey and cacheVersion to the required file address
addStealExtension(function (loader) {
	var fetch = loader.fetch;

	loader.fetch = function(load) {
		var loader = this;

		if(loader.isEnv("production") && loader.cacheVersion) {
			var cacheVersion = loader.cacheVersion,
				cacheKey = loader.cacheKey || "version",
				cacheKeyVersion = cacheKey + "=" + cacheVersion;

			load.address = load.address + (load.address.indexOf('?') === -1 ? '?' : '&') + cacheKeyVersion;
		}
		return fetch.call(this, load);
	};
});