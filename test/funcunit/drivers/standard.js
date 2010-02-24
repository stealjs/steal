(function() {
    S._window = null;
    var newPage = true, changing;
    var makeArray = function(arr) {
        var narr = [];
        for (var i = 0; i < arr.length; i++) {
            narr[i] = arr[i]
        }
        return narr;
    }
    S._open = function(url) {
        changing = url;
        if (newPage) {
            S._window = window.open(url, "funcunit");

        } else {
            S._window.location = url;

        }

    }
    var unloadLoader, loadSuccess, currentDocument;
    unloadLoader = function() {
        Synthetic.addEventListener(S._window, "load", function() {
            S._window.document.documentElement.tabIndex = 0;
            setTimeout(function() {
                S._window.focus();
                if (loadSuccess) {
                    loadSuccess();
                }

                loadSuccess = null;
            }, 0);
            Synthetic.removeEventListener(S._window, "load", arguments.callee);
        });

        //listen for unload to re-attach
        Synthetic.addEventListener(S._window, "unload", function() {
            Synthetic.removeEventListener(S._window, "unload", arguments.callee);
            setTimeout(unloadLoader, 0)

        })
    }

    //check for window location change, documentChange, then readyState complete -> fire load if you have one
    var poller = function() {
        if (S._window.document !== currentDocument) { //we have a new document
            if (S._window.document.readyState == "complete") {
                if (loadSuccess) {
                    S._window.focus();
                    S._window.document.documentElement.tabIndex = 0;
                    loadSuccess();
                }
                loadSuccess = null;
                currentDocument = S._window.document;
            }
        }
        setTimeout(arguments.callee, 1000)
    }

    S._onload = function(success, error) {
        loadSuccess = success;
        if (!newPage) return;
        newPage = false;
        if (jQuery.browser.msie) //check for readyState
        {
            poller();
        } else {
            unloadLoader();
        }

    }
    S.$ = function(selector, context, method) {

        var args = makeArray(arguments);
        for (var i = 0; i < args.length; i++) {
            args[i] = args[i] === S.window ? S._window : args[i]
        }

        var selector = args.shift(),
			context = args.shift(),
			method = args.shift(),
			q;

        //convert context	
        if (context == S.window.document) {
            context = S._window.document
        } else if (typeof context == "number" || typeof context == "string") {
            context = S._window.frames[context].document;
        }


        if (S._window.jQuery && parseFloat(S._window.jQuery().jquery) >= 1.3) {
            q = jQuery(S._window.jQuery(selector, context).get());
        } else {
            q = jQuery(selector, context);
        }

        return q[method].apply(q, args);
    }

    $(window).unload(function() {
        if (S._window)
            S._window.close();
    })




})();


