steal.loading('//steal/test/package/1','//steal/test/package/0','//steal/test/package/2');
steal("0").then(function(){
	packagesStolen.push("1");
},"2");
;
steal.loaded('//steal/test/package/1');
steal(function(){
	packagesStolen = ["0"]
});
steal.loaded('//steal/test/package/0');
packagesStolen.push("2");;
steal.loaded('//steal/test/package/2');