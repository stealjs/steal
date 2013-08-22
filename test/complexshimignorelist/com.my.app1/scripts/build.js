//steal/js sample/scripts/compress.js

load("steal/rhino/rhino.js");
steal("steal/build", "steal/build/scripts", "steal/build/styles", function () {

	steal.build("steal/test/complexshimignorelist/com.my.app1/resources/index.html", {
		to : "theme"
	});
});
