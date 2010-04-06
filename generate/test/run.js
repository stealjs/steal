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
_args = ['Cnu.Models.Todo']; load('steal/generate/model');_S.clear();
load('steal/file/file.js');
cnuContent = readFile('cnu/cnu.js').
    replace(".models()", ".models('todo')").
    replace(".controllers()", ".controllers('todos')");
new steal.File('cnu/cnu.js').save( cnuContent );
/*print("-- unit test --");
_args = ['Truth']; load('jmvc/generate/unit_test');clearEverything();
print("-- functional test --");
_args = ['TruthFunctional']; load('jmvc/generate/functional_test');clearEverything();*/
print("-- generate page --")
_args = ['cnugen','cnu']; load('steal/generate/page');_S.clear();

_S.open('cnu/cnugen.html')
if(typeof Cnu.Controllers.TodosController == 'undefined') throw "didn't load Cnu.Controllers.TodosController"
if(typeof Cnu.Models.Todo == 'undefined') throw "didn't load Cnu.Models.Todo"
_S.clear();
