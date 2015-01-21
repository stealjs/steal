var steal = require("../main");
var assert = require("assert");


var makeSteal = function(config){
	var localSteal =  steal.clone( steal.addSteal( steal.System.clone() ) );
	localSteal.System.config(config || {});
	return localSteal;
};


describe("plugins", function(){
	
	it("are able to convert less", function(done){
		var steal = makeSteal({
			config: __dirname+"/config.js",
			main: "dep_plugins/main"
		});
		steal.startup().then(function(){
			
			assert.ok( /width: 200px/.test( steal.System._loader.modules["dep_plugins/main.less!$less"].module.default.source ) );
			done();
		},done);
		
	});
	
});
