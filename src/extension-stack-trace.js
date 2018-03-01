addStealExtension(function (loader) {
	function StackTrace(message, items) {
		this.message = message;
		this.items = items;
	}

	StackTrace.prototype.toString = function(){
		var arr = ["Error: " + this.message];
		var t, desc;
		for(var i = 0, len = this.items.length; i < len; i++) {
			t = this.items[i];
			desc = "    at ";
			if(t.fnName) {
				desc += (fnName + " ");
			}
			desc += StackTrace.positionLink(t);
			arr.push(desc);
		}
		return arr.join("\n");
	};

	StackTrace.positionLink = function(t){
		var line = t.line || 0;
		var col = t.column || 0;
		return "(" + t.url + ":" + line + ":" + col + ")";
	};

	StackTrace.item = function(fnName, url, line, column) {
		return {
			fnName: fnName,
			url: url,
			line: line,
			column: column
		}
	};

	loader.StackTrace = StackTrace;
});
