(function(){
	//check if browser supports change delegation
	var Synthetic = function(type, options, scope){
		this.type = type;
		this.options = options || {};
		this.scope = scope || window
	}
	//helpers
	Synthetic.closest = function(el, type){
		while(el && el.nodeName.toLowerCase() != type.toLowerCase()){
			el = el.parentNode
		}
		return el;
	}	
	var data = {}, id = 0, expando = "_synthetic"+(new Date() - 0);
	Synthetic.data = function(el, key, value){
		var d;
		if(!el[expando]){
			el[expando] = id++;
		}
		if(!data[el[expando]]){
			data[el[expando]] = {};
		}
		d = data[el[expando]]
		if(value){
			data[el[expando]][key] = value;
		}else{
			return data[el[expando]][key];
		}
	}
	
	
	if(window.addEventListener){ // Mozilla, Netscape, Firefox
		var addEventListener = function(el, ev, f){
			el.addEventListener(ev, f, false)
		}
		var removeEventListener = function(el, ev, f){
			el.removeEventListener(ev, f, false)
		}
	}else{
		var addEventListener = function(el, ev, f){
			el.attachEvent("on"+ev, f)
		}
		var removeEventListener = function(el, ev, f){
			el.detachEvent("on"+ev, f)
		}
	}
	Synthetic.addEventListener = addEventListener;
	Synthetic.removeEventListener = removeEventListener;
	var createEvent = function(type, options, element){
		return dispatchType(
			document.createEvent ?  create.Event : create.EventObject,
			 type, options, element
		)
	}
	var dispatchType = function(part, type, options, element){
		if(/keypress|keyup|keydown/.test(type) )
			return part.key.apply(null, arguments);
		else if(/load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll/.test(type) )
			return part.page.apply(null, arguments);
		else 
			return part.mouse.apply(null, arguments);
	}

	var create = {
		EventObject : {},
		Event:{}
	};
	var extend = function(d, s) { for (var p in s) d[p] = s[p]; return d;},
		browser = {
			msie:     !!(window.attachEvent && !window.opera),
			opera:  !!window.opera,
			safari: navigator.userAgent.indexOf('AppleWebKit/') > -1,
			firefox:  navigator.userAgent.indexOf('Gecko') > -1 && navigator.userAgent.indexOf('KHTML') == -1,
			mobilesafari: !!navigator.userAgent.match(/Apple.*Mobile.*Safari/),
			rhino : navigator.userAgent.match(/Rhino/) && true
		}
	//-------- Sending the events --------------
	create.Event.dispatch = function(event, element){
		return element.dispatchEvent(event)
	}
	create.EventObject.dispatch = function(event, element, type){
		try {window.event = event;}catch(e) {}
		return element.fireEvent('on'+type, event);
	}
	
	
	//-------- MOUSE EVENTS ---------------------
	
	//creates default options for all mouse types
	var mouseOptions = function(type, options, element){
			var doc = document.documentElement, body = document.body;
			var center = [options.pageX || 0, options.pageY] 
			return extend({
				bubbles : true,cancelable : true,
				view : window,detail : 1,
				screenX : 1, screenY : 1,
				clientX : center[0] -(doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc.clientLeft || 0), 
				clientY : center[1] -(doc && doc.scrollTop || body && body.scrollTop || 0) - (doc.clientTop || 0),
				ctrlKey : false, altKey : false, shiftKey : false, metaKey : false,
				button : (type == 'contextmenu' ? 2 : 1), 
				relatedTarget : document.documentElement
			}, options);
	}
	
	create.EventObject.mouse = function(part, type, options, element){ //IE

		var event = element.ownerDocument.createEventObject();
		extend(event, mouseOptions(type, options, element));
		if( (element.nodeName.toLowerCase() == 'input' || 
			(element.type && element.type.toLowerCase() == 'checkbox'))) 
			element.checked = (element.checked ? false : true);
		return part.dispatch(event, element, type);
	}
	create.Event.mouse = function(part, type, options, element){  //Everyone Else
		var defaults = mouseOptions(type, options, element), event;
		
		try {
			event = element.ownerDocument.createEvent('MouseEvents');
			event.initMouseEvent(type, 
				defaults.bubbles, defaults.cancelable, 
				defaults.view, 
				defaults.detail, 
				defaults.screenX, defaults.screenY,defaults.clientX,defaults.clientY,
				defaults.ctrlKey,defaults.altKey,defaults.shiftKey,defaults.metaKey,
				defaults.button,defaults.relatedTarget);
		} catch(e) {
			try {
				event = document.createEvent("Events");
			} catch(e2) {
				event = document.createEvent("UIEvents");
			} finally {
				event.initEvent(type, true, true);
				extend(event, options);
			}
		}
		
		var doc = document.documentElement, body = document.body;
		event.synthetic = true;
		return part.dispatch(event, element);
	}
	
	// -----------------  Key Events --------------------
	var keyOptions = function(type, options, element){
		var reverse = browser.opera || browser.msie,//if keyCode and charCode should be reversed
			both = browser.safari || type != 'keypress', //if keyCode and charCode are in both places
			character = "", v, 
			defaults  = typeof options != "object" ? {character : options} : options
			
		//add basics
		defaults = extend({
			ctrlKey: false,
			altKey: false,
			shiftKey: false,
			metaKey: false,
			charCode: 0, keyCode: 0
		}, defaults);

		if(typeof defaults.character == "number"){
			character = String.fromCharCode(defaults.character);
			v = defaults.character
			defaults = extend(defaults,{keyCode :  v,charCode:  both ? v : 0})
		}else if(typeof defaults.character == "string"){
			character = defaults.character;
			v = (type == "keypress" ? character.charCodeAt(0) : character.toUpperCase().charCodeAt(0) );
			defaults = extend(defaults,{
				keyCode : both ? v : (reverse ? v : 0),
				charCode: both ? v : (reverse ? 0: v)
			})
		}
		
		if(character && character == "\b") {
			defaults.keyCode = 8;
			character = 0;
		}
		if (character && character == "\n" && type != 'keypress') {
			defaults.keyCode = 13;
		}
		defaults.character = character;
		options.keyCode = defaults.keyCode;
		return defaults
	}
	
	create.EventObject.key = function(part, type, options, element){
		var event = element.ownerDocument.createEventObject();
		options = keyOptions(type, options, element );
		event.charCode = options.charCode;
		event.keyCode = options.keyCode;
		event.shiftKey = options.shiftKey;
		var fire_event = part.dispatch(event, element, type);
		if(fire_event && type == 'keypress' && 
			(element.nodeName.toLowerCase() == 'input' || element.nodeName.toLowerCase() == 'textarea')) {
				if(options.character) element.value += options.character;
				else if(options.keyCode && options.keyCode == 8) element.value = element.value.substring(0,element.value.length-1);
		}
		return fire_event;
	}
	create.Event.key = function(part, type, options, element){
		options = keyOptions(type, options, element );
		var event
		try {
			
			event = element.ownerDocument.createEvent("KeyEvents");
			event.initKeyEvent(type, true, true, window, 
			options.ctrlKey, options.altKey, options.shiftKey, options.metaKey,
			options.keyCode, options.charCode );
		} catch(e) {
			try {
				event = document.createEvent("Events");
			} catch(e2) {
				event = document.createEvent("UIEvents");
			} finally {
				event.initEvent(type, true, true);
				extend(event, options);
			}
		}
		var preventDefault = event.preventDefault, prevented = false, fire_event;
		if(browser.firefox){
			event.preventDefault = function(){
				preventDefault.apply(this,[]);
				prevented = true;
			}
			part.dispatch(event, element)
			fire_event = !prevented;
		}else{
			fire_event = part.dispatch(event, element)
		}
		
		if(fire_event && type == 'keypress' && !browser.firefox && 
			(element.nodeName.toLowerCase() == 'input' || element.nodeName.toLowerCase() == 'textarea')) {
				if(options.character) element.value += options.character;
				else if(options.keyCode && options.keyCode == 8) element.value = element.value.substring(0,element.value.length-1);
		};
		
		return fire_event;
	}
	//---------------------Page EVENTS
	
	create.Event.page = function(part, type, options, element){
		var event = element.ownerDocument.createEvent("Events");
			event.initEvent(type, true, true ); 
		return part.dispatch(event, element);
	}
	create.EventObject.page = function(part, type, options, element){
		return part.dispatch(event, element, type);
	}
	
	var support = {
		clickChanges : false,
		clickSubmits : false,
		keypressSubmits : false,
		mouseupSubmits: false,
		radioClickChanges : false,
		focusChanges : false,
		linkHrefJS : false
	};
	
	//support code
	(function(){
		var oldSynth = window.__synthTest;
		window.__synthTest = function(){
			support.linkHrefJS = true;
		}
		var div = document.createElement("div"), checkbox, submit, form, input, submitted = false;
		div.innerHTML = "<form id='outer'><input name='checkbox' type='checkbox'/><input name='radio' type='radio' /><input type='submit' name='submitter'/><input type='input' name='inputter'/><input name='one'><input name='two'/><a href='javascript:__synthTest()' id='synlink'></a></form>";
	    document.documentElement.appendChild(div);
		form = div.firstChild
		checkbox = form.checkbox;
		submit = form.submitter
		
		
		checkbox.checked = false;
		checkbox.onchange = function(){
			support.clickChanges = true;
		}
		//document.body.appendChild(div);
		createEvent("click",{},checkbox)
		support.clickChecks = checkbox.checked;
		checkbox.checked = false;
		
		
		createEvent("change",{},checkbox);
		
		support.changeChecks = checkbox.checked;
		
		form.onsubmit = function(ev){
			if(ev.preventDefault) ev.preventDefault();
			submitted = true;
			return false;
		}
		createEvent("click",{},submit)
		if(submitted) support.clickSubmits = true;
		submitted = false;
		createEvent("keypress",{character: "\n"},form.inputter);
		if(submitted) support.keypressSubmits = true;
		
		form.radio.onchange = function(){
			support.radioClickChanges = true;
		}
		createEvent("click",{},form.radio)
		
		form.one.onchange = function(){
			support.focusChanges = true;
		}
		form.one.focus();
		createEvent("keypress",{character: "a"},form.one);
		form.two.focus();
		
		createEvent("click",{},div.getElementsByTagName('a')[0])
		
		document.documentElement.removeChild(div);
		
		//check stuff
		window.__synthTest = oldSynth;
	})();
    
	
	
	
	Synthetic.prototype = 
	{
		/**
		 * Dispatches the event on the given element
		 * @param {HTMLElement} element the element that will be the target of the event.
		 */
		send : function(element){
			this.firefox_autocomplete_off(element);
			
			if(browser.opera && /focus|blur/.test(this.type) ) return this.createEvents(element);
			if(typeof this[this.type] == "function") return this[this.type](element)
			return this.create_event(element)
		},
		check : function(element){
			if(!element.checked){
				element.checked = true;
				this.type = 'change'
				return browser.msie ? jQuery(element).change() : this.create_event(element)
			}
			return null;
		},
		uncheck : function(element){
			if(element.checked){
				element.checked = false;
				this.type = 'change'
				return browser.msie ? jQuery(element).change() : this.create_event(element)
			}
			return null;
		},
		keypress : function(element){
			var options = keyOptions("keypress", this.options, element);
			var res = this.create_event(element);
			if(res && (options.charCode == 10 || options.keyCode == 10) ){
				if(element.nodeName.toLowerCase() == "input" && !(support.keypressSubmits)){
					var form = Synthetic.closest(element, "form");
					if(form)
						new Synthetic("submit").send( form  );
				}
			}
		},
		key : function(element){
			createEvent("keydown", this.options, element);
			createEvent("keypress", this.options, element);
			createEvent("keyup", this.options, element);
		},
		/**
		 * Mouses down, focuses, up, and clicks an element
		 * @param {Object} element
		 */
		click : function(element){
			var href, checked
			try{
				checked = !!element.checked;
			}catch(e){}
			if( (browser.safari||browser.opera) && element.nodeName.toLowerCase() == "a" && element.href  && !/^\s*javascript:/.test(element.href)){
				href = element.href; //remove b/c safari/opera will open a new tab
				element.removeAttribute('href')
			}
			createEvent("mousedown", {}, element);
			
			
			try{
				element.focus();
			}catch(e){}
			
			if(!support.clickSubmits)
				createEvent("mouseup", {}, element)
			//record current value, set blur to issue change
			if(!support.focusChanges){
				
				
				Synthetic.data(element,"syntheticvalue", element.value)
				if(element.nodeName.toLowerCase() == "input"){
					var f;
					f= function(){
						if( Synthetic.data(element,"syntheticvalue") !=  element.value){
							createEvent("change", {}, element);
						}
						removeEventListener(element,"blur", f)
					}
					addEventListener(element, "blur", f)
				}
				
			}
			
			
			
			//jQuery(element).bind("click",set );
			var res = this.create_event(element);
			
			//jQuery(element).unbind("click", set)
			if(href){
				element.setAttribute('href',href)
            }
			
			// prevents the access denied issue in IE if the click causes the element to be destroyed
			try {
			    element.nodeType;
			} catch(e){
			    return res;
			}

			if(!support.linkHrefJS && /^\s*javascript:/.test(element.href)){
				//eval js
				var code = element.href.replace(/^\s*javascript:/,"")
                //try{
	            if (code != "//") {
                    if(window.selenium){
                        eval("with(selenium.browserbot.getCurrentWindow()){"+code+"}")
                    }else{
                        eval("with(this.scope){"+code+"}")
                    }
                }
                    
                //}catch(e){
                //    
                //}
                
                
			}
			if(res){
				if(element.nodeName.toLowerCase() == "input" && element.type == "submit" && !(support.clickSubmits)){
					var form =  Synthetic.closest(element, "form");
					if(form)
						new Synthetic("submit").send( form );
				}
				if(element.nodeName.toLowerCase() == "a" && element.href && !/^\s*javascript:/.test(element.href)){
					this.scope.location.href = element.href;
				}
				
				if(element.nodeName.toLowerCase() == "input" && element.type == "checkbox"){
					
					if(!support.clickChecks && !support.changeChecks){
						element.checked = !element.checked;
					}
					if(!support.clickChanges)
						new Synthetic("change").send(  element );
					
				}
				if(element.nodeName.toLowerCase() == "input" && element.type == "radio"){  // need to uncheck others if not checked
					
					if(!support.clickChecks && !support.changeChecks){
						//do the checks manually 
						if(!element.checked){ //do nothing, no change
							element.checked = true;
						}
					}
					if(checked != element.checked && !support.radioClickChanges){
						new Synthetic("change").send(  element );
					}
				}
				if(element.nodeName.toLowerCase() == "option"){
					//check if we should change
					//find which selectedIndex this is
					var children = element.parentNode.childNodes;
					for(var i =0; i< children.length; i++){
						if(children[i] == element) break;
					}
					if(i !== element.parentNode.selectedIndex){
						element.parentNode.selectedIndex = i;
						new Synthetic("change").send(  element.parentNode );
					}
				}
				
			}
			return res;
		},
		/*change : function(element){
			$(element).val( this.options )
			return browser.msie ? jQuery(element).change() : this.create_event(element)
 
		},*/
		firefox_autocomplete_off : function(element) {
			if(browser.firefox && element.nodeName.toLowerCase() == 'input' && element.getAttribute('autocomplete') != 'off')
				element.setAttribute('autocomplete','off');
		},
		/**
		 * Picks how to create the event
		 * @param {Object} element
		 */
		create_event: function(element){
			return createEvent(this.type, this.options, element)
			
		}
		
	}


	/**
	 * Used for creating and dispatching synthetic events.
	 * @codestart
	 * new MVC.Synthetic('click').send(MVC.$E('id'))
	 * @codeend
	 * @init Sets up a synthetic event.
	 * @param {String} type type of event, ex: 'click'
	 * @param {optional:Object} options
	 */
	
	if (window.jQuery) {
		jQuery.fn.synthetic = function(type, options, context){
			new Synthetic(type, options, context).send(this[0]);
			return this;
		};
	}
	//else 
		window.Synthetic = Synthetic;
	
}());

