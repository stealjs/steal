(function() {
	var testName;
	var cache = {};

	QUnit.done(function(testResults) {
		var tests = [];

		for (var name in cache) {
			var details = cache[name];

			tests.push({
				name: details.name,
				result: details.result,
				expected: details.expected,
				actual: details.actual,
				source: details.source
			});
		}

		testResults.tests = tests;
		window.global_test_results = testResults;
	});

	QUnit.testStart(function(testDetails) {
		QUnit.log(function(details) {
			testName = details.name || testDetails.name;
			cache[testName] = details;
		});
	});
}());
