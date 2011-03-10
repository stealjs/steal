steal
  .plugins("funcunit/qunit")
  .css('one','../two')
  .then("steal_test","loadtwice").then(function(){
  	ORDERNUM.push('func')
  }).then('loadtwice',
  	"//steal/test/package/package",
	"//steal/test/package/uses")

