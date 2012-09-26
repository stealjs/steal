// =============================== TYPES ===============================
// a clean up script that prevents memory leaks and removes the
// script
var cleanUp = function( elem ) {
	elem.onreadystatechange = elem.onload = elem.onerror = null;

	setTimeout(function() {
		h.head().removeChild(elem);
	}, 1);
},
	// the last inserted script, needed for IE
	lastInserted,
	// if the state is done
	stateCheck = /^loade|c|u/;


var cssCount = 0,
	createSheet = h.doc && h.doc.createStyleSheet,
	lastSheet, lastSheetOptions;

// Apply all the basic types
steal.config({
	types:{
		"js": function( options, success, error ) {
			// create a script tag
			var script = h.scriptTag(),
				callback = function() {
					if (!script.readyState || stateCheck.test(script.readyState) ) {
						cleanUp(script);
						success();
					}
				};

			// if we have text, just set and insert text
			if ( options.text ) {
				// insert
				script.text = options.text;

			} else {

				// listen to loaded
				script.onload = script.onreadystatechange = callback;

				var src = options.src; //steal.idToUri( options.id );
				// error handling doesn't work on firefox on the filesystem
				if ( h.support.error && error && src.protocol !== "file" ) {
					script.onerror = error;
				}
				script.src = "" + src;
				//script.src = options.src = addSuffix(options.src);
				//script.async = false;
				script.onSuccess = success;
			}

			// insert the script
			lastInserted = script;
			h.head().insertBefore(script, h.head().firstChild);

			// if text, just call success right away, and clean up
			if ( options.text ) {
				callback();
			}
		},
		"fn": function( options, success ) {
			var ret;
			if (!options.skipCallbacks ) {
				ret = options.fn();
			}
			success(ret);
		},
		"text": function( options, success, error ) {
			steal.request(options, function( text ) {
				options.text = text;
				success(text);
			}, error)
		},
		"css": function( options, success, error ) {
			if ( options.text ) { // less
				var css = h.createElement("style");
				css.type = "text/css";
				if ( css.styleSheet ) { // IE
					css.styleSheet.cssText = options.text;
				} else {
					(function( node ) {
						if ( css.childNodes.length ) {
							if ( css.firstChild.nodeValue !== node.nodeValue ) {
								css.replaceChild(node, css.firstChild);
							}
						} else {
							css.appendChild(node);
						}
					})(h.doc.createTextNode(options.text));
				}
				h.head().appendChild(css);
			} else {
				if ( createSheet ) {
					// IE has a 31 sheet and 31 import per sheet limit
					if (!cssCount++ ) {
						lastSheet = h.doc.createStyleSheet(h.addSuffix(options.src));
						lastSheetOptions = options;
					} else {
						var relative = "" + URI(URI(lastSheetOptions.src).dir()).pathTo(options.src);
						lastSheet.addImport(h.addSuffix(relative));
						if ( cssCount == 30 ) {
							cssCount = 0;
						}
					}
					success();
					return;
				}

				options = options || {};
				var link = h.createElement("link");
				link.rel = options.rel || "stylesheet";
				link.href = h.addSuffix(options.src);
				link.type = "text/css";
				h.head().appendChild(link);
			}

			success();
		}
	}
});