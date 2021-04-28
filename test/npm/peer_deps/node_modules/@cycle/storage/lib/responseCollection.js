'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (request$) {
  return {
    // For localStorage.
    get local() {
      return (0, _util2.default)(request$);
    },
    // For sessionStorage.
    get session() {
      return (0, _util2.default)(request$, 'session');
    }
  };
};

var _util = require('./util');

var _util2 = _interopRequireDefault(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }