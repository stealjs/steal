steal.has('mxui/layout/fill/fill.js');
steal('jquery/dom/dimensions', 'jquery/event/resize').then(function( $ ) {
	//evil things we should ignore
	var matches = /script|td/,

		// if we are trying to fill the page
		isThePage = function( el ) {
			return el === document || el === document.documentElement || el === window || el === document.body
		},
		//if something lets margins bleed through
		bleeder = function( el ) {
			if ( el[0] == window ) {
				return false;
			}
			var styles = el.curStyles('borderBottomWidth', 'paddingBottom')
			return !parseInt(styles.borderBottomWidth) && !parseInt(styles.paddingBottom)
		},
		//gets the bottom of this element
		bottom = function( el, offset ) {
			//where offsetTop starts
			return el.outerHeight() + offset(el);
		}
		pageOffset = function( el ) {
			return el.offset().top
		},
		offsetTop = function( el ) {
			return el[0].offsetTop;
		},
		inFloat = function( el, parent ) {
			while ( el && el != parent ) {
				var flt = $(el).css('float')
				if ( flt == 'left' || flt == 'right' ) {
					return flt;
				}
				el = el.parentNode
			}
		},
		/**
		 * @function jQuery.fn.mxui_layout_fill
		 * @parent Mxui
		 * @test mxui/layout/fill/funcunit.html
		 * @plugin mxui/layout/fill
		 * 
		 * Fills a parent element's height with the another 
		 * element.  This is extremely useful for complex layout,
		 * especially when you want to account for line-wrapping.
		 * 
		 * ## Basic Example
		 * 
		 * If you have the following html:
		 * 
		 *     <div id='box'>
		 * 	    <p>I am a long heading.</p>
		 * 	    <div id='child'>I'm a child.</div>
		 *     </div>
		 * 
		 * The follow makes `#child` fill up `#box`:
		 * 
		 *     $('#child').mxui_layout_fill("#box")
		 * 
		 * ## Demo
		 * 
		 * @demo mxui/layout/fill/demo.html
		 * 
		 * ## Limitations
		 * 
		 * Fill currently does not well with:
		 * 
		 *   - Bleeding margins - Where margins leak through parent elements
		 *     because the parent elements do not have a padding or border.
		 *     
		 *   - Tables - You shouldn't be using tables to do layout anyway.  
		 *   
		 *   - Floated Elements - the child element has `float: left` or `float: right`
		 * 
		 * 
		 * @param {HTMLElement|selector} [parent] the parent element 
		 * to fill, defaults to the element's parent.
		 * 
		 * The following fills the parent to `#child`:
		 * 
		 *     $('#child').mxui_layout_fill()
		 *    
		 * A selector can also be pased.  This selector is passed to jQuery's
		 * closet method.  The following matches the first `#parent` element that
		 * is a parentNode of `#child`:
		 * 
		 *     $('#child').mxui_layout_fill("#parent")
		 *    
		 * An element or window can also be passed.  The following will make
		 * `#child` big enough so the entire window is filled:
		 * 
		 *     $('#child').mxui_layout_fill(window)
		 * 
		 * @return {jQuery} the original jQuery collection for chaining.
		 */
		filler = $.fn.mxui_layout_fill = function( parent ) {
			// setup stuff on every element
			this.addClass('mxui_layout_fill')
			
			
			var options = parent;
			options || (options = {});
			if(typeof options == 'string'){
				options = this.closest(options)
			}
			if ( options.jquery || options.nodeName ) {
				options = {parent: options};
			}
			
			options.parent || (options.parent = $(this).parent())
			options.parent = $(options.parent)
			
			var thePage = isThePage(options.parent[0]);
			
			if ( thePage ) {
				options.parent = $(window)
			}
			
			
			this.each(function(){
				
				var evData = {
					filler: $(this),
					inFloat: inFloat(this, thePage ? document.body : options.parent[0]),
					options: options
				},
				cb = function(){
					filler.parentResize.apply(this, arguments)
				}
				$(options.parent).bind('resize', evData, cb);
				//if this element is removed, take it out
	
				$(this).bind('destroyed', evData, function( ev ) {
					$(ev.target).removeClass('mxui_filler')
					$(options.parent).unbind('resize', cb)
				});
				
			})
			

			
			//add a resize to get things going
			var func = function() {
				options.parent.resize();
			}
			if ( $.isReady ) {
				func();
			} else {
				$(func)
			}
			return this;
		};


	$.extend(filler, {
		parentResize: function( ev ) {
			if (ev.data.filler.is(':hidden')) {
				return;
			}
			
			var parent = $(this),
				isWindow = this == window,
				container = (isWindow ? $(document.body) : parent),

				//if the parent bleeds margins, we don't care what the last element's margin is
				isBleeder = bleeder(parent),
				children = container.children().filter(function() {
					if ( matches.test(this.nodeName.toLowerCase()) ) {
						return false;
					}

					var get = $.curStyles(this, ['position', 'display']);
					return get.position !== "absolute" && get.position !== "fixed" && get.display !== "none" && !jQuery.expr.filters.hidden(this)
				}),
				last = children.eq(-1),
				first,
				parentHeight = parent.height() - (isWindow ? parseInt(container.css('marginBottom'), 10) || 0 : 0),
				currentSize;
			var div = '<div style="height: 0px; line-height:0px;overflow:hidden;' + (ev.data.inFloat ? 'clear: both' : '') + ';"/>'

			if ( isBleeder ) {
				//temporarily add a small div to use to figure out the 'bleed-through' margin
				//of the last element
				last = $(div).appendTo(container);
				
			}
			//console.log("?")
			//for performance, we want to figure out the currently used height of the parent element
			// as quick as possible
			// we can use either offsetTop or offset depending ...
			if ( last && last.length > 0 ) {
				if ( last.offsetParent()[0] === container[0] ) {

					currentSize = last[0].offsetTop + last.outerHeight();
				} else if (last.offsetParent()[0] === container.offsetParent()[0]) {
					// add pos abs for IE7 but
					// might need to adjust for the addition of first's hheight
					var curLast =last[0].offsetTop;
					first = $(div).prependTo(container);
					
					currentSize = ( curLast + last.outerHeight() ) - first[0].offsetTop;
					
					first.remove();
				} else {
					// add first so we know where to start from .. do not bleed in this case
					first = $(div).prependTo(container);
					/*console.log('last', last,'last-top', last.offset().top, 'last-height',last.outerHeight(),
						'\nct',container, "container-top",container.offset().top,
						'\nfirst',first, "first-top",
						first.offset().top,
						'parentMatch',
						last.offsetParent()[0] === container.offsetParent()[0]);*/
					
					currentSize = ( last.offset().top + last.outerHeight() ) - first.offset().top //- container.offset().top
					first.remove();
				}
			}

			// what the difference between the parent height and what we are going to take up is
			var delta = parentHeight - currentSize,
				// the current height of the object
				fillerHeight = ev.data.filler.height();

			//adjust the height
			if ( ev.data.options.all ) {
				// we don't care about anything else ... we are likely absolutely positioned
				//we need to fill the parent width ...
				// temporarily collapse ... then expand ...
				ev.data.filler.height(0).width(0);
				var parentWidth = parent.width(),
					parentHeight = parent.height();

				ev.data.filler.outerHeight(parentHeight);
				ev.data.filler.outerWidth(parentWidth);
			} else {
				//console.log(ev.data.filler, "parentHeight",parentHeight, "currentSize",currentSize)
				ev.data.filler.height(fillerHeight + delta)
			}


			//remove the temporary element
			if ( isBleeder ) {
				last.remove();
				
			}
		}
	});

});
steal.executed('mxui/layout/fill/fill.js')
