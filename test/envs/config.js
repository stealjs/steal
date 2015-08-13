define(["config-dep"], function(){
	System.config({
		envs: {
			staging: {
				map: {
					mod: "other"
				}
			}
		}
	});
});
