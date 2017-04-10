// System-Ext
// This normalize-hook does 2 things.
// 1. with specify a extension in your config
// 		you can use the "!" (bang) operator to load
// 		that file with the extension
// 		System.ext = {bar: "path/to/bar"}
// 		foo.bar! -> foo.bar!path/to/bar
// 2. if you load a javascript file e.g. require("./foo.js")
// 		normalize will remove the ".js" to load the module
addStealExtension(function (loader) {
  loader.ext = {};

  var normalize = loader.normalize,
    endingExtension = /\.(\w+)!?$/;

  loader.normalize = function (name, parentName, parentAddress, pluginNormalize) {
    if (pluginNormalize) {
      return normalize.apply(this, arguments);
    }

    var matches = name.match(endingExtension);
	var outName = name;

    if (matches) {
      var hasBang = name[name.length - 1] === "!",
        ext = matches[1];
      // load js-files nodd-like
      if (parentName && loader.configMain !== name && matches[0] === '.js') {
        outName = name.substr(0, name.lastIndexOf("."));
        // matches ext mapping
      } else if (loader.ext[ext]) {
        outName = name + (hasBang ? "" : "!") + loader.ext[ext];
      }
    }
    return normalize.call(this, outName, parentName, parentAddress);
  };
});
