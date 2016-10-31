@page StealJS.guides.progressive_loading Progressive Loading
@parent StealJS.guides 2
@outline 0

@body

<!-- hack! -->
<style>.contents { display: none; }</style>

If you've tried the [Quick Start](./StealJS.quick-start.html) guide you've seen a taste of what it's like to use StealJS.

This guide expands upon the quick start guide to give a full example of using Steal's primary feature, progressive loading, to build a single page application that loads only what is necessary.

This will be demonstrated by creating a small sample application called **myhub**.

## Install Prerequisites

### Window Setup

1.  Install [NodeJS](https://nodejs.org/).
2.  Install Chocolatey, Python, Windows SDK, and Visual Studio as described [here](http://stealjs.com/docs/guides.ContributingWindows.html).

### Linux / Mac Setup

1.  Install [NodeJS](https://nodejs.org/).

## Setting up a new project

###  Create a new project folder

Create a new folder for your project and then run `npm init`. Answer all questions with their defaults.

```
> mkdir myhub
> cd myhub
> npm init
```

<img width="682" alt="screen shot 2016-10-31 at 3 21 49 pm" src="https://cloud.githubusercontent.com/assets/361671/19868287/c926dcec-9f7d-11e6-97e5-9b0ece2165ee.png">

### Create and host the main page

Create _myhub.html_ with:

```html
<!doctype html>
<html lang="en">
  <head></head>
  <body>
    Hello World!
  </body>
</html>
```

Next install and run a local fileserver. [http-server](https://www.npmjs.com/package/http-server) handles our basic needs. We'll install it locally and then and it to our npm scripts:

```
> npm install http-server --save
```

Next edit your `package.json` so that the start script looks like:

```json
"scripts": {
  "start": "http-server"
}
```

This allows us to start the server with:

```
> npm start
```

Open [http://127.0.0.1:8080/myhub.html](http://127.0.0.1:8080/myhub.html). You should see the *Hello world!* test.

> Before proceeding kill the development server so we can install some dependencies. Use cmd+c on Mac or ctrl+c on Windows or Linux/BSD.

### Install steal, steal-tools, and jquery

Installing these 3 dependencies gives us everything we need to build our application.

```
> npm install steal jquery --save
> npm install steal-tools steal-less --save-dev
```

Now restart your server; you can keep it on while you develop the rest of the application.

```
> npm start
```

## Import your first module

### Create the module

Create _myhub.js_ with the following:

```js
import $ from "jquery";

$("body").html("<h1>Goodbye script tags!</h1>");
```

### Use steal.js in your page

Update _myhub.html_ with:

```html
<!doctype html>
<html lang="en">
  <head></head>
  <body>
    Hello World!
    <script src="./node_modules/steal/steal.js"></script>
  </body>
</html>
```

### Update package.json with the right main

Update _package.json_ to:

```json
{
  ...
  "main": "myhub.js",
}
```

Reload _myhub.html_ to see your changes.

## Import styles

What's an application without a little bit of flare? Steal allows using [less](http://lesscss.org/) through [steal-less](https://github.com/stealjs/steal-less), which we installed earlier.

### Create and import a less file

Create _myhub.less_ with:

```less
body h1 {
    color: #2193C4;
}
```

Import it with the following updated _myhub.js_:

```js
import $ from "jquery";
import "./myhub.less";

$("body").html("<h1>Goodbye script tags!</h1>");
```

Each string used to import such as `"jquery"` and `"./myhub.less"` are called [moduleIdentifier module identifiers]. They identify a module to be imported within the context of the module that is importing them. That means that when you import a module like `"./myhub.less"` you are importing that module relative to the current module (in this case it is your myhub.js module).

Internally Steal resolves all module identifiers into [moduleName moduleNames], which it uses as the **key** to look up modules. This allows you to load modules from many different places in the application and them all resolve to the same module.

### Install and import bootstrap

> Again kill your server using cmd+c on Mac or ctrl+c on Windows / Linux.

Next install bootstrap with:

```
> npm install bootstrap --save
```

Update the _myhub.html_ to use bootstrap with:

```html
<!doctype html>
<html lang="en">
  <head>
      <meta charset="utf-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body>
    <script src="./node_modules/steal/steal.js"></script>
  </body>
</html>
```

Import it and use it with the following updated _myhub.js_:

```js
import $ from "jquery";
import "./myhub.less";
import "bootstrap/dist/css/bootstrap.css";

$("body").append(`
	<div class='container'>
		<h1>Goodbye script tags!</h1>
    </div>
`);
```

Once you restart your server again (`npm start`) you'll be able to see your changes when you refresh.

This shows Steal's ability to load modules from npm using its built-in [npm] plugin. For most modules all you need to do is install them and then import and use them.

## Create a modlet

Steal encourages the use of [modlets](https://www.bitovi.com/blog/modlet-workflows) as a unit of functionality in your application. A modlet is a folder that contains an implementation file, test, demo page, test page, and documentation about a module. It is a useful development strategy to ensure your application is well tested.

Here we're going to create a modlet to show how this workflow can be beneficial:

### Create the demo page

Create _repos/repos.html_ with:

```html
<!doctype html>
<html lang="en">
  <head>
	  <meta charset="utf-8">
	  <meta http-equiv="X-UA-Compatible" content="IE=edge">
	  <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body>
    <div id="repos"/>
    <script src="../node_modules/steal/steal.js" main="@empty"></script>
	<script type="text/steal-module">
        import repos from "myhub/repos/repos";
        repos("#repos");
	</script>
  </body>
</html>
```

### Create the module implementation

Create _repos/repos.js_ with the following code. Update `{user}` with your GitHub user name. This will display your repos:

```js
import $ from "jquery";
import "bootstrap/dist/css/bootstrap.css";

export default function(selector){
    $(selector).html("Loading...")
    $.ajax({
        url: "https://api.github.com/users/matthewp/repos",
        jsonp: "callback",
        dataType: "jsonp",
        success: function( response ) {
            var defs = response.data.map(function(repo){
                return `
                <dt>
                  <a href="${repo.url}">
                    ${repo.name}
                  </a>
                </dt>
                <dd>${repo.description}</dt>
                `;
            });
            $(selector).html(`
              <dl class='dl-horizontal'>
                ${defs.join("")}
              </dl>
            `);
        }
    });
};
```

### Create the test page

Create _repos/repos-test.html_ with:

```html
<title>myhub/repos/repos</title>
<script src="../node_modules/steal/steal.js" 
        main="myhub/repos/repos-test"></script>
<div id="qunit-fixture"></div>
```

### Create the test

Install `steal-qunit` with:

```
> npm install steal-qunit --save-dev
```

Create _repos/repos-test.js_ with:

```js
import QUnit from "steal-qunit";
import repos from "./repos";

QUnit.module("myhub/repos/");

QUnit.test("basics", function(){
    stop();
    var fixtureEl = document.getElementById("qunit-fixture");

    repos(fixtureEl);

    QUnit.equal(
        fixtureEl.innerHTML,
        "Loading...", "starts with loading");

    var interval = setInterval(function(){
        var dl = fixtureEl.getElementsByTagName("dl");
        if(dl.length === 1) {
            QUnit.ok(true, "inserted a dl");
            QUnit.start();
            clearInterval(interval);
        }
    },100);
});
```

### Use the module

Update _myhub.js_ to:

```js
import $ from "jquery";
import "./myhub.less";
import "bootstrap/dist/css/bootstrap.css";
import repos from "./repos/repos";

$("body").append(
    "<div class='container'>"+
    "<h1>Goodbye script tags!</h1>"+
    "<div id='repos'/>"+
    "</div>");

repos('#repos');
```

## Create test with dependency injection

Dependency injection is a technique used to improve testing in your application. Steal provides dependency injection through its module system using [steal.steal-clone]. steal-clone allows you to create a cloned loader with stubs for modules that you want to fake.

Here we'll create a new test and use [steal.steal-clone] to provide our own fake version of jQuery. This lets us simulate a service request so that we can test that the rest of our app behaviors correctly; in this case it should list the one repo that we give it.

Update _repos/repos-test.js_ with:

```js
import QUnit from "steal-qunit";
import repos from "./repos";
import clone from "steal-clone";
import $ from "jquery";

QUnit.module("myhub/repos/");

QUnit.test("basics", function(){
    QUnit.stop();
    var fixtureEl = document.getElementById("qunit-fixture");

    repos(fixtureEl);

    QUnit.equal(
        fixtureEl.innerHTML,
        "Loading...", "starts with loading");

    var interval = setInterval(function(){
        var dl = fixtureEl.getElementsByTagName("dl");
        if(dl.length === 1) {
            QUnit.ok(true, "inserted a dl");
            QUnit.start();
            clearInterval(interval);
        }
    },100);
});

QUnit.asyncTest("basics with dependency injection", function(){
    var jQuery = function(selector){
        return $(selector)
    };
    jQuery.ajax = function(options){
        setTimeout(function(){
            options.success({
                data: [{
                    url: "http://stealjs.com",
                    name: "StealJS",
                    description: "Futuristic Module Loader"
                }]
            });

            var html = $("#qunit-fixture").html();

            QUnit.ok(/href="http:\/\/stealjs.com"/.test(html),
              "updated with request");
            QUnit.start();
        },1);
    };

    clone({
        "jquery": {"default": jQuery}
    }).import("myhub/repos/repos").then(function(module){
        var repos = module["default"];

        var fixtureEl = document.getElementById("qunit-fixture");
        repos(fixtureEl);
    });
});
```

## Import a global script in a CommonJS modlet

Steal supports all of the most common module formats: [syntax.es6 ES modules], [syntax.CommonJS], and [syntax.amd]. Your project can contain multiple formats; as is common when you are using ES modules but a dependency is using CommonJS, for example.

Some libraries on the web are still distributed as [syntax.global globals]. These are modules that instead of exporting a value using one of the above module formats, instead set a property on the `window`.

Steal is able to detect and deal with globals by default, but it's often necessary to configure globals for correctness. The [StealJS.configuration configuration guide] goes into greater depth on how to configure globals, but we'll do a simple version here.

### Install the global script

First we'll install a library for displaying a gallery of images. This library is distributed as a global and we'll need to configure it.

Run:
```
> npm install justifiedGallery --save
```

### Create the modlet

Create _puppies/puppies.html_:

```html
<!doctype html>
<html lang="en">
  <head>
      <meta charset="utf-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body>
    <div class="container">
        <div id="puppies"></div>
    </div>
    <script src="../node_modules/steal/steal.js" main="@empty"></script>
	<script type="text/steal-module">
        var puppies =  require("myhub/puppies/puppies");
        puppies("#puppies");
	</script>
  </body>
</html>
```

Create _puppies/puppies.js_:

```js
require("justifiedGallery");

module.exports = function(selector) {
    
};
```

### Configure justifiedGallery to load

Configuration in Steal is usually done in the `package.json` under the `steal` object.

Here we are using [config.map] configuration to map the "justifiedGallery" [moduleIdentifier identifier] to the JavaScript file we need to actually load. Then we are using [config.meta] configuration to specify that this module is a global that depends on jQuery and its own styles.

Change _package.json_ to:

```json
{
  "name": "myhub",
  "version": "1.0.0",
  "description": "",
  "main": "myhub.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "ISC",
  "dependencies": {
    "bootstrap": "^3.3.6",
    "jquery": "^3.0.0",
    "justifiedGallery": "^3.6.2",
    "steal": "^1.0.0"
  },
  "devDependencies": {
    "steal-qunit": "^0.1.1",
    "steal-tools": "^1.0.0"
  },
  "steal": {
     "map": {
         "justifiedGallery": "justifiedGallery/src/js/justifiedGallery"
     },
     "meta": {
         "justifiedGallery/src/js/justifiedGallery": {
             "format": "global",
             "deps": ["jquery","justifiedGallery/src/less/justifiedGallery.less"]
         }
     }
  }
}
```

### Use justifiedGallery

Now that the library is installed and configured we only need to `require()` it in our CommonJS module.

Change _puppies/puppies.js_ to:

```js
require("justifiedGallery");
var $ = require("jquery");

module.exports = function(selector) {
  $(selector).html("Loading...");

	$.ajax({
		url: 'https://api.flickr.com/services/feeds/photos_public.gne',
		dataType: 'jsonp',
		jsonpCallback: "jsonFlickrFeed",
		data: {
			"tags": "puppy",
			"format": "json"
		},
		success: function(response) {
			var html = response.items.map(function(item, index) {
				return '<a href="'+item.link+'">'+
				'<img alt="'+item.title+'" src="'+item.media.m+'"/>'+
				'</a>'
			}).join("");

			$(selector).html(html).justifiedGallery();
		}
	});
};
```

## Build a production app

Now that we've created our application we need to share it with the public. To do this we'll create a build that will concat our JavaScript and styles down to only one file, each, for faster page loads in production.

### Update app to change pages

Before we do that, let's update the app so that we can toggle between the *repos* and *puppies* page depending on the [location.hash](https://developer.mozilla.org/en-US/docs/Web/API/Window/location) of the page.

Update _myhub.js_ to:

```js
import $ from "jquery";
import "./myhub.less";
import "bootstrap/dist/css/bootstrap.css";
import repos from "./repos/repos";
import puppies from "./puppies/puppies";

$("body").append(`
    <div class='container'>
        <h1>Goodbye script tags!</h1>
        <a href="#repos">Repos</a> <a href="#puppies">Puppies</a>
        <div id='main'/>
    </div>`);

var modules = {
    repos: repos,
    puppies: puppies,
    "": function(selector){
        $(selector).html("Welcome home");
    }
}

var updatePage = function(){
    var hash = window.location.hash.substr(1);
    modules[hash]("#main");
};

$(window).on("hashchange", updatePage);

updatePage();
```

### Build the app and switch to production

When we first installed our initial dependencies for myhub, one of those was *steal-tools*. steal-tools is a set of tools that helps with bundling assets for production use.

In your package.json `"scripts"` section add:

```json
{
  "scripts": {
    ...
	"build": "steal-tools"
  }
}
```

And then you can run:

```
> npm run build
```

To use the production artifacts rather than the development files we need to update our index.html to load them.

Create _index.html_ with:

```html
<!doctype html>
<html lang="en">
  <head>
      <meta charset="utf-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body>
    <script src="./node_modules/steal/steal.production.js"
        main="myhub/myhub"></script>
  </body>
</html>
```

By using `steal.production.js` instead of `steal.js` Steal will know to load the production files we just built.

### Preload css

To prevent [flash of unstyled content](https://en.wikipedia.org/wiki/Flash_of_unstyled_content) (or FOUC) we can add a link tag to the top of the page.

> Note that it is usually recommended not to include link tags for stylesheets in the head as it blocks the page from rendering until those styles are fetched. For this small demonstration we'll do it anyways. See [PageSpeed Tools](https://developers.google.com/speed/docs/insights/OptimizeCSSDelivery) for more information.

Update _index.html_ to:

```html
<!doctype html>
<html lang="en">
  <head>
      <meta charset="utf-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link href="./dist/bundles/myhub/myhub.css" rel="stylesheet">
  </head>
  <body>
    <script src="./node_modules/steal/steal.production.js"
        main="myhub/myhub"></script>
  </body>
</html>
```

Now if you restart your server with `npm start` and reload the page you'll notice that only a few resources are downloaded.

<img width="744" alt="screen shot 2016-11-02 at 2 27 00 pm" src="https://cloud.githubusercontent.com/assets/361671/19943420/b0900d0c-a10d-11e6-99d6-8c1aea6632d5.png">

### Bundle steal.js

You'll notice in the above screenshot that we are loading two JavaScript files. *myhub.js* and *steal.production.js*. We can avoid loading both by bundling Steal along with your app's main bundle.
 
Update your `build` script to add the `--bundle-steal` flag:

```json
{
  "scripts": {
    ...
	"build": "steal-tools --bundle-steal"
  }
}
```

Run:

```
> npm run build
```

Update _index.html_ to:

```html
<!doctype html>
<html lang="en">
  <head>
      <meta charset="utf-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link href="./dist/bundles/myhub/myhub.css" rel="stylesheet">
  </head>
  <body>
    <script src="./dist/bundles/myhub/myhub.js"></script>
  </body>
</html>
```

## Build a progressive loading production app

For this size app we're in a good spot. For larging apps you want to avoid bundling your entire site into 1 JavaScript and one CSS file. Instead you should progressively load your app based on which page the user is viewing.

Steal enables this with [config.bundle] configuration.

### Make the app progressively load

Update _myhub.js_ to:

```js
import $ from "jquery";
import "./myhub.less";
import "bootstrap/dist/css/bootstrap.css";

$("body").append(`
    <div class='container'>
        <h1>Goodbye script tags!</h1>
        <a href="#repos">Repos</a> <a href="#puppies">Puppies</a>
        <div id='main'/>
    </div>`);

var updatePage = function(){
    var hash = window.location.hash.substr(1);
    if(!hash) {
        $("#main").html("Welcome home");
    } else {
		steal.import(`myhub/${hash}/${hash}`).then(function(moduleOrPlugin){
            var plugin = typeof moduleOrPlugin === "function" ?
                moduleOrPlugin : moduleOrPlugin["default"];
            plugin("#main");
        });
    }
};

$(window).on("hashchange", updatePage);

updatePage();
```

In the above code we have a div `#main` that each page renders into. Based on the location.hash, dynamically import the page being requested. So when the hash is `#repos` use [steal.import] to import the repos modlet; if the hash is `#puppies` use steal.import to import the puppies modlet.

### Update bundles to build

Using [config.bundle] we can specify each page of our application and steal-tools will build out separate bundles.

Update _package.json_ to:

```json
{
  "name": "myhub",
  "version": "1.0.0",
  "description": "",
  "main": "myhub.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "ISC",
  "dependencies": {
    "bootstrap": "^3.3.6",
    "jquery": "^3.0.0",
    "justifiedGallery": "^3.6.2",
    "steal": "^1.0.0"
  },
  "devDependencies": {
    "steal-tools": "^1.0.0",
    "steal-qunit": "^0.1.1"
  },
  "steal": {
    "map": {
      "justifiedGallery": "justifiedGallery/src/js/justifiedGallery"
    },
    "meta": {
      "justifiedGallery/src/js/justifiedGallery": {
        "format": "global",
        "deps": ["jquery","justifiedGallery/src/less/justifiedGallery.less"]
      }
    },
    "bundle": [
      "myhub/puppies/puppies",
      "myhub/repos/repos"
    ]
  }
}
```

Run:

```
> npm run build
```

### Make a build script

Using our existing `npm run build` command we create a build using the default [steal-tools.BuildOptions build options]. In many cases you might want to customize these, so creating a small script allows you to do that more easily.

Create _build.js_:

```js
var stealTools = require("steal-tools");

stealTools.build({}, {
  bundleSteal: true
});
```

Run the build script with:

```
> node build.js
```

## Export modules to other formats

### Create an export script

Create _export.js_ with:

```js
var stealTools = require("steal-tools");
stealTools.export({
  system: {
    main: "myhub/repos/repos",
    config: __dirname+"/package.json!npm"
  },
  options: {
    verbose: true
  },
  outputs: {
    "+amd": {},
    "+global-js": {
        exports: {
            "myhub/repos/repos":"repos",
            "jquery": "jQuery"
        },
        dest: __dirname+"/dist/global/repos.js"
    }
  }
});
```

Run:

```js
> node export.js
```

### Test the standalone module

Create _repos/repos-standalone.html_ with:

```html
<!doctype html>
<html lang="en">
  <head>
      <meta charset="utf-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">
  </head>
  <body>
    <div id='git-repos'/>
    <script src="//code.jquery.com/jquery-3.0.0.js"></script>
    <script src="../dist/global/repos.js"></script>
    <script>
        repos("#git-repos");
    </script>
  </body>
</html>
```


