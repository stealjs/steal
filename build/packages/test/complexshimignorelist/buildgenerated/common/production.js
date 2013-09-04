steal.packages({
	"common/my/common.js" : "common//packages/common.js"
});
steal.make({
	id : "common//packages/common.js",
	needs : ["common//packages/common.css"],
	has : ["common/my/common-1.js", "common/my/common-2.js", "common/my/common.js"]
});
steal.make({
	id : "common//packages/common.css",
	has : ["undefined", "undefined"]
});
steal.has("stealconfig.js", "common/my/make_package.js");
steal("stealconfig.js", "common/my/make_package.js");
steal.pushPending();
steal.config({
	map : {
		"*" : {
			"jquery/jquery.js" : "jquery",
			"can/util/util.js" : "can/util/jquery/jquery.js"
		}
	},
	paths : {
		jquery : "jquery/jquery.js"
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
steal.executed("stealconfig.js");
steal.packages("common/my/common.js");
steal(function () {
	steal("common/my/common.js")
});
steal.executed("common/my/make_package.js");
steal.popPending();
