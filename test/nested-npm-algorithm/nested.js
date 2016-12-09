steal.import("some").then(function (module) {
	if (typeof window !== "undefined" && window.QUnit) {
		QUnit.strictEqual(steal.loader.npmContext.isFlatFileStructure, false, "npm-algorithm is nested");
		QUnit.equal(steal.loader.npmAlgorithm, "nested", "npm-algorithm is nested");
		QUnit.equal(module.some, 'some', "module loaded");
		QUnit.equal(module.other, 'other', 'nested module loaded');

		QUnit.start();
		removeMyself();
	} else {
		console.log(steal.loader);
	}
});

