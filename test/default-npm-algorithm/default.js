steal.import("some").then(function (module) {
	if (typeof window !== "undefined" && window.assert) {
		assert.strictEqual(steal.loader.npmContext.isFlatFileStructure, true, "default npm-algorithm is flat");
		assert.equal(steal.loader.npmAlgorithm, 'flat');

		assert.equal(module.some, 'some', "module loaded");
		assert.equal(module.other, 'other', 'nested module loaded');
		done();
	} else {
		console.log(steal.steal.loader);
	}
});
