System.import("some").then(function (module) {
	if (typeof window !== "undefined" && window.QUnit) {
		QUnit.strictEqual(System.npmContext.isFlatFileStructure, true, "default npm-algorithm is flat");
		QUnit.equal(System.npmAlgorithm, 'flat');

		QUnit.equal(module.some, 'some', "module loaded");
		QUnit.equal(module.other, 'other', 'nested module loaded');

		QUnit.start();
		removeMyself();
	} else {
		console.log(steal.System);
	}
});
