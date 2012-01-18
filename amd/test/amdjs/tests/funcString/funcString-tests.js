go(['one', 'two', 'three'], function (one, two, three) {

    var args = two.doSomething(),
        oneMod = two.getOneModule();

    doh.register(
        "funcString",
        [
            function funcString(t){
                t.is("large", one.size);
                t.is("small", two.size);
                t.is("small", args.size);
                t.is("redtwo", args.color);
                //Check CommonJS "module.id" property support.
                t.is("one", oneMod.id);
                t.is('three', three.name);
                t.is('four', three.fourName);
                t.is('five', three.fiveName);
            }
        ]
    );
    doh.run();

});
