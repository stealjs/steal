var stealClone = require('steal-clone');
var origModuleA = require('ext-steal-clone/multiple-overrides/moduleA');

var clone = stealClone({
  'ext-steal-clone/multiple-overrides/moduleB': {
    getName: function() {
      return 'mockModuleB';
    }
  },
  'ext-steal-clone/multiple-overrides/moduleC': {
    getName: function() {
      return 'mockModuleC';
    }
  }
});

clone.import('ext-steal-clone/multiple-overrides/moduleA')
  .then(function(moduleA) {
    if (typeof window !== "undefined" && window.assert) {
      assert.equal(moduleA.getName(), 'moduleA mockModuleB mockModuleC', 'import should use injected dependency');
      assert.equal(origModuleA.getName(), 'moduleA moduleB moduleC', 'prior import should use original dependency');

      done();
    } else {
      console.log('moduleA.getName():', moduleA.getName());
      console.log('origModuleA.getName():', origModuleA.getName());
    }
  });
