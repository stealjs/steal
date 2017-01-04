addStealExtension(function (loader) {
  loader._contextualModules = {};

  loader.setContextual = function(moduleName, definer){
    this._contextualModules[moduleName] = definer;
  };

  var normalize = loader.normalize;
  loader.normalize = function(name, parentName){
    var loader = this;

    if (parentName) {
      var definer = this._contextualModules[name];

      // See if `name` is a contextual module
      if (definer) {
        name = name + '/' + parentName;

        if(!loader.has(name)) {
          // `definer` could be a function or could be a moduleName
          if (typeof definer === 'string') {
            definer = loader['import'](definer);
          }

          return Promise.resolve(definer)
            .then(function(definer) {
              if (definer['default']) {
                definer = definer['default'];
              }
              var definePromise = Promise.resolve(
                definer.call(loader, parentName)
              );
              return definePromise;
            })
            .then(function(moduleDef){
              loader.set(name, loader.newModule(moduleDef));
              return name;
            });
        }
        return Promise.resolve(name);
      }
    }

    return normalize.apply(this, arguments);
  };
});