addStealExtension(function addMetaDeps(loader) {
	var superTranspile = loader.transpile;
	var superDetermineFormat = loader._determineFormat;

	function prependDeps (loader, load, callback) {
		var meta = loader.meta[load.name];
		if (meta && meta.deps && meta.deps.length) {
			var imports = meta.deps.map(callback).join('\n');
			load.source = imports + "\n" + load.source;
		}
	}

	function createImport(dep) {
		return "import \"" + dep + "\";";
	}

	function createRequire(dep) {
		return "require(\"" + dep + "\");";
	}

	loader.transpile = function (load) {
		// TODO this needs to change
		prependDeps(this, load, createImport);
		var result = superTranspile.apply(this, arguments);
		return result;
	};

	loader._determineFormat = function (load) {
		if(load.metadata.format === 'cjs') {
			prependDeps(this, load, createRequire);
		}
		var result = superDetermineFormat.apply(this, arguments);
		return result;
	};
});
