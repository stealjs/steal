define('one', [
    'require',
    'exports',
    'module',
    /*'two'*/
], function (require, exports, module) {
  module.exports = One;

  One.Two = require("./two");

  function One() {

  }

  window.APP = {};
  window.APP.One = One;
});

define('two', [
    'require',
    'exports',
    'module',
    /*'one'*/
], function (require, exports, module) {
  module.exports = Two;

  var One = require("./one");

  function Two() {

  }

  Two.prototype = Object.create(One.prototype);
});

define(['one']);
