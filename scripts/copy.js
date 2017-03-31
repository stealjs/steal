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

// copy babel plugin tests dependencies
(function() {
	var paths = [
		"babel_npm_plugins",
		"babel_env_plugins",
		"babel_plugin_options",
		"babel_plugins"
	];

	paths.forEach(function(folder) {
		fs.copySync(
			path.join(root, "node_modules", "babel-plugin-steal-test"),
			path.join(root, "test", folder, "node_modules", "babel-plugin-steal-test")
		);
	});
}());

// copy babel presets tests dependencies
(function() {
	var paths = [
		"babel_presets",
		"babel_env_presets",
		"babel_presets_options"
	];

	var deps = [
		"babel-preset-steal-test",
		"babel-plugin-steal-test"
	];

	paths.forEach(function(folder) {
		deps.forEach(function(dep) {
			fs.copySync(
				path.join(root, "node_modules", dep),
				path.join(root, "test", folder, "node_modules", dep)
			);
		});
	});
}());
