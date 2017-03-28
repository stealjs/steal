var reload = require("live-reload");
var other = require("./other");

// Keep a count of how many times this reloads.
if(typeof window.counter !== "number") window.counter = -1;
window.counter++;

reload(function(){
	console.log("All complete", window.counter);
});

reload("other", function(other){
	console.log("Other is now", other);
});

reload.dispose(function(){
	console.log("Doing some cleanup");
});
