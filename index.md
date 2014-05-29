---
layout: default
title: StealJS
version: 0.2.0
downloadUrl: http://canjs.us/release/1.1.5
---

# Good artists copy; great artists steal.

StealJS is a client module loader and builder that will
help you create the next great app. Its designed to simplify 
dependency management while being extremely powerful and flexible.

Its client loader, [steal](https://github.com/bitovi/steal), supports 
the future - [ES6 Module Loader](https://github.com/ModuleLoader/es6-module-loader) syntax -
with everything [traceur supports](https://github.com/google/traceur-compiler/wiki/LanguageFeatures),
while supporting AMD, and CommonJS.

Steal makes common use cases as simply as possible. Steal automatically
loads a config file, supports css and less, and can load plugins by 
extension (no more `!less` in `styles.less!less`).

Its builder, [steal-tools](https://github.com/bitovi/steal-tools), 
lets you build an application or export your project to AMD, 
CommonJS or standalone formats. But steal-tools 
killer feature, it can build progressively loaded apps that 
balance caching and the number of script requests, resulting
in lightening fast load times.

## Quick Start

The following uses npm and bower to install steal, steal-tools, grunt,
and jQuery and creates a little app that writes `Hello World` to 
the page and build it. An application does not need to be setup this way
to work.  This is just a common way.

### Install

Install [Node.js](http://nodejs.org/) on your 
computer. Within your `ROOT` folder,
use npm to install bower, grunt, and steal-tools:

    > npm install -g bower
    > npm install grunt --save-dev
    > npm install steal-tools --save-dev

Use bower to install steal and jQuery:

    > bower install steal -S
    > bower install jquery -S

Your `ROOT` folder should contain all your static scripts and 
resources.  It should now look like this:

      ROOT/
        bower_components/
        bower.json
        node_modules/
        package.json
         
### Setup

Create `index.html`, `stealconfig.js`, and `main.js`, files in your ROOT folder so it looks like:

      ROOT/
        bower_components/
        bower.json
        node_modules/
        package.json
        index.html
        stealconfig.js
        main.js
        
`index.html` loads your app. Add the following code that loads `steal` and
tells steal to load the `main` module.

    <!DOCTYPE html>
    <html>
      <body>
        <script src='./bower_components/steal/steal.js'
                data-main='main'></script>
      </body>
    </html>

`stealconfig.js` is loaded by every page in your 
project. It is used to configure the location to modules and 
other behavior.  Use it to configure the location of the `"jquery"` module by adding the following
code:

    System.paths.jquery = "bower_components/jquery/dist/jquery.js";
    System.meta.jquery = { exports: "jQuery" };

`main.js` is the entrypoint of the application. It should load import your
apps other modules and kickoff the application. Write the following in `main.js`:

    import $ from "jquery";
    $(document.body).append("<h1>Hello World!</h1>");
    
This imports jQuery with ES6 module syntax.
    
### Run in the browser

Open `index.html` in the browser.  You should see a big "Hello World".

### Build

Create a `Gruntfile.js` in your ROOT folder. Configure grunt to 
call `stealBuild`

    module.exports = function (grunt) {
      grunt.initConfig({
        stealBuild: {
          html: "index.html"
        }
      });
      grunt.registerTask('build',['stealBuild']);
    };

After saving `Gruntfile.js` run:

    > grunt build
    
This will read `index.html` and build `dist/index.html` to load 
`dist/bundles/main.js`.  `dist/bundles/main.js` will include `steal.js`, `stealconfig.js`, the `main` module
and its dependencies.

Open `dist/index.html` to see your built app in action.


## Steal

### Syntaxes

### Config Options

## StealTools

### Build

### Pluginify