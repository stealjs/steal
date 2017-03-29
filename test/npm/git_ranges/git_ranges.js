var library = require("library");
var framework = require("framework");
var tabs = require("tabs");

if(window.assert) {
	assert.equal(tabs.framework ,framework);
	assert.equal(tabs.library, library);
	assert.equal(framework.library ,library);
} else {
	console.log(tabs.framework === framework,
			tabs.library === library,
			framework.library === library);

}
