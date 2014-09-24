steal(function() {
    console.log('Start of eval_error.js');
	throw Error('error during module evaluation');
    console.log('End of eval_error.js');
});
