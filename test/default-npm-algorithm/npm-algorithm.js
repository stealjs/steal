steal.import("some").then(function (module) {
	if (typeof window !== "undefined" && window.assert) {
		assert.strictEqual(steal.loader.npmContext.isFlatFileStructure, true, "default npm-algorithm is flat");
		// you cant config npmAlgorithm outside of a package.json config-file!
		// npmAlgorithm is "nested", but "System.npmContext.isFlatFileStructure" is true because of the
		// package-config. it is a wired to have a test like this, but we should figure out if this behaviour
		// is wanted.
		assert.equal(steal.loader.npmAlgorithm, 'nested');

		assert.equal(module.some, 'some', "module loaded");
		assert.equal(module.other, 'other', 'nested module loaded');
		done();
	} else {
		console.log(steal.loader);
	}
});
