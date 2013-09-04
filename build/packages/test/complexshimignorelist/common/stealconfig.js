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

		// when running "./js ./steal/build/packages/test/complexshimignorelist/common/scripts/build.js"
		// command uncomment all "MAKING COMMON PACKAGE" sections and comment other sections

		// when running "./js ./steal/build/packages/test/complexshimignorelist/app1/scripts/build.js" command
		// or loading app1 from browser in development mode uncomment all "BUILDING THEME OR LOADING app1 IN DEVELOPMENT MODE"
		// sections and comment other sections

		// ----- MAKING COMMON PACKAGE START -----

		// ,  "common/" : "steal/build/packages/test/complexshimignorelist/common/"

		// ----- MAKING COMMON PACKAGE END -----

		// ----- BUILDING THEME OR LOADING app1 IN DEVELOPMENT MODE START -----
		,
		"common/my/common.js" : "steal/build/packages/test/complexshimignorelist/common/my/packages/common.js",
		"common/" : "steal/build/packages/test/complexshimignorelist/common/my/",
		"theme/" : "steal/build/packages/test/complexshimignorelist/app1/"

		// ----- BUILDING THEME OR LOADING app1 IN DEVELOPMENT MODE END -----

		//!steal-remove-end
	},
	shim : {
		jquery : {
			exports : "jQuery"
		}
		//!steal-remove-start

		// ----- BUILDING THEME OR LOADING app1 FROM BROWSER IN DEVELOPMENT MODE START -----
		,
		"common/my/common.js" : {
			packaged : false
		}
		// ----- BUILDING THEME OR LOADING app1 FROM BROWSER IN DEVELOPMENT MODE END -----

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
