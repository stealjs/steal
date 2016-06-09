import {barDefinition} from "bar";
import fooDefinition from "foo";

if (typeof window !== "undefined" && window.QUnit) {

	QUnit.equal(typeof barDefinition(), "function", "got es6 define-function" );
	QUnit.equal(typeof fooDefinition(), "function", "got cjs define-function" );
	QUnit.equal(barDefinition().name, "define");
	QUnit.equal(fooDefinition().name, "define");
	QUnit.start();
	removeMyself();
} else {
	console.log(barDefinition().name);
	console.log(fooDefinition().name);
}