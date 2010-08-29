// load("steal/build/apps/test.js")

load("steal/rhino/steal.js");
steal.plugins('steal/build','steal/build/scripts','steal/build/styles','steal/build/apps',function(){
	
	steal.build.apps(['phui/combobox','phui/modal'])
	
})