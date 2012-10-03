module('Config')

test('steal.config should return default config object', function(){
	equal(steal.config().env, 'development');
})