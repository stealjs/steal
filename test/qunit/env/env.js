(function(){
	
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
    
})();






