var loader = require('@loader');
var dep1 = require('dep1');

if(window.QUnit) {
	var myJson = require('foo.json');
	QUnit.equal(typeof myJson, "object", "foo.json loaded and parsed");

	QUnit.equal(myJson.foo, "bar");
	QUnit.equal(myJson.bar, "bar", "json property was modifed");

	var appPackage = loader.npmContext.pkgInfo[0];
	QUnit.ok(!appPackage.foo, "foo property was deleted in apps package.json");
	QUnit.ok(!appPackage.steal.someConfig);

	var dep1Package = loader.npmContext.pkgInfo[1];
	QUnit.ok(!dep1Package._npmVersion, "_npmVersion property was deleted in dep1s package.json");
	QUnit.ok(dep1Package.steal.main);
	QUnit.ok(!dep1Package.steal.someConfig, "system config was rewritten to steal and deleted");

	removeMyself();
} else {
	console.log(loader.npmContext.pkgInfo);
}
