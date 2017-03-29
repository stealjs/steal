var stealClone = require('steal-clone');
var loader = require('@loader');

loader.config({
	foo: 'bar',
	bar: function() {}
});

var clone = stealClone({
	'ext-steal-clone/basics/moduleB': {
		getName: function() {
			return 'mockModuleB';
		}
	}
});

if (window.assert) {
	assert.equal(typeof clone.import, 'function', 'steal-clone should return an import function');
	assert.equal(clone.foo, 'bar', 'clone should contain config properties that are not functions');
	assert.ok(!clone.bar, 'clone should not contain config properties that are functions');
} else {
	console.log('clone.import:', clone.import);
	console.log('clone.foo:', clone.foo);
	console.log('clone.bar:', clone.bar);
}

clone.import('ext-steal-clone/basics/moduleA')
	.then(function(moduleA) {
		if (window.assert) {
			assert.equal(moduleA.getName(), 'moduleA mockModuleB', 'import should use injected dependency');
			done();
		} else {
			console.log('moduleA.getName():', moduleA.getName());
		}
	})
	.then(null, function(err) {
		assert.notOk(err, "should not fail");
		done();
	});
