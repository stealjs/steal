@property {Object.<glob,glob>} System.traceur
@parent StealJS.config

Configure compiler overrides for [@traceur].

@option {Object.<glob,glob>}

Options to set. See
[the traceur wiki page](https://github.com/google/traceur-compiler/wiki/Options-for-Compiling)
for details on what options are available. These options will be passed
directly to [@traceur].
 
@body 

## Use

[@traceur] allows you to enable/disable various compiler features by
setting flags. Using `System.config`'s `traceur` option, you can override
the defaults using the standard `steal.js` configuration system.

For example, to enable the experimental
[ES7 async functions](https://github.com/google/traceur-compiler/wiki/LanguageFeatures#async-functions-experimental),
which are disabled by default, you would use:

    System.config({
       traceur: {
           asyncFunctions: true
       }
    });

And you can then write code like:

    async function greetUser(name) {
        try {
            let user = await User.findOne({name});
            console.log(`Hello, ${user.name}!`);
        } catch(e) {
            console.error(`Error finding user: ${e.message}`);
        }
    }

## Implementation

Implemented in [traceur](https://github.com/google/traceur-compiler).
