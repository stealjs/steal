var stealClone = require('steal-clone');

return stealClone({
  './moduleB': {
    getName: function() {
      return 'mockModuleB';
    }
  }
})
.import('ext-steal-clone/relative-override/moduleA')
.then(function(moduleA) {
  if (typeof window !== "undefined" && window.assert) {
    assert.equal(moduleA.getName(), 'moduleA mockModuleB', 'import should use injected dependency');

    done();
  } else {
    console.log('moduleA.getName():', moduleA.getName());
  }
});
