go(['car'], function (car) {

    doh.register(
        "namedWrapped/basic",
        [
            function namedWrappedBasic(t){
                t.is('car', car.name);
                t.is('wheels', car.wheels.name);
                t.is('engine', car.engine.name);
            }
        ]
    );
    doh.run();

});
