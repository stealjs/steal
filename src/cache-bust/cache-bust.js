// Steal Cache-Bust Extension
// if enabled, Steal Cache-Bust will add a
// cacheKey and cacheVersion to the required file address
addStealExtension(function (loader) {
	var isBuildEnvironment = function() {
		return (loader.isPlatform && loader.isPlatform("build") || loader.isEnv && loader.isEnv("build"))
	};
	var isProduction = function () {
		return (loader.isEnv && loader.isEnv("production"))
	};

	var fetch = loader.fetch,
		timestamp = new Date().getTime();

	loader.fetch = function(load) {
		var loader = this;

		if(!isBuildEnvironment() && loader.cachebust && !loader.cachebust === false) {
			var cacheVersion = isProduction() ? loader.cachebust.version || timestamp : timestamp,
				cacheKey = loader.cachebust.key || "version",
				cacheKeyVersion = cacheKey + "=" + cacheVersion;

			load.address = load.address + (load.address.indexOf('?') === -1 ? '?' : '&') + cacheKeyVersion;
		}
		return fetch.call(this, load);
	};
});