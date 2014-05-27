import 'plugins/main.css!';

if(typeof window !== "undefined" && window.QUnit) {
	QUnit.equal(document.getElementById("test-element").clientWidth, 200, "element width set by css");

	QUnit.start();
	removeMyself();
} else {
	console.log("width", document.getElementById("test-element").clientWidth);
}
