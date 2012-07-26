steal.packages('steal/build/packages/test/table_scroll.js',
               'canui/incubator/accordion/accordion.js',
			   'canui/resize/resize.js')
	.then('jquery/controller/route',
		'jquery/view/ejs','./app.css')
	.then('./ejs.ejs', function(){

$.Controller('Route', {
	"table route" : function(){
		steal('steal/build/packages/test/table_scroll.js', function(){
			$('#table').tableScroll()
		})
	},
	"accordion route" : function(){
		steal('canui/incubator/accordion', function(){
			$('#accordion').accordion()
		})
	},
	"resize route" : function(){
		steal('canui/resize', function(){
			$('#resize').resizable()
		})
	}
});

new Route(document.body);
		
		
});
	
