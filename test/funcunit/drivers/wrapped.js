jQuery.wrapped = function(){
	var args = jQuery.makeArray(arguments),
	    selector = args.shift(),
	    context =  args.shift(),
		method = args.shift();
	//eval each param ...
	//for(var a = 0; a < args.length; a++){
	//	args[a] = jQuery.evalJSON(args[a])
	//}
	var q = jQuery(selector, context);
	//need to conver to json
	var res = q[method].apply(q, args);
    
    return jQuery.toJSON(res.jquery ? true : res)
}
_doc = function(){
	return selenium.browserbot.getCurrentWindow().document
}
_win = function(){
	return selenium.browserbot.getCurrentWindow()
}