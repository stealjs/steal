steal("//steal/parse/tokens").
	plugins('steal/build').then(function(steal){

var isArray = function( array ) {
  return Object.prototype.toString.call( array ) === "[object Array]";
},
same = function(a, b){
    a = steal.extend({},a);
    for(var name in b){
        if(b[name] != a[name]){
            return false;
        }else{
            delete a[name];
        }
    }
    //there should be nothing left in a
    for(var name in a){
        return false;
    }
    return true;
},
// a is like b, but doesn't have to have all of b's properties
like = function(a, b){
	for(var name in a){
        if(b[name] != a[name]){
            return false;
        }
    }
	return true;
};

/**
 * Returns an pull parser useful for walking through
 * token streams.
 * 
 * @param {String} str
 */
steal.parse = function(str){
		//print("Breaking up strs")
		var tokens = str.tokens('=<>!+-*&|/%^', '=<>&|'),
			tokenNum = 0,
			lines;
			
		var moveNext = function(ignoreComments){
			var next = tokens[tokenNum++];
			if(next){
				//print("Next TOken = "+next.value);
			}
			if(next && ignoreComments && next.type === 'comment'){
				return moveNext(ignoreComments);
			}else{
				return next;
			}
			
		},
		getLineNum = function(pos){
			if(!lines){
				lines = str.split("\n");
			}
			var cur = 0,
				line = 0;
			while(pos < cur+lines[line].length){
				line++;
			}
			return line
		}
		
		return {
			ignoreComments : true,
			moveNext : function(){
				return moveNext(this.ignoreComments)
			},
			next : function(){
				return tokens[tokenNum];
			},
			cur : function(){
				return tokens[tokenNum-1];
			},
			lineNum : function(token){
				token = token || tokens[tokenNum];
				return getLineNum(token.from);
			},
			line : function(tokenOrLineNum){
				token = token || tokens[tokenNum];
			},
			/**
			 * parses until it finds the corresponding partner for a (),[],{},<> pair.
			 * returns all the tokens in between.
			 * parse.partner
			 */
			partner : function(left, cb){
				var right = {
						"(" : ")",
						"[" : "]",
						"{" : "}",
						"<" : ">"
					}[left],
						count = 1, 
						token, 
						last, 
						prev;

				if(this.cur().value != left){
					this.until(left);
				}
				while(token = this.moveNext()){
					if(token.type == 'operator'){
						if(token.value === left){
							count++;
						}else if(token.value === right){
							count--;
							//print("  -"+count+" "+prev+" "+last)
							if(count === 0){
								return token;
							}
						}else if(token.value === "/"){
							print("YOU SHOULD NOT BE HERE")
							this.comment();
						}
					}
					cb && cb(token)
					prev = last;
					last = (token.value)
				}
			},
			/**
			 * Parses until it finds something you are looking for.
			 * 
			 * until("function",")") -> looks for function or  )
			 * until(["foo",".","bar"]) -> looks for foo.bar
			 * 
			 * 
			 */
			until: function(){
				var token, 
					//where in each Pattern we've got a match
					patternMatchPosition = [],
					// an array of pattern arrays ...
					patterns = [],
					//makes an option into a token that can be compared against
					makeTokens = function(tokens){
						var res = [];
						for(var i =0 ; i < tokens.length; i++){
							res.push(typeof tokens[i] === 'string' ? {value : tokens[i]} : tokens[i])
						}
						return res;
					},
					callback = function(){};
					
				for(var i =0; i < arguments.length;i++){
					patternMatchPosition[i] =0;
					if(isArray(arguments[i])){
						patterns.push(makeTokens(arguments[i]))
					}else if(typeof arguments[i] == 'function'){
						callback =  arguments[i];
					}
					else{
						patterns.push(makeTokens([arguments[i]]))
					}
				}
				while (token = this.moveNext() ) {
					for(i =0; i< patterns.length; i++){
						var pattern = patterns[i];
	
						if( token.type !== "string" && like( pattern[patternMatchPosition[i]], token) ){
							patternMatchPosition[i] = patternMatchPosition[i]+1;
							if(patternMatchPosition[i] === pattern.length){
								return token;
							}
						}else{
							patternMatchPosition[i] = 0;
						}
					}
				}
			}
		}
	};
})