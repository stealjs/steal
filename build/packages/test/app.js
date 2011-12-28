steal.packages('mxui/layout/table_scroll/table_scroll.js',
               'mxui/nav/accordion/accordion.js')
	.then('jquery/controller/route', function(){	
$.Controller('Route', {
	"table route" : function(){
		steal('mxui/layout/table_scroll', function(){
			$('#table').mxui_layout_table_scroll()
		})
	},
	"accordion route" : function(){
		steal('mxui/nav/accordion', function(){
			$('#accordion').mxui_nav_accordion()
		})
	}
})
new Route(document.body)
		
});
	
