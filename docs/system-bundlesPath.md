@property {String} System.mainBundle
@parent StealJS.config

Specify the name of the main module's bundle.


@option {String} 

In [System.env production], the `main` module shoudl be within a module. By default
the [moduleName] of the bundle is `"bundles/[MAIN_MODULE_NAME]`". For example,

    System.config({
      main: "myapp",
      env: "production"
    });
    
    System.mainBundle //-> "bundles/myapp";
    System.bundles["bundles/myapp"] //-> ["myapp"]
    System.meta["bundles/myapp"] //-> {format: "amd"}

@body

## Use
