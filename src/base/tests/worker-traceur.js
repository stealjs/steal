importScripts('../../loader/loader.js', '../base.js');

System.baseURL = '../';
System.paths['traceur'] = '../node_modules/traceur/bin/traceur.js';
System.transpiler = 'traceur';

System.import('tests/es6-and-amd').then(function(m) {
  postMessage({
    amd: m.amd_module,
    es6: m.es6_module
  });
}, function(err) {
  console.error(err);
});
