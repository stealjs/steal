var steal = require('./steal');
var fs = require('fs');

var extend = function (d, s) {
	for (var p in s) d[p] = s[p];
	return d;
};

extend(steal.URI.prototype, {
	mkdir: function () {
		fs.mkdirSync('' + this);
		return this;
	},
	mkdirs: function () {
		// TODO
		return this;
	},
	exists: function () {
		return fs.existsSync('' + this);
	},
	copyTo: function (dest, ignore) {
		// TODO
		return this;
	},
	moveTo: function (dest) {
		// TODO
	},
	setExecutable: function () {
		fs.chmodSync('' + this, '755');
		return this;
	},
	save: function (src, encoding) {
		encoding = encoding || 'utf8';
		fs.writeFileSync('' + this, src);
		return this;
	},
	download_from: function (address) {
		// TODO
	},
	basename: function () {
		return ('' + this).match(/\/?([^\/]*)\/?$/)[1];
	},
	remove: function () {
		fs.unlinkSync('' + this);
		return this;
	},
	isFile: function () {
		return fs.statSync('' + this).isFile();
	},
	removeDir: function () {
		var rmDir = function(path) {
			try { var files = fs.readdirSync(path); }
			catch(e) { return; }
			if (files.length > 0)
				for (var i = 0; i < files.length; i++) {
					var filePath = dirPath + '/' + files[i];
					if (fs.statSync(filePath).isFile()) {
						fs.unlinkSync(filePath);
					} else {
						rmDir(filePath);
					}
				}
			fs.rmdirSync(dirPath);
		}
		rmDir('' + this);
		return this;
	},
	zipDir: function (name, replacePath) {
		// TODO
	},
	contents: function (func, current) {
		// TODO
	},
	/**
	 * Returns the path to the root jmvc folder
	 */
	pathToRoot: function (isFile) {
		var root = steal.URI.getRoot(),
			rootFolders = root.split(/\/|\\/),
			targetDir = rootFolders[rootFolders.length - 1]
		i = 0,
			adjustedPath = (targetDir ? ('' + this).replace(new RegExp(".*" + targetDir + "\/?"), "") :
				'' + this),
			myFolders = adjustedPath.split(/\/|\\/);

		//for each .. in loc folders, replace with steal folder
		if (myFolders[i] == "..") {
			while (myFolders[i] == "..") {
				myFolders[i] = rootFolders.pop();
				i++;
			}
		} else {
			for (i = 0; i < myFolders.length - 1; i++) {
				myFolders[i] = ".."
			}
		}
		myFolders.pop();

		if (!isFile) {
			myFolders.push('..')
		}

		return myFolders.join("/")
	}
});

module.exports = steal;
