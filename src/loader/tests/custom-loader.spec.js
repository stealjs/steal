QUnit.module("Custom Loader", function() {
	/**
	 * Throws error if function argument is truthy
	 */
	function notSupposedToFail(err) {
		if (err) throw new Error("should not fail");
	}

	/**
	 * Throws error if function is called
	 */
	function supposeToFail() {
		throw(new Error("should not be successful"));
	}

	QUnit.module("#import", function() {

		QUnit.module("scripts", function() {
			QUnit.test("should support ES6 scripts", function(assert) {
				var done = assert.async();

				customLoader.import("tests/loader/test")
					.then(function(m) {
						assert.equal(m.loader, "custom");
					})
					.then(done, notSupposedToFail);
			});

			QUnit.test("should support AMD scripts", function(assert) {
				var done = assert.async();

				customLoader.import("tests/loader/amd")
					.then(function(m) {
						assert.equal(m.format, "amd");
					})
					.then(done, notSupposedToFail);
			});
		});

		QUnit.module("special #locate path rule", function() {
			QUnit.test("should support special loading rules", function(assert) {
				var done = assert.async();

				customLoader.import("path/custom")
					.then(function(m) {
						assert.ok(m.path);
					})
					.then(done, notSupposedToFail);
			});

		});

		QUnit.module("errors", function() {
			QUnit.test("should make the normalize throw", function(assert) {
				var done = assert.async();

				customLoader.import("tests/loader/error1-parent")
					.then(supposeToFail, function(e) {
						assert.ok(/Error loading "tests\/loader\/error1-parent" at \S+error1-parent\.js/.test(e));
						done();
					});
			});

			QUnit.test("should make the locate throw", function(assert) {
				var done = assert.async();

				customLoader.import("tests/loader/error2")
					.then(supposeToFail, function(e) {
						assert.ok(/Error loading "tests\/loader\/error2" at \S+tests\/loader\/error2\.js/.test(e));
						done();
					});
			});

			QUnit.test("should make the fetch throw", function(assert) {
				var done = assert.async();

				customLoader.import("tests/loader/error3")
					.then(supposeToFail, function(e) {
						assert.ok(/Error loading "tests\/loader\/error3" at \S+tests\/loader\/error3\.js/.test(e));
						done();
					});
			});

			QUnit.test("should make the translate throw", function(assert) {
				var done = assert.async();

				customLoader.import("tests/loader/error4")
					.then(supposeToFail, function(e) {
						assert.ok(/Error loading "tests\/loader\/error4" at \S+tests\/loader\/error4\.js/.test(e));
						done();
					});
			});

			QUnit.test("should make the instantiate throw", function(assert) {
				var done = assert.async();

				customLoader.import("tests/loader/error5")
					.then(supposeToFail, function(e) {
						assert.ok(/Error loading "tests\/loader\/error5" at \S+tests\/loader\/error5\.js/.test(e));
						done();
					});
			});
		});
	});

	QUnit.module("#normalize", function() {
		QUnit.test("should support async normalization", function(assert) {
			var done = assert.async();

			customLoader.normalize("asdfasdf")
				.then(function(normalized) {
					return customLoader.import(normalized);
				})
				.then(function(m) {
					assert.equal(m.n, "n");
				})
				.then(done, notSupposedToFail);
		});
	});
});
