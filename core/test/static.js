module('Static')

test('st.makeOptions', function(){
	var options = st.makeOptions({
		id: 'jquery'
	});
	equal(options.id + "", 'jquery/jquery.js')
})