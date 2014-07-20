@property {String} System.main
@parent StealJS.config

@option {String} The main module to load. This is the starting point of the application. In
[System.env development], the `main` module is loaded after the [@config] and [@dev] 
modules. In [System.env production], only the `main` module is loaded, but 
it is configured to load in a bundle.

In [System.env production], a [System.bundlesPath] + [System.main] bundle is
set to include the `main` module.

@body

## Use

Main should be configured by one of the approaches in [System.config].
