System.import("some").then(function (module) {
	if (typeof window !== "undefined" && window.QUnit) {
		QUnit.strictEqual(System.npmContext.isFlatFileStructure, true, "default npm-algorithm is flat");
		// you cant config npmAlgorithm outside of a package.json config-file!
		// npmAlgorithm is "nested", but "System.npmContext.isFlatFileStructure" is true because of the
		// package-config. it is a wired to have a test like this, but we should figure out if this behaviour
		// is wanted.
		QUnit.equal(System.npmAlgorithm, 'nested');

		QUnit.equal(module.some, 'some', "module loaded");
		QUnit.equal(module.other, 'other', 'nested module loaded');

		QUnit.start();
		removeMyself();
	} else {
		console.log(steal.System);
	}
});
