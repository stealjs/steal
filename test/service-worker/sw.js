steal = {
	configMain: "@empty",
	main: "@empty",
	map: {
		"@dev": "@empty"
	}
};

importScripts('../../steal.js');

self.onmessage = function(event){
	steal.import("dep").then(function(dep){
		if(event.source) {
			event.source.postMessage(dep);
		}
	});
};
