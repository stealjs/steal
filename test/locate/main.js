define(["root.stache!", "resources/shallow.stache!", "resources/deep/deep.stache!"], function(root, shallow, deep){
	
	if(typeof window !== "undefined" && window.QUnit) {
		root = root.split("\n");
		shallow = shallow.split("\n");
		deep = deep.split("\n");

		QUnit.deepEqual(root, [
			"node_modules/bootstrap/hello-world.png",
			"steal.svg",
			"resources/deep/deep.less",
			"node_modules/bootstrap/hello-world.png",
			"steal.svg",
			"resources/deep/deep.less"
		], 'locate:// & pkg:// work as expected from importing file in package root');

		QUnit.deepEqual(shallow, [
			"../node_modules/bootstrap/hello-world.png",
			"../steal.svg",
			'deep/deep.less',
			"node_modules/bootstrap/hello-world.png",
			"steal.svg",
			"resources/deep/deep.less"
		], 'locate:// & pkg:// work as expected from importing file in a directory');

		QUnit.deepEqual(deep, [
			"../../node_modules/bootstrap/hello-world.png",
			"../../steal.svg",
			'deep.less',
			"node_modules/bootstrap/hello-world.png",
			"steal.svg",
			"resources/deep/deep.less"
		], 'locate:// & pkg:// work as expected from importing file in a nested directory');

		QUnit.start();
		removeMyself();
	} else {
		console.log("basics loaded", template, template2);
	}

});
