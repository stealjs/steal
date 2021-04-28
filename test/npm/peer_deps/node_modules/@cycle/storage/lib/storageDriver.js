'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = storageDriver;

var _writeToStore = require('./writeToStore');

var _writeToStore2 = _interopRequireDefault(_writeToStore);

var _responseCollection = require('./responseCollection');

var _responseCollection2 = _interopRequireDefault(_responseCollection);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function storageDriver(request$) {
  // Execute writing actions.
  request$.subscribe(function (request) {
    return (0, _writeToStore2.default)(request);
  });

  // Return reading functions.
  return _responseCollection2.default;
}