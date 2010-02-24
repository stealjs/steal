$convert = function(name){
    var className = name.match(/[^\.]*$/)[0] //Customer
	return {
        underscore : Generate.underscore(className),
		path : Generate.underscore(name).replace(/\./g,"/").replace(/\/[^\/]*$/,""),
        name : name,
		fullName : name,
		className : className,
		plural: steal.Inflector.pluralize(className)
    }
}
