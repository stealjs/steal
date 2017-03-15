export default function(babel) {
	var t = babel.types;

	return {
		visitor: {
			Program: function(path, state) {
				var options = state.opts;

				path.unshiftContainer("body", [
					t.expressionStatement(
						t.assignmentExpression(
							"=",
							t.memberExpression(t.identifier("window"), t.identifier("foo")),
							t.stringLiteral(options.text ? options.text : "default")
						)
					)
				]);
			}
		}
	};
}
