import a from './a';
import b from './b';

if(typeof window !== "undefined" && window.assert) {
	assert.equal(a(), true, "could execute a");
	assert.equal(b(), true, "could execute b");
	done();
} else {
	console.log('a', a());
	console.log('b', b());
}
