steal("can/control","./content_list.mustache!","./anchor.mustache!","jquery","can/observe",function(Control, contentList, anchorT, $){

	return can.Control.extend({
		init: function() {
			var sections = [];

			this.collectSignatures().each(function(ix) {
				var h2 = $('h2', this);
				this.id = 'sig_' + h2.text().replace(/\s/g,"").replace(/[^\w]/g,"_");

				//this.id = encodeURIComponent(h2.text());
				sections.push({id: this.id, text: h2.text()});
			});

			this.collectHeadings().each(function(ix) {
				var el = $(this);
				this.id = 'section_' + el.text().replace(/\s/g,"").replace(/[^\w]/g,"_");

        el.prepend(anchorT({ id: this.id }));
				//this.id = encodeURIComponent(el.text());
				sections.push({id: this.id, text: el.text()});
			});

			this.element.html(contentList(
				{sections: sections},
				{encode: function() { return encodeURIComponent(this); }}
			));

			if(window.location.hash.length) {
				var id = window.location.hash.replace('#', ''),
					anchor = document.getElementById(id);

				if(anchor) {
					anchor.scrollIntoView(true);
				}
			}
		},
		collectSignatures: function() {
			var cloned = $('.content .signature').clone();
			// remove release numbers
			cloned.find(".release").remove();
			return cloned;
		},
		collectHeadings: function() {
			return $('.content .comment h2, .content .comment h3');
		}
	});

})
