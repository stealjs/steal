/**
 * Whether browser supports __proto__
 *
 * Used to skip tests in browsers without support (IE <= 10)
 *
 * see https://babeljs.io/docs/usage/caveats/#internet-explorer-classes-10-and-below-
 *
 * @return {Function} When called evaluates to `true` if __proto__ is supported
 */
module.exports = function supportsProto() {
	var foo = {};
	foo.__proto__ = { bar: "baz" };
	return foo.bar === "baz";
};
