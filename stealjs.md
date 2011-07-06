
@page stealjs StealJS
@parent index 1

The StealJS project is a collection of comamnd and client based JavaScript utilities
that make building, packaging, sharing and consuming JavaScript applications easy.

## Tools

### Dependency Management 

The [steal steal script] (steal/steal.js) is a script loader and 
dependency management tool.  Features:

  - Loads JavaScript, CSS, Less, CoffeeScript, and a variety of client-side templates.
  - Only loads a file once.
  - Can load relative to the current file.

    steal('jquery/controller','jquery/view/ejs');

### JS/CSS Concatenation and Compression

The steal [steal.build build] plugin makes compressing an application into a single compressed 
JavaScript and CSS file extremely easy.  Features:

  - Works with any application, even ones not using the steal script.
  - Configurable compressors (defaults to Google Closure).
  - Compresses Less and CoffeeScript.
  - Pre-processes and compresses client-side templates (templates don't have to be parsed).<
  - Expandable architecture makes it easy to build other resources.
  
@codestart text
js steal/buildjs mypage.html
@codeend

### Logging

Steal [steal.dev dev] logs messages cross browser.  Messages are removed in production builds.

    steal.dev.log('something is happening');

### Code Generators

Steal [steal.generate generate]  makes building code generators extremely easy.  Features:

  - Pre-packaged JMVC style code generators.
  - Very easy to write custom generators.
  
@codestart text
js steal/generate/app cookbook
@codeend

<h3>Package Management</h3>
Steal [steal.get get] is a simple JavaScript version of [http://rubygems.org/ ruby gems].  Features:
 <ul>
	<li>Download and install plugins from remote SVN or GIT repositories.  </li>
	<li>Installs dependencies.</li>
</ul>

@codestart text
js steal/getjs http://github.com/jupiterjs/mxui/
@codeend
<h3>Code Cleaner</h3>
Steal [steal.clean clean] cleans your code and checks it against JSLint. 

@codestart text
js steal/clean path/to/page.html
@codeend
