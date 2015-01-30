@page StealJS.project-exporting Project Exporting
@parent StealJS.guides

Learn how to use StealJS to export your project into commonly used
formats and platforms.

Steal and steal-tools can be used to create a distributable that can
be used in almost any situation:

 - [syntax.global global format] and `<script>` tags
 - [syntax.CommonJS] and NPM for [Browserify](http://browserify.org/)
 - [syntax.amd] and Bower
 - [syntax.es6 ES Syntax] and StealJS, SystemJS, or JSPM

This guide creates a `can-tabs` plugin with [CanJS](http://canjs.com) that can 
be found at [https://github.com/bitovi-components/can-tabs](https://github.com/bitovi-components/can-tabs).

Although the example uses CanJS, the same techniques can be used to create and export projects that use any other
framework or library.


## Project Structure

Our project will have the following folders:

```
can-tabs/
  /dist       - non CJS/Browserify builds 
  	/amd      - AMD build
  	/global   - Global / <script> build
	
  /lib        - The CJS/Browserify build 

  /src        - Source files
    /lib      - Source files needed to be distributed 
	/test     - Test source files
```

The contents of _src/lib_ will be read and used to build out the _dist/amd_, _dist/global_ and _lib_ folders.

This structure allows a single package to be used in all the situations above. When 
[Browserify adds more powerful mapping behavior](https://github.com/substack/node-resolve/issues/62), the 
CJS distributable will be able to be placed anywhere, enabling more flexibility.

> Create `src/lib` and `src/test`.

For our example, the "main" entrypoint of this package will be _src/lib/can-tabs.js_.  

> Create the main entrypoint of the application in _src/lib_.


## package.json

Your project's `package.json` is used to conigure how Browserify or Steal loads your 
project. The following walks through the important parts:

### system

The "system" property specifies SystemJS and StealJS overwrites. By
setting the "directories.lib" property, we tell SystemJS
to look in the _can-tabs/src_ for any modules.  This means that `import "can-tabs/lib/can-tabs"`
will look in _can-tabs/src/lib/can-tabs_.

The "npmIgnore" property tells SystemJS to ignore processing certain dependencies's
package.jsons.

```
  "system": {
    "directories" : {
      "lib": "src"
    },
    "npmIgnore": ["cssify","devDependencies"]
  },
```

> Create a "system" property that points "directories.lib" to where SystemJS should find code. And,
> set "npmIgnore" to ignore dependencies that aren't needed by the browser.

### main

CJS/Browserify and StealJS will read the `main` property when someone require's your package.

```
  "main": "lib/can-tabs",
```

Because of the "system.directories.lib" setting, StealJS will look in _can-tabs/src/lib/can-tabs.js_, while
Browserify will look in _can-tabs/lib/can-tabs.js_

> Point "main" at the entrypoint of your package.


### dependencies

Use npm to install your project's dependencies.  If your project includes css or LESS files,
include `cssify`.  Browserify will use it to bundle css files.

```
  "dependencies": {
    "canjs": "2.2.0-alpha.8",
    "jquery": ">1.9.0",
    "cssify": "^0.6.0"
  }
```

Add `steal`, `steal-tools`, `grunt`, and `grunt-cli` to your project's devDependencies:

```
  "devDependencies": {
    "grunt": "~0.4.1",
    "grunt-cli": "^0.1.13",
    "steal": "0.5.0-pre.3",
    "steal-tools": "0.5.0-pre.8"
  },
```

> Add your project's dependencies to _package.json_.

### browser and browserify

Because our project will export CSS, we need to tell Browserify to 
run "cssify" on css files with a `transform`.  To make this work
with new and old versions of Browserify you must specify both the 
"browser" and "browserify" properties.

```
  "browser": {
    "transform": [ "cssify" ]
  },
  "browserify": {
    "transform": ["cssify"]
  },
```

> Specify Browserify transforms.

### scripts

Finally, prior to publishing to `npm`, we will want to make sure
our project is built. In the next step, we will create
a grunt build step that builds our project. For now,
we point at a grunt task that doesn't exist: 

```
  "scripts": {
    "prepublish": "./node_modules/.bin/grunt build"
  }
```

> Set "prepublish" to build the distributables.

## Gruntfile.js

Create a _Gruntfile.js_ that looks like the following:

```
module.exports = function (grunt) {

	grunt.loadNpmTasks('steal-tools');
	
	grunt.initConfig({
		stealPluginify: {
			dist: {
				system: {
					config: "package.json!npm"
				},
				outputs: {
					"+cjs": {dest: __dirname},
					"+amd": {},
					"+global-js": {},
					"+global-css": {}
				}
			}
		}
	});
	grunt.registerTask('build',['stealPluginify']);
};
```




Create a _Gruntfile.js_.

## Publishing


