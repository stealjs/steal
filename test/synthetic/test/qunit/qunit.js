//we probably have to have this only describing where the tests are
steal
 .apps("jquery")
 .apps("steal/test/synthetic")  //load your app
 .plugins('steal/test/qunit')  //load qunit
 .then("synthetic_test")