StealJS is an ES6, AMD, CommonJS, and steal client-side loader. Combined with 
[steal-tools](https://github.com/bitovi/steal-tools/tree/systemjs), its designed
to simplify dependency management while being extremely powerful and flexible.

Steal builds from [SystemJS](https://github.com/systemjs/systemjs) and 
[ES6ModuleLoader](https://github.com/ModuleLoader/es6-module-loader) and adds:

 - global configuration
 - css and less support
 - plugin extension mapping _(upcoming)_
 - production builds with [steal-tools](https://github.com/bitovi/steal-tools/tree/systemjs)

But its __killer__ feature - progressively loaded apps that balance caching and the 
number of script requests.

StealJS supports IE8+ with AMD, CommonJS, and Steal syntax and IE9+ for ES6 syntax.

## Use

### Hello World Example

Lets see how to get a basic app up and running.

1. Install StealJS:
  
  With [Bower](http://bower.io/)

  > bower install steal#0.1.1 -S

2. Create `stealconfig.js`:

  Add a `stealconfig.js` file directly within your "root" folder. Your
  "root" folder should contain all your static scripts and resources.
  
  By default, steal will assume `stealconfig.js` is a sibling of `bower_components`:

      ROOT/
        bower.json
        bower_components
        stealconfig.js
    
  `stealconfig.js` will be loaded by every page in your project.  It is used to configure
  the location to modules and other behavior.    
    
3. Add `main` module:

  Add a `main.js` to your project. This will load your apps other modules.
  
      ROOT/
        bower.json
        bower_components
        stealconfig.js
        main.js
      
  Within `main.js` add:
  
  ```js
  console.log("hello world");
  ```
 
4. Create an HTML page:

  Create an `index.html` page that specifies the location of `stealconfig.js` and
  the `main` module name:
  
      ROOT/
        bower.json
        bower_components
        stealconfig.js
        index.html

  Within `index.html` add:

  ```html
  <!DOCTYPE html>
  <html>
    <body>
      <script src='./bower_components/steal/steal.js'
              data-config='stealconfig.js'
              data-main='main'></script>
    </body>
  </html>
  ```
  
  To build this app, read [StealTools](https://github.com/bitovi/steal-tools/tree/systemjs) docs.


### Adding jQuery

1. Install jQuery:
   
   With [Bower](http://bower.io/)
   
   > bower install jquery -S

2. Configure jQuery's path and export:

   Add a `System.paths` config to `stealconfig.js` to tell steal where to find
   jQuery. Add a `System.meta` config to tell SystemJS that jQuery exports the "jQuery"
   variable.
   
   ```js
   System.paths = {jquery: 'bower_components/jquery/dist/jquery.js'};
   System.meta = {jquery: { exports: "jQuery" } };
   ```

3. Load jQuery.
  
  Import "jquery" with ES6 module syntax in `main.js`:
  
  ```js
  import $ from "jquery";
  $(document.body).append("<h1>Hello World!</h1>");
  ```


## Developing

After cloning ...

1.  Install npm modules
  
    > npm install
 
2. Install bower modules
  
    > bower install
    
3. Setup grunt watch
  
    > grunt watch
    
  This will automatically build when anything in `src` change.  
  
  To test, open:

      test/test.html
      
  And make sure everything passes.
