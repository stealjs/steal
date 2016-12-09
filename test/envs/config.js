define(["config-dep"], function(){
	steal.config({
		envs: {
			"window-staging": {
				map: {
					mod: "other"
				}
			}
		}
	});
});
