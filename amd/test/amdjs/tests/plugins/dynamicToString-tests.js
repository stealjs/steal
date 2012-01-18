/*jslint strict: false */
/*global go, doh */

go(['mattress'], function (mattress) {

    doh.register(
        'pluginsDynamicToString',
        [
            function pluginsDynamicToString(t) {
                //Make sure the resource names do not match for the
                //three kinds of pillow-related resources.
                t.is('mattress', mattress.name);
                t.is('1:medium', mattress.id1);
                t.is('2:medium', mattress.id2);
            }
        ]
    );
    doh.run();

});
