steal(function(steal){
	steal.prompt = function(question){
	    java.lang.System.out.print(question);
	    var br = new java.io.BufferedReader(new java.io.InputStreamReader(java.lang.System["in"]));
	    var response;
	    try {
	         response = br.readLine();
	    } catch (e) {
	         System.out.println("IO error trying to read");
	    }
	    return response;
	}
	/**
	 * 
	 * @param {String} question
	 * @param {Boolean} true or false
	 */
	steal.prompt.yesno = function(question){
	    var response = "";
	    while(! response.match(/^\s*[yn]\s*$/i)){
	        response = prompt(question)
	    }
	    return response.match(/[yn]/i)[0].toLowerCase() == "y";
	}
})

