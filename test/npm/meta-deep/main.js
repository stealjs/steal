if (typeof window !== "undefined" && window.assert) {
	var cfg = steal.config("meta").foo;
	assert.equal(cfg.format, "global");
	assert.ok(cfg.deps, "has deps");
	assert.equal(cfg.deps.length, 1, "has 1 dep");
	assert.equal(cfg.deps[0], "bar", "has correct dep");

	done();
} else {
	console.log(steal.config("meta"));
}
