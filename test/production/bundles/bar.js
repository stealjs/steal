/*bundlesConfig*/
System.bundles = {"bundles/bar":["bar"],"bundles/bar.css!":["bar.css!steal/css"]};
/*stealconfig*/

define("steal/css",[], function(){
	return {
		
		instantiate: function(load) {
	    
		    return {
				deps: [],
				execute: function(){
					var head = document.head || document.getElementsByTagName('head')[0],
						style = document.createElement('style');
					
					style.type = 'text/css';
					if (style.styleSheet){
					  style.styleSheet.cssText = load.source;
					} else {
					  style.appendChild(document.createTextNode(load.source));
					}
					head.appendChild(style);
					return new System.global.Module({});
				}
			};
		},
		buildType: "css"
	};
});

/*main*/
define("bar",["bar.css!"],function(e){
	
	
	if(typeof window !== "undefined" && window.QUnit) {
		QUnit.equal(document.getElementById("test-element").clientWidth, 200, "element width set by css");
	
		QUnit.start();
		removeMyself();
	} else {
		console.log("width", document.getElementById("test-element").clientWidth);
	}
	
});
