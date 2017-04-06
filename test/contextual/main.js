function basic() {
	steal.setContextual('foo', function(parentName) {
		return {
			'default': function() {
				return parentName + ' bar';
			},
			__useDefault: true
		};
	});

	return steal.import('contextual/moduleA')
	.then(function(moduleA) {
		if (typeof window !== "undefined" && window.assert) {
			assert.equal(moduleA.default(), 'contextual/moduleA bar');
		} else {
			console.log(moduleA.default());
		}
	});
}

function definer() {
	steal.setContextual('foo', 'contextual/foo');

	return steal.import('contextual/moduleB')
	.then(function(moduleA) {
		if (typeof window !== "undefined" && window.assert) {
			assert.equal(moduleA.default(), 'contextual/moduleB baz');
		} else {
			console.log(moduleA.default());
		}
	});
}

basic()
.then(definer)
.then(function() {
	if (typeof window !== "undefined" && window.done) {
		done();
	}
});
