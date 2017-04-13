/**
 * Module representing a list of test pages urls
 *
 * Shared between the Grunt task that runs testee and the SauceLabs script
 *
 * @module test/test-pages-urls
 * @type {Object.<string, string>[]}
 */
module.exports = [{
	name: "loader babel tests",
	url: "src/loader/babel_test.html"
}, {
	name: "loader traceur tests",
	url: "src/loader/traceur_test.html"
}, {
	name: "base extension tests",
	url: "src/base/base_test.html"
}, {
	name: "live-reload tests",
	url: "test/live_reload/unit.html"
}, {
	name: "bower extension tests",
	url: "test/bower/test.html"
}, {
	name: "npm extension tests",
	url: "test/npm/test.html"
}, {
	name: "steal tests",
	url: "test/test.html"
}];
