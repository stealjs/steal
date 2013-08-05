steal.config({
	map : {
		"*" : {
			"jquery/jquery.js" : "jquery",
			"can/util/util.js" : "can/util/jquery/jquery.js"
		}
	},
	paths : {
		"jquery" : "jquery/jquery.js"
		// ,"common/" : "steal/test/complexpackaging/com.my.common/resources/"
		// ,"theme/" : "steal/test/complexpackaging/com.my.app1/resources/"
	},
	shim : {
		jquery : {
			exports : "jQuery"
		}
	},
	ext : {
		js : "js",
		css : "css",
		less : "steal/less/less.js",
		coffee : "steal/coffee/coffee.js",
		ejs : "can/view/ejs/ejs.js",
		mustache : "can/view/mustache/mustache.js"
	}
});
