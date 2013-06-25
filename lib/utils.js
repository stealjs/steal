var fs = require('fs'),
	execSync = require('execsync-ng');

var slice = Array.prototype.slice;

/*
 * Stubs Rhino's readFile function.
 */
readFile = function(){
	return fs.readFileSync.apply(fs, arguments).toString();
};

/**
 * @function runCommand
 *
 * Stubs Rhino's runCommand function
 *
 * @param {String} [command] The command to run.
 *
 * @param {Object} [options] An options object.
 */
runCommand = function(){
	var args = slice.call(arguments),
		options = args.pop(),
		commandString = "";

	if(typeof options === "string") {
		args.push(options);
		options = null;
	} else {
		if(options.args) {
			args.push.apply(args, options.args);
		}
	}

	commandString = args.join(" ");

	// Execute the command.
	var result = execSync.exec(commandString);
	if(options.output) {
		options.output = result.stdout;
	}
};
