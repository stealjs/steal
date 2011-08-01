@page stealjs StealJS
@parent index 1

StealJS is a collection of command line and JavaScript client utilities
that make building, packaging, and sharing JavaScript applications easy.

## Features

Behold StealJS's goodies:

### Dependency Management ([steal])

[steal] loads JS and other file into your app.  Features:

 - Loads JavaScript, CSS, Less, CoffeeScript, and a variety of client-side templates.
 - Can be use with scripts that don't use steal.

    steal('widgets/tabs.js',
          './style.css', function(){
      $('#tabs ).tabs();     
    });

### JS/CSS Concatenation and Compression ([steal.build])

The [steal.build] plugin combines an application's files into a single minified 
JavaScript and CSS file extremely easy.  Features:

  - Configurable compressors (defaults to Google Closure).
  - Compresses Less and CoffeeScript.
  - Pre-processes and compresses client-side templates (templates don't have to be parsed).
  
@codestart text
js steal/buildjs mypage.html
@codeend

### Logging ([steal.dev])

[steal.dev] logs messages cross browser.  Messages are removed in production builds.

    steal.dev.log('something is happening');

### Code Generators ([steal.generate])

[steal.generate]  makes building code generators extremely easy.  Features:

  - Pre-packaged JMVC style code generators.
  - Easily author custom generators.
  
@codestart text
js jquery/generate/app cookbook
@codeend

### Package Management ([steal.get])

[steal.get] is a simple JavaScript version of [http://rubygems.org/ ruby gems] featuring:

 - Download and install plugins from remote SVN or GIT repositories.  
 - Installs dependencies.

@codestart text
js steal/getjs http://github.com/jupiterjs/mxui/
@codeend

### Code Cleaner ([steal.clean])

[steal.clean] cleans your code and checks it against JSLint. 

@codestart text
js steal/clean path/to/page.html
@codeend

### Searchable Ajax Apps ([steal.html])

[steal.html] makes Google-crawlable html from your ajax app.

@codestart text
js steal/htmljs http://localhost/cookbook.html#recipes
@codeend   

## Getting Started with StealJS

The remainder of this page walks through using StealJS to create a 
micro application.  The application will use a basic tabs widget to
load content from the server and show it in a content area.  We'll
use steal to generate a google crawlable version of the site.

We won't use jQuery to demonstrate that steal works with any library.

### Installing Steal

Download StealJS or JavaScriptMVC and unzip it in a public folder.

### Setting up your app.

JavaScriptMVC encourages you to have two root folders.  One for reusable 
widgets, plugins and other code that can be potentially used across multiple applications.

The other folder will be code specific to your application.




### Setting up your page

In a page, add the script tag

### Loading Scripts

Load other scripts

### Load other types (Less and Coffee)

### Installing Other Scripts

No

### Cleaning Scripts

Our scripts are ugly, we can clean them ... or JS lint them ...

### Make your site crawl-able

If you want Google to be able to find your site, you better make it crawlable.

Google does not know how to crawl ajax applications.  However, Steal makes this possible.

