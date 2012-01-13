(function( window, steal, undefined ) {

	var extend			= steal.extend,
		each			= steal.each,
		isGecko			= "MozAppearance" in document.documentElement.style,
		URI				= steal.URI,
		preloadScript	= function( src, callback ) {
			var deferred = preloading[ src ] || new Deferred(),
				complete = function() {
					delete preloading[src];
					setTimeout(function() {
						deferred.resolve( src );
					}, 0);
				};
			if ( ! ( src in preloading )) {
				preloading[ src ] = deferred;
				if ( isGecko ) {
					steal.request({
						src: src
					}, complete );
				} else {
					elem = document.createElement("img");
					elem.onload = elem.onerror = complete;
					elem.src = src;
				}
			}
			return deferred;
		},
		map = function( arr, callback ) {
			var result = [];
			each( arr, function( i, v ) {
				var temp = callback.call( arr, v, i, arr );
				if ( temp !== false ) {
					result.push( temp );
				}
			});
			return result;
		},
		resolveUris = function( srcs ) {
			return map( srcs, function( src ) {
				return "" + URI.root().join(  URI( src ).addJS().normalize() );
			});
		},
		preloading = {},
		Deferred = steal.Deferred,
		origLoad = steal.p.load;

	extend( steal, {
		preload: function() {
			var deferred	= new Deferred();
			Deferred
				.when.apply( Deferred, map( resolveUris( arguments ), preloadScript ))
				.done(function() {
					deferred.resolve.apply( deferred, arguments );
				});
			return deferred;
		}
	});

	extend(steal.p, {
		/**
		 * This clobbers the original steal.load function to make sure we don't
		 * load something twice.
		 */
		load: function( returnScript ) {
			var self = this,
				src;
			if ( self.options && self.options.buildType !== "fn" ) {
				src = "" + self.options.src;
				if ( src in preloading ) {
					preloading[ src ].done(function() {
						self.loading = true;
						self.loaded.resolve();
					});
				} else {
					origLoad.apply( self, arguments );
				}
			} else {
				origLoad.apply( self, arguments );
			}
		}
	});

}( window, steal ));
