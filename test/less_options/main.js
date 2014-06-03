import "less_options/main.less!steal/less";

if (typeof window !== "undefined" && window.QUnit) {
	var style = document.getElementsByTagName("style")[0],
		hasLineNumber = style.innerHTML.indexOf("line 1, input") !== -1,
		hasStrictMath = style.innerHTML.indexOf("100%") !== -1;

	QUnit.ok(hasLineNumber, "less set to dump line numbers");
	QUnit.ok(hasStrictMath, "less set to process only maths inside un-necessary parenthesis");

	QUnit.start();
	removeMyself();
} else {
	var style = document.getElementsByTagName('style')[0];
	console.log(style);
}