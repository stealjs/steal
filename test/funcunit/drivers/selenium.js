
importClass(Packages.com.thoughtworks.selenium.DefaultSelenium);



    



//first lets ping and make sure the server is up

(function(){
    var browser = 0;
	
	QUnit.testStart = function(name){
		print("--"+name+"--")
	}
	QUnit.log = function(result, message){
		print((result ? "  PASS " : "  FAIL ")+message)
	}
	QUnit.testDone = function(name, failures, total){
		print("  done - fail "+failures+", pass "+total+"\n")
	}
	QUnit.moduleStart = function(name){
		print("MODULE "+name+"\n")
	}
	QUnit.moduleDone = function(name, failures, total){
		//if(name)
        //    print(name+" done\n")
	}
	QUnit.done = function(failures, total){
    	S.selenium.stop();	
        S.endtime = new Date().getTime();
        var formattedtime = (S.endtime - S.starttime) / 1000;
        print("\nALL DONE "+failures+", "+total+' - '+formattedtime+' seconds')
        browser++;
        if(browser < SeleniumBrowsers.length){
            print("\nSTARTING "+SeleniumBrowsers[browser])
            S.selenium = new DefaultSelenium(SeleniumDefaults.serverHost, 
                    SeleniumDefaults.serverPort, SeleniumBrowsers[browser], SeleniumDefaults.browserURL);
            S.starttime = new Date().getTime();
        	S.selenium.start();	
            QUnit.restart();
        }
	}
	
	
	print("\nSTARTING "+SeleniumBrowsers[0])
	S.selenium = new DefaultSelenium(SeleniumDefaults.serverHost, 
            SeleniumDefaults.serverPort, SeleniumBrowsers[0], SeleniumDefaults.browserURL);
    S.starttime = new Date().getTime();
	S.selenium.start();		
	S._open = function(url){
		this.selenium.open(url);
	};
	S._onload = function(success, error){
		setTimeout(function()
        {
            S.selenium.getEval("selenium.browserbot.getCurrentWindow().focus();selenium.browserbot.getCurrentWindow().document.documentElement.tabIndex = 0;");
            success();
        }, 1000)
	};
	var convertToJson = function(arg){
		return arg === S.window ? "selenium.browserbot.getCurrentWindow()" : jQuery.toJSON(arg)
		
	}
	
	S.$ = function(selector, context, method){
		var args = S.makeArray(arguments);
		for(var a=0; a < args.length; a++){
			if(a==1){ //context
				
				if(args[a] == S.window.document){
					args[a] = "_doc()"
				}else if(typeof args[a] == "number"){
					args[a] = "_win()["+args[a]+"].document"
				}else if(typeof args[a] == "string"){
					args[a] = "_win()['"+args[a]+"'].document"
				}
			}else
				args[a] = convertToJson(args[a]);
		}
		var response = S.selenium.getEval("jQuery.wrapped("+args.join(',')+")"  );
		return eval("("+response+")")//  q[method].apply(q, args);
	}
	

    
})();



