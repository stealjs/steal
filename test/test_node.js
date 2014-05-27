var steal = require('steal');
function throwError(e) {
	setTimeout(function(){
		throw e;
	},1);
}

function traverse(object, iterator, parent, parentProperty) {
  var key, child;
  if (iterator(object, parent, parentProperty) === false)
    return;
  for (key in object) {
    if (!object.hasOwnProperty(key))
      continue;
    if (key == 'location' || key == 'type')
      continue;
    child = object[key];
    if (typeof child == 'object' && child !== null)
      traverse(child, iterator, object, key);
  }
}

// given a syntax tree, return the import list
function getImports(moduleTree) {
  var imports = [];

  function addImport(name) {
    if ([].indexOf.call(imports, name) == -1)
      imports.push(name);
  }

  traverse(moduleTree, function(node) {
    // import {} from 'foo';
    // export * from 'foo';
    // export { ... } from 'foo';
    // module x from 'foo';
    if (node.type == 'EXPORT_DECLARATION') {
      if (node.declaration.moduleSpecifier)
        addImport(node.declaration.moduleSpecifier.token.processedValue);
    }
    else if (node.type == 'IMPORT_DECLARATION')
      addImport(node.moduleSpecifier.token.processedValue);
    else if (node.type == 'MODULE_DECLARATION')
      addImport(node.expression.token.processedValue);
  });
  return imports;
}

function getESModuleImports(load){
	load.address = load.address || 'anon' + ++anonCnt;
    var parser = new traceur.syntax.Parser(new traceur.syntax.SourceFile(load.address, load.source));
    var body = parser.parseModule();
    return getImports(body);
}



var trace = function(System, onFulfilled, onRejected){
	var systemInstantiate = System.instantiate;
	System.instantiate = function(load){
		var res = systemInstantiate.apply(this, arguments);
		Promise.resolve(res).then(function(instantiateResult){
			if(!instantiateResult) {
				var imports = getESModuleImports(load);
				onFulfilled(load, imports );
			} else {
				onFulfilled(load, instantiateResult.deps);
			}
			
		}, onRejected)["catch"](throwError);
		

		return res;
	};
};





printOut({
	configPath: __dirname+"/stealconfig.js",
	startId: "basics"
});