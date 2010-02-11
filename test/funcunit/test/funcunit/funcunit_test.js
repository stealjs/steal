
 
module("funcunit test")




test("Back to back opens", function(){
      S.open("file:///c:/development/steal/steal/test/funcunit/myotherapp.html", null, 10000);
      S.open("file:///c:/development/steal/steal/test/funcunit/myapp.html", null, 10000);

    S("#changelink").click().text(function(t){
        equals(t, "Changed","href javascript run")
    })

})

test("Copy Test", function(){

        S.open("file:///c:/development/steal/steal/test/funcunit/myapp.html", null, 10000);

        
		S("#typehere").type("javascriptmvc")
		
		S("#seewhatyoutyped").text(function(val){
			equals(val, "typed javascriptmvc","typing");
		})
		S.wait(1000)
		S("#copy").click();
		S("#seewhatyoutyped").text(function(val){
			equals(val, "copied javascriptmvc","copy");
		})
		S("#typehere").offset(function(offset){
			ok(offset.top,"has values")
		})
})
test("click href", function(){
    S("#changelink").click().text(function(t){
        equals(t, "Changed","href javascript run")
    })
})

test("iframe", function(){
	S("h2",0).text(function(text){
		equals(text, "Goodbye World", "text of iframe")
	})
})


test("Next Test", function(){

        S.open("file:///c:/development/steal/steal/test/funcunit/myotherapp.html", null, 10000);

        
		
		S.wait(1000,function(){
			ok('coolness')
			
		})
})
