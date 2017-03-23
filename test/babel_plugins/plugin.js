// adds `window.foo = "bar";` at the top of the file
module.exports = function(babel) {
	var t = babel.types;

	return {
		visitor: {
			Program: function(path, file) {
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
