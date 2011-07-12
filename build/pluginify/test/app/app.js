steal('jquery/view/ejs')
 .views("//steal/build/pluginify/test/app/template.ejs").then(function($){
 	$.writerApp = function(){
		this.html("//steal/build/pluginify/test/app/template.ejs",{
			message : "Hello World"
		})
	}
 })
