ORDER.push(1)
console.log("file1")
steal('./file2.js').then(function(){
console.log("func")
	ORDER.push("then1")
})
