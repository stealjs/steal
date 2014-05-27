@page stealjs StealJS
@parent javascriptmvc 2
@group stealjs.pages Pages

StealJS is a collection of command line and JavaScript client utilities
that make building, packaging, and sharing 
JavaScript applications easy.  Lets see what it can do:


### Dependency management ([steal])

[steal] loads modules into your app. Features:

 - Loads JS, CSS, Less, CoffeeScript, and client-side templates.
 - Parallel loading.
 - Works with scripts that don't use steal.

@codestart
steal('widgets/tabs.js',
      './style.css', 
      function(Tabs){
      
  new Tabs("#item");
});
@codeend
  
### JS/CSS concatenation and minification ([steal.build])

[steal.build] combines and minfies an application (or application's) resources
into a small number of minified packages for faster downloading. Features:

 - Minifies JS, Less, CoffeeScript, and client-side templates.
 - Build shared dependencies across [steal.build.apps multiple apps].
 - Package modules for [steal.build.packages progressive loading].
 - Create modules that work [steal.build.pluginify without steal].

@codestart text
js steal/buildjs mypage.html
@codeend

### Logging ([steal.dev])

[steal.dev] logs messages cross browser.  Messages are removed in production builds.

    steal.dev.log('something is happening');

### Code generators ([steal.generate])

[steal.generate]  makes building code generators extremely easy.  Features:

  - Pre-packaged JMVC style code generators.
  - Easily author custom generators.

@codestart text
js jquery/generate/app cookbook
@codeend

### Code cleaner ([steal.clean])

[steal.clean] cleans your code and checks it against JSLint.

@codestart text
js steal/clean path/to/page.html
@codeend

### Searchable ajax apps ([steal.html])

[steal.html] makes Google-crawlable html from your ajax app.

@codestart text
js steal/htmljs http://localhost/cookbook.html#recipes
@codeend
