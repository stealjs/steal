var loader = require('@loader');
var dep1 = require('dep1');

if(window.assert) {
	var myJson = require('foo.json');
	assert.equal(typeof myJson, "object", "foo.json loaded and parsed");

	assert.equal(myJson.foo, "bar");
	assert.equal(myJson.bar, "bar", "json property was modifed");

	var appPackage = loader.npmContext.pkgInfo[0];
	assert.ok(!appPackage.foo, "foo property was deleted in apps package.json");
	assert.ok(!appPackage.steal.someConfig);

	var dep1Package = loader.npmContext.pkgInfo[1];
	assert.ok(!dep1Package._npmVersion, "_npmVersion property was deleted in dep1s package.json");
	assert.ok(dep1Package.steal.main);
	assert.ok(!dep1Package.steal.someConfig, "system config was rewritten to steal and deleted");

	done();
} else {
	console.log(loader.npmContext.pkgInfo);
}
