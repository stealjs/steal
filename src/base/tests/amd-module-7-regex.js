define(function(require, exports, module){

  var not_require = function () {};
  var x1 = /'/gim,r1 = require('./amd-module');
  var x2 = /"/,r2 = require("./amd-module");
  var x3 = /"'/,r3 = not_require("./not-a-module");

  return {
    amd: true
  };

});
