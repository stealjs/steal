//console.log('running qunit');
steal
  .plugins("funcunit/qunit")
  .then('one.css','../two.css')
  .then("steal_test","loadtwice").then(function(){
  	ORDERNUM.push('func')
  })
  .then('loadtwice')
  .then("//steal/test/package/package")
  .then("//steal/test/package/uses")


