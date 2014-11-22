var cloneLoader = System.clone();
cloneLoader.packages = {};
cloneLoader.paths = {};

var getBowerJSON = function(address){
	return cloneLoader.fetch({
		address: address,
		metadata: {}
	}).then(function(bowerJson){
		return JSON.parse(bowerJson);
	});
};

function withoutJs(name) {
	var len = name.length;
	if(name.substr(len - 3) === ".js") {
		return name.substr(0, len - 3);
	}
	return name;
}

function applyPackageConfig(package, bowerAddress, bowerPath) {
	var loader = this;
	var packageName = typeof package === "string" ? package : null;
	var promise = packageName ? getBowerJSON(bowerAddress) : Promise.resolve(package);

	return promise.then(function(bower) {
		var main = bower.main;
		if(packageName && main) {
			main = typeof main === "string" ? main : main[0];

			if(!loader.paths[packageName] && !loader.packages[packageName]) {
				cloneLoader.paths[packageName + "/*"] = bowerPath + "/" + packageName + "/*.js";
				cloneLoader.packages[packageName] = {
					main: withoutJs(main)
				};
			}
		}

		var deps = bower.dependencies || {},
			depPromises = [],
			depAddress;
		for(var depName in deps) {
			depAddress = bowerPath + "/" + depName + "/bower.json";
			depPromises.push(
				applyPackageConfig.call(loader, depName, depAddress, bowerPath)
			);
		}

		return Promise.all(depPromises);
	});
}

exports.locate = function(load){
	var loader = this;

	return loader.locate({
		name: loader.bower.config,
	}).then(function(address){
		return address.substr(0, address.length - 3);
	});
};

exports.translate = function(load){
	var bower = JSON.parse(load.source);
	var bowerPath = this.bower.dependencies;
	return applyPackageConfig.call(this, bower, null, bowerPath)
		.then(function(){
			var config = {
				paths: cloneLoader.paths,
				packages: cloneLoader.packages
			};
			return "define([], function(){\nSystem.config(" +
				JSON.stringify(config, null, ' ') + ");\n});";
		});
};
