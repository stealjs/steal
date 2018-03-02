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
				desc += (t.fnName + " ");
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

	function getPositionOfError(txt) {
		var res = /at position ([0-9]+)/.exec(txt);
		if(res && res.length > 1) {
			return Number(res[1]);
		}
	}

	loader._parseJSONError = function(err, source){
		var pos = getPositionOfError(err.message);
		if(pos) {
			return loader._getLineAndColumnFromPosition(source, pos);
		} else {
			return {line: 0, column: 0};
		}
	};

	loader._addSourceInfoToError = function(err, pos, load, fnName){
		var isProd = loader.isEnv("production");
		var p = isProd ? Promise.resolve() : loader["import"]("@@babel-code-frame");

		return p.then(function(codeFrame) {
			if(codeFrame) {
				var src = load.metadata.originalSource || load.source;
				var codeSample = codeFrame(src, pos.line, pos.column);
				err.message += "\n\n" + codeSample + "\n";
			}
			var stackTrace = new StackTrace(err.message, [
				StackTrace.item(fnName, load.address, pos.line, pos.column)
			]);
			err.stack = stackTrace.toString();
			return Promise.reject(err);
		});
	};
});
