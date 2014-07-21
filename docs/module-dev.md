@typedef {{logLevel: Number, warn: function(), log: function()}} @dev
@parent StealJS.modules

A module loaded in [System.env development] after [@config] but 
before [System.main].  It typically loads development-only 
tools.  By default, it loads `steal/dev.js` which provides the following
values on a global `steal.dev`:


@option {function()} log Writes out a message with `console.log` if `logLevel` is
less than 1.
@option {function()} warn Writes out a warning message if `logLevel` is less
than 2.
@option {Number} [logLevel=0] Controls what types of messages will be logged. By
default the logLevel is 0 so all messages will be logged.

@body

## Use

Call `steal.dev.log` to log development info.  For example:

    steal.dev.log("app is initializing");

Call `steal.dev.warn` to log warning information.  For example:

    steal.dev.warn("something went wrong");

By default, [steal-tools] will remove `steal.dev.log` and `steal.dev.warn` calls
from the built output.


