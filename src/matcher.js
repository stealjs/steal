
	var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
	var reCache = {};

	function escapeStringRegexp(str) {
		return str.replace(matchOperatorsRe, '\\$&');
	}

	function makeRe(pattern, shouldNegate) {
		var cacheKey = pattern + shouldNegate;

		if (reCache[cacheKey]) {
			return reCache[cacheKey];
		}

		var negated = false;

		if (pattern[0] === '!') {
			negated = true;
			pattern = pattern.slice(1);
		}

		pattern = escapeStringRegexp(pattern).replace(/\\\*/g, '.*');

		if (negated && shouldNegate) {
			pattern = '(?!' + pattern + ')';
		}

		var re = new RegExp('^' + pattern + '$', 'i');

		re.negated = negated;

		reCache[cacheKey] = re;

		return re;
	}

	steal.isMatch = function(input, pattern){
		return makeRe(pattern, true).test(input);
	};
	return steal;
