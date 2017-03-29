steal.import("some").then(function (module) {
	if (typeof window !== "undefined" && window.assert) {
		assert.strictEqual(steal.loader.npmContext.isFlatFileStructure, false, "npm-algorithm is nested");
		assert.equal(steal.loader.npmAlgorithm, "nested", "npm-algorithm is nested");
		assert.equal(module.some, 'some', "module loaded");
		assert.equal(module.other, 'other', 'nested module loaded');
		done();
	} else {
		console.log(steal.loader);
	}
});

