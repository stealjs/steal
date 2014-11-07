@property {Object} System.lessOptions
@parent StealJS.config

A hash of options to customize the behavior of the [less](http://lesscss.org/usage/index.html#command-line-usage-options) compiler.

@body

## Use

You can see the list of possible options in the less [docs page](http://lesscss.org/usage/index.html#command-line-usage-options),
one of the available options is `strictMath`, by default the less compiler will process all maths in your css e.g.

    .foo {
        height: calc(100% - 10px);
    }

will be proccesed currently, if you want to change that, you'd do the following:

    System.config({
        main: "myapp",
        lessOptions: {
            strictMath: true  // default value is false.
        }
    });

with this in place, less will only proccess maths that is inside un-necessary parenthesis e.g

    .foo {
        height: calc(100% - (10px  - 5px));
    }

will be compiled to:

    .foo {
        height: calc(100% - 5px);
    }

`lessOptions.paths` and `lessOptions.filename` are used internally by StealJS and any value
provided will be ignored.
