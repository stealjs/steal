steal.has('mxui/util/scrollbar_width/scrollbar_width.js','mxui/layout/table_fill/table_fill.js','mxui/layout/table_scroll/table_scroll.js','steal/build/packages/test/table_scroll.js');
steal({src: 'steal/build/packages/test/packages/table_scroll.css', waits: true, has: ['steal/build/packages/test/table_scroll.css']});
steal('jquery').then(function($){
		var div = $('<div id="out"><div style="height:200px;"></div></div>').css({
				position: "absolute",
				top: "0px",
				left: "0px",
				visibility: "hidden",
				width: "100px",
				height: "100px",
				overflow: "hidden"
			}).appendTo(document.body),
			inner = $(div[0].childNodes[0]),
			w1 = inner[0].offsetWidth,
			w2;

		div.css("overflow","scroll");
		//inner.css("width","100%"); //have to set this here for chrome
		var w2 = inner[0].offsetWidth;		
		if (w2 == w1) {
			inner.css("width", "100%"); //have to set this here for chrome
			w2 = inner[0].offsetWidth;
		}
		div.remove();
		(window.Mxui || (window.Mxui = {}) ).scrollbarWidth = w1 - w2;
})
;
steal.executed('mxui/util/scrollbar_width/scrollbar_width.js');
steal('mxui/layout/fill',
	'mxui/util/scrollbar_width',
	'jquery/controller').then(function(){
	
//makes a table fill out it's parent

$.Controller('Mxui.Layout.TableFill',{
	setup : function(el, options){
		//remove the header and put in another table
		el = $(el);
		if(el[0].nodeName.toLowerCase() == 'table'){
			this.$ = {
				table: el
			}
			this._super(this.$.table.wrap("<div></div>").parent(), 
					options)
		} else {
			this.$ = {
				table: el.find('table:first')
			}
			this._super(el, options);
		}
		
	},
	init : function(){
		// add a filler ...
		var options = {};
		if(this.options.parent){
			options.parent = this.options.parent;
			options.filler = this.options.filler;
		}
		this.element.mxui_layout_fill(options).css('overflow','auto');
		
	},
	// listen on resize b/c we want to do this right away
	// in case anyone else cares about the table's
	// dimensions (like table scroll)
	resize : function(ev){
		var table = this.$.table,
			el = this.element[0];
		//let the table flow naturally
		table.css("width","");
		
		// is it scrolling vertically
		if(el.offsetHeight < el.scrollHeight){
			table.outerWidth(this.element.width() - Mxui.scrollbarWidth)
		} else {
			table.outerWidth(this.element.width() )
		}
		
	}
})
	
})
;
steal.executed('mxui/layout/table_fill/table_fill.js');
steal('mxui/layout/table_fill').then(function( $ ) {

	// helpers
	var setWidths = function( cells, firstWidths ) {
		var length = cells.length - 1;
		for ( var i = 0; i < length; i++ ) {
			cells.eq(i).outerWidth(firstWidths[i]);
		}
	}

	/**
	 * @class Mxui.Layout.TableScroll
	 * @parent Mxui
	 * @test mxui/layout/table_scroll/funcunit.html
	 * 
	 * @description Makes a table body scroll under a table header.
	 * 
	 * Makes a table body scroll under a table 
	 * header.  This is very useful for making grid-like widgets.
	 * 
	 * ## Basic Example
	 * 
	 * If you have the following html:
	 * 
	 *     <div id='area' style='height: 500px'>
	 *        <p>This is My Table</p>
	 *        <table id='people'>
	 *          <thead>
	 *            <tr> <th>Name</th><th>Age</th><th>Location</th> </tr>
	 *          </thead>
	 *          <tbody>
	 *            <tr> <td>Justin</td><td>28</td><td>Chicago</td> </tr>
	 *            <tr> <td>Brian</td><td>27</td><td>Chicago</td> </tr>
	 *            ...
	 *          </tbody>
	 *        </table>
	 *     </div>
	 * 
	 * The following make the list of people, the tbody, scrollable between
	 * the table header and footer:
	 * 
	 *     $('#people').mxui_layout_table_scroll()
	 * 
	 * It makes it so you can always see the table header 
	 * and footer.  The table will [Mxui.Layout.Fill fill] the height of it's parent 
	 * element. This means that if the `#area` element's height 
	 * is 500px, the table will take up everything outside the `p`aragraph element.
	 * 
	 * ## Demo
	 * 
	 * @demo mxui/layout/table_scroll/demo.html
	 * 
	 * ## How it works
	 * 
	 * To scroll the `tbody` under the `thead`, TableScroll 
	 * wraps the table with `div`s and seperates out the 
	 * `thead` into its own div.  After changing the DOM,
	 * the table looks like:
	 * 
	 *     <div class='mxui_layout_table_scroll'>
	 *       <div class='header'>
	 *          <table>
	 *            <thead> THEAD CONTENT </thead>
	 *          </table>
	 *       </div>
	 *       <div class='body'>
	 *          <div class='scrollBody'>
	 *            <table>
	 *              <tbody> TBODY CONENT </tbody>
	 *            </table>
	 *          </div>
	 *       </div>
	 *     </div>
	 * 
	 * The grid also maintains a copy of the `thead`'s content
	 * in the scrolling table to ensure the columns are 
	 * sized correctly.
	 * 
	 * ## Changing the table
	 * 
	 * When you change the table's content, the table
	 * often needs to update the positions of 
	 * the column header.  If you change the tbody's content,
	 * you can simply trigger resize on the grid.
	 * 
	 * But, if you change the columns, you must call
	 * [Mxui.Layout.Fill.prototype.changed changed].
	 * 
	 * @constructor
	 * 
	 * @param {HTMLElement} el
	 * @param {Object} [options] values to configure
	 * the behavior of table scroll:
	 * 
	 *    - `filler` - By default, the table fills 
	 *      it's parent's height. Pass false to not actually scroll the
	 *      table.
	 */
	$.Controller("Mxui.Layout.TableScroll", {
		defaults: {
			// this option is really for the grid, because the grid
			// uses table scroll internally to add items to
			// the list
			filler: true
		}
	},
	/** 
	 * @prototype
	 */
	{
		setup: function( el, options ) {
			// a cache of elements.
			this.$ = {
				table: $(el)
			}
			// the area that scrolls
			this.$.scrollBody = this.$.table.wrap("<div><div  class='body'><div class='scrollBody'></div></div></div>").parent()
			// a div that houses the scrollable area.  IE < 8 needs this.  It acts
			// as a buffer for the scroll bar
			this.$.body = this.$.scrollBody.parent();

			this._super(this.$.body.parent()[0], options)
			//wrap table with a scrollable div

		},
		init: function() {
			// body acts as a buffer for the scroll bar
			this.$.body.css("width", "100%");

			// get the thead, and tfoot into their own table.
			$.each(['thead', 'tfoot'], this.callback('_wrapWithTable'))


			// get the tbody
			this.$.tbody = this.$.table.children('tbody')

			// if one doesn't exist ... make it
			if (!this.$.tbody.length ) {
				this.$.tbody = $('<tbody/>')
				this.$.table.append(this.$.tbody)
			}

			// add thead
			if ( this.$.theadTable ) {
				this.$.head = $("<div class='header'></div>").css({
					"visibility": "hidden",
					overflow: "hidden"
				}).prependTo(this.element).append(this.$.theadTable);
				this._addSpacer('thead');
			}
			if ( this.$.tfootTable ) {
				this.$.foot = $("<div class='footer'></div>").css({
					"visibility": "hidden",
					overflow: "hidden"
				}).appendTo(this.element).append(this.$.tfootTable);
				this._addSpacer('tfoot');
			}


			// add representations of the header cells to the bottom of the table

			// fill up the parent
			//this.element.mxui_layout_fill();
			//make the scroll body fill up all other space
			// why doesn't it do this by default?
			if ( this.options.filler ) {
				this.$.scrollBody.mxui_layout_table_fill({
					parent: this.element.parent()
				})
			}

			this.bind(this.$.scrollBody, "resize", "bodyResized")
			//this.element.parent().triggerHandler('resize')
			//make a quick resize
			//then redraw the titles

			this.bind(this.$.scrollBody, "scroll", "bodyScroll")
			this._sizeHeaderAndFooters();
		},
		_wrapWithTable: function( i, tag ) {

			// save it
			this.$[tag] = this.$.table.children(tag)
			if ( this.$[tag].length && this.$[tag].find('td, th').length ) {
				// remove it (w/o removing any widgets on it)
				this.$[tag][0].parentNode.removeChild(this.$[tag][0]);

				//wrap it with a table and save the table
				this.$[tag + "Table"] = this.$.thead.wrap('<table/>').parent()
			}



		},
		/**
		 * Returns useful elements of the table
		 * the thead, tbody, tfoot, and scrollBody of the modified table:
		 * 
		 *     $('.mxui_layout_table_scroll')
		 *       .controller().element() //-> {...}
		 * 
		 * If you need to change the content of the table, you can
		 * use elements for access.  If you change the content, make sure
		 * you call changed.
		 * 
		 * @return {Object} an object like:
		 * 
		 *     {
		 *         tbody : HTMLTableSelectionElement,
		 *         tfoot : HTMLTableSelectionElement,
		 *         thead : HTMLTableSelectionElement,
		 *         scrollBody : HTMLDivElement
		 *     }
		 */
		elements: function() {
			return {
				tbody: this.$.tbody,
				tfoot: this.$.tfoot,
				thead: this.$.thead,
				scrollBody: this.$.scrollBody
			}
		},
		/**
		 * Call when columns are added or removed or the title's changed.
		 * 
		 * ### Example:
		 * 
		 *     $('th:eq(2)').text('New Text');
		 *     $('.mxui_layout_table_scroll')
		 *        .mxui_layout_table_scroll('changed')
		 * 
		 * @param {Boolean} [resize] By default, changed will trigger a resize,
		 * which re-calculates the layout.  Pass false to prevent this 
		 * from happening.
		 */
		changed: function( resize ) {
			if ( this.$.foot ) {
				this._addSpacer('tfoot');
			}
			if ( this.$.head ) {
				this._addSpacer('thead');
			}
			this._sizeHeaderAndFooters();
			if ( resize !== false ) {
				this.element.resize()
			}
		},
		/**
		 * Add elements to this scrollable table
		 * after an optional element. This 
		 * assumes these elements matches the 
		 * current column headers.  If you change the column
		 * headers, make sure you trigger resize.
		 * 
		 *     $('.mxui_layout_table_scroll')
		 *       .mxui_layout_table_scroll('append', elements );
		 * 
		 * @param {jQuery} els The elements to append.
		 * @param {jQuery|false} [after] where to insert items in the list
		 *   - If a jQuery collection is provided, elements will be added
		 *     after this element.  
		 *   - If `false`, elements will be added to the start of the grid.   
		 *   - If nothing is provided, elements will be added to the end of the list 
		 */
		append: function( els, after ) {

			if ( after ) {
				after.after(els);
			} else if ( after === false ) {
				this.$.tbody.prepend(els);
			} else if(this.$.spacer){
				this.$.spacer.before(els);
			} else {
				this.$.tbody.append(els);
			}
			this.changed(true)
			//this.element.resize();
		},
		/**
		 * Empties the table body.
		 * 
		 *     $('.mxui_layout_table_scroll')
		 *       .mxui_layout_table_scroll('empty');
		 *       
		 * @return {table_scroll} returns the table_scroll instance
		 * for chaining.
		 */
		empty: function() {
			this.$.tbody.children(":not(.spacing)").remove();
			this.element.resize();
			return this;
		},
		/**
		 * @hide
		 * Adds a spacer on the bottom of the table that mimicks the dimensions
		 * of the table header elements.  This keeps the body columns for being
		 * smaller than the header widths.
		 * 
		 * This ONLY works when the table is visible.
		 */
		_addSpacer: function( tag ) {
			if (!this.$[tag].is(":visible") ) {
				return;
			}
			//check last element ...
			var last = this.$.tbody.children('.spacing.' + tag)
			if ( last.length ) {
				last.remove();
			}

			var spacer = this.$[tag].children(0).clone().addClass('spacing').addClass(tag);

			// wrap contents with a spacing
			spacer.children("th, td").each(function() {
				var td = $(this);
				td.html("<div style='float: left;'>" + td.html() + "</div>")
			});

			spacer.appendTo(this.$.tbody);

			//now set spacing, and make minimal height
			spacer.children("th, td").each(function() {
				var $td = $(this),
					$spacer = $td.children(':first'),
					width = $spacer.outerWidth();

				$td.css({
					"padding-top": 0,
					"padding-bottom": 0,
					margin: 0,
					width: ""
				}) // If padding is removed from the cell sides, layout might break!
				$spacer.outerWidth(width + 2).css({
					"float": "none",
					"visibility": "hidden",
					height: "1px"
				}).html("")
			})
			this.$.spacer = spacer;
		},
		/**
		 * @hide
		 * When the body is resized, resize the header and footer th and td elements
		 */
		bodyResized: function() {
			this._sizeHeaderAndFooters();
		},
		bodyScroll: function( el, ev ) {
			this.$.head.scrollLeft(el.scrollLeft())
		},
		/**
		 * @hide
		 * Sizes the table header cells to match the width of 
		 * the column widths.
		 */
		_sizeHeaderAndFooters: function() {

			var body = this.$.body,

				// getting the outer widths is the most expensive thing
				firstWidths = this.$.tbody.find("tr:first:not(.spacing)").children().map(function() {
					return $(this).outerWidth()
				}),

				padding = this.$.table.height() >= body.height() ? Mxui.scrollbarWidth : 0,
				tableWidth = this.$.table.width();

			if ( tableWidth ) {
				if ( this.$.foot ) {
					var cells = this.$.tfootTable.find("th, td")
					if ( cells.length == firstWidths.length ) {
						setWidths(cells, firstWidths);
					}
					this.$.foot.css('visibility', 'visible')
					this.$.tfootTable.width(tableWidth + padding)
				}

				if ( this.$.head ) {
					var cells = this.$.theadTable.find("th, td")
					if ( cells.length == firstWidths.length ) {
						setWidths(cells, firstWidths);
					}
					this.$.head.css('visibility', 'visible')
					this.$.theadTable.width(tableWidth + padding)
				}
			}
		},

		destroy: function() {
			delete this.$;
			this._super();
		}
	})


});
steal.executed('mxui/layout/table_scroll/table_scroll.js');
steal('mxui/layout/table_scroll','./table_scroll.css')
;
steal.executed('steal/build/packages/test/table_scroll.js')
