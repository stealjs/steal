const off = 0;
const error = 2;

module.exports = {
	root: true,
	extends: "eslint:recommended",
	globals: {
		WorkerGlobalScope: true,
		$__Object$create: true,
		LoaderPolyfill: true,
		steal: true
	},
	rules: {
		"no-param-reassign": error,
		"no-mixed-spaces-and-tabs": off,
		"no-empty": [error, { "allowEmptyCatch": true }],
		"no-cond-assign": off
	},
	parserOptions: {
		ecmaVersion: 7,
		sourceType: "module",
		ecmaFeatures: {}
	},
	env: {
		"browser": true,
		"es6": true,
		"commonjs": true,
		"amd": true,
		"node": true,
		"worker": true
	}
};
