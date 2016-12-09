@page StealJS.circular Circular Dependencies
@parent StealJS.topics

@body

Circular dependencies refers to the uncommon, but some times necessary, practice of having two (or more) modules that depend on each other. Steal supports circular dependencies between modules of the same format. This means AMD modules can be circularly dependant on other AMD modules. ES modules with other ES modules, etc.

The legacy `steal()` format does not support circular dependencies. 

## ES Modules

ES modules get circular dependencies *right*, making it easier to use without having to think/worry about the fact that the modules depend on each other. Here's an example of 2 modules that depend on each other:

**foo**

```
import { getFoo, name as barName } from './bar';

export let name = 'foo';

export function getBar() {
	return barName;
}
```

**bar**

```
import { getBar, name as fooName } from './foo';

export let name = 'bar';

export function getFoo() {
	return fooName;
}
```

## AMD / CommonJS

AMD handles circular refs by allowing to import a special "exports" module, an object which represents the module's exports that you can modify. [This gist](https://gist.github.com/matthewp/63edaf2177374e4aaeecede68e54c8df) demonstrates how this works. 

CommonJS allows for the same behavior except you do not need to import any special module, but rather use `exports` directly:

```
exports.foo = function(){
};
```


