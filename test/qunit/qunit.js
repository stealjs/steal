//console.log('running qunit');
steal("funcunit/qunit")
	.then("stealjs/less/less_test.js")
	.then('./one.css','../two.css')
	.then("./steal_test.js","./loadtwice.js").then(function(){
		ORDERNUM.push('func')
	})
	.then('./loadtwice')
	.then("stealjs/test/package")
	.then("stealjs/test/package/uses.js")
