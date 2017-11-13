import './a';
import './c';

if (window.assert) {
	window.assert.equal(window.FOO, 'bar', "b.js was loaded successfully");
	window.assert.equal(window.BAZ, 'qux', "d.js was loaded successfully");
	window.done();
} else {
	console.log('window.FOO:', window.FOO)
	console.log('window.BAZ:', window.BAZ)
}
