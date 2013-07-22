@page steal.use Using steal
@parent stealjs.pages 1

@description Learn how to load [steal.module modules], scripts and styles.

@body

After [stealjs.installing installing StealJS], you will 
have __steal/steal.js__. This provides the [steal] function that
loads scripts, css, and other
modules into your like:

    steal('jquery','can',function($, can){
      
    })

To use steal effectively, you need to know how to:

 - Add steal.js to your page
 - Configure steal's behavior
 - Load modules
 - Return module values
 
We will go into each of these in detail, but first lets
look at a quick example.
 
## Quick Example

The following walks through the steps to create an application
that loads a JavaScript and [LESS](http://lesscss.org/) module.

The resulting folder structure will look like:

    ROOT/
      steal/
        steal.js
        ...
      myapp/
        myapp.js
        myapp.less
        mymodule.js
        index.html
      stealconfig.js

Follow these steps 5:
  
__0.__ Create `myapp`, its contents, and `stealconfig.js`.

__1.__ Add a script tag to __index.html__  that 
loads <code>steal/steal.js</code> and add
the path to the first file to load in the query string like:

    <script src='../steal/steal.js?myapp/myapp.js'>
    </script>

__2.__ In __stealconfig.js__, configure steal to load
the less engine for any modules ending in `.less` like:

    steal.config({
      ext: {
        less: "steal/less/less.js"
      }
    })

__3.__ Add the following to __mymodule.js__:

    steal(function(){
      return function(element){
        element.innerHTML = "Hello World"
        element.className = "welcome"
      }
    })

`myapp/mymodule.js`'s module value is a function that
sets an element's contents and changes its class attribute to "welcome".

Add the following to __myapp.less__:

    @@dark #228022;
    .welcome {
      color: @dark;
    }

`myapp/myapp.less` adds a `.welcome` style to the app.

__4.__ Add the following to __myapp/myapp.js__:

    steal("./mymodule.js","./myapp.less",function(mymodule){
      mymodule(document.body)
    })

__5.__ Open __index.html__, you should 
find <span style="color: #228022">Hello World</span>. 

Read on to understand setting up steal in detail.

## Add steal.js to your page

The first step to using steal is to 
add `steal/steal.js` to your page. 

    <script src='../public/steal/steal.js'>
    </script>

> _PRO TIP: Bottom load your scripts. It
> will increase your application's percieved response time._

With this, you can start stealing modules. For example,
you could load jQuery from a CDN in a following
script tag like:

    <script src='../public/steal/steal.js'>
    </script>
    <script>
    steal('http://cdn.com/jquery-1.8.3.js',function(){
       $
    })
    </script>

The folder that contains the `steal` folder is
the [steal.config.root rootfolder]. By default, all modules are loaded 
from the root folder unless they start with:

 - "http://" or "https://" like "http://foo.com/bar.js"
 - "/" like `"/bar.js"`

So the following would load `public/component.js`:

    <script>
    steal('http://cdn.com/jquery-1.8.3.js',
      'component.js',
      function(){
    
    })
    </script>

Although, your HTML pages that load steal can
exist anywhere can be served up dynamically, it's 
best to have all your JavaScript, CSS, and other static
resources in the [rootfolder root folder]. 

But steal allows you to configure pretty much everything as we will see ...

## Configure steal's behavior

[steal.config]\(configOptions\) allows you to 
change the behavior of how steal loads modules. `steal.config`
allows you to set rules that:

 - Apply for all modules. (_ex: changing the location of the root folder_)
 - Apply for a single moduleId. (_ex: 'steal/dev/dev.js' should not be added to production_)
 - Apply to startup. (_ex: load `myapp/myapp.js` as the first JS module_)

You can find a full list of options in [steal.config steal.config's docs],
but the most common configuration options are:

 - __startFile__ - the first moduleId to load. Example: `"myapp/myapp.js"`.
 - __env__ - the environment the page is 
   running in: `"development"` or `"production"`. By default, env is development.

For any application that you intend to [steal.build build], 
`startFile` and __env__ need to be set.

You can set configOptions in a variety ways:

__Set startFile and env in the script tag__

You can set startFile and env the queryparams of steal like:

    <script src='../steal/steal.js?STARTFILE,ENV'>
    </script>

For example:

    <script src='../steal/steal.js?cookbook,production'>
    </script>

If you load `steal/steal.production.js` the environment defaults
to production:

    <script src='../steal/steal.production.js?cookbook'>
    </script>

__Call `steal.config(stealConfig)`__

After `steal.js` is loaded and run, you can call steal.config
anywhere in the application.  However, after `steal.js` loads,
it automatically loads `stealconfig.js` before it loads 
anything else. `stealconfig.js` is the best place to 
configure settings that should be applied to all 
projects.

__A `steal` object that exists before `steal.js` is loaded__

If a `steal` object exists before `steal.js` is loaded,
steal will internally call `steal.config` with that 
object.  For example:

    <script>
    steal = {
      executed: "myapp/production.css"
    }
    </script>
    <script src='../steal/steal.production.js,myapp'>
    </script>
    
## Load modules

Use `steal(ids...)` to load dependent 
modules. Ids might look like:

    // in myapp/myapp.js
    steal('components/item',
          'person.js',
          './view.ejs')

Steal uses [steal.id] to convert the id passed to steal
into a moduleId. It then uses [steal.idToUri] to
convert that moduleId into a URI to load the resource.

The behavior of [steal.id] and [steal.idToUri] can
be configured by steal.config's [steal.config.map map] and 
[steal.config.paths paths] options. But the default behavior is 
as follows:

 - "components/item" is found in `ROOT/components/item/item.js`
 - "person.js" is found in `ROOT/person.js`
 - "./view.ejs" is found in `ROOT/myapp/view.ejs`

It is possible to use:

 - a url like: `"http://cdn.com/foo.js"`
 - a path relative to the domain like: `"/foo.js"`
 
But, we STRONGLY encourage you to use moduleId's and [steal.config]
to adjust the lookup path for resources outside stealroot.

## Return module values

After the optional list of moduleIds, you can pass steal
a "definition" function. For example:

    // in myapp/myapp.js
    steal('components/item',
          'person.js',
          './view.ejs', 
          
          function(item, Person, viewEJS){
          
              return MODULEVALUE;
          
          })

The "definition" function gets called with
each dependent module's value 
and can optionally return a module value of its
own. Your code goes in the definition function.

If a module doesn't return a value, undefined
is passed to the definition function.

