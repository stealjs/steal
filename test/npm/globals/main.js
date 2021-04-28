var foo = $$$;

if (typeof window !== "undefined" && window.assert) {
	assert.deepEqual($$$, {} , "got globals/global first");
	done();
}
else {
	console.log("Global: ", $$$);
}
