var library = require("library");
var framework = require("framework");
var tabs = require("tabs");

if(window.QUnit) {
	QUnit.equal(tabs.framework ,framework);
	QUnit.equal(tabs.library, library);
	QUnit.equal(framework.library ,library);
	removeMyself();
} else {
	console.log(tabs.framework === framework, 
			tabs.library === library,
			framework.library === library);
	
}
