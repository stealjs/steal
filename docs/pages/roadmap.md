@page StealJS.roadmap Roadmap
@parent StealJS.guides

Here's what we've got planned:

## Multi-app build

Add the same high-performance builds to multi-page appliactions as happens
for progressively loaded single page apps.

## Watch Builds

Automatically build when a file changes. We should be able to make
this extremely high performance if the dependency graph is not changing.

## Remove Traceur Runtime and IE8 ES6 module support

[Read here](https://groups.google.com/forum/#!topic/systemjs/yECCl6I9SDw) 

## Development Packages

Build a package that will be loaded in development. For example, instead of
loading each CanJS module individually, you could easily build them
into a package that would be loaded in development as a single file.
