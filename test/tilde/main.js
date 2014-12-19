define(["~/tilde/mod", "~/tilde/template.stache!", "~/tilde/styles.less!",
	"~/tilde/more.css!"], function(module, template){
	
	if(typeof window !== "undefined" && window.QUnit) {
		QUnit.ok(module, "got tilde/mod");
		QUnit.equal(module.name, "module", "module name is right");
		QUnit.ok(/\/images\/hello-world\.png/.test(template), "Template corrected converted");
		QUnit.ok(/partial\.stache/.test(template), "Template includes the partial");
			
		QUnit.start();
		removeMyself();
	} else {
		console.log("basics loaded", module);
	}
	
});
