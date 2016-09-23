if(typeof console === "undefined") {
	var noop = function() {};

	console = {
		log: noop,
		error: noop,
		warn: noop,
		info: noop,
		clear: noop
	};
}
