var util = require("./util");

if(window.QUnit) {
	QUnit.equal(module.id,"dep@1.2.2#main");
	QUnit.equal(util, "123", "meta applied");
	
} else {
	console.log(module.id);
	console.log(util);
}
