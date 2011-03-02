steal.loading('//steal/build/test/1.js','//steal/build/test/0.js','//steal/build/test/2.js');
steal("0").then(function(){
	packagesStolen.push("1");
},"2");
;
steal.loaded('//steal/build/test/1.js');
steal(function(){
	packagesStolen = ["0"]
});;
steal.loaded('//steal/build/test/0.js');
packagesStolen.push("2");;
steal.loaded('//steal/build/test/2.js');