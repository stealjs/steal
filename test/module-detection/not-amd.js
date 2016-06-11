import {foo, bar} from "./foo";

function makeDefinition(bar) {
	return function define (bar) {
		return "lets create a define function"
	}
}

if (typeof window !== "undefined" && window.QUnit) {
	QUnit.equal(foo, "foo");
	QUnit.equal(bar, "bar");
}

export {makeDefinition}