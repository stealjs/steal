config.shim = function(shims){
	for(var id in shims){
		var resource = Module.make({id: id});
		if(typeof shims[id] === "object"){
			var needs   = shims[id].deps || []
			var exports = shims[id].exports;
			var init    = shims[id].init
		} else {
			needs = shims[id];
		}
		(function(_resource, _needs){
			_resource.options.needs = _needs;
		})(resource, needs);
		resource.exports = (function(_resource, _needs, _exports, _init){
			return function(){
				var args = [];
				h.each(_needs, function(i, id){
					args.push(Module.make(id).value);
				});
				if(_init){
					_resource.value = _init.apply(null, args);
				} else {
					_resource.value = h.win[_exports];
				}
			}
		})(resource, needs, exports, init)
	}
}