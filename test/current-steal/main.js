var mySteal = require('@steal');

if (typeof window !== "undefined" && window.assert) {
	assert.ok(mySteal.loader == steal.loader, "The steal's loader is the loader");
	done();
} else {
	console.log("Systems", mySteal.loader == steal.loader);
}
