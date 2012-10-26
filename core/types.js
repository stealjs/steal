// ### TYPES ##
var types = stealConfiguration().types;
/**
 * Registers a type.  You define the type of the file, the basic type it
 * converts to, and a conversion function where you convert the original file
 * to JS or CSS.  This is modeled after the
 * [http://api.jquery.com/extending-ajax/#Converters AJAX converters] in jQuery.
 *
 * Types are designed to make it simple to switch between steal's development
 * and production modes.  In development mode, the types are converted
 * in the browser to allow devs to see changes as they work.  When the app is
 * built, these converter functions are run by the build process,
 * and the processed text is inserted into the production script, optimized for
 * performance.
 *
 * Here's an example converting files of type .foo to JavaScript.  Foo is a
 * fake language that saves global variables defined like.  A .foo file might
 * look like this:
 *
 *     REQUIRED FOO
 *
 * To define this type, you'd call st.type like this:
 *
 *     st.type("foo js", function(options, original, success, error){
 *       var parts = options.text.split(" ")
 *       options.text = parts[0]+"='"+parts[1]+"'";
 *       success();
 *     });
 *
 * The method we provide is called with the text of .foo files in options.text.
 * We parse the file, create JavaScript and put it in options.text.  Couldn't
 * be simpler.
 *
 * Here's an example,
 * converting [http://jashkenas.github.com/coffee-script/ coffeescript]
 * to JavaScript:
 *
 *     st.type("coffee js", function(options, original, success, error){
 *       options.text = CoffeeScript.compile(options.text);
 *       success();
 *     });
 *
 * In this example, any time steal encounters a file with extension .coffee,
 * it will call the given converter method.  CoffeeScript.compile takes the
 * text of the file, converts it from coffeescript to javascript, and saves
 * the JavaScript text in options.text.
 *
 * Similarly, languages on top of CSS, like [http://lesscss.org/ LESS], can
 * be converted to CSS:
 *
 *     st.type("less css", function(options, original, success, error){
 *       new (less.Parser)({
 *         optimization: less.optimization,
 *         paths: []
 *       }).parse(options.text, function (e, root) {
 *         options.text = root.toCSS();
 *         success();
 *       });
 *     });
 *
 * This simple type system could be used to convert any file type to be used
 * in your JavaScript app.  For example, [http://fdik.org/yml/ yml] could be
 * used for configuration.  jQueryMX uses st.type to support JS templates,
 * such as EJS, TMPL, and others.
 *
 * @param {String} type A string that defines the new type being defined and
 * the type being converted to, separated by a space, like "coffee js".
 *
 * There can be more than two steps used in conversion, such as "ejs view js".
 * This will define a method that converts .ejs files to .view files.  There
 * should be another converter for "view js" that makes this final conversion
 * to JS.
 *
 * @param {Function} cb( options, original, success, error ) a callback
 * function that converts the new file type to a basic type.  This method
 * needs to do two things: 1) save the text of the converted file in
 * options.text and 2) call success() when the conversion is done (it can work
 * asynchronously).
 *
 * - __options__ - the steal options for this file, including path information
 * - __original__ - the original argument passed to steal, which might be a
 *   path or a function
 * - __success__ - a method to call when the file is converted and processed
 *   successfully
 * - __error__ - a method called if the conversion fails or the file doesn't
 *   exist
 */
stealConfiguration.types = function(types){
	h.each(types, st.type)
};




st.
/**
 * Called for every file that is loaded.  It sets up a string of methods called
 * for each type in the conversion chain and calls each type one by one.
 *
 * For example, if the file is a coffeescript file, here's what happens:
 *
 *   - The "text" type converter is called first.  This will perform an AJAX
 *   request for the file and save it in options.text.
 *   - Then the coffee type converter is called (the user provided method).
 *   This converts the text from coffeescript to JavaScript.
 *   - Finally the "js" type converter is called, which inserts the JavaScript
 *   in the page as a script tag that is executed.
 *
 * @param {Object} options the steal options for this file, including path information
 * @param {Function} success a method to call when the file is converted and processed successfully
 * @param {Function} error a method called if the conversion fails or the file doesn't exist
 */
require = function( options, success, error ) {
	// add the src option
	options.src = options.idToUri ? options.idToUri(options.id) : st.idToUri(options.id);

	// get the type
	var type = types[options.type],
		converters;

	// if this has converters, make it get the text first, then pass it to the type
	if ( type.convert.length ) {
		converters = type.convert.slice(0);
		converters.unshift("text", options.type)
	} else {
		converters = [options.type]
	}
	require(options, converters, success, error)
};

function require(options, converters, success, error) {

	var type = types[converters.shift()];

	type.require(options, function require_continue_check() {
		// if we have more types to convert
		if ( converters.length ) {
			require(options, converters, success, error)
		} else { // otherwise this is the final
			success.apply(this, arguments);
		}
	}, error)
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
stealConfiguration({
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
				var src = options.src; //st.idToUri( options.id );
				if(script.readyState){
					script.event = "onclick";
					script.id = script.htmlFor = "ie-" + h.uuid();
					script.onreadystatechange = function(){
						if (stateCheck.test(script.readyState)  ) {
							if(script.onclick){
								var scriptText = script.onclick + "";
								scriptText = scriptText.slice(scriptText.indexOf('{') + 1, -1);
								eval(scriptText);
								success();
							} else {
								error();
							}
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
			h.request(options, function( text ) {
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