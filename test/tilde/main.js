define(["tilde/template.stache!","tilde/alt.stache!"], function(template, template2){
	
	if(typeof window !== "undefined" && window.QUnit) {
		QUnit.equal(template, '"hello-world.png"\n../partial/path.stache');
		QUnit.equal(template2, '"../libs/bootstrap/hello-world.png"\n../libs/bootstrap/partial');
		
			
		QUnit.start();
		removeMyself();
	} else {
		console.log("basics loaded", template, template2);
	}
	
});
