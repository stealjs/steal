var path = require("path");

global.steal = {
	nodeRequire: require,
	root: path.resolve(__dirname, "../../..")
};

suite("Basic");

var steal = require("../../lib");

test("Steal is required", function(){
	equal(typeof steal, "function", "Steal is a function");
});

test("Able to steal code", function(done){
	expect(1);

	steal("stealjs/test/node/files/file1.js",
		function(f){

		deepEqual(f, { foo: "bar" }, "Objects are equal");
		done();
	});

});

/*
test("Able to steal code using relative paths", function(done){
	expect(1);

	steal("./files/file1.js", function(f){
		notEqual(typeof f, "undefined", "f was retrieved.");
		done();
	});

});
*/
