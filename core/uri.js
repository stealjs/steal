// ## URI ##
/**
 * @class steal.URI
 * @parent steal
 * 
 * A URL / URI helper for getting information from a URL.
 * 
 *     var uri = URI( "http://stealjs.com/index.html" )
 *     uri.path //-> "/index.html"
 */

var URI = function( url ) {
	if ( this.constructor !== URI ) {
		return new URI(url);
	}
	h.extend(this, URI.parse("" + url));
};
// the current url (relative to root, which is relative from page)
// normalize joins from this
//
h.extend(URI, {
	// parses a URI into it's basic parts
	parse: function( string ) {
		/**
		 * @prototype
		 */
		var uriParts = string.split("?"),
			uri = uriParts.shift(),
			queryParts = uriParts.join("").split("#"),
			protoParts = uri.split("://"),
			parts = {
				/**
				 * @property query
				 * 
				 * The query part of the url. Everything after the `?`, but before
				 * the `#`.
				 * 
				 *     var uri = URI("/foo?bar#zed")
				 *     uri.query //-> bar
				 * 
				 */
				query: queryParts.shift(),
				/**
				 * @property fragment
				 * 
				 *     var uri = URI("/foo?bar#zed")
				 *     uri.query //-> zed
				 * 
				 */
				fragment: queryParts.join("#")
			},
			pathParts;

		if ( protoParts[1] ) {
			/**
			 * @property protocol
			 */
			parts.protocol = protoParts.shift();
			pathParts = protoParts[0].split("/");
			/**
			 * @property host
			 */
			parts.host = pathParts.shift();
			/**
			 * @property path
			 */
			parts.path = "/" + pathParts.join("/");
		} else {
			parts.path = protoParts[0];
		}
		return parts;
	}
});
/**
 * @static
 */
//
/**
 * @property page
 * The location of the page as a URI.
 * 
 *     st.URI.page.protocol //-> "http"
 */
URI.page = URI(h.win.location && location.href);
/**
 * @property cur
 * 
 * The current working directory / path.  Anything
 * loaded relative will be loaded relative to this.
 */
URI.cur = URI();

/**
 * @prototype
 */
h.extend(URI.prototype, {
	/**
	 * @function
	 * @signature `dir()`
	 * Returns everything before the last `/` as a URI.
	 * 
	 * @return {steal.URI}
	 */
	dir: function() {
		var parts = this.path.split("/");
		parts.pop();
		return URI(this.domain() + parts.join("/"))
	},
	/**
	 * @function
	 * @signature `filename()`
	 * Returns everything after the last `/` as a String.
	 * 
	 * @return {String}
	 */
	filename: function() {
		return this.path.split("/").pop();
	},
	/**
	 * @function
	 * 
	 * @signature `ext()`
	 * returns everything after the last `.`.
	 * 
	 * @return {String}
	 */
	ext: function() {
		var filename = this.filename();
		return (filename.indexOf(".") > -1) ? filename.split(".").pop() : "";
	},
	/**
	 * @function
	 * 
	 * @signature `domain()`
	 * Returns the protocol and host of the domain.
	 * 
	 * return {String}
	 */
	domain: function() {
		return this.protocol ? this.protocol + "://" + this.host : "";
	},
	/**
	 * @function
	 * 
	 * @signature `isCrossDomain([referenceUri])`
	 * Returns if a URI is cross domain.  
	 * 
	 *     var abc = URI("http://abc.com")
	 *     abc.isCrossDomain() // -> true
	 *     abc.isCrossDomain( "http://abc.com/foo" ) //-> false
	 * 
	 * @param {steal.URI} [referenceUri] An optional uri to use
	 * as the reference to return if the uri is cross domain from.
	 */
	isCrossDomain: function( referenceUri ) {
		referenceUri = URI(referenceUri || h.win.location.href);
		var domain = this.domain(),
			uriDomain = referenceUri.domain()
			return (domain && uriDomain && domain != uriDomain) || this.protocol === "file" || (domain && !uriDomain);
	},
	/**
	 * @function
	 * 
	 * @signature `isRelativeToDomain()`
	 * Returns if the uri begins with `/`.
	 * 
	 * @return {Boolean}
	 */
	isRelativeToDomain: function() {
		return !this.path.indexOf("/");
	},
	/**
	 * @function
	 * 
	 * @signature `hash()`
	 * Returns the URI's [steal.URI::fragment fragment] with 
	 * `"#"` preceeding it.
	 * 
	 * return {String}
	 */
	hash: function() {
		return this.fragment ? "#" + this.fragment : ""
	},
	/**
	 * @function
	 * 
	 * @signature `search()`
	 * Returns the URI's [steal.URI::query query] with
	 * `"?"` preceeding it.
	 * 
	 * @return {String}
	 */
	search: function() {
		return this.query ? "?" + this.query : ""
	},
	// like join, but returns a string
	add: function( uri ) {
		return this.join(uri) + '';
	},
	/**
	 * @function
	 * @signature `join(rightUri)`
	 * Joins two uris together and return
	 * the result as a new URI.
	 * 
	 *     var left = URI("/a/starting/place")
	 *     var res = left.join("../../better/location")
	 *     res //-> URI("a/better/location")
	 * 
	 */
	join: function( uri, min ) {
		uri = URI(uri);
		if ( uri.isCrossDomain(this) ) {
			return uri;
		}
		if ( uri.isRelativeToDomain() ) {
			return URI(this.domain() + uri)
		}
		// at this point we either
		// - have the same domain
		// - this has a domain but uri does not
		// - both don't have domains
		var left = this.path ? this.path.split("/") : [],
			right = uri.path.split("/"),
			part = right[0];
		//if we are joining from a folder like cookbook/, remove the last empty part
		if ( this.path.match(/\/$/) ) {
			left.pop();
		}
		while ( part == ".." && left.length && left[left.length-1] !== "..") {
			// if we've emptied out, folders, just break
			// leaving any additional ../s
			if (!left.pop() ) {
				break;
			}
			right.shift();

			part = right[0];
		}
		return h.extend(URI(this.domain() + left.concat(right).join("/")), {
			query: uri.query
		});
	},
	/**
	 * @function
	 * For a given path, a given working directory, and file location, update the
	 * path so it points to a location relative to steal's root.
	 *
	 * We want everything relative to steal's root so the same app can work in
	 * multiple pages.
	 *
	 *     ./files/a.js = steals a.js
	 *     ./files/a = a/a.js
	 *     files/a = //files/a/a.js
	 *     files/a.js = loads //files/a.js
	 */
	normalize: function( cur ) {
		cur = cur ? cur.dir() : URI.cur.dir();
		var path = this.path,
			res = URI(path);
		//if path is rooted from steal's root (DEPRECATED)
		if (!path.indexOf("//") ) {
			res = URI(path.substr(2));
		} else if (!path.indexOf("./") ) { // should be relative
			res = cur.join(path.substr(2));
		}
		// only if we start with ./ or have a /foo should we join from cur
		else if ( this.isRelative() ) {
			res = cur.join(this.domain() + path)
		}
		res.query = this.query;
		return res;
	},
	/**
	 * @function
	 * @signature `isRelative()`
	 * Returns if the path starts with `.` or `/`.
	 * 
	 * @return {Boolean}
	 */
	isRelative: function() {
		return /^[\.|\/]/.test(this.path)
	},
	// a min path from 2 urls that share the same domain
	/**
	 * @function
	 * @signature `pathTo(relativeURI)`
	 * Returns a relative
	 * path from `uri` to `relativeURI`
	 * 
	 *     steal.URI("app/controls/recipe.js")
	 *        .pathTo("app/models/recipe.js")
	 *     // -> ../../models/recipe.js
	 *     
	 *     steal.URI("foo/bar")
	 *        .pathTo("foo/bar/zed")
	 *     //-> zed
	 *     
	 * @return {steal.URI}
	 */
	pathTo: function( uri ) {
		uri = URI(uri);
		var uriParts = uri.path.split("/"),
			thisParts = this.path.split("/"),
			result = [];
		while ( uriParts.length && thisParts.length && uriParts[0] == thisParts[0] ) {
			uriParts.shift();
			thisParts.shift();
		}
		h.each(thisParts, function() {
			result.push("../")
		})
		return URI(result.join("") + uriParts.join("/"));
	},
	mapJoin: function( url ) {
		return this.join(URI(url).insertMapping());
	},
	// helper to go from jquery to jquery/jquery.js
	addJS: function() {
		var ext = this.ext();
		if ( !ext ) {
			// if first character of path is a . or /, just load this file
			if (!this.isRelative() ) {
				this.path += "/" + this.filename();
			}
			this.path += ".js"
		}
		return this;
	}
});
// This can't be added to the prototype using extend because
// then for some reason IE < 9 won't recognize it.
URI.prototype.toString = function() {
	return this.domain() + this.path + this.search() + this.hash();
};
//  =============================== MAPPING ===============================
// TODO: this can likely be removed
URI.prototype.insertMapping = function() {
	// go through mappings
	var orig = "" + this,
		key, value;
	for ( key in steal.mappings ) {
		value = steal.mappings[key]
		if ( value.test.test(orig) ) {
			return orig.replace(key, value.path);
		}
	}
	return URI(orig);
};

// --- END URI