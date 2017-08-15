define(function(require, exports, module){

  var x1 = /'/gim,r1 = require('./amd-module');
  var x2 = /"/,r2 = require("./amd-module");

  return {
    amd: true
  };

});
