

QUnit.module("steal.joinURIs");

QUnit.test("Handles URIs with an @ symbol", function(assert){
	var expected;
	var result;

	expected = "http://127.0.0.1:8080/images/bird.png";
	result = steal.joinURIs("http://127.0.0.1:8080/node_modules/priv/dep/styles.less", "/images/bird.png");
	assert.equal(result, expected, "Works without the `@`");


	expected = "http://127.0.0.1:8080/images/bird.png";
	result = steal.joinURIs("http://127.0.0.1:8080/node_modules/@priv/dep/styles.less", "/images/bird.png");
	assert.equal(result, expected, "Works with the `@`");
});
