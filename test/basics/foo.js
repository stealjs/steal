var save = function(cacheName, request, response){
	return caches.open(cacheName).then(function(cache){
		return cache.put(request, response);
	});
};
