/**
 * Steal Script-Module Extension
 *
 * Add a steal-module script to the page and it will run after Steal has been
 * configured, e.g:
 *
 * <script type="text/steal-module">...</script>
 * <script type="steal-module">...</script>
 */
addStealExtension(function(loader) {
	// taken from https://github.com/ModuleLoader/es6-module-loader/blob/master/src/module-tag.js
	function completed() {
		document.removeEventListener("DOMContentLoaded", completed, false);
		window.removeEventListener("load", completed, false);
		ready();
	}

	function ready() {
		var scripts = document.getElementsByTagName("script");
		for (var i = 0; i < scripts.length; i++) {
			var script = scripts[i];
			if (script.type == "steal-module" || script.type == "text/steal-module") {
				var source = script.innerHTML;
				if (/\S/.test(source)) {
					loader.module(source)["catch"](function(err) {
						setTimeout(function() {
							throw err;
						});
					});
				}
			}
		}
	}

	loader.loadScriptModules = function() {
		if (isBrowserWithWindow) {
			if (document.readyState === "complete") {
				setTimeout(ready);
			} else if (document.addEventListener) {
				document.addEventListener("DOMContentLoaded", completed, false);
				window.addEventListener("load", completed, false);
			}
		}
	};
});
