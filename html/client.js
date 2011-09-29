steal(function(){
	steal.html = {};
	var count = 0,
		readyFunc;
	/**
	 * @function steal.html.wait
	 * @parent steal.html
	 * Waits for the html to finish
	 */
	steal.html.wait = function(){
		count++;
	};
	/**
	 * @function steal.html.ready
	 * @parent steal.html
	 * Lets the page know it's ready to render the html
	 */
	steal.html.ready = function(){
		count--;
		if(count <= 0 && steal.client){
			steal.client.trigger("pageready")
		}
	};

})