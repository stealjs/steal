
//Map the configure({}) call to loader-specific call.
var config = steal,

    //Map the top-level entry point to start loading to loader-specific call.
    go = steal,

    //Indicate what levels of the API are implemented by this loader,
    //and therefore which tests to run.
    implemented = {
        basic: true,
        anon: false,
        funcString: false,
        namedWrapped: false,
        require: false,
        plugins: false,
        pluginDynamic: false
    };

//Remove the global require, to make sure a global require is not assumed
//in the tests
require = undefined;
