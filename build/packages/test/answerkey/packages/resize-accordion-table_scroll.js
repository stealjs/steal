steal.has('jquery/event/resize/resize.js','jquery/dom/dom.js','jquery/dom/cur_styles/cur_styles.js','jquery/dom/dimensions/dimensions.js');
steal('jquery/event').then(function( $ ) {
	/**
	 * @add jQuery.event.special
	 */
	var resizers = $(),
		resizeCount = 0,
		// bind on the window window resizes to happen
		win = $(window),
		windowWidth = 0,
		windowHeight = 0,
		timer;

	$(function() {
		windowWidth = win.width();
		windowHeight = win.height();
	})

	/**
	 * @attribute resize
	 * @parent specialevents
	 * 
	 * The resize event is useful for updating elements dimensions when a parent element
	 * has been resized.  It allows you to only resize elements that need to be resized 
	 * in the 'right order'.
	 * 
	 * By listening to a resize event, you will be alerted whenever a parent 
	 * element has a <code>resize</code> event triggered on it.  For example:
	 * 
	 *     $('#foo').bind('resize', function(){
	 *        // adjust #foo's dimensions
	 *     })
	 *     
	 *     $(document.body).trigger("resize");
	 * 
	 * ## The 'Right Order'
	 * 
	 * When a control changes size, typically, you want only internal controls to have to adjust their
	 * dimensions.  Furthermore, you want to adjust controls from the 'outside-in', meaning
	 * that the outermost control adjusts its dimensions before child controls adjust theirs.
	 * 
	 * Resize calls resize events in exactly this manner.  
	 * 
	 * When you trigger a resize event, it will propagate up the DOM until it reaches
	 * an element with the first resize event 
	 * handler.  There it will move the event in the opposite direction, calling the element's
	 * children's resize event handlers.
	 *
	 * If your intent is to call resize without bubbling and only trigger child element's handlers,
	 * use the following:
	 *
	 *     $("#foo").trigger("resize", false);
	 * 
	 * ## Stopping Children Updates
	 * 
	 * If your element doesn't need to change it's dimensions as a result of the parent element, it should
	 * call ev.stopPropagation().  This will only stop resize from being sent to child elements of the current element.
	 * 
	 * 
	 */
	$.event.special.resize = {
		setup: function( handleObj ) {
			// add and sort the resizers array
			// don't add window because it can't be compared easily
			if ( this !== window ) {
				resizers.push(this);
				$.unique(resizers);
			}
			// returns false if the window
			return this !== window;
		},
		teardown: function() {
			// we shouldn't have to sort
			resizers = resizers.not(this);

			// returns false if the window
			return this !== window;
		},
		add: function( handleObj ) {
			// increment the number of resizer elements
			//$.data(this, "jquery.dom.resizers", ++$.data(this, "jquery.dom.resizers") );
			var origHandler = handleObj.handler;
			handleObj.origHandler = origHandler;

			handleObj.handler = function( ev, data ) {
				var isWindow = this === window;

				// if we are the window and a real resize has happened
				// then we check if the dimensions actually changed
				// if they did, we will wait a brief timeout and 
				// trigger resize on the window
				// this is for IE, to prevent window resize 'infinate' loop issues
				if ( isWindow && ev.originalEvent ) {
					var width = win.width(),
						height = win.height();


					if ((width != windowWidth || height != windowHeight)) {
						//update the new dimensions
						windowWidth = width;
						windowHeight = height;
						clearTimeout(timer)
						timer = setTimeout(function() {
							win.trigger("resize");
						}, 1);

					}
					return;
				}

				// if this is the first handler for this event ...
				if ( resizeCount === 0 ) {
					// prevent others from doing what we are about to do
					resizeCount++;
					var where = data === false ? ev.target : this

					//trigger all this element's handlers
					$.event.handle.call(where, ev);
					if ( ev.isPropagationStopped() ) {
						resizeCount--;
						return;
					}

					// get all other elements within this element that listen to resize
					// and trigger their resize events
					var index = resizers.index(this),
						length = resizers.length,
						child, sub;

					// if index == -1 it's the window
					while (++index < length && (child = resizers[index]) && (isWindow || $.contains(where, child)) ) {

						// call the event
						$.event.handle.call(child, ev);

						if ( ev.isPropagationStopped() ) {
							// move index until the item is not in the current child
							while (++index < length && (sub = resizers[index]) ) {
								if (!$.contains(child, sub) ) {
									// set index back one
									index--;
									break
								}
							}
						}
					}

					// prevent others from responding
					ev.stopImmediatePropagation();
					resizeCount--;
				} else {
					handleObj.origHandler.call(this, ev, data);
				}
			}
		}
	};

	// automatically bind on these
	$([document, window]).bind('resize', function() {})
});
steal.executed('jquery/event/resize/resize.js');
/**
@page dom DOM Helpers
@parent jquerymx
@description jQuery DOM extension.

JavaScriptMVC adds a bunch of useful 
jQuery extensions for the dom.  Check them out on the left. 

## [dimensions Dimensions]

Set and animate the inner and outer height and width of elements.

    $('#foo').outerWidth(100);
    $('#bar').animate({innerWidth: 500});

This is great when you want to include padding and margin in
setting the dimensions of elements.

## [jQuery.cookie Cookie]

Set and get cookie values:

    $.cookie('cookie','value');
    
## [jQuery.fixture Fixture]

Simulate Ajax responses.

    $.fixture("/services/tasks.php','fixtures/tasks.json');
    
Works with jQuery's Ajax converters!

## [jQuery.fn.compare Compare]

Compare the location of two elements rapidly.

    $('#foo').compare($('#bar')) & 2 // true if #bar is before #foo
    
## [jQuery.fn.curStyles CurStyles]

Get multiple css properties quickly.

    $('#foo').curStyles('left','top') //-> {left:'20px',top:'10px'}

## [jQuery.fn.formParams FormParams]

Serializes a form into a JSON-like object:

    $('form').formParams() //-> {name: 'Justin', favs: ['JS','Ruby']}
    
## [jQuery.fn.selection Selection]

Gets or sets the current text selection.

    // gets selection info
    $('pre').selection() //-> {start: 22, end: 57, range: range}
    
    // sets the selection
    $('div').selection(20,22)

## [jQuery.fn.within Within]

Returns elements that have a point within their boundaries.

    $('.drop').within(200,200) //-> drops that touch 200,200
    
## [jQuery.Range Range]

Text range utilities.

    $('#copy').range() //-> text range that has copy selected
    
## [jQuery.route]

Hash routes mapped to an [jQuery.Observe $.Observe].

	$.route(':type',{type: 'videos'})
    $.route.delegate('type','set', function(){ ... })
    $.route.attr('type','images');

*/
steal('jquery');;
steal.executed('jquery/dom/dom.js');
steal('jquery/dom').then(function( $ ) {

	var getComputedStyle = document.defaultView && document.defaultView.getComputedStyle,
		rupper = /([A-Z])/g,
		rdashAlpha = /-([a-z])/ig,
		fcamelCase = function( all, letter ) {
			return letter.toUpperCase();
		},
		getStyle = function( elem ) {
			if ( getComputedStyle ) {
				return getComputedStyle(elem, null);
			}
			else if ( elem.currentStyle ) {
				return elem.currentStyle;
			}
		},
		rfloat = /float/i,
		rnumpx = /^-?\d+(?:px)?$/i,
		rnum = /^-?\d/;
	/**
	 * @add jQuery
	 */
	//
	/**
	 * @function curStyles
	 * @param {HTMLElement} el
	 * @param {Array} styles An array of style names like <code>['marginTop','borderLeft']</code>
	 * @return {Object} an object of style:value pairs.  Style names are camelCase.
	 */
	$.curStyles = function( el, styles ) {
		if (!el ) {
			return null;
		}
		var currentS = getStyle(el),
			oldName, val, style = el.style,
			results = {},
			i = 0,
			left, rsLeft, camelCase, name;

		for (; i < styles.length; i++ ) {
			name = styles[i];
			oldName = name.replace(rdashAlpha, fcamelCase);

			if ( rfloat.test(name) ) {
				name = jQuery.support.cssFloat ? "float" : "styleFloat";
				oldName = "cssFloat";
			}

			if ( getComputedStyle ) {
				name = name.replace(rupper, "-$1").toLowerCase();
				val = currentS.getPropertyValue(name);
				if ( name === "opacity" && val === "" ) {
					val = "1";
				}
				results[oldName] = val;
			} else {
				camelCase = name.replace(rdashAlpha, fcamelCase);
				results[oldName] = currentS[name] || currentS[camelCase];


				if (!rnumpx.test(results[oldName]) && rnum.test(results[oldName]) ) { //convert to px
					// Remember the original values
					left = style.left;
					rsLeft = el.runtimeStyle.left;

					// Put in the new values to get a computed value out
					el.runtimeStyle.left = el.currentStyle.left;
					style.left = camelCase === "fontSize" ? "1em" : (results[oldName] || 0);
					results[oldName] = style.pixelLeft + "px";

					// Revert the changed values
					style.left = left;
					el.runtimeStyle.left = rsLeft;
				}

			}
		}

		return results;
	};
	/**
	 *  @add jQuery.fn
	 */


	$.fn
	/**
	 * @parent dom
	 * @plugin jquery/dom/cur_styles
	 * @download http://jmvcsite.heroku.com/pluginify?plugins[]=jquery/dom/cur_styles/cur_styles.js
	 * @test jquery/dom/cur_styles/qunit.html
	 * Use curStyles to rapidly get a bunch of computed styles from an element.
	 * <h3>Quick Example</h3>
	 * @codestart
	 * $("#foo").curStyles('float','display') //->
	 * // {
	 * //  cssFloat: "left", display: "block"
	 * // }
	 * @codeend
	 * <h2>Use</h2>
	 * <p>An element's <b>computed</b> style is the current calculated style of the property.
	 * This is different than the values on <code>element.style</code> as
	 * <code>element.style</code> doesn't reflect styles provided by css or the browser's default
	 * css properties.</p>
	 * <p>Getting computed values individually is expensive! This plugin lets you get all
	 * the style properties you need all at once.</p>
	 * <h2>Demo</h2>
	 * <p>The following demo illustrates the performance improvement curStyle provides by providing
	 * a faster 'height' jQuery function called 'fastHeight'.</p>
	 * @demo jquery/dom/cur_styles/cur_styles.html
	 * @param {String} style pass style names as arguments
	 * @return {Object} an object of style:value pairs
	 */
	.curStyles = function() {
		return $.curStyles(this[0], $.makeArray(arguments));
	};
});;
steal.executed('jquery/dom/cur_styles/cur_styles.js');

steal('jquery/dom/cur_styles').then(function($) {
/**
 * @page dimensions dimensions
 * @parent dom
 * @plugin jquery/dom/dimensions
 * 
 * The dimensions plugin adds support for setting+animating inner+outer height and widths.
 * 
 * ### Quick Examples
 * 
 *      $('#foo').outerWidth(100).innerHeight(50);
 *      $('#bar').animate({outerWidth: 500});
 *      
 * ## Use
 * 
 * When writing reusable plugins, you often want to 
 * set or animate an element's width and height that include its padding,
 * border, or margin.  This is especially important in plugins that
 * allow custom styling.
 * 
 * The dimensions plugin overwrites [jQuery.fn.outerHeight outerHeight],
 * [jQuery.fn.outerWidth outerWidth], [jQuery.fn.innerHeight innerHeight] 
 * and [jQuery.fn.innerWidth innerWidth]
 * to let you set and animate these properties.
 * 
 * 
 * 
 * 
 * ## Demo
 * 
 * @demo jquery/dom/dimensions/dimensions.html
 */

var weird = /button|select/i, //margin is inside border
	getBoxes = {},
    checks = {
        width: ["Left", "Right"],
        height: ['Top', 'Bottom'],
        oldOuterHeight: $.fn.outerHeight,
        oldOuterWidth: $.fn.outerWidth,
        oldInnerWidth: $.fn.innerWidth,
        oldInnerHeight: $.fn.innerHeight
    };
/**
 *  @add jQuery.fn
 */
$.each({ 

/**
 * @function outerWidth
 * @parent dimensions
 * Lets you set the outer width on an object
 * @param {Number} [height] 
 * @param {Boolean} [includeMargin=false] Makes setting the outerWidth adjust 
 * for margin. Defaults to false.
 * 
 *     $('#hasMargin').outerWidth(50, true);
 * 
 * @return {jQuery|Number} If you are setting the value, returns the jQuery wrapped elements.
 */
width: 
/**
 * @function innerWidth
 * @parent dimensions
 * Lets you set the inner height of an object
 * @param {Number} [height] 
 */
"Width", 
/**
 * @function outerHeight
 * @parent dimensions
 * Lets you set the outer height of an object where: <br/> 
 * <code>outerHeight = height + padding + border + (margin)</code>.  
 * @codestart
 * $("#foo").outerHeight(100); //sets outer height
 * $("#foo").outerHeight(100, true); //uses margins
 * $("#foo").outerHeight(); //returns outer height
 * $("#foo").outerHeight(true); //returns outer height with margins
 * @codeend
 * When setting the outerHeight, it adjusts the height of the element.
 * @param {Number|Boolean} [height] If a number is provided -> sets the outer height of the object.<br/>
 * If true is given ->  returns the outer height and includes margins.<br/>
 * If no value is given -> returns the outer height without margin.
 * @param {Boolean} [includeMargin] Makes setting the outerHeight adjust for margin.
 * @return {jQuery|Number} If you are setting the value, returns the jQuery wrapped elements.
 * Otherwise, returns outerHeight in pixels.
 */
height: 
/**
 * @function innerHeight
 * @parent dimensions
 * Lets you set the outer width on an object
 * @param {Number} [height] 
 */
"Height" }, function(lower, Upper) {

    //used to get the padding and border for an element in a given direction
    getBoxes[lower] = function(el, boxes) {
        var val = 0;
        if (!weird.test(el.nodeName)) {
            //make what to check for ....
            var myChecks = [];
            $.each(checks[lower], function() {
                var direction = this;
                $.each(boxes, function(name, val) {
                    if (val)
                        myChecks.push(name + direction+ (name == 'border' ? "Width" : "") );
                })
            })
            $.each($.curStyles(el, myChecks), function(name, value) {
                val += (parseFloat(value) || 0);
            })
        }
        return val;
    }

    //getter / setter
    $.fn["outer" + Upper] = function(v, margin) {
        var first = this[0];
		if (typeof v == 'number') {
            first && this[lower](v - getBoxes[lower](first, {padding: true, border: true, margin: margin}))
            return this;
        } else {
            return first ? checks["oldOuter" + Upper].call(this, v) : null;
        }
    }
    $.fn["inner" + Upper] = function(v) {
        var first = this[0];
		if (typeof v == 'number') {
            first&& this[lower](v - getBoxes[lower](first, { padding: true }))
            return this;
        } else {
            return first ? checks["oldInner" + Upper].call(this, v) : null;
        }
    }
    //provides animations
	var animate = function(boxes){
		return function(fx){
			if (fx.state == 0) {
	            fx.start = $(fx.elem)[lower]();
	            fx.end = fx.end - getBoxes[lower](fx.elem,boxes);
	        }
	        fx.elem.style[lower] = (fx.pos * (fx.end - fx.start) + fx.start) + "px"
		}
	}
    $.fx.step["outer" + Upper] = animate({padding: true, border: true})
	
	$.fx.step["outer" + Upper+"Margin"] =  animate({padding: true, border: true, margin: true})
	
	$.fx.step["inner" + Upper] = animate({padding: true})

})

})
;
steal.executed('jquery/dom/dimensions/dimensions.js')
