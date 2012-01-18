go(     ['require', 'earth', 'prime/earth'],
function (require,   earth,   primeEarth) {

    doh.register(
        "pluginsNormalize",
        [
            function pluginsNormalize(t){
                t.is("a", earth.getA().name);
                t.is("c", earth.getC().name);
                t.is("b", earth.getB().name);
                t.is("aPrime", primeEarth.getA().name);
                t.is("cPrime", primeEarth.getC().name);
                t.is("bPrime", primeEarth.getB().name);
             }
        ]
    );
    doh.run();
});
