'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getResponseObj;

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getStorage$(request$, type) {
  return _rx2.default.Observable.if(function () {
    return type === 'local';
  }, request$.filter(function (req) {
    return !req.target || req.target === 'local';
  }), request$.filter(function (req) {
    return req.target === 'session';
  }));
}

function storageKey(n, request$) {
  var type = arguments.length <= 2 || arguments[2] === undefined ? 'local' : arguments[2];

  var storage$ = getStorage$(request$, type);
  var key = type === 'local' ? localStorage.key(n) : sessionStorage.key(n);

  return storage$.filter(function (req) {
    return req.key === key;
  }).map(function (req) {
    return req.key;
  }).startWith(key).distinctUntilChanged();
}

function storageGetItem(key, request$) {
  var type = arguments.length <= 2 || arguments[2] === undefined ? 'local' : arguments[2];

  var storage$ = getStorage$(request$, type);
  var storageObj = type === 'local' ? localStorage : sessionStorage;

  return storage$.filter(function (req) {
    return req.key === key;
  }).map(function (req) {
    return req.value;
  }).startWith(storageObj.getItem(key));
}

function getResponseObj(request$) {
  var type = arguments.length <= 1 || arguments[1] === undefined ? 'local' : arguments[1];

  return {
    // Function returning Observable of the nth key.

    key: function key(n) {
      return storageKey(n, request$, type);
    },

    // Function returning Observable of item values.
    getItem: function getItem(key) {
      return storageGetItem(key, request$, type);
    }
  };
}