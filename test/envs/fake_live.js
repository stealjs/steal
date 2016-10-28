var loader = require("@loader");
var steal = require("@steal");

loader.liveReloadInstalled = true;

function updateEnvs() {
	steal.config({
		envs: {
			"window-staging": {
				map: {
					mod: "other"
				}
			}
		}
	});
}

steal.done().then(function(){
	setTimeout(function(){
		updateEnvs();

		// Simulate live-reload's behavior
		callbacks.forEach(function(cb){
			cb();
		});
	}, 600);
});

var callbacks = [];

module.exports = function(moduleName, callback){
	callbacks.push(callback);
};
