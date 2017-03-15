// adds `window.foo = "bar";` at the top of the file
module.exports = function({ types: t }) {
	return {
		visitor: {
			Program(path, file) {
				path.unshiftContainer("body", [
					t.expressionStatement(
						t.assignmentExpression(
							"=",
							t.memberExpression(t.identifier("window"), t.identifier("foo")),
							t.stringLiteral("bar")
						)
					)
				]);
			}
		}
	};
};
