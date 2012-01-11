(function( window, steal, undefined ) {

	var extend			= steal.extend,
		each			= steal.each,
		isGecko			= "MozAppearance" in document.documentElement.style,
		URI				= steal.URI,
		preloadScript	= function( src, callback ) {
			var deferred = new Deferred(),
				complete = function() {
					deferred.resolve( src );
				};
			if ( isGecko ) {
				steal.request({
					src: src
				}, complete );
			} else {
				elem = new Image();
				elem.onload = elem.onerror = complete;
				elem.src = src;
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
				var uri = URI( src );
				return uri.ext() ?
					src : 
					uri.path + "/" + uri.path + ".js" + "?" + uri.query;
			});
		},
		Deferred = steal.Deferred;

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

}( window, steal ));
