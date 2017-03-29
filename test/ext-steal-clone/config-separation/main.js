var moduleA = require('./moduleA');
var stealClone = require('steal-clone');

var clone = stealClone({});

function excludeRegistry() {
  var deletedModule = 'ext-steal-clone/config-separation/moduleB';

  clone.delete(deletedModule);

  if (typeof window !== "undefined" && window.assert) {
    assert.ok(!clone.has(deletedModule), 'should delete module from clone');
    assert.ok(steal.loader.has(deletedModule), 'should not delete module from loader');
  } else {
    console.log(' clone.has(' + deletedModule + '):', clone.has(deletedModule));
    console.log('steal.loader.has(' + deletedModule + '):', steal.loader.has(deletedModule));
  }

  return Promise.resolve();
}

function excludeExtensions() {
  function cloneExtension() {}
  clone._extensions.push(cloneExtension);

  if (typeof window !== "undefined" && window.assert) {
    assert.ok(clone._extensions.indexOf(cloneExtension) >= 0, 'clone should include new extensions');
    assert.ok(steal.loader._extensions.indexOf(cloneExtension) < 0, 'steal.loader should not include new extensions');
  } else {
    console.log('index of cloneExtension in clone:', clone._extensions.indexOf(cloneExtension));
    console.log('index of cloneExtension in steal.loader:', steal.loader._extensions.indexOf(cloneExtension));
  }

  return Promise.resolve();
}

excludeRegistry()
  .then(excludeExtensions)
  .then(function() {
    if (typeof window !== "undefined" && window.assert) {
      done();
    }
  });
