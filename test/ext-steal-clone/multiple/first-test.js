var clone = require("steal-clone");

module.exports = function(){
	return clone({}).import("./first")
}
