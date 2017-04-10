// Steal Locate Extension
// normalize a given path e.g.
// "path/to/folder/" -> "path/to/folder/folder"
addStealExtension(function (loader) {
  var normalize = loader.normalize;
  var npmLike = /@.+#.+/;

  loader.normalize = function (name, parentName, parentAddress, pluginNormalize) {
    var lastPos = name.length - 1,
      secondToLast,
      folderName,
	  newName = name;

    if (name[lastPos] === "/") {
      secondToLast = name.substring(0, lastPos).lastIndexOf("/");
      folderName = name.substring(secondToLast + 1, lastPos);
      if (npmLike.test(folderName)) {
        folderName = folderName.substr(folderName.lastIndexOf("#") + 1);
      }

      newName += folderName;
    }
    return normalize.call(this, newName, parentName, parentAddress, pluginNormalize);
  };
});
