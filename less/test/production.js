steal.loading('//steal/less/test/test.js','//steal/less/less.js');
steal.plugins("steal/less").then(function(){steal.less("styles")}).css("styles");
;
steal.loaded('//steal/less/test/test.js');
steal({path:"less_engine.js",ignore:true},function(){steal.less=function(){if(steal.options.env=="production"){if(!steal.loadedProductionCSS){var a=steal.File(steal.options.production.replace(".js",".css")).normalize();a=steal.root.join(a);steal.createLink(a);steal.loadedProductionCSS=true}return steal}return steal}});
;
steal.loaded('//steal/less/less.js');