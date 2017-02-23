var path = require("path");
var fs = require("fs-extra");

var root = path.join(__dirname, "..");

// copy test node_modules dependencies
var nodeModules = [
	"jquery",
	"jquery-ui"
];

nodeModules.forEach(function(mod) {
	fs.copySync(
		path.join(root, "node_modules", mod),
		path.join(root, "test", "npm", "node_modules", mod)
	);
});

// copy test/conditionals dependencies
fs.copySync(
	path.join(root, "node_modules", "steal-conditional"),
	path.join(root, "test", "npm", "conditionals", "node_modules", "steal-conditional")
);
