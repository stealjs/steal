// load('steal/generate/test/test.js')

load('steal/rhino/steal.js')

steal("//steal/generate/generate", function(steal){
	
	steal.generate("steal/generate/templates/app","foo",{})
	
	
})


quit();
// load('steal/generate/test/run.js')

load('steal/test/helpers.js')
_S.clear();

/**
 * Tests generating a very basic plugin and then tries to load it
 * (one level deep first then two levels deep)
 */
print("-- generate cnu plugin --");

_args = ['cnu']; load('steal/generate/plugin');_S.clear();
_S.open('cnu/cnu.html')
if(typeof steal == 'undefined') throw "didn't load steal"
_S.clear();

print("-- try 2 levels deep --");
_args = ['cnu/widget']; load('steal/generate/plugin');_S.clear();
_S.open('cnu/widget/widget.html')
if(typeof steal == 'undefined') throw "didn't load steal"
_S.clear();

/**
 * Tests generating a very basic controller and model
 */
print("-- generate controller --");
_args = ['Cnu.Controllers.Todos']; load('steal/generate/controller');_S.clear();
print("-- generate model --");
_args = ['Cnu.Models.Todo']; load('steal/generate/model');_S.clear();
load('steal/file/file.js');
cnuContent = readFile('cnu/cnu.js').
    replace(".models()", ".models('todo')").
    replace(".controllers()", ".controllers('todos')");
new steal.File('cnu/cnu.js').save( cnuContent );

print("-- generate page --")
_args = ['cnugen','cnu']; load('steal/generate/page');_S.clear();

_S.open('cnu/cnugen.html')
if(typeof Cnu.Controllers.TodosController == 'undefined') throw "didn't load Cnu.Controllers.TodosController"
if(typeof Cnu.Models.Todo == 'undefined') throw "didn't load Cnu.Models.Todo"


/**
 * Tests generating a unit and functional tests
 */
_S.clear();
print("-- generate unit test --");
_args = ['cnu','cnu_unit']; load('steal/generate/unit_test');_S.clear();
print("-- generate functional test --");
_args = ['cnu','cnu_functional']; load('steal/generate/functional_test');_S.clear();

_S.clear();
load('steal/file/file.js');
cnuQunitContent = readFile('cnu/test/qunit/qunit.js').
    replace(".then(\"basic\")", ".then(\"cnu_unit_test\")");
new steal.File('cnu/test/qunit/qunit.js').save( cnuQunitContent );

cnuFuncunitContent = readFile('cnu/test/funcunit/funcunit.js').
    replace(".then(\"basic\")", ".then(\"cnu_functional_test\")");
new steal.File('cnu/test/funcunit/funcunit.js').save( cnuFuncunitContent );

_S.clear();
//now see if unit and functional run
print("-- Run unit tests for cnu --");
load('cnu/scripts/qunit.js');

_S.sleep(300);

_S.clear();
load('steal/file/file.js');

_S.clear();
print("-- Run functional tests for cnu --");
load('cnu/scripts/funcunit.js');_S.clear();

_S.sleep(300);

_S.clear();
