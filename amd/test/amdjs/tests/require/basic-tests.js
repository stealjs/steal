go(['require', 'a'], function (require) {

    require(['b', 'c'], function (b, c) {

        doh.register(
            "require/basic",
            [
                function requireBasic(t){
                    t.is('a', require('a').name);
                    t.is('b', b.name);
                    t.is('c', c.name);
                    t.is(true, /c\/templates\/first\.txt$/.test(c.url));
                }
            ]
        );
        doh.run();

    });
});
