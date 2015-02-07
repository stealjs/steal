@page StealJS.changelog Changelog
@parent StealJS.guides

## 0.6.0

### steal

- Added the [npm] extension.
- Add the [bower] extension.
- Updated SystemJS and ESML
- If _steal.js_ is found in node_modules, 
  load `package.json!npm` as [System.configMain].
- If _steal.js_ is found in bower_components, load
  `bower.json!bower` as [System.configMain].
- Replaced `@config` with [System.configMain]. If you were doing:
      
      System.import("@config")
      
  You should do:
  
      System.import(System.configMain)

### steal-tools


- Added [steal-tools/lib/build/helpers/amd],
  [steal-tools/lib/build/helpers/cjs] and
  [steal-tools/lib/build/helpers/global] export helpers.
- Grunt task `stealPluginify` is now `steal-export`
- Grunt task `stealBuild` is now `steal-build`.
- `stealTools.pluginifier` is now `steal.transform`.
- Command line `steal-tools pluginify` is now `steal tools transform`.
- [steal-tools.export], formerly the _lib/build/pluginifier_builder_ module
  now returns a deferred and the defaults and modules arguments have been switched.
