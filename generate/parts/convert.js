/**
 * Converts name into a bunch of useful other parts
 * @param {Object} name
 */
$convert = function(name){
    var className = name.match(/[^\.]*$/)[0] //Customer
    var appName = name.split(".")[0] //Customer
	return {
        underscore : Generate.underscore(className),
		path : Generate.underscore(name).replace(/\./g,"/").replace(/\/[^\/]*$/,""),
        name : name,
		fullName : name,
		className : className,
		plural: steal.Inflector.pluralize(Generate.underscore(className)),
		appName: appName.toLowerCase()
    }
}
