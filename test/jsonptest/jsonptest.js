steal.plugins('jquery').then(function(){

	$.ajax({
		dataType: 'jsonp',
		url:'service.json',
		jsonpCallback: "callback123",
		success: function(a){
			$("#out").text(a)
		}
	});
	steal('file1')

});