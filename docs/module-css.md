@typedef {{}} @css
@parent StealJS.modules

@option {{}} The `@css` module is configured to process CSS modules.  By default, 
extensions that end with `.css!` will use the `@css` module.  The path to the `@css`
module is automatically specified to `steal/css.js`.

@body

## Use

Specify a CSS dependency like:

    require("my.css!");

