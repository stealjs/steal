addStealExtension(function addPrettyName(loader){
	loader.prettyName = function(load){
		var pnm = load.metadata.parsedModuleName;
		if(pnm) {
			return pnm.packageName + "/" + pnm.modulePath;
		}
		return load.name;
	};
});
