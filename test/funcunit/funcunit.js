//needs to open up the test page in another window, and run each test

if(steal.browser.rhino){
	
	steal('jquery').plugins('steal/test/qunit').then('drivers/json','drivers/base','drivers/selenium')
}else{
	steal('jquery').plugins('steal/test/qunit','steal/test/synthetic').then('drivers/json','drivers/base','drivers/standard')
	
}

