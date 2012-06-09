steal.loading('steal/test/myapp/one.js', 'steal/test/myapp/two.js',
		'steal/test/myapp/three.js', 'steal/test/myapp/common.js');
steal("./two.js").then("./three.js").then(
		function() {
			TWO.digit = 2;
			THREE.digit = 3;
			document.body.appendChild(document.createTextNode(JSON
					.stringify(TWO)
					+ JSON.stringify(THREE)
					+ JSON.stringify(COMMON)
					+ "production.js loading test - PASS"))
		});
steal.loaded("steal/test/myapp/one.js");
steal("./common.js").then(function() {
	TWO = {}
});
steal.loaded("steal/test/myapp/two.js");
(function(a) {
	a.name = "ARJUN";
	THREE = {}
})(COMMON);
steal.loaded("steal/test/myapp/three.js");
(function() {
	COMMON = {}
})();
steal.loaded("steal/test/myapp/common.js");
