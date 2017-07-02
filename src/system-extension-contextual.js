addStealExtension(function (loader) {
  loader._contextualModules = {};

  loader.setContextual = function(moduleName, definer){
    this._contextualModules[moduleName] = definer;
  };

  var normalize = loader.normalize;
  loader.normalize = function(name, parentName){
    var loader = this;
	var pluginLoader = loader.pluginLoader || loader;

    if (parentName) {
      var definer = this._contextualModules[name];

      // See if `name` is a contextual module
      if (definer) {
        var localName = name + '/' + parentName;

        if(!loader.has(localName)) {
          // `definer` could be a function or could be a moduleName
          if (typeof definer === 'string') {
            definer = pluginLoader['import'](definer);
          }

          return Promise.resolve(definer)
            .then(function(modDefiner) {
				var definer = modDefiner;
              if (definer['default']) {
                definer = definer['default'];
              }
              var definePromise = Promise.resolve(
                definer.call(loader, parentName)
              );
              return definePromise;
            })
            .then(function(moduleDef){
              loader.set(localName, loader.newModule(moduleDef));
              return localName;
            });
        }
        return Promise.resolve(localName);
      }
    }

    return normalize.apply(this, arguments);
  };
});
