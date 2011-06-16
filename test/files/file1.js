ORDER.push(1)

steal('file2').then(function(){
	ORDER.push("then1")
})
