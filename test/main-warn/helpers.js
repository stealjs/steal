window.WARN = Function.prototype.bind.call(
	window.console.warn,
	window.console
);

window.allWarnings = [];

window.console.warn = function(msg) {
	window.allWarnings.push(msg);
	window.WARN.apply(this, arguments);
};
