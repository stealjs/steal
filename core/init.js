// create the steal function now to use as a namespace.

function steal() {
	// convert arguments into an array
	var args = h.map(arguments);
	if ( args.length ) {
		pending.push.apply(pending, args);
		// steal.after is called everytime steal is called
		// it kicks off loading these files
		steal.after(args);
		// return steal for chaining
	}
	return steal;
};
steal._id = Math.floor(1000 * Math.random());

// temp add steal.File for backward compat
steal.File = steal.URI = URI;
// --- END URI
var pending = [],
	s = steal;