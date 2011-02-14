steal.loading("//steal/test/package/1.js",
	"//steal/test/package/0.js",
	"//steal/test/package/2.js");
	
steal("//steal/test/package/0").then(function(){
	packagesStolen.push("1");
}).then("//steal/test/package/2");

steal.loaded("//steal/test/package/1.js");

steal(function(){
	packagesStolen = ["0"]
});
steal.loaded("//steal/test/package/0.js");
packagesStolen.push("2");
steal.loaded("//steal/test/package/2.js");






