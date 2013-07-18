var fs = require("fs")
  , exists = fs.existsSync
  , stat = fs.statSync
  , readdir = fs.readdirSync;


var idFun = steal.id;
steal.id = function(id, currentWorkingId){
	var nodeRequire = steal.config("nodeRequire") || require;

	try {
		nodeRequire.resolve(id);
		return steal.URI(id);
	} catch(err){
		return idFun.apply(this,arguments);
	}
};


var idToUri = steal.idToUri;
steal.idToUri = function(id, noJoin){
	var nodeRequire = steal.config("nodeRequire") || require;

	// See if this is a node module
	try {
		nodeRequire.resolve(id+"");
		return id;
	} catch(err){
		return idToUri(id+"", noJoin);
	}
 
};
