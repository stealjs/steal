steal("//steal/test/package/0").then(function(){
	packagesStolen.push("1");
}).defined("//steal/test/package/1.js");

steal(function(){
	packagesStolen = ["0"]
});
steal.defined("//steal/test/package/0.js");




