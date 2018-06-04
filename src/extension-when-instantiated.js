addStealExtension(function(loader) {
	function Deferred() {
		var dfd = this;
		this.promise = new Promise(function(resolve, reject){
			dfd.resolve = resolve;
			dfd.reject = reject;
		});
	}

	loader.instantiatePromises = Object.create(null);
	loader.whenInstantiated = function(name) {
		// Should this always override?
		var dfd = new Deferred();
		this.instantiatePromises[name] = dfd;
		return dfd.promise;
	};
})
