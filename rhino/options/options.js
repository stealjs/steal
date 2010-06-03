// used to parse options for rhino scripts

options = function(){}

// takes something like ["HI","YO"] (no spaces)
// returns this as an actual array
options.getArray = function(opt){
	a = opt.replace(/\[|\]/g, "")
	return a.split(",")
}
