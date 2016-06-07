var addScriptModule = function(loader) {
	// stolen from https://github.com/ModuleLoader/es6-module-loader/blob/master/src/module-tag.js

	function completed() {
		document.removeEventListener( "DOMContentLoaded", completed, false );
		window.removeEventListener( "load", completed, false );
		ready();
	}

	function ready() {
		var scripts = document.getElementsByTagName('script');
		for (var i = 0; i < scripts.length; i++) {
			var script = scripts[i];
			if (script.type == 'text/steal-module') {
				var source = script.innerHTML;
				if(/\S/.test(source)){
					loader.module(source)['catch'](function(err) { setTimeout(function() { throw err; }); });
				}
			}
		}
	}

	loader.loadScriptModules = function(){
		if(isBrowserWithWindow) {
			if (document.readyState === 'complete') {
				setTimeout(ready);
			} else if (document.addEventListener) {
				document.addEventListener('DOMContentLoaded', completed, false);
				window.addEventListener('load', completed, false);
			}
		}

	};
};

if(typeof System !== "undefined") {
	addScriptModule(System);
}