var documentjs = require("documentjs"),
	path = require("path");


documentjs({
	pattern: "{steal,steal-tools}/**/*.+(md)",
	cwd: __dirname
},{
	out: path.join(__dirname,"docs"),
	parent: "StealJS",
	forceBuild: true,
	"static": __dirname+"/theme/static"
});
