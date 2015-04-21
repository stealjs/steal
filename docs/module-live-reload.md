@module {*} live-reload
@parent StealJS.modules

Live-reload is a module that enables a speedier development workflow. Paired with a WebSocket server such as StealTools, `live-reload` will reload modules as you change them in your browser.

@option {Number} liveReloadPort

Specifies a port to use to establish the WebSocket connection. By default `8012` will be used. This can be specified in the script tag or in your config:

```html
<script src="node_modules/steal/steal.js"
	live-reload-port="9999"></script>
```


@body

## Use

Use live-reload by including it as a configDependency in your `package.json`:

```json
{
  "system": {
    "configDependencies": [
      "live-reload"
    ]
  }
}
```

## Hooks

**live-reload** includes 2 hooks that you can use in your code that are called during the livecycle of a reload.

### beforeDestroy

If you include a `beforeDestroy` function in your module's code, the function will be called before that module is unloaded. Use this if you need to do some cleanup because the module has side effects (such as setting a property on the `window`).

```js
export function beforeDestroy(){
	delete window.App; // Remove a property added to the window.
};
```

### afterReload

If you include an `afterReload` function in your module, that function will be called after every reload. This is the place to do re-initialization, if you need it, such as rerendering:

```js
export function afterReload(){
	render();
};
```

