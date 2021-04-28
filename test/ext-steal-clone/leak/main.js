var clone = require("steal-clone");
var counter = require("./counter");

if (typeof window !== "undefined" && window.assert) {
	assert.equal(counter.getCount(), 0, "initially 0");
} else {
	console.log(counter.getCount());
}

var loader = clone({
	"ext-steal-clone/leak/c": {}
});

loader["import"]("ext-steal-clone/leak/a").then(function(a){
	a();

	if (typeof window !== "undefined" && window.assert) {
		assert.equal(counter.getCount(), 0, "still should be 0");
		done();
	} else {
		console.log(counter.getCount());
	}
});
