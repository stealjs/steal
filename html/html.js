steal(function(s){

var window = (function() {
		return this;
	}).call(null, 0),
	url;

/**
 * url, options
 * 
 * options
 * 
 *   - page
 */
var html = steal.html = function(urlo, opts){
	options = opts;
	url = urlo;
	
	load('steal/rhino/env.js');
	
	Envjs(urlo, {
		scriptTypes: {
			"text/javascript": true,
			"text/envjs": true,
			"": true
		},
		logLevel: 2,
		dontPrintUserAgent: true,
	});
		
	var newSteal = window.steal;
	
	newSteal.one('done',function(init){

		newSteal.html.onready(function(){
			var html = getDocType()+"\n"+document.innerHTML;
			if(typeof opts === "function"){
				opts(html)
			} else {
				print(html)
			}
		})
	});
	
	
},
	options,
	count,
	getDocType  = function(){
		var content;
		if(s.File(url).domain() === null){
			content = readFile(s.File(url).clean());
		} else {
			content = readUrl(url);
		}
		var docTypes = content.match( /<!doctype[^>]+>/i );
		return docTypes ? docTypes[0] : "";
	};
// wait for steal.done
	
var count = 0,
	readyFunc;

html.wait = function(){
	count++;
};
html.ready = function(){
	count--;
	if(readyFunc && count <= 0){
		readyFunc();
	}
	
};
html.onready = function(func){
	readyFunc = func;
	if(count <= 0){
		readyFunc();
	}
};


});