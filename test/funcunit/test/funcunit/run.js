//load("steal\test\qfunctional\test\qfunctional\run_functional.js")



//load global selenium settings
load('steal/settings/selenium.js')

// load qfunctional
load('steal/rhino/loader.js');
rhinoLoader(function(){
    steal.plugins('steal/test/funcunit/test/funcunit');
}, true);