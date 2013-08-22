//steal/js sample/scripts/compress.js

load("steal/rhino/rhino.js");
steal("steal/build", "steal/build/scripts", "steal/build/styles", function () {

	steal.build("steal/test/complexshimignorelist/com.my.common/resources/index.html", {
		to : "common"
	});
});
