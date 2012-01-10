(function( window, steal, undefined ) {

	// Grab helper functions off of steal
	var each			= steal.each,
		extend			= steal.extend,
		isString		= steal.isString,
		isFunction		= steal.isFn,
		isObject		= steal.isObject,
		URI				= steal.URI,
		error			= steal.error,
		isEmptyObject	= function( o ) {
			for ( var name in o ) {
				return false;
			}
			return true;
		},
		indexOf			= function( arr, item ) {
			for ( var i = 0, len = arr.length; i < len; i++ ) {
				if ( arr[i] == item ) {
					return i;
				}
			}
			return -1;
		},
		map				= function( arr, callback ) {
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
		modules			= {},
		// Array to store what's current being required to track circular
		// dependencies
		requiring		= [],
		getUnmet		= function( needs ) {
			return map( needs || [], function( id ) {
				if (	id != "exports" && 
						id != "module"  && 
						indexOf( requiring, id ) < 0 ) {
					if ( ! modules[ id ] ) {
						return id;
					} else {
						return false;
					}
				} else {
					return false;
				}
			});
		},
		getArgs			= function ( needs ) {
			return map( needs || [], function( id ) {
				if ( isString( id )) {
					if ( indexOf( requiring, id ) > -1 ) {
						return undefined;
					} else {
						return modules[ id ];
					}
				} else {
					return id;
				}
			});
		},
		resolveUris		= (function(){
			var parts = window.location.pathname.split("/"),
				currentPage;
			parts.pop();
			currentPage = parts.join("/");

			return function( unmet ) {
				return map( unmet, function( uri ) {
					return currentPage + "/" + uri + ".js";
				});
			}
		}());
	
	// Add globals to the window
	extend( window, {

		// cases to handle:
		// define ("foo", ["bar", "lol", "wat"], function() {});
		// define ("foo", ["bar", "lol", "wat"], {});
		define: function( id, dependencies, factory ) {

			var resolveCallback = function() {
				console.log( "define callback", arguments, this );
					var exports = {},
						module = {},	
						definition, args, key;
					
					if ( dependencies ) {
						each( dependencies, function( i, id ) {
							if ( id === "module" ) {
								dependencies.splice( i, 1, module );
							}
							if ( id === "exports" ) {
								dependencies.splice( i, 1, exports );
							}
						});
					}
					args = getArgs( dependencies );

					definition = isFunction( factory ) ? 
						factory.apply( window, args ) : 
						factory;

					if ( id ) {
						if ( ! isEmptyObject( exports )) {
							modules[ id ] = exports;
						} else if ( ! isEmptyObject( module )) {
							modules[ id ] = module;
						} else {
							modules[ id ] = definition;
						}
						modules[ id ].module = {
							id : id
						}
					} else {
						extend( modules, definition );
					}
				},
				unmet;

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

			unmet = getUnmet( dependencies );
			if ( unmet.length ) {
				require.call( window, unmet, resolveCallback );
			} else {
				resolveCallback();
			}
		},

		require: function( needs, callback ) {

			var resolveCallback = function() {
				console.log( "require callback", arguments, this );
					each( unmet, function( i, id ) {
						requiring.splice( indexOf( requiring, id ), 1);
					});
					callback.apply( window, getArgs( needs ));
				},
				unmet;

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
					requiring.push.apply( requiring, unmet );
					steal
						.apply( steal, resolveUris( unmet ))
						.then( resolveCallback );
				} else {
					resolveCallback();
				}
			}

		}

	});

	extend( window.define, {
		amd : {}
	});

	modules.require = window.require;

}( window, steal ));
