@property {Boolean} System.bowerDev
@parent StealJS.config

Specifies whether `devDependencies` included in your bower.json will be included in configuration.

@option {Boolean} If true, allows devDependencies to be loaded through the Bower plugin.

@body

## Use

By default, the [Bower plugin](https://github.com/bitovi/system-bower) will only load configurations for deps listed in `dependencies`. In some cases you might want to also load the `devDependencies`, for example when running unit tests. To do so just include `bowerDev` in the script tag when loading Steal:

```
<script src="bower_components/steal/steal.js"
	data-bower-dev="true"
	data-main="tests"></script>
```

## Implementation

Implemented in [system-bower](https://github.com/bitovi/system-bower).
