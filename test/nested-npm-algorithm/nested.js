System.import("some").then(function (module) {
	if (typeof window !== "undefined" && window.QUnit) {
		QUnit.strictEqual(System.npmContext.isFlatFileStructure, false, "npm-algorithm is nested");
		QUnit.equal(steal.System.npmAlgorithm, "nested", "npm-algorithm is nested");
		QUnit.equal(module.some, 'some', "module loaded");
		QUnit.equal(module.other, 'other', 'nested module loaded');

		QUnit.start();
		removeMyself();
	} else {
		console.log(steal.System);
	}
});

