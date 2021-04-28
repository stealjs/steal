var stealClone = require('steal-clone');

stealClone({
  'steal/test/ext-steal-clone/npm-extension/moduleB': {
    default: function() {
      return 'mockModuleB';
    }
  }
})
.import('steal/test/ext-steal-clone/npm-extension/moduleA')
.then(function(moduleA) {
  if (typeof window !== "undefined" && window.assert) {
    assert.equal(moduleA.getName(), 'moduleA mockModuleB', 'import should use injected dependency');

    done();
  } else {
    console.log('moduleA.getName():', moduleA.getName());
  }
});
