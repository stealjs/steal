// Steal Env Extension
// adds some special environment functions to the loader
addStealExtension(function (loader) {

	loader.getEnv = function(){
		var envParts = (this.env || "").split("-");
		// Fallback to this.env for legacy
		return envParts[1] || this.env;
	};

	loader.getPlatform = function(){
		var envParts = (this.env || "").split("-");
		return envParts.length === 2 ? envParts[0] : undefined;
	};

	loader.isEnv = function(name){
		return this.getEnv() === name;
	};

	loader.isPlatform = function(name){
		return this.getPlatform() === name;
	};
});