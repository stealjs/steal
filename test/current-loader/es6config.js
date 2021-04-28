import loader from '@loader';

if (typeof window !== "undefined" && window.assert) {
	assert.ok(loader == steal.loader,  "got back the current loader");
	done();
} else {
	console.log("loaders", loader == steal.loader);
}
