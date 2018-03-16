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
			method: fnName,
			fnName: fnName,
			url: url,
			line: line,
			column: column
		}
	};

	function parse(stack) {
	  var rawLines = stack.split('\n');

	  var v8Lines = compact(rawLines.map(parseV8Line));
	  if (v8Lines.length > 0) return v8Lines;

	  var geckoLines = compact(rawLines.map(parseGeckoLine));
	  if (geckoLines.length > 0) return geckoLines;

	  throw new Error('Unknown stack format: ' + stack);
	}

	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/Stack
	var GECKO_LINE = /^(?:([^@]*)@)?(.*?):(\d+)(?::(\d+))?$/;

	function parseGeckoLine(line) {
	  var match = line.match(GECKO_LINE);
	  if (!match) return null;
	  var meth = match[1] || ''
	  return {
	    method:   meth,
		fnName:   meth,
	    url: match[2] || '',
	    line:     parseInt(match[3]) || 0,
	    column:   parseInt(match[4]) || 0,
	  };
	}

	// https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
	var V8_OUTER1 = /^\s*(eval )?at (.*) \((.*)\)$/;
	var V8_OUTER2 = /^\s*at()() (\S+)$/;
	var V8_INNER  = /^\(?([^\(]+):(\d+):(\d+)\)?$/;

	function parseV8Line(line) {
	  var outer = line.match(V8_OUTER1) || line.match(V8_OUTER2);
	  if (!outer) return null;
	  var inner = outer[3].match(V8_INNER);
	  if (!inner) return null;

	  var method = outer[2] || '';
	  if (outer[1]) method = 'eval at ' + method;
	  return {
	    method:   method,
		fnName:   method,
	    url: inner[1] || '',
	    line:     parseInt(inner[2]) || 0,
	    column:   parseInt(inner[3]) || 0,
	  };
	}

	// Helpers

	function compact(array) {
	  var result = [];
	  array.forEach(function(value) {
	    if (value) {
	      result.push(value);
	    }
	  });
	  return result;
	}

	StackTrace.parse = function(error) {
		try {
			var lines = parse(error.stack || error);
			if(lines.length) {
				return new StackTrace(error.message, lines);
			}
		} catch(e) {
			return undefined;
		}

	};

	loader.StackTrace = StackTrace;

	function getPositionOfError(txt) {
		var res = /at position ([0-9]+)/.exec(txt);
		if(res && res.length > 1) {
			return Number(res[1]);
		}
	}

	loader.loadCodeFrame = function(){
		if(!this.global.process) {
			this.global.process = { argv: '', env: {} };
		}

		var isProd = this.isEnv("production");
		var p = isProd ? Promise.resolve() : this["import"]("@@babel-code-frame");
		return p;
	};

	loader._parseJSONError = function(err, source){
		var pos = getPositionOfError(err.message);
		if(pos) {
			return this._getLineAndColumnFromPosition(source, pos);
		} else {
			return {line: 0, column: 0};
		}
	};

	var errPos = /at position( |:)([0-9]+)/;
	var errLine = /at line ([0-9]+) column ([0-9]+)/;
	loader._parseSyntaxErrorLocation = function(error, load){
		// V8 and Edge
		var res = errPos.exec(error.message);
		if(res && res.length === 3) {
			var pos = Number(res[2]);
			return this._getLineAndColumnFromPosition(load.source, pos);
		}

		// Firefox
		res = errLine.exec(error.message);
		if(res && res.length === 3) {
			return {
				line: Number(res[1]),
				column: Number(res[2])
			};
		}
	}

	loader._addSourceInfoToError = function(err, pos, load, fnName){
		return this.loadCodeFrame()
		.then(function(codeFrame){
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

	function findStackFromAddress(st, address) {
		for(var i = 0; i < st.items.length; i++) {
			if(st.items[i].url === address) {
				return st.items[i];
			}
		}
	}

	loader.rejectWithCodeFrame = function(error, load) {
		var st = StackTrace.parse(error);
		var item = st && findStackFromAddress(st, load.address);
		if(item) {
			return this.loadCodeFrame()
			.then(function(codeFrame){
				if(codeFrame) {
					var newError = new Error(error.message);

					var line = item.line;
					var column = item.column;

					// CommonJS adds 3 function wrappers
					if(load.metadata.format === "cjs") {
						line = line - 3;
					}

					var src = load.metadata.originalSource || load.source;
					var codeSample = codeFrame(src, line, column);
					if(!codeSample) return Promise.reject(error);

					newError.message += "\n\n" + codeSample + "\n";
					st.message = newError.message;
					newError.stack = st.toString();
					return Promise.reject(newError);
				} else {
					return Promise.reject(error);
				}
			});
		}

		return Promise.reject(error);
	};
});
