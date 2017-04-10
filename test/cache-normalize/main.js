var loader = require("@steal").loader;
var id = module.id;

function test(fn){
	if(typeof window !== "undefined" && window.assert) {
		fn(assert);
	}
}

loader.import("./dep", { name: id })
.then(function(){
	test(function(assert){
		var cacheHit = "./dep+" + id in loader._normalizeCache;
		assert.ok(cacheHit, "Added to the cache");
	});

	return loader.import("./dep", { name: id });
})
.then(function(){
	test(function(){
		assert.ok(true, "Imported twice");
		done();
	});
});
