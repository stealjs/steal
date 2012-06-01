steal.has('mxui/layout/wrap/wrap.js','mxui/layout/resize/resize.js');
steal('jquery').then(function($){
	/**
	 * Wraps an element with another element .. returns new element
	 */
	var tags = /canvas|textarea|input|select|button|img/i
	$.fn.mxui_layout_wrap = function(){
		var ret = [];
		this.each(function(){
			if(this.nodeName.match(tags)) {
				var $el = $(this),
				    $org =  $el
				//Opera fix for relative positioning
				if (/relative/.test($el.css('position')) && $.browser.opera)
					$el.css({ position: 'relative', top: 'auto', left: 'auto' });
	
				//Create a wrapper element and set the wrapper to the new current internal element
				var position = $el.css('position')
				$el.wrap(
					$('<div class="ui-wrapper"></div>').css({
						position: position == 'static' ? "relative" : position,
						width: $el.outerWidth(),
						height: $el.outerHeight(),
						top: $el.css('top'),
						left: $el.css('left')
					})
				);
			
				//Overwrite the original $el
				$el = $el.parent()
	
				$elIsWrapper = true;
	
				//Move margins to the wrapper
				$el.css({ marginLeft: $org.css("marginLeft"), marginTop: $org.css("marginTop"), marginRight: $org.css("marginRight"), marginBottom: $org.css("marginBottom") });
				$org.css({ marginLeft: "0px", marginTop: "0px", marginRight: "0px", marginBottom: "0px"});
	
				//Prevent Safari textarea resize
				//this.originalResizeStyle = $org.css('resize');
				//$org.css('resize', 'none');
	
				//Push the actual element to our proportionallyResize internal array
				//$org.css({ position: 'static', zoom: 1, display: 'block' })
				//this._proportionallyResizeElements.push();
	
				// avoid IE jump (hard set the margin)
				//$org.css({ margin: $org.css('margin') });
	
				// fix handlers offset
				//this._proportionallyResize();
				ret.push($el)
			}else{
				ret.push(this)
			}
			
		})
		
		return $(ret);
		
		
		
	}
	
})
;
steal.executed('mxui/layout/wrap/wrap.js');
steal('jquery',
	'jquery/controller',
	'mxui/layout/wrap',
	'jquery/event/drag',
	'jquery/dom/dimensions',
	'mxui/layout/fill')
     .then(function(){
	 	//we need to check we aren't evil and have overflow size our container
		
		$.support.correctOverflow = false;
		
		
		
		$(function(){
			var container =$("<div style='height: 18px; padding: 0; margin: 0'><div style='height: 20px; padding: 0; margin: 0'></div></div>").appendTo(document.body)
			$.support.correctOverflow = container.height() == 18;
			container.remove();
			container = null;
		})
		
		
		/**
		 * @class Mxui.Layout.Resize
		 * @parent Mxui
		 * @test mxui/layout/resize/funcunit.html
		 * 
		 * @description Makes an element resizable.
		 *
		 * Adds a resizable hook to the bottom right of an element 
		 * allowing you to drag the handle to resize the element. This can be
		 * useful for expanding `textarea`s or implementing a resizable window
		 * system.
		 *
		 * # Example
		 *
		 * Given the following markup:
		 *
		 *		<label>
		 *			<textarea id="comment" name="comment"></textarea>
		 *		</label>
		 *
		 *	As well as the following css:
		 *
		 *		.ui-resizable-handle {
		 *			display: block;
		 *			font-size: 0.1px;
		 *			position: absolute;
		 *			z-index: 1000;
		 *		}
		 *
		 *		.ui-resizable-s {
		 *			bottom: -3px;
		 *			cursor: s-resize;
		 *			height: 7px;
		 *			left: 0;
		 *			width: 100%;
		 *		}
		 *		.ui-resizable-e {
		 *			cursor: e-resize;
		 *			height: 100%;
		 *			right: -3px;
		 *			top: 0;
		 *			width: 7px;
		 *			
		 *		}
		 *		.ui-resizable-se {
		 *			bottom: 0px;
		 *			cursor: se-resize;
		 *			height: 12px;
		 *			right: 0px;
		 *			width: 12px;
		 *			background-color: #ddddff;
		 *		}
		 *
		 *	You can make the textarea resizable using the following code:
		 *
		 *		$("textarea").mxui_layout_resize({
		 *			minHeight : 40,
		 *			minWidth: 120
		 *		});
		 *
		 *	This adds three small `div`s to the element. One to the lower right
		 *	corner, one to the bottom edge and one to the right edge. These
		 *	divs become draggable hooks that allow you to resize the element.
		 *	To style these elements, simply over ride the above css.
		 *
		 *	When resizing the initialized element, it emits the "resize" event.
		 *
		 *
		 * ## Demo
		 * @demo mxui/layout/resize/resize.html
		 *
		 * @param {Object} options Object literal defining the minimum height
		 * and width the element should be allowed to be resized to.
		 *
		 *	- `minHeight` - The minimum height the element will be allowed to
		 *	resize to.
		 *	- `minWidth` - The minimum width the element will be allowed to
		 *	resize to.
		 */

		$.Controller("Mxui.Layout.Resize",
		{
			/*
			 * - minHeight - The minimum height the element will be allowed to
			 *   resize to. Default is 10 pixels.
			 * - minWidth - The minimum width the element will be allowed to
			 *   resize to. Default is 10 pixels.
			 */
			defaults : {
				minHeight: 10,
				minWidth: 10,
				handles : ["e", "s", "se"],
				className: "ui-resizable-handle"
			}
		},
		{
			setup : function(el, options){
				var diff = $(el).mxui_layout_wrap()[0]
				this._super(diff, options)
				if(diff != el){
					this.original = $(el).mxui_layout_fill({all: true}); //set to fill
				}
			},
			directionInfo: {
				"s" : {
					limit : "vertical",
					dim :  "height"
				},
				"e" : {
					limit : "horizontal",
					dim :  "width"
				},
				"se" : {
					
				}
			},
			/*
			 * @hide
			 * @param {Element} el
			 * The element you wish to be resizable.
			 *
			 * @param {Object} options
			 * The options that will be extended over the defaults.
			 */
			init : function(el, options){
				//draw in resizeable
				this.element.height( this.element.height() );
				this.element.prepend( $.map( this.options.handles, this.proxy( function( dir ) {
					return "<div class='ui-resizable-" + [ dir, this.options.className ].join(" ") + "'/>";
				})).join("") );
			},
			getDirection : function(el){
				return el[0].className.match(/ui-resizable-(se|s|e)/)[1]
			},
			".{className} draginit" : function(el, ev, drag){
				//get direction
				//how far is top corner 
				this.margin = this.element.offsetv().plus(this.element.dimensionsv('outer')).minus(  el.offsetv()  ) 
				this.overflow = $.curCSS(this.element[0], "overflow")
				if(!$.support.correctOverflow && this.overflow == "visible"){
					this.element.css("overflow","hidden")
				}
				var direction = this.getDirection(el)
				ev.stopPropagation();
				if(this.directionInfo[direction].limit)
					drag[this.directionInfo[direction].limit]()
			},
			".{className} dragmove" : function(el, ev, drag){

				ev.preventDefault(); //prevent from drawing .. 
				var direction = this.getDirection(el);

				if(direction.indexOf("s") > -1){
					var top = drag.location.y();
				
					var start = this.element.offset().top;
					var outerHeight = top-start
					if(outerHeight < this.options.minHeight){
						outerHeight = this.options.minHeight
					}
					this.element.outerHeight(outerHeight+this.margin.y())
					
				}
				if(direction.indexOf("e") > -1){
					var left = drag.location.x();
				
					var start = this.element.offset().left;
					var outerWidth = left-start
					if(outerHeight < this.options.minWidth){
						outerWidth = this.options.minWidth
					}
					this.element.outerWidth(outerWidth+this.margin.x())
				}
				var el = this.element;
				el.resize()
				

			},
			".{className} dragend" : function(){
				if (!$.support.correctOverflow && this.overflow == "visible") {
					this.element.css("overflow","visible")
				}
			}
		})
		
	 })
;
steal.executed('mxui/layout/resize/resize.js')
