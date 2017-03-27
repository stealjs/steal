/**
 * Module representing a list of test pages urls
 *
 * Shared between the Grunt task that runs testee and the SauceLabs script
 *
 * @module test/test-pages-urls
 * @type {Object.<string, string>[]}
 */
module.exports = [{
	description: "loader babel tests",
	url: "src/loader/babel_test.html"
}, {
	description: "loader traceur tests",
	url: "src/loader/traceur_test.html"
}, {
	description: "base extension tests",
	url: "src/base/base_test.html"
}, {
	description: "bower extension tests",
	url: "test/bower/test.html"
}, {
	description: "npm extension tests",
	url: "test/npm/test.html"
}, {
	description: "steal tests",
	url: "test/test.html"
}];

