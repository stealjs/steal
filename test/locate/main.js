define(["resources/template.stache!"], function(template){
	if(typeof window !== "undefined" && window.assert) {
		template = template.split("\n");

		assert.deepEqual(template, [
			"../node_modules/bootstrap/hello-world.png",
			"../steal.svg",
			'deep/deep.less'
		], 'locate:// works as expected from importing file in a directory');

		done();
	} else {
		console.log("basics loaded", template);
	}
});
