/**
 * Module dependencies.
 */

var express = require('express'),
	util = require("util"),
	app = module.exports = express.createServer(),
	exec		= require('child_process').exec;

/**/
express.static.mime.define({
	"text/plain" : ["ejs"]
});

// Configuration

app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + "../../.."));
  app.use(express.directory(__dirname + "../../.."));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

app.all("*", function( req, res, next ) {
	if ( req.query && req.query.sleep ) {
		setTimeout( next, req.query.sleep * 1000 );
	} else {
		next();
	}
});

// Routes
app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
exec("open http://localhost:3000/steal/preload/test/index.html");
