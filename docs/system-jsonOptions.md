@property {Object} System.jsonOptions
@parent StealJS.config

Provides options that can be applied to JSON loading. The JSON extension has the following options:

@option {Function} [transform] A function that allows you to transform the JSON object that will be used as the module value.

```js
System.config({
  jsonOptions: {
    transform: function(load, data) {
      // Delete secret data
	  delete data._secret;
	  return data;
	}
  }
});
```

  @param {Object} load The load object for this module. Use this if you need to know the module's name or other metadata to determine how to transform it.
  
  @param {Object} data The raw JSON data parsed by `JSON.parse`.

  @return {Object} The object that will be used as the module's value.
