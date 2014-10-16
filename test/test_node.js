var steal = require('../main');


var localSteal =  steal.clone( steal.addSteal( steal.System.clone() ) );

global.steal = localSteal;
global.System = localSteal.System;

System.logLevel = 0;

localSteal.config({
	config: __dirname+"/node_test_plugins/config.js",
	main: "main"
});

localSteal.startup().then(function(){
	console.log("worked");
},function(e){
	console.log(e);
})
