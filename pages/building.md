@page stealjs.building Building
@parent stealjs.pages 2

@description Learn how to build an application or applications for production.

@body

After [stealjs.installing installing] StealJS and [steal.use using] steal to
load the modules of your application, it's time to build them into
combined and minified scripts that download fast in production.

StealJS uses [steal.build] to build an application into 
production files. 

By default, [steal.build] combines and minfies all modules into a 
single JavaScript and CSS file. This may not be optimal 
for performance so this article includes some common enhancements.

## Basic build

To build a JS file that uses 
steal (ex: _myapp/myapp.js_ in [quick example](steal.use.html#section_QuickExample)),
simply run :

    > ./js steal/buildjs myapp/myapp.js

This will produce:

 - myapp/production.js
 - myapp/production.css

> _Notice: If you used JavaScriptMVC's generators to generate an application
  skeleton, you can likely run `./js APP/scripts/build.js`.

Switch a page to load these production scripts by changing the page
from loading _steal/steal.js_ to _steal/steal.production.js_:

    <script src="../steal/steal.production.js?myapp"></script>

Often, these pages are rendered by a server-side framework that
knows if it is running in a production 
environment or not. It's common that a server-side template
includes some logic to switch between loading the production
or development versions of steal like:

    <script src='../steal/steal<%= ENV == "PRODUCTION" ? 
            ".production" :
            "" %>.js?myapp'/>


## Top loading CSS

Typically, you want to top-load CSS so styling is present before
any content is shown to the page while 
bottom-loading JavaScript. 

To make this happen, manually
add a `<LINK>` tag that points to _production.css_ and
configure steal so that it knows _production.css_ has
already been loaded and run like:

    <head>
      <link rel="stylesheet" type="text/css" href="production.css"/>
    </head>
    <body>
       ... CONTENT ...
       <script>
         steal = {
           executed: ["myapp/production.css"]
         }
       </script>
       <script src="../steal/steal.production.js?myapp"></script>
    </body>
    

## Cache Busting

As you release new versions, you want to make sure the latest
production files are used by the client. To do this, configure 
the [steal.config.suffix suffix] property. This is
often a build number passed by the server-side template like:


     <script>
       steal = {
         suffix: "<%= BUILD_NUMBER %>"
       }
     </script>
     <script src="../steal/steal.production.js?myapp"></script>

## Loading scripts from a CDN.

Sometimes, you want to __not__ package 
certain modules in the production files, but load those modules
somewhere else. Use [steal.config.shim] to prevent the module
from being packaged and [steal.config.paths] to indicate where to load it:

    paths: {
      "jquery": "http://cdn.com/jquery.min.js",
    },
    shim: {
      "jquery": {packaged: false}
    }

If you have multiple pages using the same resources, use
the [#section_Buildingmultipleapps building multiple apps] technique.

## Building multiple apps

If you have multiple pages that use many of the same resources, it's
a good practice to combine the shared resources into a file or files that
can be cached and used across multiple pages.

If multiple apps are passed to [steal.build], it will:

 - calculate which modules are shared by which 
   applications
 - bundle the shared modules into cachable packages
 - set each app's production.js to load the packages it depends on.
 
For example, the following lists appA's and appB's dependencies:

 - appA
    - module1
    - module2
 
 - appB
    - module1
    - module3

Running:

    > ./js steal/build appA/appA.js appB/appB.js
    
Will produce the following 3 files with their contents listed in []:

 - appA/production.js [module2]
 - appB/production.js [module3]
 - packages/appA_appB.js [module1]

As the number of apps grows, so does the number of 
shared packages.  For example, building 4 apps will produce
15 production and package files:

    4 - a,b,c,d
    3 - a,b,c; a,b,d; a,c,d; b,c,d
    2 - a,b; a,c; a,d; b,c; b,d; c,d;
    1 - a; b; c; d;

Each app could potentially load 8 scripts!  To prevent this,
you can specify a depth argument that limits the number of
scripts to load like:

    ./js steal/build appA/appA.js ... -depth 3
    
Steal will combine packages minimizing the amount of extra 
resources each page loads.  In our experience, 
a depth of 3 is optimal.


## Progressive loading

[steal.packages] can be used to progressively load an 
application.

    steal.packages('login','filemanager','contacts')
    steal('can/route',function(route){
      route.bind("page",function(ev,newVal){
        if(newVal === "login"){
          steal("login")
        } else if(newVal === "filemanager"){
          steal("filemanager")
        }
      })
    })




