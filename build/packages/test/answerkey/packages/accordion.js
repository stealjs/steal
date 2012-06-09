steal.has('mxui/nav/accordion/accordion.js');
/**
 * @class Mxui.Nav.Accordion
 */
steal('jquery/controller',
	  'jquery/dom/dimensions',
	  'jquery/event/drag',
	  'jquery/event/resize',
	  function($){

// Future Improvements:
//  - Make work with selectable (after it can use tab).
//  - clickToActivate should check if selectable is on, then use it.
/**
 * @class Mxui.Nav.Accordion
 * @parent Mxui
 * @test mxui/nav/accordion/funcunit.html
 * 
 * Provides basic accordion vertical accordion functionality.
 * 
 * ## Basic Example
 * 
 * If you have the following html:
 * 
 *     <div id='accordion'>
 *       <h3>Baked Goods</h3>
 *       <ul> <li>Cookies</li> ... </ul>
 *       
 *       <h3>Americana</h3>
 *       <ul> <li>Hot Dog</li> ... </ul>
 *       
 *       <h3>Other</h3>
 *       <div>I like Italian ...</div>
 *     </div>
 * 
 * The following will make the list sortable:
 * 
 *     $('#accordion').mxui_nav_accordion()
 * 
 * ## Demo
 * 
 * @demo mxui/nav/accordion/demo.html
 * 
 * ## Events
 * 
 * The accordion trigger 'show' events on content elements when shown.
 * 
 * ## HTML Considerations
 * 
 * The html should alternate between `title` and content 
 * elements.  By default, title elements are `h3` elements and
 * content elements are any other element.
 * 
 * It does support a `title` element followed by another `title` element,
 * but does not support a content element followed by another content element.
 * 
 * ## CSS Considerations
 * 
 * By default, accordion uses Themeroller styles. For content elements, you
 * typically want to add 'overflow:auto' to allow scrolling.
 * 
 * @constructor
 * 
 * @param {HTMLElement} element the element to add the accordion to.
 * @param {Object} options name-value pairs to configure
 * the accordion.  The available options are:
 * 
 *   - title ("h3") - the title element selector
 *   - duration ("fast") - how fast to animate
 *   - activeClassName ("ui-state-active") - the className to add
 *     to the opened title
 *   - hoverClassName ("ui-state-hover") - the className to add on
 *     hovering a title
 *   - activateFirstByDefault (true) - activate the first title
 *   - clickToActivate (true) - use click to activate
 */
$.Controller("Mxui.Nav.Accordion",{
	defaults : {
		title : "h3",
		duration : "fast",
		activeClassName: "ui-state-active",
		hoverClassName: "ui-state-hover",
		activateFirstByDefault: true,
		clickToActivate: true
	},
	listensTo : ["insert","resize"]
},
/**
 * @prototype
 */
{
	init : function()
	{
		// Initially add Title classes for title and hide the content.
		var title = this.options.title,
			children = this.element.children().each(function(){
				var el = $(this);
				if(!el.is(title)){
					el.hide();
				}else{
					el.addClass('ui-helper-reset ui-state-default');
				}
			});
			
		// Select first content element, since children.eq(0) is title, and trigger show and resize height.
		if(this.options.activateFirstByDefault){
			this.activate(children.eq(0));
		}
		
		//- Fixes problems with scrollbars when expanding/collasping elements
		this.element.css('overflow', 'hidden');
	},
	currentContent : function(){
		return this.element.children(':visible').not(this.options.title)
	},
	/**
	 * @hide
	 * Draws the current in the right spot. Triggered 
	 * initially or when resized.
	 * @param {jQuery} [children] - cached children (for performance)
	 */
	setHeight : function(children)
	{
		// Get only titles pre-defined in defaults either from param or current class object.
		var titles = (children || this.element.children() ).filter(this.options.title);
		
		// Initial proposed height for current content area.
		var ul_height = 0,
			content = this.currentContent();
		
		// Set current div height to match parent first.
		//this.element.height($(this.element).parent().height());
		
		// Make sure current height is not fixed to prevent double scroll bar.
		content.height('');
		
		// Calculate the allowed height after subtracting all titles height if not using scrollbar.
		if(titles && titles.length > 0){
			ul_height = this.calculateRemainder(titles);
		}
		// Minimum height for ul area to be 50, if allowed height more than 50, use the allowed height to push remaing titles to the bottom.
		if(ul_height > 50){
			content.outerHeight(ul_height);
		}
	},
	
	/**
	 * Expands the content for the `title` element
	 * without animating.
	 * 
	 *     $('#accordion').mxui_nav_accordion(
	 *       'activate',
	 *       $('#accordion ul:eq(3)')
	 *     )
	 * 
	 * 
	 * @param {jQuery} title the jQuery wrapped title element
	 * @param {Array} [args] optional aditional arguments to pass to show event.
	 */
	activate:function(title, args)
	{
		var next = title.next();
		
		this.current = title;
		if( !next.is(this.options.title) ) {
			next.triggerHandler("show", args)
			next.show();
		}
		
		title.addClass(this.options.activeClassName);
		this.setHeight();
	},
	
	// Occurs when title was clicked.
	"{title} click" : function(elm, event)
	{		
		if(this.options.clickToActivate){
			this.expand.apply(this, arguments);
		}
	},
	
	//  Activate was triggered.  Doing this to standardized the app's event system.
	"{title} activate":function()
	{
		this.expand.apply(this, arguments);
	},
	
	/**
	 * Expand and animate the content of the title that was clicked.
	 * 
	 *     $('#accordion').mxui_nav_accordion(
	 *       'expand',
	 *       $('#accordion ul:eq(3)')
	 *     )
	 * 
	 * 
	 * @param {jQuery} title the jQuery-wrapped title element.
	 */
	expand : function(title)
	{
		var next = title.next();
		// If we don't have one selected by default
		if(!this.current || next.is(this.options.title) ) {
			
			this.current && this.current
				.removeClass(this.options.activeClassName);
			
			this.activate(title, arguments);
			return;
		}
		
		// If proposed content for expansion is already expanded, no need to recalculate.
		if( title[0] === this.current[0] ){
			title.addClass(this.options.activeClassName);
			return;
		}
		
		//we need to 'knock out' the top border / margin / etc proportinally ...
		var newHeight = this.calculateRemainder(null, title),
			oldContent = this.element.children(':visible').not(this.options.title),
			newContent = title.next().show().height(0).trigger("show", arguments),
			oldH3 = this.current;
			
		//- toggle the classes
		newContent.find('.activated').removeClass('activated selected');
		oldH3.removeClass(this.options.activeClassName);
		title.addClass(this.options.activeClassName);
		
		// turn off scrolling ...
		var oldOverflow = oldContent[0].style.overflow,
			newOverflow = newContent[0].style.overflow;
		
		oldContent.css('overflow',"hidden");
		newContent.css('overflow',"hidden");
		
		// Animation closing the existing expanded content and removed class for title, then expand the new one.
		oldContent.stop(true, true).animate({outerHeight: "0px"},{
			complete : function(){
				$(this).hide();
				newContent.outerHeight(newHeight);
				oldContent.css('overflow',oldOverflow);
				newContent.css('overflow',newOverflow);
			},
			step : function(val, ani){
				//- the height will be 0 if there is more accoridans that height available, 
				//- then we just want to do a auto height.
				if(newHeight <= 0){
					newContent.css('height', 'auto')
				} else {
					newContent.outerHeight(newHeight*ani.pos);
				}
			},
			duration : this.options.duration
		});
		
		this.current = title;
	},
	
	/**
	 * @hide
	 * Calculate the allowed height left after subtracting height from all the titles.
	 * @param {Object} titles - title elements
	 * @param {Object} el resizing - element we are going to resize
	 * @return {Number} the size
	 */
	calculateRemainder : function(titles, el)
	{
		var total = this.element.height(),
			options = this.options;
			
		//- find the available space minus the accordian headers.
		(titles || this.element.children(this.options.title) )
				.each(function(){
					total -= $(this).outerHeight(true);
				});
		return total;
	},
	
	/**
	 * Occurs when resize was triggered.
	 * Call when an insert or DOM modification happens.
	 */
	resize : function()
	{
		clearTimeout(this._resizeTimeout);
		var self = this;
		this._resizeTimeout = setTimeout(function(){
			self.setHeight();
		}, 10);
	},
	
	// Call when an insert or dom modification happens
	insert : function()
	{
		this.setHeight();
	},
	
	// Remove hover class on mouse out event.
	"{title} mouseleave" : function(el)
	{
		el.removeClass(this.options.hoverClassName);
	},
	
	// Add hover class on mouse in event.
	"{title} mouseenter" : function(el)
	{
		el.addClass(this.options.hoverClassName);
	},
	
	// Occurs when an item was dropped over a title.
	"{title} dropover" : function(el)
	{
		this._timer = setTimeout(this.callback('titleOver', el),200);
	},
	
	// Occurs when an item was dropped out.
	"{title} dropout" : function(el)
	{
		clearTimeout(this._timer);
	}
});

});;
steal.executed('mxui/nav/accordion/accordion.js')
