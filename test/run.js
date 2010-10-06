// load('steal/test/run.js')
/**
 * Steal qunit tests
 */

load('steal/test/helpers.js')
_S.clear();

load('settings.js')
load('funcunit/funcunit.js')
Funcunit.runTest('steal/test/qunit/qunit.html')