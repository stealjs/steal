@page StealJS.moving-to-prod Moving to Production
@parent StealJS.topics

@body

Once your application is in a place to deploy to production you'll need to take just a few steps to get that ready.

## Create a build

Using [steal-tools] we can create a build that concats and minifies our source code together. If you haven't already, install steal-tools now:

```
npm install steal-tools --save-dev
```

Then create a script in your project folder called `build.js`:

```
var stealTools = require("steal-tools");

stealTools.build();
```

Run it with:

```
node build.js
```

This will create a bundles folder in `dist/bundles` that contain all of your JavaScript and CSS bundles.

If you'd also like it to copy your fonts and images (from CSS) you can specify that in the build options:

```
var stealTools = require("steal-tools");

stealTools.build({}, {
  bundleAssets: true
});
```

With everything packaged together you can move the `dist/` folder to where it is exposed on your webserver.

This will also pack a `steal.production.js` file that can be used to load the app in production.

## Create a production html file

In a lot of Steal apps you might have separate html files for development and production. Your development.html might look like:

```
<html>
<head>
  <title>My App</title>
</head>
<body>
  <script src="./node_modules/steal/steal.js"></script>
</body>
</html>
```

To use this in production you only need to change the script tag to:

```
<script src="./dist/steal.production.js"></script>
```

Notice that steal-tools has copied over *steal.production.js* into your dist folder. This script is preconfigured, so all you need to do is add it to your page. Because we use `bundleAssets`, everything is packaged into the dist folder and your development files are never touched in production.

### bundleSteal

Alternatively you could use the [steal-tools.BuildOptions bundleSteal] option with steal-tools which will include Steal in your main bundle. To use this option update your build script to:

```
var stealTools = require("steal-tools");

stealTools.build({}, {
  bundleAssets: true,
  bundleSteal: true
});
```

Then to use change your script tag to:

```
<script src="./dist/bundles/app/app.js"></script>
```

## Load Scripts from a CDN

You may have very common scripts like jQuery that you want to load from a CDN in production. To do this, see [Loading Scripts from a CDN](http://stealjs.com/docs/StealJS.loading-from-cdn.html).
