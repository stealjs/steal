Steal.isArray = function( obj ) {
    return Object.prototype.toString.call(obj) === "[object Array]";
},

Steal.isFunction = function( obj ) {
	return toString.call(obj) === "[object Function]";
},

Steal.merge = function( first, second ) {
	var i = first.length, j = 0;

	if ( typeof second.length === "number" ) {
		for ( var l = second.length; j < l; j++ ) {
			first[ i++ ] = second[ j ];
		}
	} else {
		while ( second[j] !== undefined ) {
			first[ i++ ] = second[ j++ ];
		}
	}

	first.length = i;

	return first;
},

Steal.makeArray = function( array, results ) {
	var ret = results || [];

	if ( array != null ) {
		// The window, strings (and functions) also have 'length'
		// The extra typeof function check is to prevent crashes
		// in Safari 2 (See: #3039)
		if ( array.length == null || typeof array === "string" || Steal.isFunction(array) || (typeof array !== "function" && array.setInterval) ) {
			push.call( ret, array );
		} else {
			Steal.merge( ret, array );
		}
	}

	return ret;
}

