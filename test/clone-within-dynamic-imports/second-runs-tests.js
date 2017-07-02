var clone = require("steal-clone");
var second = require("./second");
console.log("running second-test");
clone({})
.import('./second')
.then(function(mod) {
	console.log("got second again", mod, second);
});
