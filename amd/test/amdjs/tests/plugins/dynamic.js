
/*jslint strict: false */
/*global define: false */

(function () {
    var counter = 0;
    define(function () {
        //Depends on loader to normalize relative resource names, so it
        //does not implement normalize().
        return {
            dynamic: true,

            load: function (name, require, load, config) {
                counter += 1;
                load(counter + ':' + name);
            }
        };
    });

}());
