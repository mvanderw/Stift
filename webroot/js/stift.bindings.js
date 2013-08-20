
var Carbon = (function (app) {
	app.bindings = (function() {

		app.buttonBindings = function() { }
		app.togglePanel = function(panel) { }
		$(window).bind('resize', function() { app.svgwrapper.trigger('scroll') });

		doc.bind('click', function(e) {
			var target = $(e.target).closest('a').length ? $(e.target).closest('a')[0] : e.target,
				action = $(e.target).data('action') || null,
				tool = $(e.target).data('tool') || null,
				nodeName = target.nodeName ? target.nodeName.toLowerCase() : null,
				data = $.isEmptyObject($(target).data()) ? {} : $(target).data()
			;
			$('.select').removeClass('active').find('ul').hide();
			if (action) {
				e.preventDefault();
				return (tool) ? app.setTool(tool) : app.ui[action.toCamel()](e);
			}
			switch (nodeName) {
				case 'svg': $('input:focus').blur(); break;
				case 'a': 
					if ($(target).find('ul').length) {
						$(target).addClass('active').find('ul').toggle();
					}
				break;
				case 'button':
					if ($(target).hasClass('zoom-in')) app.helper.zoomIn();
					if ($(target).hasClass('zoom-out')) app.helper.zoomOut();
				break;
				case 'legend': $(target).toggleClass('collapsed').next('div').stop().slideToggle(200); break;
			}
			return;
		});

		doc.bind('contextmenu', function(e) {
			//console.log(e);
			//e.preventDefault();
		});
		doc.bind('keydown', function(e) {
			// bind to keydown so the target doesn't move
			var target = e.target;
			if ((e.which == 13 || e.which == 9) && target.nodeName.toLowerCase() == 'input') {
				if (e.which == 13) $(target).blur();
				$(app.selection).each(function() { this.setAttributeNS(null, $(target).data('attr'), $(target).val()) })
			}
		});

		// panel scrolling
		(function() {
			var initial = $('.panel-scrollbar').parent('div').scrollTop();
			$('.panel-scrollbar').parent('div').bind('scroll', function() {
				var track = $(this).find('.panel-scrollbar'), thumb = $(this).find('.panel-scrollbar div'), ratio = $(this).height() / $(this).children('div').eq(1).height();
				thumb.css({height: track.height() * ratio, top: $(this).scrollTop() * ratio});
			});
			$('.panel-scrollbar').bind(' move movestart moveend', function(e) {
				if (e.target.className == 'panel-scrollbar') return;
				var scrollable = $(this).parent('div'), track = $(this), thumb = $(this).find('div'), ratio = $(this).height() / $(this).next('div').height();
				if (e.type == 'movestart') { app.panAndZoom.delta = {x: 0, y: 0}; initial = scrollable.scrollTop(); }
				scrollable.scrollTop(initial + app.panAndZoom.delta.y * 4)
				//thumb.css({height: track.height() * ratio, top: (scrollable.scrollTop() * ratio) + app.panAndZoom.delta.y});
			});
		})();

		// mousewheel
		app.container.bind('mousewheel', function(e, delta) {
			//app.tools.pan(e, delta);
		});

		// inspector
		app.container.bind('mousemove', function(e) {
			/*
			var target = $(e.target), nodeName = e.target.nodeName;
			$('.status .x').text(Math.round(app.mouse(e).x));
			$('.status .y').text(Math.round(app.mouse(e).y));
			$('.el').html(function() {
				var stack = [nodeName];
				$(target).parentsUntil('div').each(function() {
					stack.push(this.nodeName);
				});
				return '<span>' + stack.reverse().join('</span><span>') + '</span>';
			});
			*/
		});
		/*
		app.paper.bind('mousemove', function(e) {
			var target = $(e.target), nodeName = e.target.nodeName;
			if (nodeName == 'svg') return;
			return;
			//$('.props .type').text(nodeName);
			$('.props .type').text(nodeName == 'path' ? ($(target).attr('d').split('M').length - 1 > 1 ? 'compound path' : 'path') : nodeName);
			$('.picker.fill ._value')
				.css('background-color', (!target.attr('fill') || target.attr('fill') == 'none') ? 'transparent' : target.attr('fill'));
			$('.picker.stroke ._value')
				.css('background-color', (!target.attr('stroke-width') || !target.attr('stroke') || target.attr('stroke') == 'none') ? 'transparent' : target.attr('stroke'));
			$('.picker.x')
				.val(Math.round(target.box().x));
			$('.picker.y')
				.val(Math.round(target.box().y));
			$('.picker.width')
				.val(Math.round(target.box().width));
			$('.picker.height')
				.val(Math.round(target.box().height));
		});
		*/
		// tool
		app.container.bind('click.onCanvas move.onCanvas movestart.onCanvas moveend.onCanvas', function(e) {
			// fucknuts
			var pass = $.extend({}, e, {target: e.target.correspondingUseElement ? e.target.correspondingUseElement : e.target});
			app.tools[app.tool](pass);
		});
		// ui
		app.uilayer.bind('click.onUI', function(e) {
			e.stopPropagation();
			app.tools[app.tool](e);
		});

	})();

	return app;
}(Carbon || {}));
