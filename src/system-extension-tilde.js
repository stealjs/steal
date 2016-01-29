var addTilde = function(loader){

	/**
	 * @hide
	 * @function normalizeAndLocate
	 * @description Run a tilded moduleName through Normalize and Locate hooks.
	 * @param {String} moduleName The module to run through normalize and locate.
	 * @return {Promise} A promise to resolve when the address is found.
	 */
	var normalizeAndLocate = function(moduleName, parentName){
		var loader = this;
		return Promise.resolve(loader.normalize(moduleName, parentName))
			.then(function(name){
				return loader.locate({name: name, metadata: {}});
			}).then(function(address){
				if(address.substr(address.length - 3) === ".js") {
					address = address.substr(0, address.length - 3);
				}
				return address;
			});
	};
	
	var quotes = /["']/;
	var LOCATE_MACRO = function(source) {
			var locations = [];
			source.replace(/LOCATE\(([^\)]+)\)/g, function(whole, part, index){
				// trim in IE8
				var name = part.replace(/^\s+|\s+$/g, ''),
					first = name.charAt(0),
					quote;
				if( quotes.test(first) ) {
					quote = first;
					name = name.substr(1, name.length -2); 
				}
				locations.push({
					start: index,
					end: index+whole.length,
					name: name,
					replace: function(address){
						return quote ? quote + address + quote : address;
					}
				});
			});
			return locations;
		}; 

	var translate = loader.translate;
	loader.translate = function(load){
		var loader = this;

		// This only applies to plugin resources.
		if(!load.metadata.plugin) {
			return translate.call(this, load);
		}

		// Get the translator RegExp if this is a supported type.
		var locateMacro = load.metadata.plugin.locateMacro;

		if(!locateMacro) {
			return translate.call(this, load);
		}
		if(locateMacro === true) {
			locateMacro = LOCATE_MACRO;
		}

		// Gets an array of moduleNames like ~/foo
		var locations = locateMacro(load.source);
		
		if(!locations.length) {
			return translate.call(this, load);
		}

		// This load is a supported type and there are ~/ being used, so get
		// normalize and locate all of the modules found and then replace those
		// instances in the source.
		var promises = [];
		for(var i = 0, len = locations.length; i < len; i++) {
			promises.push(
				normalizeAndLocate.call(this, locations[i].name, load.name)
			);
		}
		return Promise.all(promises).then(function(addresses){
			for(var i = locations.length - 1; i >= 0; i--) {
				// Replace the tilde names with the fully located address
				load.source = load.source.substr(0, locations[i].start)+
								locations[i].replace(addresses[i])+
								load.source.substr(locations[i].end, load.source.length);

			}
			return translate.call(loader, load);
		});
	};
};

if(typeof System !== "undefined") {
	addTilde(System);
}
