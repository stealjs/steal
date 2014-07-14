@page StealJS

_Good artists copy; great artists steal._

StealJS is a module loader and builder that will
help you create the next great app. Its designed to simplify 
dependency management while being extremely powerful and flexible.

Its module loader, [Steal], supports 
the future - [ES6 Module Loader](https://github.com/ModuleLoader/es6-module-loader) syntax -
with everything [traceur supports](https://github.com/google/traceur-compiler/wiki/LanguageFeatures),
while supporting AMD, and CommonJS.

Steal makes common use cases as simply as possible. Steal automatically
loads a config file, supports css and less, and can load plugins by 
extension (no more `!less` in `styles.less!less`).

Its builder, [StealTools], 
lets you build an application or export your project to AMD, 
CommonJS or standalone formats. But steal-tools 
killer feature, it can build progressively loaded apps that 
balance caching and the number of script requests, resulting
in lightening fast load times.