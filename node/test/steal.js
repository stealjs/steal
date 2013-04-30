var steal = require('./../steal');
var assert = require('assert');

describe('Steal', function(){
	it('Steals files and loads modules', function(done) {
		steal('steal/node/test/hello', function(message) {
			assert.equal(message, 'Hello World');
			done();
		});
	});
});
