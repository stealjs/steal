@page stealjs.installing Installing StealJS
@parent stealjs.pages 0

@description Learn how to install StealJS.

@body




## Basic Install

By default, StealJS is designed to work from the same folder
as your scripts, typically a public folder. Install StealJS in 
a public folder by:

 - [downloading StealJS](http://javascriptmvc.com/builder.html), 
 - [installing installing JavaScriptMVC], or
 - [cloning it from github](http://github.com/bitovi/steal)
 
If you downloaded or cloned steal, you might have run:

    > ./js steal/make.js

When finished you should have the following in a public folder:

    steal/
    stealconfig.js
    js
    js.bat


> _Note: StealJS requires Java 1.6 or greater._

To verify that steal works, run one of the following commands in
the folder you installed StealJS:

    mac > ./js
    
    windows > js

The folder you installed steal is the [steal.config.root ROOT] folder.


## Installing Steal other places

It's possible, using [steal.config], to locate steal other places.  It's 
common to want steal in a folder
that is maintained by a server-side dependency management system like
Maven or NPM.

The following shows StealJS and CanJS placed in a __shared__ folder
while application code exists in the __apps__ folder.


    public/
       shared/
          can/
          steal/
          js
          js.bat
          stealconfig.js
       apps/
          app/
             app.js
             app.html

To make it possible for app.js to use steal and be built by it, the 
following needs to happen:

__app.html__

Have _app.html_ point to _shared/steal/steal.js_ like:

    <script src="../../shared/steal/steal.js?app">

__stealconfig.js__

Update the paths to the _can_ and _steal_ folders and
set steal root to be the public folder:


    root: steal.config('root').join('../apps'),
    paths: {
      "can/": "../shared/can/",
      "steal/" : "../shared/steal/",
    }
	
Notice that:

 - `steal.config('root').join('../apps')` updates the root path relative to the 
   default root location.
 - The paths to _can_ and _steal_ are given relative to the root folder. 
