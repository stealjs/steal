var path = require("path")
  , exec = require("child_process").exec;

suite("Multiples");

test("Able to steal a file that loads its own steal.", function(done){
	expect(1);

	var file = path.resolve(__dirname, "multi/index.js");
	var cmd = "node " + file;

	exec(cmd, function(err, stdout, stderr){
		equal(stdout, "Worked? true\n");
		done();
	});

});
