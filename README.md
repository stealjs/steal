@page stealjs StealJS
@parent index 1

StealJS is a collection of command and client based JavaScript utilities
that make building, packaging, sharing and consuming JavaScript applications easy.

This page highlights the features of StealJS then walks through how to use them.

## Features

### Dependency Management ([steal])

The [steal steal script] (steal/steal.js) is a script loader and 
dependency management tool.  Features:

 - Loads JavaScript, CSS, Less, CoffeeScript, and a variety of client-side templates.
 - Only loads a file once.
 - Can load relative to the current file.
 - Can be use with scripts that don't use steal.


    steal('jquery/controller','jquery/view/ejs');

### JS/CSS Concatenation and Compression ([steal.build])

The [steal.build] plugin makes compressing an application into a single compressed 
JavaScript and CSS file extremely easy.  Features:

  - Works with any application, even ones not using the steal script.
  - Configurable compressors (defaults to Google Closure).
  - Compresses Less and CoffeeScript.
  - Pre-processes and compresses client-side templates (templates don't have to be parsed).<
  - Expandable architecture makes it easy to build other resources.
  
@codestart text
js steal/buildjs mypage.html
@codeend

### Logging ([steal.dev dev])

[steal.dev] logs messages cross browser.  Messages are removed in production builds.

    steal.dev.log('something is happening');

### Code Generators ([steal.generate])

[steal.generate]  makes building code generators extremely easy.  Features:

  - Pre-packaged JMVC style code generators.
  - Very easy to write custom generators.
  
@codestart text
js steal/generate/app cookbook
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

## Getting started With Steal

### Installing Steal

### Setting up your page

### Loading Scripts

### Cleaning Scripts

### Loading Other Types

[steal.static.type] makes it very easy to define other types in the build system.  You can easily define 
a type for meta languages on top of JS/CSS (like coffeescript and LESS) and provide a simple 
conversion function.

### Cleaning Scripts

### Installing Other Scripts

### Make your site crawl-able