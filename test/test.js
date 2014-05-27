module("steal via system import");



(function(){
	
	var writeIframe = function(html){
		var iframe = document.createElement('iframe');
		window.removeMyself = function(){
			delete window.removeMyself;
			//document.body.removeChild(iframe);
		};
		document.body.appendChild(iframe);
		iframe.contentWindow.document.open();
		iframe.contentWindow.document.write(html);
		iframe.contentWindow.document.close();
	};
	var makePassQUnitHTML = function(){
		return "<script>\
			window.QUnit = window.parent.QUnit;\
			window.removeMyself = window.parent.removeMyself;\
			</script>";
			
	};
	var makeStealHTML = function(url, src, code){
		return "<!doctype html>\
			<html>\
				<head>" + makePassQUnitHTML() +"\n"+
					"<base href='"+url+"'/>"+
				"</head>\
				<body>\
					<script "+src+"></script>"+
					(code ? "<script>\n"+code+"</script>" :"") +
				"</body></html>";

	};
	var makeIframe = function(src){
		var iframe = document.createElement('iframe');
		window.removeMyself = function(){
			delete window.removeMyself;
			document.body.removeChild(iframe);
		};
		document.body.appendChild(iframe);
		iframe.src = src;
	};




	asyncTest('steal basics', function(){
		System['import']('tests/module').then(function(m){
		  equal(m.name,"module.js", "module returned" );
		  equal(m.bar.name, "bar", "module.js was not able to get bar");
	      start();
		}, function(err){
			console.log(err)
			ok(false, "steal not loaded");
			start()
		});
	});
	
	
	asyncTest("steal's normalize", function(){
		System['import']('tests/mod/mod').then(function(m){
		  equal(m.name,"mod", "mod returned" );
		  equal(m.module.bar.name, "bar", "module.js was able to get bar");
		  equal(m.widget(), "widget", "got a function");
	      start();
		}, function(){
			ok(false, "steal not loaded");
			start()
		});
	});

	asyncTest("steal's normalize with a plugin", function(){
		var stealFormat = System.format.steal;
		stealFormat.normalize("foo/bar!foo/bar", "foo", "http://foo", System.normalize)
			.then(function(result){
				equal(result, "foo/bar/bar!foo/bar", "normalize fixed part before !");
				start();
			});
	});

	asyncTest("steal's normalize with plugin only the bang", function(){
		var stealFormat = System.format.steal;
		stealFormat.normalize("./rdfa.stache!", "foo", "http://foo", System.normalize)
			.then(function(result){
				equal(result, "rdfa.stache!stache", "normalize added the extension as plugin name");
				start();
			});
	});

module("steal via html");

	asyncTest("basics", function(){
		makeIframe("basics/basics.html");
		
	});
	
	asyncTest("basics with generated html", function(){
		writeIframe(makeStealHTML(
			"basics/basics.html",
			'src="../../steal.js?basics" data-config="../config.js"'));
	});
	
	asyncTest("default config path", function(){
		writeIframe(makeStealHTML(
			"basics/basics.html",
			'src="../steal.js?basics"'));
	});

	asyncTest("default config path", function(){
		writeIframe(makeStealHTML(
			"basics/basics.html",
			'src="../steal/steal.js?basics"'));
	});
	
	
	asyncTest("inline", function(){
		makeIframe("basics/inline_basics.html");
		
	});
	
	asyncTest("default bower_components config path", function(){
		writeIframe(makeStealHTML(
			"basics/basics.html",
			'src="../bower_components/steal/steal.js?basics"'));
	});
	
	
	asyncTest("default bower_components without config still works", function(){
		makeIframe("basics/noconfig.html");
	});
	
	asyncTest("map works", function(){
		makeIframe("map/map.html");
	});
	
	
	asyncTest("read config", function(){
		writeIframe(makeStealHTML(
			"basics/basics.html",
			'src="../../steal.js?configed" data-config="../config.js"'));
	});
	
	asyncTest("compat - product bundle works", function(){
		makeIframe("production/prod.html");
	});
	
	asyncTest("product bundle specifying main works", function(){
		makeIframe("production/prod-main.html");
	});
	
	asyncTest("automatic loading of css plugin", function(){
		makeIframe("plugins/site.html");
	});
	
	asyncTest("product bundle with css", function(){
		makeIframe("production/prod-bar.html");
	});
	
	asyncTest("automatic loading of less plugin", function(){
		makeIframe("dep_plugins/site.html");
	});

	asyncTest("Using path's * qualifier", function(){
		writeIframe(makeStealHTML(
			"basics/basics.html",
			'src="../steal.js?../paths" data-config="../paths/config.js"'));
	});
	
	asyncTest("url paths in css work", function(){
		makeIframe("css_paths/site.html");
	});
	
})();
