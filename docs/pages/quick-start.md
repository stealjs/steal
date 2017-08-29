@page StealJS.quick-start Quick Start
@parent StealJS.guides 1

## Quick Start

The Quick Start is a simple demo that uses [npm](https://www.npmjs.org/) to install steal, steal-tools,
and [jquery](http://jquery.com/) to build a *Hello World* app. This guide is a step-by-step guide to create the app from scratch. If you just want a starter project, you can clone the source from the [GitHub Quick Start repo](https://github.com/stealjs/quick-start).

### Install

Install [Node.js](http://nodejs.org/) on your computer.

Create a directory for all your static content, scripts, and styles called `quick-start`.

    > mkdir quick-start

This is your [config.baseURL baseURL] folder. Within that folder run `npm init` to, create a **package.json**:

Note: when it asks for the *entry point*, write **index.js**.

    > npm init

Within the quick-start folder, use [npm](https://www.npmjs.org/) to install steal, steal-tools, and jquery. Use `--save-dev` to save the configuration to **package.json**.

	> npm install steal steal-tools jquery --save-dev

If you already have a webserver running locally, you can skip this step. If you don't have a web server, install this simple zero-configuration command-line [http-server](https://www.npmjs.com/package/http-server) to help you get started.

    > npm install http-server -g

Your quick-start should now look like this:

      quick-start/
        node_modules/
          steal/
          steal-tools/
          jquery/
        package.json

### Setup

Create **index.html** and **index.js**, files in your folder so it looks like:

      quick-start/
        node_modules/
        package.json
        index.html
        index.js

The **index.html** page loads your app. All that is needed is the script tag that loads steal, which will in turn load your **index.js** as well.

```
<!doctype html>
<html>
  <body>
	<script src="./node_modules/steal/steal.js"></script>
  </body>
</html>
```

Steal uses **package.json** to configure its behavior. Find the full details on
the [npm npm extension page]. Most of the configuration happens within
a special "steal" property. Its worth creating it now in case you'll
need it later.

```
{
  "name": "stealjs",
  "version": "1.0.0",
  "main": "index.js",
  "devDependencies": {
    ...
  },
  "steal": {
  }
}
```

@highlight 8-9


**index.js** is the entrypoint of the application. It should import your app's 
other modules and kickoff the application. Write the following in **index.js**:

    import $ from "jquery";
    $(document.body).append("<h1>Hello World!</h1>");

The line `import $ from "jquery";` is an ES module import that loads jQuery.

### Run in the browser

If you installed `http-server` earlier, navigate to the `quick-start` directory and run the following command to start the server.

```
> cd quick-start
> http-server
Starting up http-server, serving ./ on: http://0.0.0.0:8080
Hit CTRL-C to stop the server
```

Open `http://localhost:8080/index.html` in the browser. You should see a big "Hello World". Open the Network tab in developer tools and you'll see several files including index.js were loaded.

### Production Build

Open up your **package.json** and add the following `build` script to your **scripts** section:

```
{
  "name": "quick-start",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "build": "steal-tools"
  },
  "steal": {
  },
  "devDependencies": {
    ...
  }
```

@highlight 6

After saving **package.json** run:

    > npm run build

### Switch to production

Change `index.html` to look like:

```
<!doctype html>
<html>
  <body>
    <script src="./dist/steal.production.js"></script>
  </body>
</html>
```

@highlight 4

### Run in production

Reload `http://localhost:8080/index.html` and check the network tab again, you will see only two scripts load. The steal-tools grunt task builds a graph of the required files, minifies and concatenates all the scripts into **index.js**. 
