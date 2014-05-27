import 'extensions/main.less!';
import 'extensions/main.css!';
import text from 'extensions/hello.txt!';


if(typeof window !== "undefined" && window.QUnit) {
	QUnit.equal(text, 'hello world', "element width set by css");
	QUnit.equal(document.getElementById("test-element1").clientWidth, 200, "element width set by css");
	QUnit.equal(document.getElementById("test-element2").clientWidth, 200, "element width set by css");
	
	QUnit.start();
	removeMyself();
} else {
	console.log("width", document.getElementById("test-element1").clientWidth);
	console.log("width", document.getElementById("test-element2").clientWidth);
	console.log("text",text);
}
