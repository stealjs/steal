@page stealjs.deploying Deploying
@parent stealjs.pages 3

After building an application, you need to deploy the 
application.  Typically, you need to:

1. Copy _steal.production.js_, and your 
   app's _production.js_ and _production.css_ to the production public
   folder in the same location as in development.

2. Make sure your pages set steal in production mode:

       <script src='../steal/steal.production.js?myapp'/>
       

For example, if you have the following development 
folders / files after a build:

    app/
        app.html
        app.js
        app.less
        production.js
        production.css
    steal/
        steal.production.js
        

In production you will need the following files in their
correct places:

    app/
        app.html
        production.js
        production.css
    steal/
        steal.production.js
        
## Images

If your css has references images, make sure they
are also copied.