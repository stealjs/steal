var clone = require('steal-clone');

var moduleObject = { abc: 'xyz' };

clone({
	'fooBarBaz': {
		default: moduleObject,
		__useDefault: true
	}
})
.import('fooBarBaz')
.then(function(fooBarBaz) {
	if (typeof window !== "undefined" && window.assert) {
		assert.ok(fooBarBaz === moduleObject, 'default export should be the passed object');

		try {
			fooBarBaz.def = 'uvw';
			assert.equal(fooBarBaz.def, 'uvw', 'should be able to set a property on the default export object');
		} catch(e) {
			assert.ok(false, 'error setting a property on the default export object: ' + e);
		}

		done();
	} else {
		console.log('fooBarBaz === moduleObject:', fooBarBaz === moduleObject);

		try {
			fooBarBaz.def = 'uvw';
			console.log("fooBarBaz.def === 'uvw':", fooBarBaz.def === 'uvw');
		} catch(e) {
			console.log('error setting a property on the default export object:', e);
		}
	}
});
