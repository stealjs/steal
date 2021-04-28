function privateBar() {
    return bar();
}

export function bar() {
    return 'bar result';
}

export function foo() {
    return privateBar();
}

var result = foo();

if(typeof window !== "undefined" && window.assert) {
	assert.equal(result, "bar result", "it worked yo");
	done();
}
