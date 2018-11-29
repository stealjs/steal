var _systemBundles = System.bundles || (System.bundles = {});
_systemBundles["bundle-b"] = ["config/alarms.json"];

define("form-fields", ["config/alarms.json"], function(alarms) {
	return {
		config: alarms
	};
});
