System.trace = true;

System.config({
	bower: {
    dependencies: "../bower_components",
    config: "../bower.json"
  },
  meta: {
		"jQuery-Collapse": {
			format: "global",
			exports: "jQuery"
		},
		"jquery": {
			format: "global",
			exports: "jQuery"
		}
	}
});
