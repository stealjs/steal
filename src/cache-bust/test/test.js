var QUnit = require("steal-qunit");
var loader = require("@loader");

function wrapFetch(loader, callback) {
	var fetch = loader.fetch;
	loader.fetch = function (load) {
		return fetch.apply(this, arguments).then(function (source) {
			callback(load.address);
			return source;
		});
	};
	loader.unwrap = function () {
		loader.fetch = fetch;
	};
}

function getQuery(address) {
	return address.substr(address.indexOf("?") + 1)
}

QUnit.module("cache-bust development-mode", {
	beforeEach: function() {
		this.loader = loader.clone();
		this.loader.config({
			env: "window-development"
		});
	}
});

QUnit.test("do not cachebust on development-mode", function(assert) {
	assert.expect(2);
	var done = assert.async();

	wrapFetch(this.loader, function (address) {
		var query = getQuery(address);
		var cachebust = query.split("=");

		assert.equal(cachebust.length, 1);
		assert.equal(query, cachebust);

	});

	this.loader.import("src/cache-bust/test/basics/foo")
		.then(this.loader.unwrap)
		.then(done, function(err) {
			assert.notOk(err, "should not fail");
		});
});

QUnit.module("cache-bust production-mode", {
	beforeEach: function() {
		this.loader = loader.clone();
		this.loader.config({
			env: "window-production"
		});
	},
	afterEach: function(assert) {
		this.loader = loader.clone();
	}
});

QUnit.test("no cachebust with default", function(assert) {
	assert.expect(2);
	var done = assert.async();

	wrapFetch(this.loader, function (address) {
		var query = getQuery(address);
		var cachebust = query.split("=");

		assert.equal(cachebust.length, 1);
		assert.equal(query, cachebust);
	});
	this.loader.import("src/cache-bust/test/basics/foo")
		.then(this.loader.unwrap)
		.then(done, function(err) {
			assert.notOk(err, "should not fail");
		});
});

QUnit.test("cachebust", function(assert) {
	this.loader.config({
		cacheVersion: 100
	});

	assert.expect(3);
	var done = assert.async();

	wrapFetch(this.loader, function (address) {
		var query = getQuery(address);
		var cachebust = query.split("=");
		var cacheKey = cachebust[0];
		var cacheVersion = cachebust[1];

		assert.equal(cachebust.length, 2);
		assert.equal(cacheKey, 'version');
		assert.equal(cacheVersion, '100');
	});

	this.loader.import("src/cache-bust/test/basics/foo")
		.then(this.loader.unwrap)
		.then(done, function(err) {
			assert.notOk(err, "should not fail");
		});
});

QUnit.test("cachebust key and version in production-mode", function(assert) {
	var that = this;

	this.loader.config({
		env: "window-production",
		cacheKey: "foo",
		cacheVersion: 200
	});


	assert.expect(3);
	var done = assert.async();

	wrapFetch(this.loader, function (address) {
		var query = getQuery(address);
		var cachebust = query.split("=");
		var cacheKey = cachebust[0];
		var cacheVersion = cachebust[1];

		assert.equal(cacheKey, 'foo');
		assert.equal(cacheVersion, '200');

		assert.ok(that.loader.isEnv("production"));
	});

	this.loader.import("src/cache-bust/test/basics/foo")
		.then(this.loader.unwrap)
		.then(done, function(err) {
			assert.notOk(err, "should not fail");
		});
});

QUnit.test("works with plugins too", function(assert) {
	this.loader.config({
		env: "window-production",
		cacheKey: "somekey",
		cacheVersion: 1
	});

	assert.expect(3 * 2);
	var done = assert.async();

	wrapFetch(this.loader, function (address) {
		if (address.indexOf("?") > 0) {
			var query = getQuery(address);
			var parts = query.split("=");

			assert.equal(parts.length, 2);
			assert.equal(parts[0], 'somekey');
			assert.equal(parts[1], '1');

		}
	});

	this.loader.import("src/cache-bust/test/plugin/some.txt!src/cache-bust/test/plugin/plugin")
		.then(this.loader.unwrap)
		.then(done, function(err) {
			assert.notOk(err, "should not fail");
		});
});
