
var doc = $(document), win = $(window), ws = ' ';

/* utility */
if(!String.prototype.toCamel) {
	String.prototype.toCamel = function(str) {
		var str = str || this;
		return str.replace(/(\-[a-z])/gi, function(str) { return str.toUpperCase().replace('-','') });
	};
}
if(!String.prototype.startsWith) {
	String.prototype.startsWith = function (str){
		return this.slice(0, str.length) == str;
	};
}
if(!String.prototype.trimmer) {
	String.prototype.trimmer = function () {
		return this.replace(/^[,\s]+|[,\s]+$/g,'');
	};
}

/* jqxhr progress */
(function addXhrProgressEvent($) {
	var originalXhr = $.ajaxSettings.xhr;
	$.ajaxSetup({
		progress: function() {  },
		xhr: function() {
			var req = originalXhr(), that = this;
			if (req) {
				if (typeof req.addEventListener == "function") {
					req.addEventListener("progress", function(evt) {
						that.progress(evt);
					},false);
				}
			}
			return req;
		}
	});
})(jQuery);

/* mod to jquery's attr, see also appendix B: http://www.w3.org/TR/SVG/svgdom.html */
(function($) {
	var jqattr = $.fn.attr; // reference to original func
	$.fn.attr = function() {
		var args = arguments, ret;
		this.each(function() {
			if (this.namespaceURI != svg.ns) {
				ret = jqattr.apply($(this), args);
			} else if (typeof args[0] == 'object') {
				for (var arg in args[0]) {
					this.setAttribute(arg, args[0][arg]);
				}
			} else if (args.length == 2) {
				this.setAttribute(args[0], args[1]);
			} else if (args.length == 1) {
				var val = this.getAttribute(args[0]);
				if (!ret) ret = val;
				else if (typeof ret == 'string') ret = [ret];
				if (val && ret.indexOf(val) < 0) ret.push(val)
			}
		});
		return ret || this;
	};
})(jQuery);

/* appdefs */
var Carbon = (function (app) {

	app.initialized = false;

	app.container = $('.container');
	app.svgwrapper = app.container.parent('div');
	app.paper = $('.paper');
	app.artboard = $('.artboard');
	app.uilayer = $('svg.ui g');
	app.buttons = $('button');

	// $.extend({})
	app.settings = {
		selectionColor: '#a30',
		outlineFill: 'rgba(215, 225, 255, 0.55)',
		outlineStroke: 'rgba(35, 45, 95, 0.65)'
	}

	// current tool
	app.tool = 'selection';
	// the current user selection
	app.selection = [];
	// ... and the current/last selection outline
	app.selectionOutline = null;

	// color/stroke value
	app.fill = '#000';
	app.stroke = 'none';
	app.strokeWidth = '0';

	// the shape/path/outline currently being drawn
	app.drawing = null;
	app.dragging = null;
	app.preOp = null;
	app.postOp = null;

	// mouse convenience
	app.panAndZoom = {
		initialScrollPos: {x: 0, y: 0},
		currentScrollPos: {x: 0, y: 0},
		currentMousePos: {x: 0, y: 0},
		initialMousePos: {x: 0, y: 0},
		initialUserspacePos: {x: 0, y: 0},
		delta: {x: 0, y: 0},
		zoomLevels: [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4],
		currentZoom: 1
	}
	app.svgwrapper.bind('scroll', function(e) {
		app.panAndZoom.currentScrollPos = {'x': app.svgwrapper.scrollLeft(), 'y': app.svgwrapper.scrollTop()}
	});
	app.svgwrapper.bind('move movestart moveend', function(e) {
		if (e.type == 'movestart') {
			app.panAndZoom.delta = {'x': 0, 'y': 0}
			app.panAndZoom.initialMousePos = {'x': e.pageX, 'y': e.pageY}
			app.panAndZoom.initialUserspacePos = {'x': app.mouse(e).x / app.panAndZoom.currentZoom, 'y': app.mouse(e).y / app.panAndZoom.currentZoom}
			app.panAndZoom.initialScrollPos = {'x': app.svgwrapper.scrollLeft(), 'y': app.svgwrapper.scrollTop()}
		}
		if (e.type == 'move') {
			app.panAndZoom.delta = {
				'x': (e.pageX - app.panAndZoom.initialMousePos.x) / app.panAndZoom.currentZoom,
				'y': (e.pageY - app.panAndZoom.initialMousePos.y)  / app.panAndZoom.currentZoom
			}
		}
		//if (e.type == 'moveend') setTimeout(function() { app.panAndZoom.delta = {'x': 0, 'y': 0} }, 500);
	});
	app.mouse = function(e) {
		return app.panAndZoom.currentMousePos = {'x': (e.pageX - app.artboard.offset().left) / app.panAndZoom.currentZoom, 'y': (e.pageY - app.artboard.offset().top) / app.panAndZoom.currentZoom}
	}

	app.defs = {}
	app.defs.containerSize = {width: 4000, height: 4000}
	// color palettes
	app.defs.palettes = {}
	app.defs.palettes.x11 = ['ffb6c1', 'ffc0cb', 'dc143c', 'fff0f5', 'db7093', 'ff69b4', 'ff1493', 'c71585', 'da70d6', 'd8bfd8', 'dda0dd', 'ee82ee', 'ff00ff', '8b008b', '800080', 'ba55d3', '9400d3', '9932cc', '4b0082', '8a2be2', '9370db', '7b68ee', '6a5acd', '483d8b', 'e6e6fa', 'f8f8ff', '0000ff', '0000cd', '191970', '00008b', '000080', '4169e1', '6495ed', 'b0c4de', '778899', '708090', '1e90ff', 'f0f8ff', '4682b4', '87cefa', '87ceeb', '00bfff', 'add8e6', 'b0e0e6', '5f9ea0', 'f0ffff', 'e0ffff', 'afeeee', '00ffff', '00ced1', '2f4f4f', '008b8b', '008080', '48d1cc', '20b2aa', '40e0d0', '7fffd4', '66cdaa', '00fa9a', 'f5fffa', '00ff7f', '3cb371', '2e8b57', 'f0fff0', '90ee90', '98fb98', '8fbc8f', '32cd32', '00ff00', '228b22', '008000', '006400', '7fff00', '7cfc00', 'adff2f', '556b2f', '9acd32', '6b8e23', 'f5f5dc', 'fafad2', 'fffff0', 'ffffe0', 'ffff00', '808000', 'bdb76b', 'fffacd', 'eee8aa', 'f0e68c', 'ffd700', 'fff8dc', 'daa520', 'b8860b', 'fffaf0', 'fdf5e6', 'f5deb3', 'ffe4b5', 'ffa500', 'ffefd5', 'ffebcd', 'ffdead', 'faebd7', 'd2b48c', 'deb887', 'ffe4c4', 'ff8c00', 'faf0e6', 'cd853f', 'ffdab9', 'f4a460', 'd2691e', '8b4513', 'fff5ee', 'a0522d', 'ffa07a', 'ff7f50', 'ff4500', 'e9967a', 'ff6347', 'ffe4e1', 'fa8072', 'fffafa', 'f08080', 'bc8f8f', 'cd5c5c', 'ff0000', 'a52a2a', 'b22222', '8b0000', '800000', 'ffffff', 'f5f5f5', 'dcdcdc', 'd3d3d3', 'c0c0c0', 'a9a9a9', '808080', '696969', '000000']
	app.defs.defaultPalette = app.defs.palettes['x11']

	// Plain English
	app.defs.svgAttributePhrases = {
		'r': 'Radius',
		'transform': 'Transformation',
		'alignment-baseline': 'Alignment',
		'baseline-shift': 'Baseline shift',
		'clip-path': 'Clip path',
		'clip-rule': 'Clip rule',
		'clip': 'Clip',
		'color-interpolation-filters': 'Color interpolation filter',
		'color-interpolation': 'Color interpolation',
		'color-profile': 'Color profile',
		'color-rendering': 'Color rendering',
		'color': 'Color',
		'cursor': 'Cursor',
		'direction': 'Direction',
		'display': 'Display',
		'dominant-baseline': 'Dominant baseline',
		'enable-background': 'Enable background',
		'fill-opacity': 'Fill opacity',
		'fill-rule': 'Fill rule',
		'fill': 'Fill color',
		'filter': 'Filter',
		'flood-color': 'Flood color',
		'flood-opacity': 'Flood opacity',
		'font-family': 'Font',
		'font-size-adjust': 'Font size adjust',
		'font-size': 'Font size',
		'font-stretch': 'Font stretch',
		'font-style': 'Font style',
		'font-variant': 'Font variant',
		'font-weight': 'Font weight',
		'glyph-orientation-horizontal': 'Glyph orientation (h)' ,
		'glyph-orientation-vertical': 'Glyph orientation (v)',
		'image-rendering': 'Image rendering',
		'kerning': 'Kerning',
		'letter-spacing': 'Letter spacing',
		'lighting-color': 'Lighting color',
		'marker-end': 'Marker end',
		'marker-mid': 'Marker mid',
		'marker-start': 'Marker start',
		'mask': 'Mask',
		'opacity': 'Opacity',
		'overflow': 'Overflow',
		'pointer-events': 'Pointer events',
		'shape-rendering': 'Shape rendering',
		'stop-color': 'Stop color',
		'stop-opacity': 'Stop opacity',
		'stroke-dasharray': 'Dash array',
		'stroke-dashoffset': 'Dash offset',
		'stroke-linecap': 'Linecap',
		'stroke-linejoin': 'Linejoin',
		'stroke-miterlimit': 'Miter limit',
		'stroke-opacity': 'Stroke opacity',
		'stroke-width': 'Stroke width',
		'stroke': 'Stroke color',
		'text-anchor': 'Text anchor',
		'text-decoration': 'Text decoration',
		'text-rendering': 'Text rendering',
		'unicode-bidi': 'Unicode bidi',
		'visibility': 'Visibility',
		'word-spacing': 'Word spacing',
		'writing-mode': 'Writing mode'
	}
	app.defs.unicodeMultiplicationSign = '<span class="_215">&#215;</span>';

	return app;
}(Carbon || {}));
