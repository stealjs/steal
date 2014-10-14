/*bundlesConfig*/
System.bundles = {"bundles/main":[]};
/*stealconfig*/
System.config({
	bower: "../bower_components"
});

define("main", [], function(){
	var hasqunit = typeof window !== "undefined" && window.QUnit;

	return System.import("lodash").then(function(){
		if(hasqunit) {
			QUnit.ok(false, "Should not have loaded since in production");
		}
	}, function(){
		if(hasqunit) {
			QUnit.ok(true, "Got an error because we are in prodution");
		}
	}).then(function(){
		setTimeout(function(){
			QUnit.start();
			removeMyself();
		});
	});

});
