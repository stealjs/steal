var foo = require("./foo");
var clone = require("steal-clone");

CLONE_DONE = clone({}).import("~/foo").then(function(){

});
