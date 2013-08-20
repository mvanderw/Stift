
var Carbon = (function (app) {

	app.normalizePath = function(node) {

		if (!node) node = $('#star')[0];

		console.log(node.pathSegList);
		for (var i = 0; i < node.pathSegList.numberOfItems; i++) {
			// normalizedPathSegList would be useful, but not implemented anywhere
			var x, y, s = node.pathSegList.getItem(i),
				z = s.pathSegType,
				handle = svg.handle()
			;
			console.log({type: s.pathSegTypeAsLetter, coords: s});
		}

		app.worker.postMessage({
			path: JSON.stringify(node.pathSegList),//node.getAttribute('d'),
			matrix: null
		});
	}

	app.test = function() {
		function flatten(array) {
			return array.reduce(function(a, b) {
				return a.concat('function' === typeof b.flatten ? b.flatten() : b);
			}, []);
		}

		return Raphael.path2curve($('#star').attr('d'))
		return flatten(['M1','d22,33','g33,22'])
	}

	app.prop = function() {

		//$('body').append('<div class="log" style="position: fixed; bottom: 18px; left: 0; height: 40px; width: 140px; background: #fff;"></div>');

		// initialize webworker
		if (typeof Worker == 'object') {
			app.worker = new Worker('/js/stift.thread.js');
			app.worker.addEventListener('message', function(e) {
				console.log('Worker said: ', e.data);
			}, false);
		}

		$('form.fill legend, form.attributes legend').trigger('click');

		// load svg
		var url = 'svg/testcases.svg';
		app.loadSVG(url);

		app.initialized = true;
	}

	app.loadSVG = function(url) {
		if (!url) throw 'Missing argument (url) for loadSVG()';
		var ajaxFail = function (jqxhr, status, error) { console.warn('loadSVG(\''+url+'\'): '+ jqxhr.status +' '+ error) },
			ajaxDone = function (data, status, jqxhr) {
				//
				$('.paper').remove();
				app.helper.clearSelection();
				// hack to inject inline svg; append to page first
				// todo: investigate serving page as xhtml+xml instead since we're only supporting ie9+ anyway
				// http://stackoverflow.com/q/3642035
				$('body').append($('<div class="inject"></div>').append($(data)));
				app.container[0].insertBefore($('div.inject > svg')[0], $('.ui')[0]);
				$('div.inject').remove();
				// resize artboard
				app.helper.setArtboard();
				// center artboard
				app.svgwrapper
					.scrollTop((app.container.height() - $('.svg').height() + 36 /* FIXME magic number = scrolltrack × 2 */) / 2)
					.scrollLeft((app.container.width() - $('.svg').width() +  36) / 2)
				;
				app.panAndZoom.initialScrollPos = {'x': app.svgwrapper.scrollLeft(), 'y': app.svgwrapper.scrollTop()}
				app.ui.updatePalette();
				app.helper.setZoom();

				$('.panel.tools').css({'left': -$('.panel.tools').outerWidth()});
				$('.panel.inspector').css({'right': -$('.panel.inspector').outerWidth()});

				//
				var timeout = 1000;
				setTimeout(function() { $('.loading-svg').fadeOut(200) }, timeout + 0);
				setTimeout(function() { $('.panel.tools').animate({'left': 0}, 400) }, timeout + 100);
				setTimeout(function() { $('.panel.inspector').animate({'right': '10px'}, 250) }, timeout + 200);
			},
			ajaxAlways = function() { }
			ajax = function(url) { $.ajax({url: url, cache: false, dataType: 'html'}).fail(ajaxFail).done(ajaxDone).always(ajaxAlways) }
		;
		
		setTimeout(function() { $('.loading-svg').fadeIn(200) }, 200);
		$('.panel.tools').animate({'left': -$('.panel.tools').outerWidth()}, 300);
		$('.panel.inspector').animate({'right': -$('.panel.inspector').outerWidth()}, 200);
		setTimeout(function() { ajax(url); }, 400);
	}

	// handle urlhash
	app.go = function(destination) {
		//hash = location.hash.substr(1) ? location.hash.substr(1) : 'home';
		destination = destination || app;
		//$('nav a.' + hash).trigger('click');
		$('section.' + destination).show().siblings('section').hide();
		//document.title = 'Carbon: '+ $('nav li a.' + hash).text();
	}
	//$(window).bind('hashchange ready', app.go(location.hash.substr(1) ? location.hash.substr(1) : 'app')); // on page load
	$('nav a').bind('click', function(e) {
		//app.go($(this).data('go'));
	});

	app.setTool = function(tool) {
		$('.tools button').removeClass('active');
		$('.tools .'+ tool).addClass('active');
		app.container.attr('class', 'container '+tool);
		app.tool = tool.toCamel();
		return tool.toCamel();
	}

	app.tools = {
		selection: function(e, outlineFill, outlineStroke) {
			var target = e.target, type = e.type, nodeName = target.nodeName
				//outlineFill = outlineFill || 'rgba(215, 225, 255, 0.55)', outlineStroke = outlineStroke || 'rgba(35, 45, 95, 0.65)'
			;
			if (type == 'click' && !app.dragging) {
				app.helper.clickSelect(e);
			}
			// selection outline
			else if ((type == 'move' || type == 'movestart' || type == 'moveend') && nodeName == 'svg') {
				if (type == 'movestart') {
					app.panAndZoom.delta = {x: 0, y: 0}
					if (!e.shiftKey && nodeName == 'svg') { app.helper.clearSelection(); }
					app.dragging = true;
					return app.selectionOutline = svg.rect().attr({
						x: app.panAndZoom.delta.x < 0 ? app.panAndZoom.initialUserspacePos.x - -app.panAndZoom.delta.x : app.panAndZoom.initialUserspacePos.x,
						y: app.panAndZoom.delta.y < 0 ? app.panAndZoom.initialUserspacePos.y - -app.panAndZoom.delta.y : app.panAndZoom.initialUserspacePos.y,
						width: Math.abs(app.panAndZoom.delta.x),
						height: Math.abs(app.panAndZoom.delta.y),
						fill: app.settings.outlineFill, stroke: app.settings.outlineStroke, 'stroke-width': 1 / app.panAndZoom.currentZoom,
						'pointer-events': 'none', 'shape-rendering': 'crispEdges'
					}).appendTo(app.uilayer);
				}
				if (type == 'move') {
					return app.selectionOutline.attr({
						'x': app.panAndZoom.delta.x < 0 ? app.panAndZoom.initialUserspacePos.x - -app.panAndZoom.delta.x : app.panAndZoom.initialUserspacePos.x,
						'y': app.panAndZoom.delta.y < 0 ? app.panAndZoom.initialUserspacePos.y - -app.panAndZoom.delta.y : app.panAndZoom.initialUserspacePos.y,
						width: Math.abs(app.panAndZoom.delta.x),
						height: Math.abs(app.panAndZoom.delta.y)
					});
				}
				if (type == 'moveend') {
					var selectionRect = app.paper.svgrect(
						parseInt(app.selectionOutline.attr('x')) + parseInt(app.artboard.attr('x')),
						parseInt(app.selectionOutline.attr('y')) + parseInt(app.artboard.attr('y')),
						app.selectionOutline.attr('width'),
						app.selectionOutline.attr('height')
					);
					app.selectionOutline.remove();
					// FF still doesn't implement getIntersectionList
					//var t = $.fn.getIntersectionList(selectionRect[0], app.paper[0]);
					var t = app.paper[0].getIntersectionList(selectionRect[0], app.paper[0]);
					//$.each(t, function() { app.selection.push(this); });
					app.helper.setSelection(t);
					setTimeout(function() { app.dragging = false; }, 100);
				}
			}
			// free movement
			else {
			//if (type == 'move') {
				app.helper.move(e)
				//$(target).attr({'x': app.mouse(e).x})
			}
		},
		selectionDirect: function(e) {
			var target = e.target, type = e.type, nodeName = target.nodeName,
				data = $.isEmptyObject($(target).data()) ? null : $(target).data()
			;
			if (!(data && data.handle)) return this.selection.call(this, e, 'rgba(255, 255, 255, 0.55)', 'rgba(88, 88, 88, 0.65)');
			if (type == 'click') {}
			if (type == 'movestart') {
				switch (data.node.nodeName) {
					case 'path': app.preOp = {x: data.node.pathSegList.getItem(data.segment).x, y: data.node.pathSegList.getItem(data.segment).y}; break;
					case 'polygon': case 'polyline': app.preOp = {x: data.node.points.getItem(data.segment).x, y: data.node.points.getItem(data.segment).y}; break;
				}
			}
			if (type == 'move') {
				switch (data.node.nodeName) {
					case 'path':
					data.node.pathSegList.replaceItem(
						data.node.createSVGPathSegLinetoAbs(app.preOp.x + app.panAndZoom.delta.x, app.preOp.y + app.panAndZoom.delta.y), data.segment
					);
					break;
					case 'polygon': case 'polyline':
					data.node.points.replaceItem(
						data.node.createSVGPoint(app.preOp.x + app.panAndZoom.delta.x, app.preOp.y + app.panAndZoom.delta.y), data.segment
					);
					break;
				}
			}
			if (type == 'moveend') {
				app.helper.setSelection();
			}
		},
		pan: function(e) {
			if (e.type == 'movestart') {
				return app.panAndZoom.initialScrollPos = {'x': app.svgwrapper.scrollLeft(), 'y': app.svgwrapper.scrollTop()}
			}
			var initial = app.panAndZoom.initialScrollPos, zoom = app.panAndZoom.currentZoom;
			app.svgwrapper
				.scrollTop(initial.y - (app.panAndZoom.delta.y * zoom))
				.scrollLeft(initial.x - (app.panAndZoom.delta.x * zoom))
			// no classList in IE9
			//if (e.type == 'movestart') app.container[0].classList.add('grabbing');
			//if (e.type == 'moveend') app.container[0].classList.remove('grabbing');
		},
		pen: function(e) {
			if (!app.drawing) app.drawing = svg.path(app.mouse(e).x, app.mouse(e).y).attr({fill: 'none', stroke: '#555'}).appendTo(app.paper);
			console.log(e.type);
			var d = app.drawing.attr('d');
			if (e.type === 'click') {
				if (app.dragging) return;
				console.log(d);
				app.drawing.attr('d', d + ' L'+app.mouse(e).x+' '+app.mouse(e).y)
			} else if (e.type === 'movestart') {
				app.dragging = true;
				app.drawing.data('d', d);
				app.drawing.attr('d', d + ' C0 0 0 0 '+app.mouse(e).x+' '+app.mouse(e).y)
			} else if (e.type === 'move') {
				app.drawing.attr('d', app.drawing.data('d') + ' C'+ app.mouse(e).x +' '+ app.mouse(e).y +' 0 0 '+ app.panAndZoom.initialMousePos.x +' '+ app.panAndZoom.initialMousePos.y)
			} else if (e.type === 'moveend') {
				setTimeout(function() { app.dragging = false; }, 100);
			}
			;
		},
		rectangle: function(e) {
			if (e.type == 'click') return false;
			if (e.type == 'movestart') return app.drawing = svg.rect().attr({x: app.mouse(e).x, y: app.mouse(e).y, width: 1, height: 1, fill: '#fa0'}).appendTo(app.paper);
			if (e.type == 'moveend') return app.drawing = null;
			app.drawing.attr({
				'x': app.panAndZoom.delta.x < 0 ? app.panAndZoom.initialUserspacePos.x - -app.panAndZoom.delta.x : app.panAndZoom.initialUserspacePos.x,
				'y': app.panAndZoom.delta.y < 0 ? app.panAndZoom.initialUserspacePos.y - -app.panAndZoom.delta.y : app.panAndZoom.initialUserspacePos.y,
				width: Math.abs(app.panAndZoom.delta.x),
				height: Math.abs(app.panAndZoom.delta.y)
			});
		}
	}

	app.helper = {
		setArtboard: function() {
			app.paper = $('.paper');
			var cw = app.container.box().width, ch = app.container.box().height,
				pw = parseInt(app.paper.attr('width')) || app.paper.box().width, ph = parseInt(app.paper.attr('height')) || app.paper.box().height
			;
			app.paper.add(app.artboard).add($(app.uilayer).parent()).attr({
				viewBox: '0 0 '+ pw +' '+ ph,
				x: 0.5 + Math.round((cw - pw) / 2),
				y: 0.5 + Math.round((ch - ph) / 2),
				width: pw,
				height: ph
			});
			//app.artboard.attr({x: app.artboard.attr('x') - 1, width: pw + 1, y: app.artboard.attr('y') - 1, height: ph + 1})
		},
		move: function(e) {
			// simple move by translation
			$.each(app.selection, function() {
				if (e.type == 'movestart') {
					$(this).data('t', $(this).parseTransformAttr().translate);
					app.uilayer.attr('opacity', 0);
				} else if (e.type == 'move') {
					var tx = app.panAndZoom.delta.x, ty = app.panAndZoom.delta.y, tr = $(this).data('t');
					$(this).translate(tr.x + tx, tr.y + ty);
				}
			});
			if (e.type == 'moveend') {
				app.helper.setSelection();
				app.uilayer.attr('opacity', 1);
			}
		},
		// zoom
		zoomIn: function() {
			var levels = app.panAndZoom.zoomLevels, z = app.panAndZoom.currentZoom, i = levels.indexOf(z);
			if (i < 0 || i >= (levels.length - 1)) return;
			this.setZoom(i + 1);
		},
		zoomOut: function() {
			var levels = app.panAndZoom.zoomLevels, z = app.panAndZoom.currentZoom, i = levels.indexOf(z);
			if (i < 1) return;
			this.setZoom(i - 1);
		},
		setZoom: function(zoomLevelIndex) {
			var c = app.defs.containerSize, z = app.panAndZoom.zoomLevels[zoomLevelIndex || app.panAndZoom.zoomLevels.indexOf(app.panAndZoom.currentZoom)];
			app.container.attr({width: parseInt(c.width * z) +'px', height: parseInt(c.height * z) +'px'});
			app.panAndZoom.currentZoom = z;
			$('.status .zoom-level').text(parseInt(z * 100) +'%');
			$(window).trigger('resize');
		},
		// node selections
		clickSelect: function(e) {
			var target = e.target, nodeName = target.nodeName;
			if (e.handleObj.namespace != 'onCanvas') return;
			if (nodeName == 'svg' || nodeName == 'g') return app.helper.clearSelection();
			if (!e.shiftKey) return app.helper.setSelection(target);
			if (e.shiftKey) return app.helper.toggleSelection(target);
		},
		clearSelection: function() { app.selection = []; app.helper.setSelection() },
		toggleSelection: function(node) {
			if ($.inArray(node, app.selection) >= 0) {
				app.selection.splice($.inArray(node, app.selection), 1)
			} else {
				app.selection.push(node)
			}
			app.helper.setSelection()
		},
		setSelection: function(node) {
			var wallclock = [Date.now()];
			if (node) {
				if (node instanceof NodeList) node = Array.prototype.slice.call(node);
				app.selection = node instanceof Array ? node : [node];
			}
			wallclock.push(Date.now());
			app.ui.clearHandles();
			wallclock.push(Date.now());
			for (var i = 0; i < app.selection.length; i++) {
				app.ui.drawHandles(app.selection[i]);
			}
			wallclock.push(Date.now());
			app.ui.updatePanels();
			wallclock.push(Date.now());
			if (wallclock[4] - wallclock[0] > 25) console.log('latency: '+ (wallclock[4] - wallclock[0]) +'ms (node: '+ (wallclock[1]-wallclock[0]) +'ms, clearHandles: '+ (wallclock[2]-wallclock[1]) +'ms, drawHandles: '+ (wallclock[3]-wallclock[2]) +'ms, updatePanels: '+ (wallclock[4]-wallclock[3]) +'ms)');
			if (app.selection.length === 1) console.log($(app.selection[0]).getPath())
		}
	}

	// init
	$(document).ready(function() {
		app.prop();
	});

	return app;
}(Carbon || {}));
//});



/*
var nodeTree;

function getNodes(node) {
	if (!node) node = $('.paper');
	var p = $(node).children(), t = [];
	p.each(function() {
		if (this.nodeName == 'g') getNodes(this);
		t.push(this.nodeName)
	});
	console.log(t)
	return;
}

function check(callback) {
	if (gAuto.hasOwnProperty('gm_accessors_')) {
		callback();
	} else {
		//console.log('waiting for init');
		init(callback);
	}
}
*/
