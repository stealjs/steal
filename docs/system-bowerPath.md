@property {String} System.bowerPath
@parent StealJS.config

Specifies the path to the folder where Bower dependencies can be found.

@option {String} The folder containing bower dependencies. Defaults to `bower_components`.

@body

## Use

When using the [Bower plugin](https://github.com/bitovi/system-bower) by default it will assume dependencies are located at `System.baseURL` + `/bower_components`, which is the default location that Bower installs dependencies. Since this is configurable by Bower itself, `bowerPath` provices a way to point to the directory where you install Bower dependencies.  Using in the script tag is the best option:

```
<script src="vendor/steal/steal.js"
	data-bower-path="vendor"
	data-main="main"></script>
```

Would load the Bower configuration file for, for example, `lodash` in `vendor/lodash/bower.json`.

## Implementation

Implemented in [system-bower](https://github.com/bitovi/system-bower).
