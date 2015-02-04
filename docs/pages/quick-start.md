@page StealJS.quick-start Quick Start
@parent StealJS.guides 1

## Quick Start

The Quick Start is a simple demo that uses [npm](https://www.npmjs.org/) to install steal, steal-tools, [grunt](http://gruntjs.com/),
and [jquery](http://jquery.com/) to build a `Hello World` app. Steal supports a wide variety of other configuration options which can be found [steal here].

### Install

Install [Node.js](http://nodejs.org/) on your
computer. Create a directory for all your static content, scripts, and
styles. This is your [System.baseURL BASE] folder. Within that folder run `npm init` to ,
create a `package.json`:

Note: when it asks for the "entrypoint", write "main.js".

    > npm init



Within the BASE folder, use [npm](https://www.npmjs.org/) to install steal, steal-tools, jquery, and
[grunt](http://gruntjs.com/). Use `--save-dev` to save the configuration to `package.json`.

	> npm install steal --save-dev
    > npm install steal-tools --save-dev
    > npm install jquery --save-dev
    > npm install grunt --save-dev
    > npm install grunt-cli --save-dev


Your `BASE` should now look like this:

      BASE/
        node_modules/
          steal/
          steal-tools/
          grunt-cli/
          jquery/
        package.json

### Setup

Create `index.html` and `main.js`, files in your BASE folder so it looks like:

      BASE/
        node_modules/
        package.json
        index.html
        main.js

The `index.html` loads your app. The following `script src` loads `steal.js` and
`data-main` tells steal to load the `main` module.

    <!DOCTYPE html>
    <html>
      <body>
        <script src="./node_modules/steal/steal.js"
                data-main="main">
        </script>
      </body>
    </html>

Steal uses `package.json` to configure its behavior. Find the full details on
the [npm npm extension page]. Most of the configuration happens within
a special "system" property. Its worth creating it now in case you'll
need it later.

```
// package.json
{
  ...
  "system": {},
  ...
}
```


`main.js` is the entrypoint of the application. It should load import your
apps other modules and kickoff the application. Write the following in `main.js`:

    import $ from "jquery";
    $(document.body).append("<h1>Hello World!</h1>");

The line `import $ from "jquery";` is ES6 module syntax which loads jQuery.

### Run in the browser

Open `index.html` in the browser.  You should see a big "Hello World".

### Build

Create a `Gruntfile.js` in your BASE folder. Configure grunt to
call `stealBuild`

	module.exports = function (grunt) {
	  grunt.initConfig({
		"steal-build": {
		  bundle: {
			options: {
			  system: {
				config: "package.json!npm"
			  }
			}
		  }
		}
	  });
	  grunt.loadNpmTasks("steal-tools");
	  grunt.registerTask("build", ["steal-build"]);
	};

After saving `Gruntfile.js` run:

    > grunt build

### Switch to production

Change `index.html` to look like:

    <!DOCTYPE html>
    <html>
      <body>
        <script src="./node_modules/steal/steal.production.js"
                data-main="main">
        </script>
      </body>
    </html>

### Run in production

Open `index.html` in the browser. You should see a big "Hello World". If you check
the network tab, you will see only two scripts load.
