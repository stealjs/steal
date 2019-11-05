/**
 * Auto-main warning. The main is no longer automatically loaded in development.
 * This warns the user in cases where they likely forgot to set a main.
 **/
addStealExtension(function addNoMainWarn(loader) {
	loader._warnNoMain = function(ms){
		var loader = this;
		this._noMainTimeoutId = setTimeout(function(){
			var msg = "No modules have loaded, did you forget to include a 'main'?" +
				"\nSee https://stealjs.com/docs/config.main.html for more information.";
			console.warn(msg);
			loader.import = loaderImport;
		}, ms);
	};

	var whitelist = {
		"package.json!npm": true,
		"npm": true,
		"@empty": true,
		"@dev": true,
		"babel": true
	};

	var loaderImport = loader.import;
	loader.import = function(name) {
		if(whitelist[name] === undefined && name !== this.configMain) {
			this.import = loaderImport;
			this._warnNoMain = Function.prototype;
			clearTimeout(this._noMainTimeoutId);
		}

		return loaderImport.apply(this, arguments);
	};

	var loaderModule = loader.module;
	loader.module = function() {
		var p = loaderModule.apply(this, arguments);
		this.module = loaderModule;
		clearTimeout(this._noMainTimeoutId);
		return p;
	};
});
