import {foo, bar} from "./foo";

function makeDefinition(bar) {
	return function define (bar) {
		return "lets create a define function"
	}
}

console.log(foo, bar);

export {makeDefinition}