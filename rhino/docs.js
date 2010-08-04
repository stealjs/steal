/*
@page stealtools Steal Tools
@tag core
<h1>Steal Tools</h1>
<p>The Steal Project is a collection of comamnd and client based JavaScript utilities
that make building, packaging, sharing and consuming JavaScript applications easier.</p>

<h2>Tools</h2>
<h3>steal script</h3>
The [steal steal script] (steal/steal.js) is a script loader and dependency management tool.
@codestart
steal.plugins('jquery/controller','jquery/view/ejs');
@codeend
<h3>steal/compress</h3>
The steal [steal.compress compress] plugin makes compressing an application into a single compressed 
JavaScript file extremely easy.  It will work with any application, even ones not using the steal
script.
@codestart text
js steal/compressjs mypage.html
@codeend

<h3>steal/dev</h3>
Steal [steal.dev dev] is used to log messages cross browser.  These log messages are removed in production builds.
@codestart
steal.dev.log('something is happening');
@codeend
<h3>steal/generate</h3>
Steal [steal.generate generate]  makes building code generators extremely easy.  It also comes pre-packaged with 
 JavaScriptMVC style code generators.

@codestart text
js steal/generate/app cookbook
@codeend

<h3>steal/get</h3>
Steal [steal.get get] is a simple JavaScript version of ruby gems.  It can download and install plugins
from remote SVN or GIT repositories.  It can also download dependencies.

@codestart text
js steal/getjs http://github.com/pinhook/phui/
@codeend
 */
//blah