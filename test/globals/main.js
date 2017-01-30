var foo = $$$;

if (typeof window !== "undefined" && window.QUnit) {
	QUnit.deepEqual($$$, {} , "got globals/global first");

	QUnit.start();
	removeMyself();
}
else {
	console.log("Global: ", $$$);
}
