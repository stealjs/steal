(function( window, steal, undefined ) {

	// Grab helper functions off of steal
	var each		= steal.each,
		extend		= steal.extend,
		isString	= steal.isString,
		isFunction	= steal.isFn,
		isObject	= steal.isObject,
		URI			= steal.URI,
		error		= steal.error,
		map			= function( arr, callback ) {
			var results = [];
			each( arr, function( i, value ) {
				var temp = callback.call( arr, value, i, arr );
				if ( temp !== false ) {
					results.push( temp );
				}
			});
			return results;
		},

		// Key-value store for modules
		modules		= {},
		getUnmet	= function( needs ) {
			return map( needs, function( id ) {
				return modules[ id ] ? false : id;
			});
		},
		getArgs		= function ( needs ) {
			return map( needs, function( id ) {
				return modules[ id ];
			});
		},
		resolveUris = function( unmet ) {
			return map( unmet, function( uri ) {
				return "./" + uri + "/" + uri + ".js";
			});
		};
	
	// Add globals to the window
	extend( window, {

		// cases to handle:
		// define ("foo", ["bar", "lol", "wat"], function() {});
		// define ("foo", ["bar", "lol", "wat"], {});
		define: function( id, dependencies, factory ) {

			var definition;

			if ( id && dependencies && ! factory ) {
				
				// define ("foo", function() {});
				// define ("foo", {});
				if ( isString( id ) ) {
					factory = dependencies;
					dependencies = undefined;

				// define (["bar", "lol", "wat"], function() {});
				// define (["bar", "lol", "wat"], {});
				} else {
					factory = dependencies;
					dependencies = id;
				}

			// define (function() {});
			// define ({});
			} else if ( id && ! dependencies && ! factory ) {
				factory = id;
				id = undefined;
			}

			definition = isFunction( factory ) ? factory() : factory;

			if ( id ) {
				modules[ id ] = definition;
			} else {
				extend( modules, definition );
			}

		},

		require: function( needs, callback ) {

			var unmet, callbackArgs;

			// Synchronous call
			if ( isString( needs )) {
				if ( modules[ needs ] ) {
					return modules[ needs ];
				} else {
					error( "Synchronous require: no module definition " + 
						"exists for " + needs );
				}

			// Asynchronous
			} else {

				unmet = getUnmet( needs );

				if ( unmet.length ) {
					steal.apply( steal, resolveUris( unmet )).then(function() {
						callback.apply( window, getArgs( needs ));
					});
				} else {
					callback.apply( window, getArgs( needs ));
				}
			}

		}

	});

	extend( window.define, {
		amd : {}
	});


}( window, steal ));
