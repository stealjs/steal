steal.config({
	map : {
		"*" : {
			"jquery/jquery.js" : "jquery",
			"can/util/util.js" : "can/util/jquery/jquery.js"
		}
	},
	paths : {
		"jquery" : "jquery/jquery.js"

		//!steal-remove-start
		// Note: Uncomment the specific sections depending on task
		// when running "./js /Users/aballa/my/projects/steal/test/complexshimignorelist/com.my.common/scripts/build.js" command
		// uncomment all MAKING COMMON PACKAGE sections and comment other sections
		// when running "./js /Users/aballa/my/projects/steal/test/complexshimignorelist/com.my.app1/scripts/build.js" commndcommand
		// uncomment all BUILDING THEME START sections  and comment other sections


		// ---------------------------------------- MAKING COMMON PACKAGE START ----------------------------------------

		// ,"common/" : "steal/test/complexshimignorelist/com.my.common/resources/"

		// ---------------------------------------- MAKING COMMON PACKAGE END ----------------------------------------

		// ---------------------------------------- BUILDING THEME START ----------------------------------------

		,"common/my/common.js" : "steal/test/complexshimignorelist/com.my.common/resources/my/packages/common.js"
		,"common/" : "steal/test/complexshimignorelist/com.my.common/resources/my/"
		,"theme/" : "steal/test/complexshimignorelist/com.my.app1/resources/"

		// ---------------------------------------- BUILDING THEME START ----------------------------------------

		//!steal-remove-end
	},
	shim : {
		jquery : {
			exports : "jQuery"
		}
		//!steal-remove-start

		// ---------------------------------------- BUILDING THEME START ----------------------------------------
		,"common/my/common.js" : {
			packaged : false
		}
		// ---------------------------------------- BUILDING THEME START ----------------------------------------

		//!steal-remove-end
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
