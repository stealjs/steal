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
    <div class="container">Hello World.</div>
  </body>
</html>
```

Next install and run a local fileserver. [http-server](https://www.npmjs.com/package/http-server) handles our basic needs. We'll install it locally and then and it to our npm scripts:

```
> npm install http-server --save-dev
```

Next edit your `package.json` so that the start script looks like:

```json
{
  "name": "myhub",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "start": "http-server -c-1 ."
  },
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "http-server": "^0.10.0"
  }
}
```
@highlight 6-8,only

This allows us to start the server with:

```
> npm start
```

Open [http://127.0.0.1:8080/myhub.html](http://127.0.0.1:8080/myhub.html). You should see the *Hello world!* test.

> Before proceeding open a new command-line
> terminal that will be used for additional
> `npm install` commands.

### Install steal, steal-tools, and jquery

Installing these 3 dependencies gives us everything we need to build our application.

```
> npm install steal jquery --save-dev
> npm install steal-tools steal-less steal-css --save-dev
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
    <div class="container">Hello World.</div>
    <script src="./node_modules/steal/steal.js"></script>
  </body>
</html>
```
@highlight 6

### Update package.json with the right main

Update _package.json_ to:

```json
{
  "name": "myhub",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "start": "http-server -c-1 ."
  },
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "http-server": "^0.10.0",
    "jquery": "^3.2.1",
    "steal": "^1.5.13",
    "steal-css": "^1.3.1",
    "steal-less": "^1.2.0",
    "steal-tools": "^1.8.4"
  }
}
```
@highlight 5,only


Reload [http://127.0.0.1:8080/myhub.html](http://127.0.0.1:8080/myhub.html) to see your changes.

## Import styles

What's an application without a little bit of flare? Steal allows using [less](http://lesscss.org/) through [steal-less](https://github.com/stealjs/steal-less), which we installed earlier.

### Update package.json

We need to update our package.json to specify the *plugins* that need to be loaded:

```json
{
  "name": "myhub",
  "version": "1.0.0",
  "description": "",
  "main": "myhub.js",
  "scripts": {
    "start": "http-server -c-1 ."
  },
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "http-server": "^0.10.0",
    "jquery": "^3.2.1",
    "steal": "^1.5.13",
    "steal-css": "^1.3.1",
    "steal-less": "^1.2.0",
    "steal-tools": "^1.8.4"
  },
  "steal": {
    "plugins": [
      "steal-css",
      "steal-less"
    ]
  }
}
```
@highlight 19-24,only

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

@highlight 2

Each string used to import such as `"jquery"` and `"./myhub.less"` are called [moduleIdentifier module identifiers]. They identify a module to be imported within the context of the module that is importing them. That means that when you import a module like `"./myhub.less"` you are importing that module relative to the current module (in this case it is your myhub.js module).

Internally Steal resolves all module identifiers into [moduleName moduleNames], which it uses as the **key** to look up modules. This allows you to load modules from many different places in the application and have them all resolve to the same module.

### Install and import bootstrap

Next, install bootstrap:

```
> npm install bootstrap --save-dev
```

Update the _myhub.html_ to use bootstrap:

```html
<!doctype html>
<html lang="en">
  <head>
      <meta charset="utf-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body>
    <div class="container">Hello World.</div>
    <script src="./node_modules/steal/steal.js"></script>
  </body>
</html>
```
@highlight 4-6

Import bootstrap and use it with the following updated _myhub.js_:

```js
import $ from "jquery";
import "./myhub.less";
import "bootstrap/dist/css/bootstrap.css";

$("body").append(`
	<div class="container">
		<h1>Goodbye script tags!</h1>
    </div>
`);
```

@highlight 3,5-9

Steal is able to load npm packages as modules thanks to the [npm] plugin that comes with Steal by default.

If the package uses a module format, all you have to do is `import` in the `.js` file(s) where that module needs to be used.

## Create a modlet

Steal encourages the use of [modlets](https://www.bitovi.com/blog/modlet-workflows) as a unit of functionality in your application.

A modlet is a folder that contains:

- an implementation file,
- a test,
- a test page,
- a demo page,
- and documentation about the modlet.

Using modlets helps to ensure that your application is well tested.

For example, instead of something like:

```
.
├── myhub.html
├── myhub.js
├── myhub.less
├── package.json
├── puppies.html
├── test.js
└── weather.html
```

With modlets we will have exactly this:

```
.
├── myhub.html
├── myhub.js
├── myhub.less
├── package.json
├── puppies
│   ├── puppies-test.html
│   ├── puppies-test.js
│   ├── puppies.css
│   ├── puppies.html
│   └── puppies.js
└── weather
    ├── weather-test.html
    ├── weather-test.js
    ├── weather.css
    ├── weather.html
    └── weather.js
```

Use this workflow to create the `weather` modlet:

### Create the demo page

Create _weather/weather.html_ with:

```html
<!doctype html>
<html lang="en">
  <head>
      <meta charset="utf-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body>
    <div id="weather"></div>
    <script src="../node_modules/steal/steal.js" main="@empty"></script>
    <script type="text/steal-module">
        import weather from "myhub/weather/weather";
        weather("#weather");
    </script>
  </body>
</html>
```

### Add the weather styles

Create _weather/weather.css_ with:

```css
@@font-face {
  font-family: 'weather-widget';
  src: url("data:application/x-font-ttf;charset=utf-8;base64,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") format('truetype');
  font-weight: normal;
  font-style: normal;
}

.forecast ul {
  padding: 0;
  margin: 0;
}
.forecast ul li {
  border: 1px solid rgba(167, 207, 250, 0.7);
  border-bottom: none;
  display: flex;
  align-items: center;
  justify-content: center;
  list-style-type: none;
  padding: 10px 8px;
}
.forecast ul li:last-of-type {
  border-bottom: 1px solid rgba(167, 207, 250, 0.7);
}
.forecast .date {
  display: inline-block;
  color: #A7CFFA;
  font-size: 0.7em;
  letter-spacing: 1px;
  text-transform: uppercase;
  width: 20%;
  margin-right: 4%;
}
.forecast .description {
  display: inline-block;
  padding-left: 40px;
  margin-right: 5%;
  width: 33%;
  position: relative;
}
.forecast .description:before {
  font-family: 'weather-widget';
  font-size: 1.4em;
  left: 0;
  position: absolute;
}
.forecast .description.snow:before {
  content: "\e902";
}
.forecast .description.thunderstorms:before {
  content: "\e901";
}
.forecast .description.rain:before {
  content: "\e903";
}
.forecast .description.rain-and-snow:before {
  content: "\e90c";
}
.forecast .description.scattered-showers:before {
  content: "\e90b";
}
.forecast .description.showers:before {
  content: "\e904";
}
.forecast .description.scattered-thunderstorms:before {
  content: "\e905";
}
.forecast .description.cloudy:before {
  content: "\e90a";
}
.forecast .description.partly-cloudy:before {
  content: "\e906";
}
.forecast .description.mostly-cloudy:before {
  content: "\e902";
}
.forecast .description.sunny:before {
  content: "\e907";
}
.forecast .description.mostly-sunny:before {
  content: "\e908";
}
.forecast .description.breezy:before {
  content: "\e90d";
}
.forecast .description.windy:before {
  content: "\e909";
}
.forecast .low-temp,
.forecast .high-temp {
  display: inline-block;
  font-weight: 300;
  font-size: 1.2em;
  width: 10%;
  margin-left: 3%;
}
.forecast .low-temp sup,
.forecast .high-temp sup {
  font-size: 60%;
  margin-left: 3px;
}
.forecast .low-temp:before,
.forecast .high-temp:before {
  font-size: 0.6em;
  margin-right: 3px;
  color: #A7CFFA;
}
.forecast .high-temp:before {
  content: "\2191";
  color: #FD6565;
}
.forecast .low-temp:before {
  content: "\2193";
  color: #23e0ae;
}
```

### Create the module implementation

Create _weather/weather.js_ with the following code:

```js
import $ from "jquery";
import "bootstrap/dist/css/bootstrap.css";
import "./weather.css";

function toClassName(txt) {
  return txt.toLowerCase().replace(/ /g, "-");
}

export default function(selector){
    var city = "chicago il";
    $(selector).html("Loading...");
    $.ajax({
        url: `https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places%20where%20text%3D%22${city}%22)&format=json&diagnostics=true&callback=`,
    }).then(function(response){
      var weather = response.query.results.channel;
      var forecast = weather.item.forecast;
      var defs = forecast.map(function(day){
        return `
          <li>
            <span class="date">${day.date}</span>
            <span class="description ${toClassName(day.text)}">${day.text}</span>
            <span class="high-temp">${day.high}<sup>&deg;</sup></span>
            <span class="low-temp">${day.low}<sup>&deg;</sup></span>
          </li>
        `;
      });
      $(selector).html(`
        <div class="forecast">
          <ul>
            ${defs.join("")}
          </ul>
        </div>
      `);
    });

}
```

Update the `city` variable with your city so the weather page will display your city's weather.

Open [http://127.0.0.1:8080/weather/weather.html](http://127.0.0.1:8080/weather/weather.html) to see
the __weather__ widget's demo page.

### Create the test page

Create _weather/weather-test.html_ with:

```html
<title>myhub/weather/weather</title>
<script src="../node_modules/steal/steal.js"
        main="myhub/weather/weather-test"></script>
<div id="qunit-fixture"></div>
```

### Create the test

Install `steal-qunit` with:

```
> npm install steal-qunit --save-dev
```

Create _weather/weather-test.js_ with:

```js
import QUnit from "steal-qunit";
import weather from "./weather";

QUnit.module("myhub/weather/");

QUnit.test("basics", function(assert){
    var done = assert.async();
    var fixtureEl = document.getElementById("qunit-fixture");

    weather(fixtureEl);

    assert.equal(
        fixtureEl.innerHTML,
        "Loading...", "starts with loading");

    var interval = setInterval(function(){
        var ul = fixtureEl.getElementsByTagName("ul");
        if(ul.length === 1) {
            assert.ok(true, "inserted a ul");
            clearInterval(interval);
            done();
        }
    },100);
});
```

Open [http://127.0.0.1:8080/weather/weather-test.html](http://127.0.0.1:8080/weather/weather-test.html) to
run the __weather__ tests.

### Use the module

Update _myhub.js_ to:

```js
import $ from "jquery";
import "./myhub.less";
import "bootstrap/dist/css/bootstrap.css";
import weather from "./weather/weather";

$("body").append(`
	<div class="container">
		<h1>Goodbye script tags!</h1>
		<div id="weather"></div>
    </div>
`);

weather('#weather');
```

@highlight 4,9,13

Open [http://127.0.0.1:8080/myhub.html](http://127.0.0.1:8080/myhub.html) to
see the application using the __weather__ widget.

## Create a test with dependency injection

Dependency injection is a technique used to improve testing in your application.

Steal provides dependency injection through its module loading system using [steal.steal-clone].

steal-clone allows you to create a _cloned_ loader with stubs for modules that you want to fake.

We'll create a new test and use [steal.steal-clone] to provide our own fake version of jQuery that will let us simulate a service request, so we can test that the rest of our app behaves correctly.

In the case of the test below, the app should list the single forecast it is given.

Update _weather/weather-test.js_ with:

```js
import QUnit from "steal-qunit";
import weather from "./weather";
import clone from "steal-clone";
import $ from "jquery";

QUnit.module("myhub/weather/");

QUnit.test("basics", function(assert){
	var done = assert.async();
    var fixtureEl = document.getElementById("qunit-fixture");

    weather(fixtureEl);

    assert.equal(
        fixtureEl.innerHTML,
        "Loading...", "starts with loading");

    var interval = setInterval(function(){
        var ul = fixtureEl.getElementsByTagName("ul");
        if(ul.length === 1) {
            assert.ok(true, "inserted a ul");
            clearInterval(interval);
			done();
        }
    },100);
});

QUnit.test("basics with dependency injection", function(assert){
	var done = assert.async();

    var jQuery = function(selector){
        return $(selector)
    };
    jQuery.ajax = function(options){
        var dfd = new $.Deferred();
        setTimeout(function(){
            dfd.resolve({
    			query: {
    				results: {
    					channel: {
    						item: {
    							forecast: [{
    								date: new Date(),
    								text: "Sunny",
    								high: "72",
    								low: "58"
    							}]
    						}
    					}
    				}
    			}
            }).then(function(){
              var html = $("#qunit-fixture").html();

              assert.ok(/Sunny/.test(html),
                "updated with request");
              done();
            });
        },1);
        return dfd;
    };

    clone({
        "jquery": {"default": jQuery}
    }).import("myhub/weather/weather").then(function(module){
        var weather = module["default"];

        var fixtureEl = document.getElementById("qunit-fixture");
        weather(fixtureEl);
    });
});
```

@highlight 3-4,28-71

## Import a global script in a CommonJS modlet

Steal supports all of the most common module formats: [syntax.es6 ES modules], [syntax.CommonJS], and [syntax.amd]. This means your project can contain multiple formats which can be useful if, for example, you are using one module format in your project (like ES modules) but a package you want to depend on expects another module format (like CommonJS).

Some libraries on the web are still distributed as [syntax.global globals]. Including such a library sets a property on the global `window` object, instead of exporting a value for use with one of the module formats mentioned above.

Steal is able to detect and deal with globals by default, but it's often necessary to add some configuration for correctness. The [StealJS.configuration configuration guide] goes into greater depth on how to configure globals in more complex situations, but configuring the globals will be simple for our example.

### Install the package containing a global script

[Justified Gallery](http://miromannino.github.io/Justified-Gallery/) is a library for displaying a gallery of images. Unfortunately, the library is distributed as a global; so we'll need to add some configuration.

Use npm to get the `justifiedGallery` package into your project:

```
> npm install justifiedGallery --save-dev
```

### Create a modlet for _puppies_

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

Create _puppies/puppies.js_ in CommonJS format:

```js
require("justifiedGallery");

module.exports = function(selector) {

};
```

Open [http://127.0.0.1:8080/puppies/puppies.html](http://127.0.0.1:8080/puppies/puppies.html) to
see that requiring `justifiedGallery` fails.

### Configure `package.json` for loading the global justifiedGallery package

Configuration in Steal is usually done in the `package.json`, under the `steal` object.

[config.map] maps the `"justifiedGallery"` [moduleIdentifier identifier] to the JavaScript file location.

[config.meta] specifies that:

- This module is in a global format (`format`).
- This module depends on jQuery (`deps`)
- This module depends on its own style code (`justifiedGallery.less`).

Update _package.json_ to:

```json
{
  "name": "myhub",
  "version": "1.0.0",
  "description": "",
  "main": "myhub.js",
  "scripts": {
    "start": "http-server -c-1 ."
  },
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "bootstrap": "^3.3.7",
    "http-server": "^0.10.0",
    "jquery": "^3.2.1",
    "justifiedGallery": "^3.6.2",
    "steal": "^1.5.13",
    "steal-css": "^1.3.1",
    "steal-less": "^1.2.0",
    "steal-qunit": "^1.0.1",
    "steal-tools": "^1.8.4"
  },
  "steal": {
    "plugins": [
      "steal-css",
      "steal-less"
    ],
    "map": {
      "justifiedGallery": "justifiedGallery/src/js/justifiedGallery"
    },
    "meta": {
      "justifiedGallery/src/js/justifiedGallery": {
        "format": "global",
        "deps": [
          "jquery",
          "justifiedGallery/src/less/justifiedGallery.less"
        ]
      }
    }
  }
}
```
@highlight 27-38,only

### Use justifiedGallery

Now that justifiedGallery is installed _and configured_, we need to `require()` it in our _puppies_ CommonJS module.

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
				return '<a href="' + item.link + '">' +
					'<img alt="' + item.title + '" src="' + item.media.m + '"/>' +
					'</a>';
			}).join("");
			var root = $("<div>").html(html);

			$(selector).html(root);
			root.justifiedGallery();
		}
	});
};
```

@highlight 2,5-26

Open [http://127.0.0.1:8080/puppies/puppies.html](http://127.0.0.1:8080/puppies/puppies.html) to
see the __puppies__ widget demo page.

At this point, we've done the following:

- Installed Justified Gallery.
- Created a modlet for _puppies_.
- Configured [config.map] and [config.meta] in `package.json`.
- Required `justifiedGallery` in the _puppies_ CommonJS module.

Getting functionality out of a global script from an npm package and into a modlet is easy as that, thanks to Steal.

### Update app to change pages

Now that we've created __puppies__, the app needs to be updated so that it will toggle between the _weather_ and _puppies_ pages when using the navigation. More specfically, we will do this by looking at the [location.hash](https://developer.mozilla.org/en-US/docs/Web/API/Window/location) of the page.

Update _myhub.js_ to:

```js
import $ from "jquery";
import "./myhub.less";
import "bootstrap/dist/css/bootstrap.css";
import weather from "./weather/weather";
import puppies from "./puppies/puppies";

$("body").append(`
    <div class="container">
        <h1>Goodbye script tags!</h1>
        <a href="#weather">Weather</a> <a href="#puppies">Puppies</a>
        <div id="main"/>
    </div>`);

var modules = {
    weather: weather,
    puppies: puppies,
    "": function(selector){
        $(selector).html("Welcome home");
    }
};

var updatePage = function(){
    var hash = window.location.hash.substr(1);
    modules[hash]("#main");
};

$(window).on("hashchange", updatePage);

updatePage();
```

@highlight 5,8-29

There's a lot going on there, so you might want to re-read that file a couple of times to make sure you understand it.

## Build a production app

Now that we've created our application, we need to share it with the public. To do this we'll create a build that will concat our JavaScript and styles down to only one file, each, for faster page loads in production.

### Build the app and switch to production

When we first installed our initial dependencies for myhub, one of those was *steal-tools*. steal-tools is a set of tools that helps with bundling assets for production use.

In your package.json `"scripts"` section add:

```json
{
  "name": "myhub",
  "version": "1.0.0",
  "description": "",
  "main": "myhub.js",
  "scripts": {
    "start": "http-server -c-1 .",
    "build": "steal-tools"
  },
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "bootstrap": "^3.3.7",
    "http-server": "^0.10.0",
    "jquery": "^3.2.1",
    "justifiedGallery": "^3.6.2",
    "steal": "^1.5.13",
    "steal-css": "^1.3.1",
    "steal-less": "^1.2.0",
    "steal-qunit": "^1.0.1",
    "steal-tools": "^1.8.4"
  },
  "steal": {
    "plugins": [
      "steal-css",
      "steal-less"
    ],
    "map": {
      "justifiedGallery": "justifiedGallery/src/js/justifiedGallery"
    },
    "meta": {
      "justifiedGallery/src/js/justifiedGallery": {
        "format": "global",
        "deps": [
          "jquery",
          "justifiedGallery/src/less/justifiedGallery.less"
        ]
      }
    }
  }
}
```
@highlight 8,only

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
    <div class="container">Hello World.</div>
    <script src="./dist/steal.production.js"></script>
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
    <div class="container">Hello World.</div>
    <script src="./dist/steal.production.js"></script>
  </body>
</html>
```

@highlight 7

Now if you reload the page you'll notice that only a few resources are downloaded.

<img width="744" alt="screen shot 2016-11-02 at 2 27 00 pm" src="https://cloud.githubusercontent.com/assets/361671/19943420/b0900d0c-a10d-11e6-99d6-8c1aea6632d5.png">

### Bundle steal.js

You'll notice in the above screenshot that we are loading two JavaScript files. *myhub.js* and *steal.production.js*. We can avoid loading both by bundling Steal along with your app's main bundle.

Update your `build` script to add the `--bundle-steal` flag:

```json
{
  "name": "myhub",
  "version": "1.0.0",
  "description": "",
  "main": "myhub.js",
  "scripts": {
    "start": "http-server -c-1 .",
    "build": "steal-tools --bundle-steal"
  },
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "bootstrap": "^3.3.7",
    "http-server": "^0.10.0",
    "jquery": "^3.2.1",
    "justifiedGallery": "^3.6.2",
    "steal": "^1.5.13",
    "steal-css": "^1.3.1",
    "steal-less": "^1.2.0",
    "steal-qunit": "^1.0.1",
    "steal-tools": "^1.8.4"
  },
  "steal": {
    "plugins": [
      "steal-css",
      "steal-less"
    ],
    "map": {
      "justifiedGallery": "justifiedGallery/src/js/justifiedGallery"
    },
    "meta": {
      "justifiedGallery/src/js/justifiedGallery": {
        "format": "global",
        "deps": [
          "jquery",
          "justifiedGallery/src/less/justifiedGallery.less"
        ]
      }
    }
  }
}
```
@highlight 8,only

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
    <div class="container">Hello World.</div>
    <script src="./dist/bundles/myhub/myhub.js"></script>
  </body>
</html>
```

@highlight 11

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
    <div class="container">
        <h1>Goodbye script tags!</h1>
        <a href="#weather">Weather</a> <a href="#puppies">Puppies</a>
        <div id="main"/>
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

@highlight 3,13-22

In the above code we have a div `#main` that each page renders into. Based on the location.hash, dynamically import the page being requested. So when the hash is `#weather` use [steal.import] to import the weather modlet; if the hash is `#puppies` use steal.import to import the puppies modlet.

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
    "start": "http-server -c-1 .",
    "build": "steal-tools --bundle-steal"
  },
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "bootstrap": "^3.3.7",
    "http-server": "^0.10.0",
    "jquery": "^3.2.1",
    "justifiedGallery": "^3.6.2",
    "steal": "^1.5.13",
    "steal-css": "^1.3.1",
    "steal-less": "^1.2.0",
    "steal-qunit": "^1.0.1",
    "steal-tools": "^1.8.4"
  },
  "steal": {
    "plugins": [
      "steal-css",
      "steal-less"
    ],
    "map": {
      "justifiedGallery": "justifiedGallery/src/js/justifiedGallery"
    },
    "meta": {
      "justifiedGallery/src/js/justifiedGallery": {
        "format": "global",
        "deps": [
          "jquery",
          "justifiedGallery/src/less/justifiedGallery.less"
        ]
      }
    },
    "bundle": [
      "myhub/puppies/puppies",
      "myhub/weather/weather"
    ]
  }
}
```
@highlight 40-43,only

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
  steal: {
    main: "myhub/weather/weather",
    config: __dirname+"/package.json!npm"
  },
  options: {
    verbose: true
  },
  outputs: {
    "+amd": {},
    "+global-js": {
        exports: {
            "myhub/weather/weather":"weather",
            "jquery": "jQuery"
        },
        dest: __dirname+"/dist/global/weather.js"
    },
    "+global-css": {
      dest: __dirname+"/dist/global/weather.css"
    }
  }
});

```

Run:

```js
> node export.js
```

### Test the standalone module

Create _weather/weather-standalone.html_ with:

```html
<!doctype html>
<html lang="en">
  <head>
      <meta charset="utf-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">
      <link rel="stylesheet" href="../dist/global/weather.css">
  </head>
  <body>
    <div id="forecast"/>
    <script src="//code.jquery.com/jquery-3.0.0.js"></script>
    <script src="../dist/global/weather.js"></script>
    <script>
        weather("#forecast");
    </script>
  </body>
</html>
```
