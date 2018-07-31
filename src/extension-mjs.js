addStealExtension(function(loader){
	var mjsExp = /\.mjs$/;
	var jsExp = /\.js$/;

	var locate = loader.locate;
	loader.locate = function(load){
		var isMJS = mjsExp.test(load.name);
		var p = locate.apply(this, arguments);

		if(isMJS) {
			return Promise.resolve(p).then(function(address) {
				if(jsExp.test(address)) {
					return address.substr(0, address.length - 3);
				}
				return address;
			});
		}

		return p;
	};
});
