import {makeDefinition} from "./not-amd";

if (typeof window !== "undefined" && window.QUnit) {
	var define = makeDefinition();

	QUnit.equal(typeof define, "function", "got define-function" );
	QUnit.equal(define.name, "define");
	QUnit.start();
	removeMyself();
} else {
	console.log(makeDefinition().name);
}