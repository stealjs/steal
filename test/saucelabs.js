var testSaucelabs = require('test-saucelabs');
var testPagesUrls = require('./test-pages-urls');

// https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities
var platforms = [{
	browserName: 'firefox',
	platform: 'Windows 10',
	version: '52.0'
}, {
	browserName: 'firefox',
	platform: 'OS X 10.11',
	version: '52.0'
}, {
	browserName: 'googlechrome',
	platform: 'Windows 10'
}, {
	browserName: 'googlechrome',
	platform: 'OS X 10.11'
}, {
	browserName: 'safari',
	platform: 'OS X 10.11',
	version: '10.0'
}, {
	browserName: 'MicrosoftEdge',
	platform: 'Windows 10'
}, {
	browserName: 'internet explorer',
	platform: 'Windows 10',
	version: '11.0'
}, {
	browserName: 'internet explorer',
	platform: 'Windows 8',
	version: '10.0'
}, {
	browserName: 'internet explorer',
	platform: 'Windows 7',
	version: '9'
}, {
	browserName: 'Safari',
	'appium-version': '1.6.3',
	platformName: 'iOS',
	platformVersion: '10.0',
	deviceName: 'iPhone 7 Simulator'
}];

// collect platforms using the firefox browser
var onlyFirefox = platforms.filter(p => {
	return p.browserName === 'firefox';
});

var urls = testPagesUrls.map(testPage => {
	var cloned = Object.assign({}, testPage);

	// run the main test page in all platforms AND
	// run the other tests only in firefox
	if (testPage.url !== "test/test.html") {
		cloned.platforms = onlyFirefox;
	}

	cloned.url = `http://localhost:3000/${cloned.url}?hidepassed`;
	return cloned;
});

testSaucelabs({ urls, platforms });
