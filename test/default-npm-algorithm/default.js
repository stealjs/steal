steal.import("some").then(function (module) {
	if (typeof window !== "undefined" && window.QUnit) {
		QUnit.strictEqual(steal.loader.npmContext.isFlatFileStructure, true, "default npm-algorithm is flat");
		QUnit.equal(steal.loader.npmAlgorithm, 'flat');

		QUnit.equal(module.some, 'some', "module loaded");
		QUnit.equal(module.other, 'other', 'nested module loaded');

		QUnit.start();
		removeMyself();
	} else {
		console.log(steal.steal.loader);
	}
});
