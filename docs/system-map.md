@property {Object.<moduleGlob, moduleName|Object.<moduleGlob,moduleName>>} System.map
@parent StealJS.config

Alter [moduleName]s.

@option {Object.<moduleGlob, moduleName|Object.<moduleGlob,moduleName>>} 

Specifies rules to convert an imported moduleName to another module name. The rules can
be specified globaly or limited to a specific path.

The following will alter "glob/*" modules across the whole application.

    System.map["glob/*"] = "moduleName/*" 

The following limits converting "jquery" to "jquery@1.2" to only within modules that match
"oldcode/*":

    System.map["oldcode/*"] = {
      "jquery": "jquery@1.2"
    };

@body

## Implementation

Implemented by [SystemJS](https://github.com/systemjs/systemjs#map-configuration). 