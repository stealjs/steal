@page StealJS.why Why StealJS
@parent StealJS.guides

Everyone should use [StealJS] to do dependency management on their projects.  Here's why:

## Faster Loading Sites

[stealTools.build] heavily optimizes load times by balancing cache hits against
the number of total css and script requests. If you've ever found yourself trying to
package common scripts together, stop!  [steal-tools steal-tools] will do this for
you and better than you can do yourself.

## Just Refresh

You don't need to build everytime you change code.  Just refresh.

## Transition to the future

If your project currently uses AMD, CommonJS, or Steal, you can
keep those syntaxes and start writing ES6 today.

## The Future is bright (and small)

The ES6 module loader is an extremely well thought out specification that
allows almost any behavior to woven into the `System` 
loader. Both [SystemJS](http://github.com/systemjs/systemjs) and 
[steal] are written as groups of extensions applied to the
`System` loader. When ES6 modules do land in browsers, you'll be able to
use just the `System` extensions you need. 

## Great Workflows


