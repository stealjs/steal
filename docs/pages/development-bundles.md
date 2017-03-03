@page StealJS.guides.development_bundles Development Bundles
@parent StealJS.guides 2
@outline 0

@body

<!-- hack! -->
<style>.contents { display: none; }</style>

In this guide we'll go through the steps required to set up `steal-tools` development bundles and
speed up your application development process.

## Install Dependencies

Edit your `package.json` to get the dependencies required to support this feature:

```json
"devDependencies": {
  "steal": "^1.3.0",
  "steal-tools": "^1.2.0",
}
```

If you are using the `steal-less` package, make sure to update it to "^1.2.0", like this:

```json
"devDependencies": {
  "steal-less": "^1.2.0",
}
```

Run `npm install` after you saved the changes.

## Add npm script to generate the bundle

Edit your `package.json` and add a new npm script like the following:

```json
"scripts": {
  "deps-bundle": "steal-tools bundle --deps"
}
```

Save the changes and run the `deps-bundle` script:

> npm run deps-bundle

This should create a file `dev-bundle.js` at the root folder of your project. If StealJS is also loading your CSS
files there should be a `dev-bundle.css` file, too.

## Modify the StealJS script tag

Add the `deps-bundle` attribute to your StealJS script tag like this:

```html
<script src="./node_modules/steal/steal.js" deps-bundle></script>
```

and that's it! Load your `index.html` page in the browser, check the network tab and you should note a
decreased number of outgoing requests along with faster load times.

## My application loads faster, but I want more!!!

The previous setup creates a bundle with the application dependencies located in the `node_modules` folder;
`steal-tools bundle` accepts a `--dev` flag that will also bundle the [config.configMain] for faster loading times.

Just be aware that you will have to create the bundle every time [config.configMain] changes.

The setup process is similar to the one we just went through, a couple of changes are required though:

### Modify the npm script

Edit your `package.json` like this:

```json
"scripts": {
  "dev-bundle": "steal-tools bundle --dev"
}
```

Run the new npm script after saving the changes.

> npm run dev-bundle

### Modify the StealJS script tag

A different attribute is needed to setup StealJS so it loads the bundle before [config.configMain] is loaded:

```html
<script src="./node_modules/steal/steal.js" dev-bundle></script>
```

and you're all set! Reload your browser window, fast isn't it?
