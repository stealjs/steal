
var bowerConfiged = function(loader){
	var bowerSetter = {
		set: function(val){
			var type = typeof val;
			if(type == "boolean") {
				if(val) {
					this.bower = {
						dependencies: "bower_components",
						config: "bower.json"
					};
				} else {
					this.bower = false;
				}
			} else if(type === "string") {
				this.bower = {
					dependencies: val,
					config: "bower.json"
				}
			} else {
				this.bower = val;
			}
		}
	};

  setterConfig(loader, {
    bower: bowerSetter
  });

  loader.config({
    bower: true
  });
};

if(typeof System !== "undefined") {
	bowerConfiged(System);
}
