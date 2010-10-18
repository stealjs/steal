load('steal/rhino/steal.js')
load('steal/rhino/test.js')
_S = steal.test;
steal("//steal/generate/generate",'//steal/generate/system', function(steal){
	var	data = steal.extend({
		path: "foo", 
		application_name: "foo",
		current_path: steal.File.cwdURL(),
		path_to_steal: new steal.File("foo").pathToRoot()
	}, steal.system);
	steal.generate("steal/generate/templates/app","foo",data)
})

/**
 * Tests generating a very basic plugin and then tries to load it
 * (one level deep first then two levels deep)
 */
print("-- generate cnu app --");

_args = ['cnu']; 
load('jquery/generate/app');
_S.clear();
_S.open('cnu/cnu.html')
if(typeof steal == 'undefined') throw "didn't load steal"
_S.clear();

print("-- try 2 levels deep --");
_args = ['cnu/widget']; 
load('jquery/generate/plugin');
_S.clear();
_S.open('cnu/widget/widget.html')
if(typeof steal == 'undefined') throw "didn't load steal"
_S.clear();

/**
 * Tests generating a very basic controller and model
 */
print("-- generate controller --");
_args = ['Cnu.Controllers.Todos']; 
load('jquery/generate/controller');
_S.clear();
print("-- generate model --");
_args = ['Cnu.Models.Todo']; 
load('jquery/generate/model');
_S.clear();
cnuContent = readFile('cnu/cnu.js').
    replace(".models()", ".models('todo')").
    replace(".controllers()", ".controllers('todos')");
load('steal/rhino/steal.js')
new steal.File('cnu/cnu.js').save( cnuContent );

print("-- generate page --")
_args = ['cnu','cnugen.html']; 
load('jquery/generate/page');
_S.clear();

_S.open('cnu/cnugen.html')
if(typeof Cnu.Controllers.Todos == 'undefined') throw "didn't load Cnu.Controllers.Todos"
if(typeof Cnu.Models.Todo == 'undefined') throw "didn't load Cnu.Models.Todo"

steal.File("cnu").removeDir();