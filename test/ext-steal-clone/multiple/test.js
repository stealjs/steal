var doClone1 = require("./first-test");
var doClone2 = require("./second-test");

Promise.all([doClone1(), doClone2()]).then(function(){
	if (typeof window !== "undefined" && window.assert) {
		assert.ok(true, "promises resolved");
		done();
	} else {
		console.log("worked");
	}
}, function(){
	if (typeof window !== "undefined" && window.assert) {
		assert.ok(false, "promises failed");
		done();
	} else {
		console.log("promises failed");
	}
});
