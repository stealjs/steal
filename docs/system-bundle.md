@property {Array.<moduleName>} System.bundle
@parent StealJS.config

Specifies which modules will be progressively loaded.  This is 
used by the build.

@option {Array.<moduleName>}

@body

## Use

It is possible to load an app in chunks, rather than one single production file. If there is modules segmented by "pages", for example:

- A home screen in "js/pages/home"
- Search results in "js/pages/search"
- Details in "js/pages/details"

It will be more efficient to load "search" and "details" progressively, making the "home" page load lighter. `System.bundle` allows you to create multiple production files by defining the starting point:

    System.bundle = ["js/pages/home","js/pages/search","js/pages/details"]

Within the main application, the condition may exist such as:

```
import $ from 'jquery';

if(/*route === home*/) {
	System.import('js/pages/home', function() {});
}
```