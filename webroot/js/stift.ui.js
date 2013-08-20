
//app.ui = {
var Carbon = (function (app) {
	app.ui = {}

	app.ui.updatePalette = function(palette) {
		var palette = palette || app.defs.defaultPalette;
		//$('form.fill ul').append('<li><svg><rect width="100%" height="100%" fill="#fff"/><polyline points=""/></svg></li>')
		for (var i = 0; i < palette.length; i++) {
			$('form.fill ul').append('<li><svg><rect width="100%" height="100%" fill="#'+palette[i]+'"/></svg></li>')
		}
	}

	app.ui.clearPanels = function() {
		$('input:focus').blur();
		$('._clear-on-selectchange').remove();
	}

	app.ui.updatePanels = function() {
		app.ui.clearPanels();
		var textpickers = $('.picker.x, .picker.y, .picker.width, .picker.height, .picker.stroke-width, .picker.opacity');
		if (!app.selection.length) {
			// clear panel display
			$('.props').stop().animate({height: '19px'}, 200);
			$('.props .type').text('no selection');
			textpickers.val('').attr('disabled', 'disabled');
		} else if (app.selection.length > 1) {
			// ambiguous
			var box = app.uilayer.box();
			$('.props').stop().animate({height: '48px'}, 200);

			$('.props .type').text('selected '+ app.selection.length +' nodes (~'+ $('.handles-g rect').length +' pts)');
			$('.picker.x').val(Math.round(box.x));
			$('.picker.y').val(Math.round(box.y));
			$('.picker.width').val(Math.round(box.width));
			$('.picker.height').val(Math.round(box.height));

		} else {
			// exactly one node selected
			$('.props').stop().animate({height: '96px'}, 200);
			var selection = $(app.selection[0]),
				nodeName = app.selection[0].nodeName,
				attributes = app.selection[0].attributes,
				box = app.uilayer.box()
			;
			textpickers.val('').removeAttr('disabled');
			// fill in 'pickers'
			$('.props .type').text((nodeName == 'path' ? (selection.attr('d').split('M').length - 1 > 1 ? 'compound path' : 'path') : nodeName) +' (~'+ $('.handles-g rect').length +' pts)');
			$('.picker.fill ._value')
				.css('background-color', (!selection.attr('fill') || selection.attr('fill') == 'none') ? 'transparent' : selection.attr('fill'));
			$('.picker.stroke ._value')
				.css('background-color', (!selection.attr('stroke-width') || !selection.attr('stroke') || selection.attr('stroke') == 'none') ? 'transparent' : selection.attr('stroke'));
			$('.picker.x').val(Math.round(box.x));
			$('.picker.y').val(Math.round(box.y));
			$('.picker.width').val(Math.round(box.width));
			$('.picker.height').val(Math.round(box.height));
			$('.picker.stroke-width')
				.val(selection[0].getAttribute('stroke-width') == null ? 'null' : selection.attr('stroke-width'));
			$('.picker.opacity')
				.val(selection[0].getAttribute('opacity') == null ? 'null' : selection.attr('opacity'));
			// fill in the properties panel
			// id + class if present
			if (app.selection[0].getAttribute('id')) 
				$('form.attributes tbody').append('<tr class="_clear-on-selectchange"><td>ID</td><td>'+app.selection[0].getAttribute('id')+'</td></tr>');
			if (app.selection[0].getAttribute('class')) 
				$('form.attributes tbody').append('<tr class="_clear-on-selectchange"><td>Classlist</td><td>'+app.selection[0].getAttribute('class')+'</td></tr>');
			// bounding box
			$('form.attributes tbody').append('<tr class="_clear-on-selectchange"><td>Coordinates</td><td>'+Math.round(box.x)+app.defs.unicodeMultiplicationSign+Math.round(box.y)+'</td></tr>');
			$('form.attributes tbody').append('<tr class="_clear-on-selectchange"><td>Dimensions</td><td>'+Math.round(box.width)+app.defs.unicodeMultiplicationSign+Math.round(box.height)+'</td></tr>');
			$('form.attributes tbody').append('<tr class="_clear-on-selectchange"><td>Center</td><td>'+Math.round(box.cx)+app.defs.unicodeMultiplicationSign+Math.round(box.cy)+'</td></tr>');
			for (var i = 0; i < attributes.length; i++) {
				var n = attributes[i].name, v = attributes[i].value;
				if ($.inArray(n, ['class', 'id', 'd', 'points', 'x', 'y', 'width', 'height', 'cx', 'cy']) >= 0) continue;
				$('form.attributes tbody').append('<tr class="_clear-on-selectchange"><td>'+(app.defs.svgAttributePhrases[n] || n)+'</td><td>'+v+'</td></tr>');
			}
		}
	}

	// handles & controls
	app.ui.clearHandles = function() {
		$('.ui > g').empty();
		//$('.handles-g').remove()
	}
	app.ui.drawHandles = function(node) {
		// catch IE9 unresolved weirdness involving use elements not having SVGUseElement's interface methods ???
		try { node.getAttribute('transform'); } catch(e) { return; }
		node.removeAttribute('clip-path');
		//var time = [Date.now()];
		//var box = $(node).box(); // getbbox performance in IE
		var tr = node.getAttribute('transform') || '';
		var tr2 = node.getTransformToElement(node.ownerSVGElement);
		tr3 = tr2.a +ws+ tr2.b +ws+ tr2.c +ws+ tr2.d +ws+ tr2.e +ws+ tr2.f;
		//console.log(tr3);
		var g = svg.g().attr({'class': 'handles-g', 'transform': 'matrix('+tr3+')'}).get(0);		
		var frag = document.createDocumentFragment().appendChild(g);
		frag.appendChild($(node).clone().removeAttr('id class style transform opacity').attr({'fill': 'none', 'stroke': '#111', 'stroke-width': 1 / app.panAndZoom.currentZoom})[0])
		//time.push(Date.now());
		//frag.appendChild(svg.rect(box.x, box.y, box.width, box.height).attr('class', 'selection-outline').get(0));
		if (app.tool === 'selectionDirect') {
		switch (node.nodeName) {
			case 'image':
			case 'rect':
				var box = {x: node.x.baseVal.value, y: node.y.baseVal.value, width: node.width.baseVal.value, height: node.height.baseVal.value}
				frag.appendChild(svg.handle().attr({x: box.x - 2, y: box.y - 2}).data({'node': node})[0]);
				frag.appendChild(svg.handle().attr({x: box.x + box.width - 2, y: box.y - 2}).data({'node': node})[0]);
				frag.appendChild(svg.handle().attr({x: box.x + box.width - 2, y: box.y + box.height - 2}).data({'node': node})[0]);
				frag.appendChild(svg.handle().attr({x: box.x - 2, y: box.y + box.height - 2}).data({'node': node})[0]);
			break;
			case 'circle':
			case 'ellipse':
				//var box = $(node).box();
				var box = {cx: node.cx.baseVal.value, cy: node.cy.baseVal.value}
				frag.appendChild(svg.handle().attr({x: box.cx - 2, y: box.cy - 2}).data({'node': node})[0]);
			break;
			case 'polygon':
			case 'polyline':
				var list = node.points;
				for (var i = 0; i < list.numberOfItems; i++) {
					frag.appendChild(
						svg.handle().attr({x: list.getItem(i).x - 2, y: list.getItem(i).y - 2})
							.data({'handle': true, 'node': node, 'segment': i})
						[0]
					);
				}
			break;
			case 'path':
				// keep previous absolute coordinates for next relative operation
				var list = node.pathSegList, p = {x: 0, y: 0}
				;
				// iterate through each segment
				for (var i = 0; i < list.numberOfItems; i++) {
					// normalizedPathSegList would be useful, but not implemented anywhere
					var x, y, s = list.getItem(i),
						z = s.pathSegType,
						handle = svg.handle()
					;
					if (z < 2) {
					} else if (z % 2 == 0) {
						// absolute coordinates
						x = (s.x || p.x) - 2;
						y = (s.y || p.y) - 2;
						p.x = s.x || p.x;
						p.y = s.y || p.y;
					} else {
						// relative coordinates
						x = (s.x + p.x || p.x) - 2;
						y = (s.y + p.y || p.y) - 2;
						p.x = s.x + p.x || p.x;
						p.y = s.y + p.y || p.y;
					}
					frag.appendChild(
						handle.attr({x: x, y: y})
							.data({'handle': true, 'node': node, 'segment': i})
						[0]
					);
				}
			break;
		}}
		//time.push(Date.now());
		//if (time[2] - time[1] > 40) console.log((time[2] - time[1])+'ms '+ node.nodeName);
		app.uilayer.append(frag);
	}
	app.ui.drawControls = function(node) {
		switch (node.nodeName) {
			case 'rect':
			break;
			case 'path':
				var path = node,
					// keep previous absolute coordinates for next relative operation
					p = {x: 0, y: 0}
				;
				for (var i = 0; i < path.pathSegList.numberOfItems; i++) {
					// normalizedPathSegList would be useful, but not implemented anywhere
					var s = path.pathSegList.getItem(i),
						z = s.pathSegType
						handle = svg.rect()
					;
					if (z < 2) {
					} else if (z % 2 == 0) {
						// absolute coordinates
						if (s.x1) {
							//this.ui.front().line(p.x, p.y, s.x1, s.y1).attr({'stroke': '#111', 'stroke-width': 1});
							svg.rect().attr({
								'x': (s.x1) - 3,
								'y': (s.y1) - 3,
								'width': 5, 'height': 5,
								'fill': '#fff',
								'stroke': app.settings.selectionColor,
								'stroke-width': 1,
								'class': 'control'
							}).appendTo('svg#ui').data('node', node);
						}
						if (s.x2) {
							//this.ui.front().line(s.x, s.y, s.x2, s.y2).attr({'stroke': '#111', 'stroke-width': 1});
							svg.rect().attr({
								'x': (s.x2) - 3,
								'y': (s.y2) - 3,
								'width': 5, 'height': 5,
								'fill': '#fff',
								'stroke': app.settings.selectionColor,
								'stroke-width': 1,
								'class': 'control'
							}).appendTo('svg#ui').data('node', node);
						}
						p.x = s.x || p.x;
						p.y = s.y || p.y;
					} else {
						// relative coordinates
						if (s.x1) {
							//this.ui.front().line(p.x, p.y, s.x1, s.y1).attr({'stroke': '#111', 'stroke-width': 1});
							svg.rect().attr({
								'x': (s.x1 + p.x) - 3,
								'y': (s.y1 + p.y) - 3,
								'width': 5, 'height': 5,
								'fill': '#fff',
								'stroke': app.settings.selectionColor,
								'stroke-width': 1,
								'class': 'control'
							}).appendTo('svg#ui').data('node', node);
						}
						if (s.x2) {
							//this.ui.front().line(s.x, s.y, s.x2, s.y2).attr({'stroke': '#111', 'stroke-width': 1});
							svg.rect().attr({
								'x': (s.x2 + p.x) - 3,
								'y': (s.y2 + p.y) - 3,
								'width': 5, 'height': 5,
								'fill': '#fff',
								'stroke': app.settings.selectionColor,
								'stroke-width': 1,
								'class': 'control'
							}).appendTo('svg#ui').data('node', node);
						}
						p.x = s.x + p.x || p.x;
						p.y = s.y + p.y || p.y;
					}
				}
			break;
		}
	}

	// fopen
	app.ui.fopen = function(e) {
		var url = $(e.target).data('url');
		console.log(e);
		console.log($(e.target).data('url'))
		if (!url) return $('#open-file').show();
		$('#open-file').hide()
		app.loadSVG('svg/'+url);
	}

	// misc toggles
	app.ui.viewSvgSource = function() {
		$('.modal.fs').find('h2').text('Raw SVG Source');
		// get the svg tree contents hack cf http://stackoverflow.com/questions/652763
		$('.modal.fs').find('.scrollable').text($('<div>').append($('.paper').clone()).html()).wrapInner('<pre><code class="language-markup">');
		Prism.highlightElement($('.modal.fs').find('code')[0])
		$('.modal.fs').not(':animated').slideToggle();
	}
	app.ui.dismissModal = function() {
		$('.modal.fs').slideUp();
	}
	app.ui.collapseInspector = function() {
		$('.inspector form').not(':animated').slideToggle(200);
	}
	app.ui.toggleGrid = function() {
		$('.cbg').toggle();
	}
	app.ui.toggleArtboard = function() {
		$('.artboard').attr('opacity', $('.artboard').attr('opacity') == 1 ? 0 : 1);
	}
	app.ui.noop = function() { };

	// scrollbar hack
	(function($) {
		var ratio, startX, startY, initialX, initialY;

		app.svgwrapper.bind('scroll', function() {
			var gutter = 18, // beware very hack, positions default scrollbar just outside view
				thumb = {
					x: {
						'width': $('.scrollbar-x').outerWidth() * (($(this).outerWidth() - gutter) / $(this).find('.container').outerWidth()),
						'left': $(this).scrollLeft() * ($('.scrollbar-x').outerWidth() / $(this).find('.container').width())
					},
					y: {
						'height': $('.scrollbar-y').outerHeight() * (($(this).outerHeight() - gutter) / $(this).find('.container').outerHeight()),
						'top': $(this).scrollTop() * ($('.scrollbar-y').outerHeight() / $(this).find('.container').height())
					}
				}
			$('.scrollbar-x div').css({'width': thumb.x.width + 'px', 'left': thumb.x.left + 'px'});
			$('.scrollbar-y div').css({'height': thumb.y.height + 'px', 'top': thumb.y.top + 'px'});
		});
		$('.scrollbar').attr('unselectable', 'on').css('user-select', 'none').on('selectstart', false);
		$('.scrollbar-x').bind('click move movestart moveend', function(e) {
			ratio = $('.container').width() / $(this).outerWidth();
			if (e.type == 'click') {
				if ($(e.target).hasClass('scrollbar-thumb')) return;
				app.svgwrapper.stop().animate({scrollLeft: $(this).find('.scrollbar-thumb').offset().left > e.pageX ? app.svgwrapper.scrollLeft() - win.width() / 2 : app.svgwrapper.scrollLeft() + win.width() / 2}, 100);
				return;
				app.svgwrapper.scrollLeft(
					$(this).find('.scrollbar-thumb').offset().left > e.pageX ? 
						app.svgwrapper.scrollLeft() - win.width() / 2 : 
						app.svgwrapper.scrollLeft() + win.width() / 2
				);
				return;
			}
			if (e.type == 'movestart') {
				startX = e.pageX;
				initialX = $('.svg').scrollLeft();
				$('body').attr('unselectable', 'on').css('user-select', 'none').on('selectstart', false);
			}
			if (e.type == 'moveend') $('body').removeAttr('unselectable').css('user-select', 'text').off('selectstart');
			app.svgwrapper.scrollLeft(initialX + (e.pageX - startX) * ratio)
		});
		$('.scrollbar-y').bind('click move movestart moveend', function(e) {
			ratio = $('.container').height() / $(this).outerHeight();
			if (e.type == 'click') {
				if ($(e.target).hasClass('scrollbar-thumb')) return;
				app.svgwrapper.stop().animate({scrollTop: $(this).find('.scrollbar-thumb').offset().top > e.pageY ? app.svgwrapper.scrollTop() - win.height() / 2 : app.svgwrapper.scrollTop() + win.height() / 2}, 100);
				return;
				app.svgwrapper.scrollTop(
					$(this).find('.scrollbar-thumb').offset().top > e.pageY ? 
						app.svgwrapper.scrollTop() - win.height() / 2 : 
						app.svgwrapper.scrollTop() + win.height() / 2
				);
				return;
			}
			if (e.type == 'movestart') {
				startY = e.pageY;
				initialY = $('.svg').scrollTop();
				$('body').attr('unselectable', 'on').css('user-select', 'none').on('selectstart', false);
			}
			if (e.type == 'moveend') $('body').removeAttr('unselectable').css('user-select', 'text').off('selectstart');
			app.svgwrapper.scrollTop(initialY + (e.pageY - startY) * ratio)
			//$('.svg').scrollTop((e.pageY - $(this).offset().top) * ($('.container').height() / $('.scrollbar-y').outerHeight()))
		});
	})(jQuery);


	return app;
}(Carbon || {}));

