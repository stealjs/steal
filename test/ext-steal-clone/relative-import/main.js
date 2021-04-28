var stealClone = require('steal-clone');

return stealClone()
.import('ext-steal-clone/relative-import/moduleA')
.then(function(moduleA) {
  if (typeof window !== "undefined" && window.assert) {
    assert.equal(moduleA.getName(), 'moduleA moduleB', 'import should use injected dependency');

    done();
  } else {
    console.log('moduleA.getName():', moduleA.getName());
  }
});
