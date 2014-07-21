@page StealJS
@group StealJS.api apis
@group StealJS.guides guides

_Good artists copy; great artists steal._

StealJS is a module loader and builder that will
help you create the next great app. Its designed to simplify 
dependency management while being extremely powerful and flexible.

Its module loader, [steal], supports 
the future - [ES6 Module Loader](https://github.com/ModuleLoader/es6-module-loader) syntax -
with everything [traceur supports](https://github.com/google/traceur-compiler/wiki/LanguageFeatures),
while supporting AMD, and CommonJS.

Steal makes common use cases as simply as possible. Steal automatically
loads a [@config config] and [@dev development tools] module, supports css and less, and makes it easy to switch
between development and production [System.env environments].

Its builder, [steal-tools steal-tools], 
lets you build an application or export your project to AMD, 
CommonJS or standalone formats. But steal-tools 
killer feature, it can build progressively loaded apps that 
balance caching and the number of script requests, resulting
in lightning-fast load times.


## Quick Start

The following uses npm and bower to install steal, steal-tools, grunt,
and jQuery and creates a little app that writes `Hello World` to 
the page and build it. An application does not need to be setup this way
to work.  This is just a common way.

### Install

Install [Node.js](http://nodejs.org/) on your 
computer. Locate the folder that contains all your static content, scripts, and 
styles. This is your [System.baseURL BASE] folder.  Within that folder,
use [npm](https://www.npmjs.org/) to 
install [bower](http://bower.io/), [grunt](http://gruntjs.com/), and steal-tools:

    > npm install -g bower
    > npm install grunt --save-dev
    > npm install steal-tools --save-dev

Use bower to install steal and jQuery:

    > bower install steal -S
    > bower install jquery -S

Your `BASE` folder should contain all your static scripts and 
resources.  It should now look like this:

      BASE/
        bower_components/
        bower.json
        node_modules/
        package.json
         
### Setup

Create `index.html`, `stealconfig.js`, and `main.js`, files in your BASE folder so it looks like:

      BASE/
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

[@config stealconfig.js] is loaded by every page in your 
project. It is used to configure the location to modules and 
other behavior.  Use it to configure the location of the `"jquery"` module by adding the following
code:

    System.config({
      paths: {jquery: "bower_components/jquery/dist/jquery.js"},
      meta: {jquery: { exports: "jQuery" } }
    });

`main.js` is the entrypoint of the application. It should load import your
apps other modules and kickoff the application. Write the following in `main.js`:

    import $ from "jquery";
    $(document.body).append("<h1>Hello World!</h1>");
    
This imports jQuery with ES6 module syntax.
    
### Run in the browser

Open `index.html` in the browser.  You should see a big "Hello World".

### Build

Create a `Gruntfile.js` in your BASE folder. Configure grunt to 
call `stealBuild`

    module.exports = function (grunt) {
      grunt.initConfig({
        stealBuild: {
          default: {
            options: {
              system: {
                main: "main",
                config: _dirname+"/stealconfig.js"
              }
            }
          }
        }
      });
      grunt.registerTask('build',['stealBuild']);
    };

After saving `Gruntfile.js` run:

    > grunt build
    
### Switch to production

Change `index.html` to look like:

    <!DOCTYPE html>
    <html>
      <body>
        <script src='./bower_components/steal/steal.production.js'
                data-main='main'></script>
      </body>
    </html>

### Run in production 

Open `index.html` in the browser. You should see a big "Hello World". If you check
the network tab, you should see only two scripts load.

