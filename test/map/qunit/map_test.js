module("steal")

test("map", function() {
	ok(foo, "foo was loaded");
	ok(another, "another was loaded");
	ok(second, "second was loaded");
	ok($, "$ was loaded");
	ok($.String.capitalize, "$.String.capitalize was loaded");
})
