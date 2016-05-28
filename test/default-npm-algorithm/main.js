// import some from "some";
//
// console.log(some);

System.import('node_modules/some/package.json!npm').then(function (module) {

	System.import('some').then(function (some) {
		console.log(some);
	});
	console.log(module);
});
