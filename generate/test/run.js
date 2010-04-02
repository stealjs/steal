// load('steal/generate/test/run.js')

/**
 * Tests generating a very basic plugin and then tries to load it
 * (one level deep first then two levels deep)
 */

load('steal/test/helpers.js')
_S.clear();

_args = ['cnu']; load('steal/generate/plugin');_S.clear();
_S.open('cnu/cnu.html')
if(typeof steal == 'undefined') throw "didn't load steal"
_S.clear();

//try 2 levels deep
_args = ['cnu/widget']; load('steal/generate/plugin');_S.clear();
_S.open('cnu/widget/widget.html')
if(typeof steal == 'undefined') throw "didn't load steal"
_S.clear();