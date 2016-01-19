!(function startBottleService (root) {
  'use strict'

  if (!root.navigator.serviceWorker) {
    throw new Error('Missing ServiceWorker')
  }

  var serviceScriptUrl = 'babel-services.js';
  var parts = location.pathname.split('/');
  parts.pop();
  var scope = parts.join('/') + '/';

  function registeredWorker (registration) {
    console.log('service worker registration', registration)
    //root.location.reload()
  }

  function onError (err) {
    console.error('service worker error', err)
  }

  if (!root.navigator.serviceWorker.controller) {
    root.navigator.serviceWorker.register(serviceScriptUrl, { scope: scope })
      .then(registeredWorker)
      .catch(onError)
  } else {
	/*root.navigator.serviceWorker.getRegistration().then(function(r){
		r.unregister();
	});*/

    console.log('service worker controller is active')
  }
}(window))
