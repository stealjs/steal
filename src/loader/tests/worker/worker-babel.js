importScripts(
	"../../../../node_modules/when/es6-shim/Promise.js",
	"../../loader.js"
);

System.transpiler = "babel";
System.paths["babel"] = "../../../../node_modules/babel-core/browser.js";

System["import"]("es6").then(function(m) {
  postMessage(m.p);
}, function(err) {
  console.error(err, err.stack);
});
