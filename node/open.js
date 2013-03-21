var fs = require('fs');
var path = require('path');
// We can hardcode this for now
var root = fs.realpathSync(__dirname + '/../../');

global.steal = {
	types: {
		"js": function (options, success) {
			var text;
			if (options.text) {
				text = options.text;
				success();
			} else {
				var filename = path.join(root, options.id.path || options.id);
				fs.readFile(filename, function (error, data) {
					if (!error) {
						var text = data.toString();
						// check if steal is in this file
						var stealInFile = /steal\(/.test(text);
						if (stealInFile) {
							// if so, load it
							eval(text);
						}
					}
					success();
				});
			}
		},
		"fn": function (options, success) {
			// skip all functions
			success();
		},
		win: global
	}
}
require('../steal.js');

var touched = {},
	iterate = function (stl, CB, depth, includeFns) {
		var i = 0,
			depends = stl.dependencies.slice(0);

		while (i < depends.length) {
			if (depends[i] === null || depends[i].waits) {
				var steals = depends.splice(0, i),
					curStl = depends.shift();

				loadset(steals, CB, depth, includeFns);

				if (curStl) {
					if (depth) {
						loadset(curStl.dependencies, CB, depth, includeFns);
						touch([curStl], CB)
					} else {
						touch([curStl], CB);
						loadset(curStl.dependencies, CB, depth, includeFns);
					}
				}
				i = 0;
			} else {
				i++;
			}
		}

		if (depends.length) {
			loadset(depends, CB, depth, includeFns);
		}
	},
	loadset = function (steals, CB, depth, includeFns) {
		if (depth) {
			eachSteal(steals, CB, depth, includeFns)
			touch(steals, CB);
		} else {
			touch(steals, CB);
			eachSteal(steals, CB, depth, includeFns)
		}
	},
	touch = function (steals, CB) {
		for (var i = 0; i < steals.length; i++) {
			if (steals[i]) {
				var uniqueId = steals[i].options.id;
				if (!touched[uniqueId]) {
					CB(steals[i]);
					touched[uniqueId] = true;
				}
			}
		}
	},
	eachSteal = function (steals, CB, depth, includeFns) {
		for (var i = 0; i < steals.length; i++) {
			iterate(steals[i], CB, depth, includeFns)
		}
	},
	name = function (s) {
		return s.options.id;
	},
	firstSteal = function (rootSteal) {
		var stel;
		for (var i = 0; i < rootSteal.dependencies.length; i++) {
			stel = rootSteal.dependencies[i];

			if (stel && stel.options.buildType != 'fn' && stel.options.id != 'steal/dev/dev.js' && stel.options.id != 'stealconfig.js') {
				return stel;
			}
		}
	};

module.exports = function (id, cb) {
	var doneCb = function (rootSteal) {
		// get the 'base' steal (what was stolen)

		// callback with the following
		cb({
			/**
			 * @hide
			 * Goes through each steal and gives its content.
			 * How will this work with packages?
			 *
			 * @param {Function} [filter] the tag to get
			 * @param {Boolean} [depth] the tag to get
			 * @param {Object} func a function to call back with the element and its content
			 */
			each: function (filter, depth, func) {
				// reset touched
				touched = {};
				// move params
				if (!func) {

					if (depth === undefined) {
						depth = false;
						func = filter;
						filter = function () {
							return true;
						};
					} else if (typeof filter == 'boolean') {
						func = depth;
						depth = filter
						filter = function () {
							return true;
						};
					} else if (arguments.length == 2 && typeof filter == 'function' && typeof depth == 'boolean') {
						func = filter;
						filter = function () {
							return true;
						};
					} else {  // filter given, no depth
						func = depth;
						depth = false;

					}
				}
				;

				// make this filter by type
				if (typeof filter == 'string') {
					var resource = filter;
					filter = function (stl) {
						return stl.options.buildType === resource;
					}
				}
				var items = [];
				// iterate
				iterate(rootSteal, function (resource) {

					if (filter(resource)) {
						resource.options.text = resource.options.text; // || loadScriptText(resource);
						func(resource.options, resource);
						items.push(resource.options);
					}
				}, depth) // , includeFns);
			},
			rootSteal: rootSteal,
			firstSteal: firstSteal(rootSteal)
		})
	};

	steal(id);
	steal.one('done', doneCb);
}
