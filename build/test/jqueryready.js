jqueryReadyCodeRun = false
steal.plugins("jquery").then(function(){
	$(document).ready(function(){
		jqueryReadyCodeRun = true;
	})
});
