define(["tilde/template.stache!","tilde/alt.stache!"], function(template, template2){
	
	if(typeof window !== "undefined" && window.QUnit) {
		
		QUnit.ok(/\/test\/tilde\/hello-world\.png/.test(template), "Template corrected converted");
		QUnit.ok(/test\/partial\/path\.stache/.test(template), "Template includes the partial");
			
		QUnit.ok(/\/test\/libs\/bootstrap\/hello-world\.png/.test(template2), "Template corrected converted");
		QUnit.ok(/\/test\/libs\/bootstrap\/partial/.test(template2), "Template includes the partial");
			
		QUnit.start();
		removeMyself();
	} else {
		console.log("basics loaded", template, template2);
	}
	
});
