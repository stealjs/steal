@property {Object} config.babelOptions babelOptions
@parent StealJS.config

Babel 6 is the default JavaScript compiler in stealJS.
Babel provides some options for transpiling the JavaScript code.
Available options can be found [here](https://babeljs.io/docs/usage/options/))

@body

## Default Babel 6 options
The default options for the Babel 6 transpiler are

#### [Presets](https://babeljs.io/docs/plugins/#presets)

- es2015-no-commonjs
- react
- stage-0
    
#### [Plugins](https://babeljs.io/docs/plugins/#transform-plugins)

- transform-es2015-modules-systemjs

An example of configuration `babelOptions` in your __package.json__
```
"steal": {
    "babelOptions": {
        "presets": [
            "es2015-no-commonjs",
            "react",
            "stage-0"
        ],
        "plugins": [
            "transform-es2015-modules-systemjs"
        ]
    }
}
```

Babel options like `optional`, `whitelist` or `blacklist` are __not__ vaild options in Babel 6 anymore.


## Babel 5 options for stealJS < 1.0
If you are using a stealJS version less than 1.0, Babel is not the default transpiler.
See [config.transpiler] how to change the JavaScript compiler.
If you activated Babel as the default transpiler, steal sets the following as default options

#### blacklist
- react

If you want JSX support, pass an empty array for the blacklist option.
An example of configuration `babelOptions` in your __package.json__
```
"steal": {
    "babelOptions": {
        "blacklist": []
    }
}
```

## JSX

JSX is supported by default with the Babel 6 compiler, so you can use it directly in your code like:

```js
var hw = <div>Hello <strong>world!</strong></div>;
```

If you would like to import a `.jsx` template to your app like this:
```
import renderer from "my-jsx-template.jsx";
```
have a look at the [steal-react-jsx](https://www.npmjs.com/package/steal-react-jsx) plugin
