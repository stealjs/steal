// ### TYPES ##
/**
 * @function steal.config.types
 * @parent steal.config
 * 
 * `steal.config("types",types)` registers alternative types. The
 * `types` object is a mapping of a `type path` to 
 * a `type converter`. For example, the following creates a "coffee" type
 * that converts a [CoffeeScript](http://jashkenas.github.com/coffee-script/) 
 * file to JavaScript:
 * 
 *     steal.config("types",{
 *       "coffee js": function(options, success, error){
 *         options.text = CoffeeScript.compile(options.text);
 *         success();
 *       }
 *     });
 * 
 * The __type path__ is a list of the type to a `buildType` (either "js" or "css"). For example,
 * `"coffee js"` means the converter converts from CoffeeScript text to 
 * JavaScript text.
 * 
 * The __type converter__, `converter(options, success, error)`, takes a [steal.Module.options Module options] updates it's text property
 * to contain the text of the `buildType` and calls success. For example:
 * 
 *     steal.config("types", {
 *       "less css": function(options, success, error){
 *         new (less.Parser)({
 *           optimization: less.optimization,
 *           paths: []
 *         }).parse(options.text, function (e, root) {
 *           options.text = root.toCSS();
 *           success();
 *         });
 *       }
 *     });
 * 
 * A __type path__ can specify intermediate types. For example, 
 * 
 *     steal.config("types", {
 * 	     "view js": function(options, sucesss, error){
 * 	        return "steal('can/view/" +options.type)+"',"+
 *                 "function(){ return "+options.text+
 *                 "})" 
 *       },
 *       "ejs view js": function(options, success, error){
 *         return new EJS(options.text).fn
 *       }
 *     });  
 * 
 * ## Create your own type
 * 
 * Here's an example converting files of type .foo to JavaScript.  Foo is a
 * fake language that saves global variables.  A .foo file might
 * look like this:
 *
 *     REQUIRED FOO
 *
 * To define this type, you'd call `steal.config` like:
 *
 *     steal.config("types",{
 *       "foo js": function(options, success, error){
 *         var parts = options.text.split(" ")
 *         options.text = parts[0]+"='"+parts[1]+"'";
 *         success();
 *       }
 *     });
 *
 * The `"foo js"` method is called with the text of .foo files as `options.text`.
 * The method parses the text, and sets the resulting JavaScript 
 * as options.text.
 * 
 */
ConfigManager.prototype.types = function(types){
	var configTypes = this.stealConfig.types || (this.stealConfig.types = {});
	h.each(types, function( type, cb ) {
		var typs = type.split(" ");
		configTypes[typs.shift()] = {
			require: cb,
			convert: typs
		};
	});
};
ConfigManager.prototype.require = function( options, success, error) {
	// add the src option
	// but it is not added to functions
	if(options.idToUri){
		var old = options.src;
		options.src = this.addSuffix( options.idToUri(options.id) );
	}

	// get the type
	var type = this.attr().types[options.type],
		converters;

	// if this has converters, make it get the text first, then pass it to the type
	if ( type.convert.length ) {
		converters = type.convert.slice(0);
		converters.unshift("text", options.type)
	} else {
		converters = [options.type]
	}
	require(options, converters, success, error, this)
}
ConfigManager.prototype.addSuffix = function( str ) {
	var suffix = this.attr('suffix')
	if ( suffix ) {
		str = (str + '').indexOf('?') > -1 ? str + "&" + suffix : str + "?" + suffix;
	}
	return str;
}

// Require function. It will be called recursevly until all 
// converters are ran. After that `success` callback is ran.
// For instance if we're loading the .less file it will first
// run the `text` converter, then `less` converter and finally
// the `fn` converter.
function require(options, converters, success, error, config) {
	var t = converters[0]
	var type = config.attr('types')[converters.shift()];

	type.require(options, function require_continue_check() {
		// if we have more types to convert
		if ( converters.length ) {
			require(options, converters, success, error, config)
		} else { // otherwise this is the final
			success.apply(this, arguments);
		}
	}, error, config)
};




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
ConfigManager.defaults.types = {
	"js": function( options, success, error ) {
		// create a script tag
		var script = h.scriptTag(),
			callback = function() {
				if (!script.readyState || stateCheck.test(script.readyState) ) {
					cleanUp(script);
					success();
				}
			}, errorTimeout;
		// if we have text, just set and insert text
		if ( options.text ) {
			// insert
			script.text = options.text;

		} else {
			var src = options.src; //st.idToUri( options.id );
			// If we're in IE older than IE9 we need to use
			// onreadystatechange to determine when javascript file
			// is loaded. Unfortunately this makes it impossible to
			// call teh error callback, because it will return 
			// loaded or completed for the script even if it 
			// encountered the 404 error
			if(h.useIEShim){
				script.onreadystatechange = function(){
					if (stateCheck.test(script.readyState)) {
						success();
					}
				}
			} else {
				script.onload = callback;
				// error handling doesn't work on firefox on the filesystem
				if ( h.support.error && error && src.protocol !== "file" ) {
					script.onerror = error;
				}
			}

			// listen to loaded
			// IE will change the src property to a full domain.
			// For example, if you set it to 'foo.js', when grabbing src it will be "http://localhost/foo.js".
			// We set the id property so later references to this script will have the same path.
			script.src = script.id = "" + src;
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
	// request text
	"text": function( options, success, error ) {
		h.request(options, function( text ) {
			options.text = text;
			success(text);
		}, error)
	},
	// loads css files and works around IE's 31 sheet limit
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
					lastSheet = h.doc.createStyleSheet(options.src);
					lastSheetOptions = options;
				} else {
					var relative = "" + URI(URI(lastSheetOptions.src).dir()).pathTo(options.src);
					lastSheet.addImport(relative);
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
			link.href = options.src;
			link.type = "text/css";
			h.head().appendChild(link);
		}

		success();
	}
};
