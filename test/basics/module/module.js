define(["basics/es6module", "basics/commonjs/world"],function(es6,cjs){
	return {
		name: "module",
		es6module: es6["default"],
		cjsmodule: cjs
	};
});
