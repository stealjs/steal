var hasConsole = typeof console === "object";

exports.logError = function(msg){
	if (hasConsole && typeof console.error !== "undefined") {
		console.error(msg);
	}
};

exports.logInfo = function(msg){
	if (hasConsole && typeof console.log !== "undefined") {
		console.log(msg);
	}
};

/**
 * Whether browser supports __proto__
 *
 * Used to skip tests in browsers without support (IE <= 10)
 *
 * see https://babeljs.io/docs/usage/caveats/#internet-explorer-classes-10-and-below-
 *
 * @return {Function} When called evaluates to `true` if __proto__ is supported
 */
exports.supportsProto = function supportsProto() {
	var foo = {};
	foo.__proto__ = { bar: "baz" };
	return foo.bar === "baz";
};

exports.supportsAsyncAwait = function(){
	var fn = new Function("async function test() { }");
	try {
		fn();
		return true;
	} catch(ex) {
		return false;
	}
};


var makePassQUnitHTML =  function() {
	return [
		"<script>",
			"window.done = window.parent.done;",
			"window.assert = window.parent.assert;",
		"</script>"
	].join("\n");
};

/**
 * Returns a string of html attributes
 * @param {Object} attrs The key is the attr name and the value its value
 * @return {string} An string like 'foo="bar" baz="quz"'
 */
var processScriptTagAttrs = function(attrs) {
	attrs = attrs || {};
	var parts = [];

	for (var attr in attrs) {
		parts.push(attr + "=" + '"' + attrs[attr] + '"');
	}

	return parts.join(" ");
};

exports.makeStealHTML = function(options) {
	options = options || {};

	var code = options.code;
	var baseUrl = options.baseUrl;
	var attrs =  processScriptTagAttrs(options.scriptTagAttrs);

	return [
		"<!doctype html>",
		"<html>",
		"<head>",
			makePassQUnitHTML(),
			"<base href='" + baseUrl + "'/>",
		"</head>",
		"<body>",
			"<script " + attrs + "></script>",
			(code ? "<script>\n" + code + "</script>" : ""),
		"</body>",
		"</html>"
	].join("\n");
};

exports.makeIframe = function makeIframe(src, assert) {
	var done = assert.async();
	var iframe = document.createElement("iframe");

	window.assert = assert;
	window.done = function() {
		done();
		document.body.removeChild(iframe);
	};

	document.body.appendChild(iframe);
	iframe.src = src;
};

exports.writeIframe = function(html, assert) {
	var done = assert.async();
	var iframe = document.createElement("iframe");

	window.assert = assert;
	window.done = function() {
		done();
		document.body.removeChild(iframe);
	};

	document.body.appendChild(iframe);

	iframe.contentWindow.document.open();
	iframe.contentWindow.document.write(html);
	iframe.contentWindow.document.close();
};


function makeExpectation(type) {
	var original;
	var expectedResults = [];
	var dev = console;

	function stubbed() {
		var message = Array.prototype.slice.call(arguments).map(function(token) {
			// Case for error objects. If you send an error to the console,
			//  its "toString" gives you "Error: " plus the message, which
			//  is undesirable for trying to check its content against a known
			//  string
			if(typeof(token) !== "string" && token.message) {
				return token.message;
			} else {
				return token;
			}
		}).join(" ");

		expectedResults.forEach(function(expected) {
			var matched = typeof expected.source === "string" ?
				message === expected.source :
				expected.source.test(message);

			if(matched) {
				expected.count++;
			}
			if(typeof expected.fn === "function") {
				expected.fn.call(null, message, matched);
			}
		});
	}

	return function(expected, fn) {
		var matchData = {
			source: expected,
			fn: fn,
			count: 0
		};
		expectedResults.push(matchData);

		if(!original) {
			original = dev[type];
			dev[type] = stubbed;
		}

		// Simple teardown
		return function() {
			expectedResults.splice(expectedResults.indexOf(matchData), 1);
			if(original && expectedResults.length < 1) {
				// restore when all teardown functions have been called.
				dev[type] = original;
				original = null;
			}
			return matchData.count;
		};
	};
}

exports.willWarn = makeExpectation("warn");
