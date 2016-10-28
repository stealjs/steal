@property {moduleName|Array<moduleName>} config.main main
@parent StealJS.config

The name of the module(s) that loads all other modules in the application.

  @option {moduleName} The main module to load after [config.configMain]. 
  
  @option {Array<moduleName>} An array of main modules that will be loaded after [config.configMain].



@body

## Use

This is the starting point of the application. In
[config.env development], the `main` module is loaded after the [config.configMain] and [@dev] 
modules. In [config.env production], only the `main` module is loaded, but 
it is configured to load in a bundle.

Main should be configured by one of the approaches in [config.config].


## Use with npm

In [config.env development], your application's `package.json` will be read
and the main module set automatically.  For instance, if 
your package.json looks like:


```
{
  "main": "my/main.js",
  ...
}
```

The following will load `package.json` with the [npm] module and automatically load
`my/main.js`:

```
<script src="../node_modules/steal/steal.js">
</script> 
```

In [config.env production], make sure your script specifies `main` so the correct bundle to load
can be known.
