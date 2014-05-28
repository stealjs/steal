
	// System.ext = {bar: "path/to/bar"}
	// foo.bar! -> foo.bar!path/to/bar
	var addExt = function(loader) {
		loader.ext = {};
		
		var normalize = loader.normalize,
			endingExtension = /\.(\w+)!$/;
			
		loader.normalize = function(name, parentName, parentAddress){
			var matches = name.match(endingExtension),
				ext;
			
			if(matches && loader.ext[ext = matches[1]]) {
				name = name + loader.ext[ext];
			}
			return normalize.call(this, name, parentName, parentAddress);
		};
	};

	if(typeof System){
		addExt(System);
	}
	
