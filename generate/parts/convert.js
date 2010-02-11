$convert = function(name){
    return {
        underscore : jQuery.String.underscore(name.replace(/controller/i, '')),
	    plural : jQuery.String.pluralize(jQuery.String.underscore(name.replace(/controller/i, ''))),
        name : name
    }
}
