/*jslint strict: false, plusplus: false */
/*global location: false, doh: false, implemented: false */

(function () {
    var suffix = '.html' + location.search,
        levelNames = [
            'basic',
            'anon',
            'funcString',
            'namedWrapped',
            'require',
            'plugins',
            'pluginDynamic'
        ],
        i, levels, name;

    //Convenience function to register test.
    function reg(testName, timeout) {
        doh.registerUrl(testName, '../' + testName + suffix, timeout);
    }

    //Define the tests for each level.
    levels = {
        basic: function () {
            reg('basic/defineAmd');
            reg('basic/simple');
            reg('basic/circular');
        },

        anon: function () {
            reg('anon/simple');
            reg('anon/circular');
            reg('anon/relativeModuleId');
        },

        funcString: function () {
            reg('funcString/funcString');
        },

        namedWrapped: function () {
            reg('namedWrapped/basic');
        },

        require: function () {
            reg('require/basic');
        },

        plugins: function () {
            reg('plugins/double');
            reg('plugins/fromText');
            reg('plugins/normalize');
        },

        pluginDynamic: function () {
            reg('plugins/dynamic');
            reg('plugins/dynamicToString');
        }


        //basic: true, //include require, exports, module tests.
        //anonymous: true, //include function callback and basic object callback,
           //circular deps
        //commonJsWrapper: true,

    };

    //Cycle through the level names, if the config , and call the tests
    for (i = 0; (name = levelNames[i]); i++) {
        if (implemented[name]) {
            levels[name]();
        }
    }
}());
