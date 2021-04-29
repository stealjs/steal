// This extension allows you to define metadata that should appear on
// Any subdependencies. For example we can add the { foo: true } bool
// to a module's metadata, and it will be forwarded to any subdependency.
addStealExtension(function forwardMetadata(loader){
	loader._forwardedMetadata = {};
	loader.setForwardedMetadata = function(prop) {
		loader._forwardedMetadata[prop] = true;
	};

	loader.forwardMetadata = function(load, parentName) {
		  if(parentName) {
			  var parentLoad = this.getModuleLoad(parentName);

			  if(parentLoad) {
				  // TODO use Object.assign instead?
				  for(var p in this._forwardedMetadata) {
					  if(p in parentLoad.metadata) {
						  load.metadata[p] = parentLoad.metadata[p];
					  }
				  }
			  }
		  }
	};
});
