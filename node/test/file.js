var steal = require('./../file');
var assert = require('assert');
var fs = require('fs');

describe('steal.URI filesystem extentions', function(){
	it('Instantiates with __dirname and tells me it is not a directory', function() {
		var uri = new steal.URI(__dirname);
		assert.ok(!uri.isFile());
	});

	it('writes and deletes file', function(done) {
		var filename = __dirname + '/test.txt';
		var uri = new steal.URI(filename);
		uri.save('this is a file');
		fs.readFile(filename, function(error, data) {
			assert.equal('this is a file', data.toString());
			uri.remove();
			assert.ok(!uri.exists());
			done();
		});
	});
});
