module("synthetic")

__g = function(id){
	return document.getElementById(id)
	
}
__mylog = function(c){
	__g("mlog").innerHTML = __g("mlog").innerHTML+c+"<br/>"
}

if(window.addEventListener){ // Mozilla, Netscape, Firefox
	__addEventListener = function(el, ev, f){
		el.addEventListener(ev, f, false)
	}
	__removeEventListener = function(el, ev, f){
		el.removeEventListener(ev, f, false)
	}
}else{
	__addEventListener = function(el, ev, f){
		el.attachEvent("on"+ev, f)
	}
	__removeEventListener = function(el, ev, f){
		el.detachEvent("on"+ev, f)
	}
}

	



test("Synthetic basics", function(){
	return;
        ok(Synthetic,"Synthetic exists")
		
		__g("qunit-test-area").innerHTML = "<div id='outer'><div id='inner'></div></div>"
		var mouseover = 0, mouseoverf = function(){
			mouseover++;
		};
		__addEventListener(__g("outer"),"mouseover",mouseoverf );
		new Synthetic("mouseover").send( __g("inner") );
		
		__removeEventListener(__g("outer"),"mouseover",mouseoverf );
		equals(mouseover, 1, "Mouseover");
		new Synthetic("mouseover").send( __g("inner") );
		equals(mouseover, 1, "Mouseover on no event handlers");
		__g("qunit-test-area").innerHTML = "";
		
})

test("Click", function(){

	__g("qunit-test-area").innerHTML = "<form id='outer' onsubmit='return false'><div id='inner'>"+
			"<input type='checkbox' id='checkbox'/>"+
			"<input type='radio' name='radio' value='radio1' id='radio1'/>"+
			"<input type='radio' name='radio' value='radio2' id='radio2'/>"+
			"<input type='submit' id='submit'/></div></form>";
			
	var submit = 0, submitf = function(ev){
		submit++;
		if ( ev.preventDefault ) {
			ev.preventDefault();
		}
		return false;
	};
	__addEventListener(__g("outer"),"submit",submitf );
	new Synthetic("click").send( __g("submit") );
	
	equals(submit, 1, "Click on submit");
	
	var click =0, clickf = function(ev){
		click++;
		if ( ev.preventDefault ) {
			ev.preventDefault();
		}
		return false;	
	}
	__addEventListener(__g("inner"),"click",clickf );
	
	
	
	new Synthetic("click").send( __g("submit") );
	
	equals(submit, 1, "Submit prevented");
	equals(click, 1, "Clicked");
	
	__removeEventListener(__g("outer"),"submit",submitf );
	__removeEventListener(__g("inner"),"click",clickf );
	
	
	
	var checkbox =0, checkboxf = function(ev){
		checkbox++;	
	}
	__addEventListener(__g("checkbox"),"change",checkboxf );

	__g("checkbox").checked = false;
	new Synthetic("click").send( __g("checkbox") );
	
	ok(__g("checkbox").checked, "click checks");
	
	
	
	
	//test radio
	
	var radio1=0; radio1f = function(ev){
		radio1++;
	}
	var radio2=0; radio2f = function(ev){
		radio2++;
	}
	__g("radio1").checked = false;
	__addEventListener(__g("radio1"),"change",radio1f );
	__addEventListener(__g("radio2"),"change",radio2f );
	
	new Synthetic("click").send( __g("radio1") );
	
	equals(radio1, 1, "radio event");
	ok( __g("radio1").checked, "radio checked" );
	
	new Synthetic("click").send( __g("radio2") );
	
	equals(radio2, 1, "radio event");
	ok( __g("radio2").checked, "radio checked" );
	
	
	ok( !__g("radio1").checked, "radio unchecked" );
	
	__g("qunit-test-area").innerHTML = "";
})
test("Click link", function(){
	var didSomething = false;
	window.doSomething = function(){
		didSomething = true;
	}
	__g("qunit-test-area").innerHTML = "<a href='javascript:doSomething()' id='holler'>click me</a>";
	
	new Synthetic("click").send( __g("holler") );
	
	ok( didSomething, "link href does something" );
})


test("Keypress", function(){
	return;
	__g("qunit-test-area").innerHTML = "<form id='outer'><div id='inner'><input type='input' id='key' value=''/></div></form>";
	var submit = 0, submitf = function(ev){
		submit++;
		if ( ev.preventDefault ) {
			ev.preventDefault();
		}
		return false;
	};
	__addEventListener(__g("outer"),"submit",submitf );
	var keypress = 0, keypressf = function(ev){
		keypress++;
	};
	__addEventListener(__g("outer"),"keypress",keypressf );
	__g("key").value = "";
	
	new Synthetic("keypress","a").send( __g("key") );
	
	equals(__g("key").value, "a", "A written");
	
	equals(keypress, 1, "Keypress called once");
	
	new Synthetic("keypress","5").send( __g("key") );
	equals(__g("key").value, "a5", "5 written");
	
	new Synthetic("keypress","\b").send( __g("key") );
	equals(__g("key").value, "a", "Backspace works");
	
	
	new Synthetic("keypress","\n").send( __g("key") );
	equals(submit, 1, "submit on keypress");
	
	__removeEventListener(__g("outer"),"submit",submitf );
	__removeEventListener(__g("outer"),"keypress",keypressf );
    __g("qunit-test-area").innerHTML = "";
	
})
test("Select", function(){
	__g("qunit-test-area").innerHTML = "<form id='outer'><select name='select'><option value='1' id='one'>one</option><option value='2' id='two'>two</option></select></form>";
	
	var change = 0, changef = function(){
		change++;
	}
	__g("outer").select.selectedIndex = 0;
	
	__addEventListener(__g("outer").select,"change",changef );
	
	new Synthetic("click").send( __g("two") );
	
	equals(change, 1 , "change called once")
	equals(__g("outer").select.selectedIndex, 1, "Change Selected Index");
	__g("qunit-test-area").innerHTML = ""
})

test("Change by typing then clicking elsewhere", function(){
	__g("qunit-test-area").innerHTML = "<input id='one'/><input id='two'/>";
	var change = 0, changef = function(){
		change++;
	}
	__addEventListener(__g("one"),"change",changef );
	
	new Synthetic("click").send( __g("one") );
	new Synthetic("keypress","a").send( __g("one") );
	new Synthetic("click").send( __g("two") );
	stop();
	setTimeout(function(){
		start()
		
		equals(change, 1 , "Change called once");
		__g("qunit-test-area").innerHTML = "";
	},100)
	
})


test("Key Something", function(){
	__g("qunit-test-area").innerHTML = "<input id='one'/><div id='two'></div><div id='three'></div><div id='four'></div>";
	__addEventListener(__g("one"),"keyup",function(){
		__g("two").innerHTML = __g("one").value+ " is moderately impressive"
		
	} );
	__addEventListener(__g("one"),"keypress",function(){
		__g("three").innerHTML = __g("one").value+ " is moderately impressive"
		
	} );
	__addEventListener(__g("one"),"keydown",function(){
		__g("four").innerHTML = __g("one").value+ " is moderately impressive"
		
	} );
	new Synthetic("key","J").send( __g("one") );
	new Synthetic("key","M").send( __g("one") );
	new Synthetic("key","V").send( __g("one") );
	new Synthetic("key","C").send( __g("one") );
	
	
	equals(__g("two").innerHTML, "JMVC is moderately impressive" , "Typing works")
	equals(__g("three").innerHTML, "JMV is moderately impressive" , "Typing works")
	equals(__g("four").innerHTML, "JMV is moderately impressive" , "Typing works")
	__g("qunit-test-area").innerHTML = "";
})
