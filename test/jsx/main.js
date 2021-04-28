"format es6";

// Shim it
var React = {
	createElement: function(){
		return "it worked!";
	}
};

var out = <div>Hello <strong>world!</strong></div>;

if(typeof window !== "undefined" && window.assert) {
	assert.equal(out, "it worked!", "transpiled jsx by default");
	done();
} else {
	console.log("jsx loaded:", out);
}
