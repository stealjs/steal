/*bundlesConfig*/
/*@config*/
define("@config", [], function(){
	System.config({});
});

/*portfolio*/
define("portfolio", [
	"exports",
	"./utils"
], function(exports, _utils){
	Object.defineProperty(exports, '__esModule', { value: true });
	var _utils2 = _interopRequireDefault(_utils);
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}

	function Portfolio() {}
	Portfolio.balance = function(){
		return _utils2.default.inCurrency(5);
	};

	exports.default = Portfolio;
});

/*session*/
define('session', [
    'exports',
    './portfolio'
], function (exports, _portfolio) {
    'use strict';
	Object.defineProperty(exports, '__esModule', { value: true });
    var _portfolio2 = _interopRequireDefault(_portfolio);
    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
    }
    exports.default = {
        rates: 1000,
        logPortfolioBalance: function logPortfolioBalance() {
            console.log('portfolio.balance = ' + _portfolio2.default.balance());
        }
    };
});

/*utils*/
define("utils", [
	"exports",
	"./session"
], function(exports, _session){
	var t = exports;
	Object.defineProperty(t,"__esModule",{value:!0})
    var _session2 = _interopRequireDefault(_session);
    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
    }
    exports.default = {
        inCurrency: function inCurrency() {
            var amount = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
            return _session2.default.rates * amount;
        }
    };
});

/*main*/
define("main",[
	"./utils",
	"./portfolio"
],function(utils, portfolio){
	if(typeof window !== "undefined" && window.assert) {
		assert.equal(portfolio.default.balance(), 5000, "able to resolve circular dep");
		window.done();
	} else {
		console.log("Balance", portfolio.default.balance());
	}

});
