var QUnit = require("steal-qunit");
var loader = require("@loader");

(function() {
	var test = QUnit.test;

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

	QUnit.module("cache-bust", {
		setup: function () {

		}
	}, function () {
		QUnit.module("disabled", {
			setup: function () {
				this.loader = loader.clone();
				delete this.loader.cachebust;
			}
		}, function () {

			QUnit.test("cache by default", function (assert) {
				QUnit.expect(2);
				QUnit.stop();

				wrapFetch(this.loader, function (address) {
					var query = getQuery(address);
					var cachebust = query.split("=");

					assert.equal(cachebust.length, 1);
					assert.equal(query, cachebust[0]);
				});

				this.loader.import("src/cache-bust/test/basics/foo")
					.then(this.loader.unwrap)
					.then(function () {
						QUnit.start();
					});
			});

			QUnit.test("cache explicit", function (assert) {
				this.loader.config({
					cachebust: false
				});

				QUnit.expect(2);
				QUnit.stop();

				wrapFetch(this.loader, function (address) {
					var query = getQuery(address);
					var cachebust = query.split("=");

					assert.equal(cachebust.length, 1);
					assert.equal(query, cachebust[0]);
				});

				this.loader.import("src/cache-bust/test/basics/foo")
					.then(this.loader.unwrap)
					.then(function () {
						QUnit.start();
					});
			});
		});

		QUnit.module("enabled", {
			setup: function () {
				this.loader = loader.clone();
				this.loader.config({
					cachebust: true
				});
			},
			teardown: function () {
				this.loader = loader.clone();
			}
		}, function () {

			QUnit.test("default cachebust", function (assert) {
				QUnit.expect(4);
				QUnit.stop();

				var timestamp = new Date('2017-01-01').getTime();

				wrapFetch(this.loader, function (address) {
					var query = getQuery(address);
					var cachebust = query.split("=");
					var cacheKey = cachebust[0];
					var cacheVersion = cachebust[1];

					assert.equal(cachebust.length, 2);
					assert.equal(cacheKey, 'version');
					assert.ok(!isNaN(parseInt(cacheVersion, 10)), 'default version is a number');
					assert.ok(cacheVersion > timestamp, 'default version is a timestamp');
				});

				this.loader.import("src/cache-bust/test/basics/foo")
					.then(this.loader.unwrap)
					.then(function () {
						QUnit.start();
					});

			});

			QUnit.test("cachebust key and version in development-mode", function (assert) {
				var that = this;
				this.loader.config({
					env: "window-development",
					cachebust: {
						key: 'foo',
						version: 'bar'
					}
				});

				QUnit.expect(5);
				QUnit.stop();

				var timestamp = new Date('2017-01-01').getTime();

				wrapFetch(this.loader, function (address) {
					var query = getQuery(address);
					var cachebust = query.split("=");
					var cacheKey = cachebust[0];
					var cacheVersion = cachebust[1];

					assert.equal(cacheKey, 'foo');
					assert.notEqual(cacheVersion, 'bar');
					assert.ok(!isNaN(parseInt(cacheVersion, 10)), 'version is a number');
					assert.ok(cacheVersion > timestamp, 'version in dev-mode is a timestamp');

					assert.ok(that.loader.isEnv("development"));
				});

				this.loader.import("src/cache-bust/test/basics/foo")
					.then(this.loader.unwrap)
					.then(function () {
						QUnit.start();
					});

			});

			QUnit.test("cachebust key and version in production-mode", function (assert) {
				var that = this;

				this.loader.config({
					env: "window-production",
					cachebust: {
						key: 'foo',
						version: 'bar'
					}
				});


				QUnit.expect(3);
				QUnit.stop();

				wrapFetch(this.loader, function (address) {
					var query = getQuery(address);
					var cachebust = query.split("=");
					var cacheKey = cachebust[0];
					var cacheVersion = cachebust[1];

					assert.equal(cacheKey, 'foo');
					assert.equal(cacheVersion, 'bar');

					assert.ok(that.loader.isEnv("production"));
				});

				this.loader.import("src/cache-bust/test/basics/foo")
					.then(this.loader.unwrap)
					.then(function () {
						QUnit.start();
					});

			});

			QUnit.test("works with plugins too", function (assert) {

				this.loader.config({
					env: "window-production",
					cachebust: {
						key: 'someKey',
						version: 1
					}
				});
				QUnit.expect(3 * 2);
				QUnit.stop();

				wrapFetch(this.loader, function (address) {
					if (address.indexOf("?") > 0) {
						var query = getQuery(address);
						var parts = query.split("=");

						assert.equal(parts.length, 2);
						assert.equal(parts[0], 'someKey');
						assert.equal(parts[1], '1');

					}
				});

				this.loader.import("src/cache-bust/test/plugin/some.txt!src/cache-bust/test/plugin/plugin")
					.then(this.loader.unwrap)
					.then(function () {
						QUnit.start();
					});

			});
		});
	});
})();