@page StealJS.project-exporting Project Exporting
@parent StealJS.guides 2

StealJS can export your project into commonly used formats and platforms.

Steal and steal-tools can be used to create a distributable that can
be used in almost any situation:

 - [syntax.global global format] and `<script>` tags
 - [syntax.CommonJS] and NPM for [Browserify](http://browserify.org/)
 - [syntax.amd] and Bower
 - [syntax.es6 ES Syntax] and StealJS, SystemJS, or JSPM

This guide creates a `bit-tabs` plugin with [CanJS](http://canjs.com) that can
be found on [GitHub](https://github.com/bitovi-components/bit-tabs).

Although the example uses CanJS, the same techniques can be used to create and export projects that use any other
framework or library.


## Project Structure

Our project will have the following folders:

```
bit-tabs/
  /dist
  	/amd      - AMD build
  	/cjs	  - CJS/Browserify builds
  	/global   - Global / <script> build
  /src        - Source files
  /test       - Test source files
```

The contents of _/src_ will be read and used to build out the _dist/amd_, _dist/cjs_ and _dist/global_ folders.


> Create `src/` and `test/`.

For our example, the "main" entry-point of this package will be _src/bit-tabs.js_.

> Create the main entry-point of the application in _src/_.


## package.json

Your project's `package.json` is used to configure how Browserify or Steal loads your
project. The following walks through the important parts:

### system

The "system" property specifies SystemJS and StealJS overwrites. By
setting the "directories.lib" property, we tell SystemJS
to look in the _can-tabs/src_ for any modules.  This means that `import "can-tabs/lib/can-tabs"`
will look in _can-tabs/src/lib/can-tabs_.

The "npmIgnore" property tells SystemJS to ignore processing the package.json files of certain dependencies.

```
  "system": {
    "main": "src/bit-tabs",
    "npmIgnore": ["devDependencies"]
  },
```

> Create a "system.main" property that points to where SystemJS should find code. And,
> set "npmIgnore" to ignore dependencies that aren't needed by the browser.

### main

CJS/Browserify and StealJS will read the `main` property when someone require's your package.

```
  "main": "dist/cjs/lib/bit-tabs",
```

### dependencies

Use npm to install your project's dependencies.  If your project includes css or LESS files,
include `cssify`.  Browserify will use it to bundle css files.

```
  "dependencies": {
    "can": "2.2.0-alpha.10",
    "cssify": "^0.6.0"
  },
```

Add `steal`, `steal-tools`, `grunt`, and `grunt-cli` to your project's devDependencies:

> Add your project's dependencies to _package.json_.

```
  "devDependencies": {
    "grunt": "~0.4.1",
    "grunt-cli": "^0.1.13",
    "steal": "0.6.0-pre.0",
    "steal-tools": "0.6.0-pre.2"
  },
```

### browser and browserify

Because our project will export CSS, we need to tell Browserify to 
run "cssify" on css files with a `transform`.  To make this work
with new and old versions of Browserify you must specify both the 
"browser" and "browserify" properties.

> Specify Browserify transforms.

```
  "browser": {
    "transform": ["cssify"]
  },
  "browserify": {
    "transform": ["cssify"]
  },
```

### scripts

Finally, prior to publishing to `npm`, we will want to make sure
our project is built. In the next step, we will create
a grunt build step that builds our project. For now,
we point at a grunt task that doesn't exist: 

> Set "prepublish" to build the distributables.

```
  "scripts": {
    "test": "grunt test --stack",
    "prepublish": "./node_modules/.bin/grunt build"
  },
```

## Gruntfile.js

We use [Grunt](http://gruntjs.com/) for task automation. If Grunt isn't
your thing, you can use [steal-tools.export steal-tool's export] method
programatically. Create a _Gruntfile.js_ that looks like the following:

> Create a _Gruntfile.js_ that looks like the following code block.
```
module.exports = function (grunt) {

	grunt.loadNpmTasks('steal-tools');
	
	grunt.initConfig({
		"steal-export": {
			dist: {
				system: {
					config: "package.json!npm"
				},
				outputs: {
					"+cjs": {},
					"+amd": {},
					"+global-js": {},
					"+global-css": {}
				}
			}
		}
	});
	grunt.registerTask('build',['steal-export']);
};
```

This uses the [steal-tools.grunt.export] task to export your project's main module
and its dependencies to CommonJS, AMD, and a global export that works with plain `<script>` tags.



## Publishing

To generate your project, run:

```
> npm run pre-publish
```

This should create the `dist/amd`, `dist/global`, and `lib` folders
with the files needed to use your project with AMD, `<script>` tags, and
CommonJS respectively. 

For now, you should inspect these files and make sure they work. Eventually,
we might release helpers that make it easy to test your 
distributables.

### To NPM

Run:

```
> npm publish
```

### To Bower

The first time you publish, you must regsiter your project and
create a bower.json.

Register your project's name:

```
> bower register can-tabs git://github.com/bitovi-components/can-tabs
```

Create a [bower.json](https://github.com/bower/bower.json-spec#name). The
easist thing to do is copy your `package.json` and remove any node 
specific values. 

```
{
  "name": "bit-tabs",
  "version": "0.0.1",
  "description": "",
  "main": "dist/cjs/lib/bit-tabs",
  "dependencies": {
      "can": "2.2.0-alpha.10",
      "cssify": "^0.6.0"
  },
  "system": {
      "main": "src/bit-tabs",
      "npmIgnore": ["testee","cssify"]
  },
}
```

Once bower is setup, publishing to bower just means pushing a 
[semver](http://semver.org/) tag to github that matches
your project's version.

```
> git tag v0.0.1
> git push origin tag v0.0.1
```

## Importing the Export

Developers need to know how to use your project. The following demonstrates what you need to tell them
depending on how they are using your project.

### NPM and StealJS

Simply import, require, or use define to load your project.

```
import "bit-tabs";
require("bit-tabs");
define(["bit-tabs"], function(){});
```


### NPM and CJS

Simply require your project.

```
require("bit-tabs")
```

### AMD

They must configure your project as a package:

```
require.config({
	    packages: [{
		    	name: 'bit-tabs',
		    	location: 'path/to/bit-tabs/dist/amd',
		    	main: 'dist/amd/src/bit-tabs'
	    }]
});
```

And then they can use it as a dependency:

```
define(["bit-tabs"], function(){

});
```

### Global / Standalone

They should add script tags for the dependencies and your project and a link
tag for your project's css:

```
	<head lang="en">
		<link rel="stylesheet" type="text/css" href="dist/global/bit-tabs.css">

		<script src='./node_modules/jquery/dist/jquery.js'></script>
		<script src='./node_modules/can/dist/can.jquery.js'></script>
		<script src='./node_modules/can/dist/can.stache.js'></script>
		<script src='dist/global/bit-tabs.js'></script>
		<script>
			$(function(){
				var frag = can.view("app-template", {});
				$("#my-app").html(frag);
			})
		</script>
	</head>
	<body>

	<script type='text/stache' id="app-template">
	  <can-import from="bit-tabs"/>
	  <bit-tabs>
		<can-panel title="CanJS">
		  CanJS provides the MV*
		</can-panel>
		<can-panel title="StealJS">
		  StealJS provides the infrastructure.
		</can-panel>
	  </bit-tabs>
	</script>

	<div id="my-app"></div>
```