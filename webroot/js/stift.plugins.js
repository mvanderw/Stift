
window.svg = $.svg = {
	'ns': 'http://www.w3.org/2000/svg',
	create: function(element) {
		return $(document.createElementNS(this.ns, element))
	},
	// handles & control points
	handle: function(x, y) {
		x = x || 0; y = y || 0;
		return this.rect(x-2, y-2, 5, 5);//.attr({'class': '', 'stroke': '#333', 'fill': '#666'});
		//return this.create('rect').attr({x: x-2, y: y-2, width: 5, height: 5, 'class': 'handle'})
	},
	// basic shapes
	rect: function(x, y, w, h) { return this.create('rect').attr({x: x || 0, y: y || 0, width: w || 0, height: h || 0}) },
	path: function(x, y) { return this.create('path').attr('d', 'M'+x+' '+y) },
	g: function() { return this.create('g') }
}

pathCommand = /([achlmrqstvz])[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*)+)/ig
;
pathValues = /(-?\d*\.?\d*(?:e[\-+]?\d+)?)[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*/ig
;
p2s = /,?([achlmqrstvxz]),?/gi
;

$.fn.getPath = function () {
	if (this.length != 1) throw 'Requires one element.';

	var path, node = this;
	while (node.length) {
		var realNode = node[0], name = realNode.localName;
		if (!name) break;

		if (realNode.className.baseVal === 'paper') break;

		//name = name.toLowerCase();

		var parent = node.parent();

		var siblings = parent.children(name);
		if (siblings.length > 1) { 
			name += ':eq(' + siblings.index(realNode) + ')';
		}

		path = name + (path ? '>' + path : '');
		node = parent;
	}

	return path;
};

window.parsePathString = function (pathString) {
	// R:1466
	/*
	if (!pathString) {
		return null;
	}
	var pth = paths(pathString);
	if (pth.arr) {
		return pathClone(pth.arr);
	}
	*/
	
	var paramCounts = {a: 7, c: 6, h: 1, l: 2, m: 2, r: 4, q: 4, s: 4, t: 2, v: 1, z: 0},
		data = [];
	/*
	if (R.is(pathString, array) && R.is(pathString[0], array)) { // rough assumption
		data = pathClone(pathString);
	}
	*/
	if (!data.length) {
		String(pathString).replace(pathCommand, function (a, b, c) {
			var params = [],
				name = b.toLowerCase();
			c.replace(pathValues, function (a, b) {
				b && params.push(+b);
			});
			if (name == "m" && params.length > 2) {
				data.push([b]['concat'](params.splice(0, 2)));
				name = "l";
				b = b == "m" ? "l" : "L";
			}
			if (name == "r") {
				data.push([b]['concat'](params));
			} else while (params.length >= paramCounts[name]) {
				data.push([b]['concat'](params.splice(0, paramCounts[name])));
				if (!paramCounts[name]) {
					break;
				}
			}
		});
	}
	//data.toString = R._path2string;
	//pth.arr = pathClone(data);
	return data;
};


$.fn.bake = function(path) {
	var path = path || this[0], root = path.ownerSVGElement;

	$(path).path2absolute();


		function point(x, y) { var p = svg.createSVGPoint(); p.x=x; p.y=y; return p; }

		// add a copy of the path at the same level of the hierarchy to see transforms
		//path = path.parentElement.appendChild(path.cloneNode(false));
		// turn all arc commands into splines so we can transform them even with skews
		//path.setAttribute('d', path2curve(path));

		// var matrix = pathDOM.getTransformToElement(svgDOM);
		var svg		= path.ownerSVGElement
			, normal = (root||svg).getCTM().inverse() // compensation for root
			, matrix = normal.multiply(path.getCTM()) // transform, relative to svg root
	//,matrix = path.getTransformToElement(root||svg)
			, _			= ''
			, coords = [_, 1, 2] // main and optional handle 1 and 2 coordinates
			, segs	 = path.pathSegList
			, len		= segs.numberOfItems
			, x			= { 0: 0, '': 0, 1: 0, 2: 0 }
			, y			= { 0: 0, '': 0, 1: 0, 2: 0 }
			, i			= -1
			, seg, cmd
			;

		// simplify the logic by normalizing to absolute coordinates first
		//absolutizePath(path);

		// walk the path, applying all transforms between us and the root as we go
		while (++i < len) {
			seg = segs.getItem(i);
			cmd = seg.pathSegTypeAsLetter;

			// Apply the transform to all coordinates and handles
			coords.forEach(function(sfx) {
				var xn = 'x'+sfx, yn = 'y'+sfx
					, xc = seg[xn], yc = seg[yn]
					, coord;
				if ((xc != null) || (yc != null)) {
					if (xc == null) xc = x[_];
					if (yc == null) yc = y[_];
					coord = point(xc, yc).matrixTransform(matrix);
					x[sfx] = seg[xn] = coord.x;
					y[sfx] = seg[yn] = coord.y;
				}
			});

			// record (and recall) start-of-subpath
			switch (cmd) {
				case 'm': case 'M': x[0] = x[_]; y[0] = y[_]; break;
				case 'z': case 'Z': x[_] = x[0]; y[_] = y[0]; break;
			}
		}

		// remove our work copy; it's served us well
		//path.parentElement.removeChild(path);

		//return path.getAttribute('d');
		// for niceness, compress it a bit by making it relative
		path.removeAttribute('transform');
		console.log(path.getAttribute('d'));
		return path;
		return relatizePath(path);

}
$.fn.path2curve = function() {
	var path = this[0].getAttribute('d'), path2 = undefined,
		p = $.fn.path2absolute(path),
		p2 = path2 && pathToAbsolute(path2),
		attrs = {x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null},
		attrs2 = {x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null},
		processPath = function (path, d) {
			var nx, ny;
			if (!path) {
				return ["C", d.x, d.y, d.x, d.y, d.x, d.y];
			}
			!(path[0] in {T:1, Q:1}) && (d.qx = d.qy = null);
			switch (path[0]) {
				case "M":
					d.X = path[1];
					d.Y = path[2];
					break;
				case "A":
					path = ["C"][concat](a2c[apply](0, [d.x, d.y][concat](path.slice(1))));
					break;
				case "S":
					nx = d.x + (d.x - (d.bx || d.x));
					ny = d.y + (d.y - (d.by || d.y));
					path = ["C", nx, ny][concat](path.slice(1));
					break;
				case "T":
					d.qx = d.x + (d.x - (d.qx || d.x));
					d.qy = d.y + (d.y - (d.qy || d.y));
					path = ["C"][concat](q2c(d.x, d.y, d.qx, d.qy, path[1], path[2]));
					break;
				case "Q":
					d.qx = path[1];
					d.qy = path[2];
					path = ["C"][concat](q2c(d.x, d.y, path[1], path[2], path[3], path[4]));
					break;
				case "L":
					path = ["C"][concat](l2c(d.x, d.y, path[1], path[2]));
					break;
				case "H":
					path = ["C"][concat](l2c(d.x, d.y, path[1], d.y));
					break;
				case "V":
					path = ["C"][concat](l2c(d.x, d.y, d.x, path[1]));
					break;
				case "Z":
					path = ["C"][concat](l2c(d.x, d.y, d.X, d.Y));
					break;
			}
			return path;
		},
		fixArc = function (pp, i) {
			if (pp[i].length > 7) {
				pp[i].shift();
				var pi = pp[i];
				while (pi.length) {
					pp.splice(i++, 0, ["C"][concat](pi.splice(0, 6)));
				}
				pp.splice(i, 1);
				ii = mmax(p.length, p2 && p2.length || 0);
			}
		},
		fixM = function (path1, path2, a1, a2, i) {
			if (path1 && path2 && path1[i][0] == "M" && path2[i][0] != "M") {
				path2.splice(i, 0, ["M", a2.x, a2.y]);
				a1.bx = 0;
				a1.by = 0;
				a1.x = path1[i][1];
				a1.y = path1[i][2];
				ii = mmax(p.length, p2 && p2.length || 0);
			}
		};
	for (var i = 0, ii = mmax(p.length, p2 && p2.length || 0); i < ii; i++) {
		p[i] = processPath(p[i], attrs);
		fixArc(p, i);
		p2 && (p2[i] = processPath(p2[i], attrs2));
		p2 && fixArc(p2, i);
		fixM(p, p2, attrs, attrs2, i);
		fixM(p2, p, attrs2, attrs, i);
		var seg = p[i],
			seg2 = p2 && p2[i],
			seglen = seg.length,
			seg2len = p2 && seg2.length;
		attrs.x = seg[seglen - 2];
		attrs.y = seg[seglen - 1];
		attrs.bx = toFloat(seg[seglen - 4]) || attrs.x;
		attrs.by = toFloat(seg[seglen - 3]) || attrs.y;
		attrs2.bx = p2 && (toFloat(seg2[seg2len - 4]) || attrs2.x);
		attrs2.by = p2 && (toFloat(seg2[seg2len - 3]) || attrs2.y);
		attrs2.x = p2 && seg2[seg2len - 2];
		attrs2.y = p2 && seg2[seg2len - 1];
	}
	if (!p2) {
		pth.curve = pathClone(p);
	}
	return p2 ? [p, p2] : p;
}
$.fn.path2absolute = function(path) {
	if (!path) path = this[0];

	var segs = path.pathSegList
		, len	= segs.numberOfItems
		, M		= 'createSVGPathSegMovetoAbs'
		, L		= 'createSVGPathSegLinetoAbs'
		, H		= 'createSVGPathSegLinetoHorizontalAbs'
		, V		= 'createSVGPathSegLinetoVerticalAbs'
		, C		= 'createSVGPathSegCurvetoCubicAbs'
		, S		= 'createSVGPathSegCurvetoCubicSmoothAbs'
		, Q		= 'createSVGPathSegCurvetoQuadraticAbs'
		, T		= 'createSVGPathSegCurvetoQuadraticSmoothAbs'
		, A		= 'createSVGPathSegArcAbs'
		, seg, abs, x, y, i, c, x0, y0, x1, y1, x2, y2;
	for (x = y = i = 0; i < len; i++) {
		seg = segs.getItem(i);
		c	 = seg.pathSegTypeAsLetter;
		abs = undefined;
		if (/[MLHVCSQTA]/.test(c)) {
			// already absolute; just update current coord
			if ('x' in seg) x = seg.x;
			if ('y' in seg) y = seg.y;
		}
		else {
			if ('x1' in seg) x1 = x + seg.x1;
			if ('x2' in seg) x2 = x + seg.x2;
			if ('y1' in seg) y1 = y + seg.y1;
			if ('y2' in seg) y2 = y + seg.y2;
			if ('x'	in seg) x += seg.x;
			if ('y'	in seg) y += seg.y;
			switch (c) {
				case 'm': abs = path[M](x, y); break;
				case 'l': abs = path[L](x, y); break;
				case 'h': abs = path[H](x); break;
				case 'v': abs = path[V](y); break;
				case 'c': abs = path[C](x, y, x1, y1, x2, y2); break;
				case 's': abs = path[S](x, y, x2, y2); break;
				case 'q': abs = path[Q](x, y, x1, y1); break;
				case 't': abs = path[T](x, y); break;
				case 'a': abs = path[A](x, y, seg.r1, seg.r2, seg.angle,
																seg.largeArcFlag, seg.sweepFlag); break;
				case 'z':
				case 'Z': x = x0; y = y0; break;
			}
			if (abs) segs.replaceItem(abs, i);
		}
		// Record the start of a subpath
		if (c == 'M' || c == 'm') {
			x0 = x;
			y0 = y;
		}
	}

}
$.fn.flatten = function() {
	var node = this[0], root = node.ownerSVGElement, start = Date.now();

	/* ┌────────────────────────────────────────────────────────────────────┐
	   │    http://jsfiddle.net/ecmanaut/cFSjt/                             │
	   └────────────────────────────────────────────────────────────────────┘ */

	// Helper tool to piece together Raphael's paths into strings again
	Array.prototype.flatten || (Array.prototype.flatten = function() {
		return this.reduce(function(a, b) {
			return a.concat('function' === typeof b.flatten ? b.flatten() : b);
		}, []);
	});

	// Bake the transforms into all path nodes and remove the transform attributes

	var paths = [].slice.call(document.querySelectorAll('path'), 0);
	paths.forEach(function bake(p) {
		var before = p.getAttribute('d'), after = applyTransforms(p);
		//console.log('before/after path #'+arguments[1]+':\n', before, '\n', after);
		p.setAttribute('d', after);
	});
	paths.forEach(function removeTransforms(p) {
		do {
			p.removeAttribute('transform');
			p = p.parentNode;
		} while (!/^svg$/i.test(p.nodeName)); // walk to the SVG root, to catch <g>s
	});
	// done!

	console.log(Date.now() - start +'ms');
	console.log(node.getCTM());
	console.log(node.getCTM().inverse());
	console.log(node.getScreenCTM());
	console.log(node.getScreenCTM().inverse());
	console.log(node.getTransformToElement(root));
	console.log(node.getTransformToElement(root).inverse());
	//applyTransforms(node, root);

	// Uses Raphael.path2curve and Raphael.pathToRelative
	//
	// Calculates a new <path d> attribute relative to a given root (<svg>) element,
	// folding in all the transforms into the path data itself so it can move there,
	// and get rid of its transform attribute.
	function applyTransforms(path, root) {
		function point(x, y) { var p = svg.createSVGPoint(); p.x=x; p.y=y; return p; }

		// add a copy of the path at the same level of the hierarchy to see transforms
		path = path.parentElement.appendChild(path.cloneNode(false));
		// turn all arc commands into splines so we can transform them even with skews
		path.setAttribute('d', path2curve(path));

		// var matrix = pathDOM.getTransformToElement(svgDOM);
		var svg		= path.ownerSVGElement
			, normal = (root||svg).getCTM().inverse() // compensation for root
			, matrix = normal.multiply(path.getCTM()) // transform, relative to svg root
	//,matrix = path.getTransformToElement(root||svg)
			, _			= ''
			, coords = [_, 1, 2] // main and optional handle 1 and 2 coordinates
			, segs	 = path.pathSegList
			, len		= segs.numberOfItems
			, x			= { 0: 0, '': 0, 1: 0, 2: 0 }
			, y			= { 0: 0, '': 0, 1: 0, 2: 0 }
			, i			= -1
			, seg, cmd
			;

		// simplify the logic by normalizing to absolute coordinates first
		//absolutizePath(path);

		// walk the path, applying all transforms between us and the root as we go
		while (++i < len) {
			seg = segs.getItem(i);
			cmd = seg.pathSegTypeAsLetter;

			// Apply the transform to all coordinates and handles
			coords.forEach(function(sfx) {
				var xn = 'x'+sfx, yn = 'y'+sfx
					, xc = seg[xn], yc = seg[yn]
					, coord;
				if ((xc != null) || (yc != null)) {
					if (xc == null) xc = x[_];
					if (yc == null) yc = y[_];
					coord = point(xc, yc).matrixTransform(matrix);
					x[sfx] = seg[xn] = coord.x;
					y[sfx] = seg[yn] = coord.y;
				}
			});

			// record (and recall) start-of-subpath
			switch (cmd) {
				case 'm': case 'M': x[0] = x[_]; y[0] = y[_]; break;
				case 'z': case 'Z': x[_] = x[0]; y[_] = y[0]; break;
			}
		}

		// remove our work copy; it's served us well
		path.parentElement.removeChild(path);

		//return path.getAttribute('d');
		// for niceness, compress it a bit by making it relative
		return relatizePath(path);
	}

	// Changes all path arc commands to béziers. Uses Raphael.path2curve
	function path2curve(path) {
		if ('string' !== typeof path && 'function' === typeof path.getAttribute)
			path = path.getAttribute('d');
		return Raphael.path2curve(path).flatten().join(' ');
	}

	// Turns a path commands into relative coordinates. Uses Raphael.pathToRelative
	function relatizePath(path) {
		if ('string' !== typeof path && 'function' === typeof path.getAttribute)
			path = path.getAttribute('d');
		return Raphael.pathToRelative(path).flatten().join(' ');
	}

	function absolutizePath(path) {
		var segs = path.pathSegList
			, len	= segs.numberOfItems
			, M		= 'createSVGPathSegMovetoAbs'
			, L		= 'createSVGPathSegLinetoAbs'
			, H		= 'createSVGPathSegLinetoHorizontalAbs'
			, V		= 'createSVGPathSegLinetoVerticalAbs'
			, C		= 'createSVGPathSegCurvetoCubicAbs'
			, S		= 'createSVGPathSegCurvetoCubicSmoothAbs'
			, Q		= 'createSVGPathSegCurvetoQuadraticAbs'
			, T		= 'createSVGPathSegCurvetoQuadraticSmoothAbs'
			, A		= 'createSVGPathSegArcAbs'
			, seg, abs, x, y, i, c, x0, y0, x1, y1, x2, y2;
		for (x = y = i = 0; i < len; i++) {
			seg = segs.getItem(i);
			c	 = seg.pathSegTypeAsLetter;
			abs = undefined;
			if (/[MLHVCSQTA]/.test(c)) {
				// already absolute; just update current coord
				if ('x' in seg) x = seg.x;
				if ('y' in seg) y = seg.y;
			}
			else {
				if ('x1' in seg) x1 = x + seg.x1;
				if ('x2' in seg) x2 = x + seg.x2;
				if ('y1' in seg) y1 = y + seg.y1;
				if ('y2' in seg) y2 = y + seg.y2;
				if ('x'	in seg) x += seg.x;
				if ('y'	in seg) y += seg.y;
				switch (c) {
					case 'm': abs = path[M](x, y); break;
					case 'l': abs = path[L](x, y); break;
					case 'h': abs = path[H](x); break;
					case 'v': abs = path[V](y); break;
					case 'c': abs = path[C](x, y, x1, y1, x2, y2); break;
					case 's': abs = path[S](x, y, x2, y2); break;
					case 'q': abs = path[Q](x, y, x1, y1); break;
					case 't': abs = path[T](x, y); break;
					case 'a': abs = path[A](x, y, seg.r1, seg.r2, seg.angle,
																	seg.largeArcFlag, seg.sweepFlag); break;
					case 'z':
					case 'Z': x = x0; y = y0; break;
				}
				if (abs) segs.replaceItem(abs, i);
			}
			// Record the start of a subpath
			if (c == 'M' || c == 'm') {
				x0 = x;
				y0 = y;
			}
		}
	}

	/* ┌────────────────────────────────────────────────────────────────────┐
	   │    http://jsfiddle.net/ecmanaut/cFSjt/                             │
	   └────────────────────────────────────────────────────────────────────┘ */
}
/*
$.fn.getTranslation = function() {
	var node = this[0], ti = false,
		num = node.transform.baseVal.numberOfItems
	;
	for (var i = num; i--;) {
		if (node.transform.baseVal.getItem(i).type == 2) ti = i;
	}
}
*/
$.fn.translate = function(tx, ty) {
	var tx = tx || 0, ty = ty || 0, ti = false, node = this[0],
		num = node.transform.baseVal.numberOfItems
		//con = node.transform.baseVal.consolidate() ? node.transform.baseVal.consolidate().matrix : null
	;
	for (var i = num; i--;) {
		if (node.transform.baseVal.getItem(i).type == 2) ti = i;
	}
	if (ti !== false) {
		// replace translation
		var ox = node.transform.baseVal.getItem(ti).matrix.e, oy = node.transform.baseVal.getItem(ti).matrix.f;
		node.transform.baseVal.getItem(ti).setTranslate(tx, ty);
	} else {
		// append translation
		var newTr = node.ownerSVGElement.createSVGTransform();
		newTr.setTranslate(tx, ty);
		node.transform.baseVal.appendItem(newTr);
	}
	/*
	if (!con) return {x: 0, y: 0}; // nothing to do
	tx = con.e, ty = con.f;
	node.transform.baseVal.clear();
	node.setAttributeNS(null, 'transform', 'matrix('+con.a+' '+con.b+' '+con.c+' '+con.d+' 0 0) translate('+tx+','+ty+')');
	*/
}
$.fn.parseTransformAttr = function(node) {
	// http://www.w3.org/TR/SVG/coords.html#TransformAttribute
	var node = node || this,
		// always return a transformation obj
		tr = {translate: {x:0,y:0}, scale: {x:0,y:0}, rotate: {angle:0,x:0,y:0}, skewX: {angle:0}, skewY: {angle:0}},
		command = /(\w*)[\s\(]([-,\d\s\.]+)/g
	;
	// http://www.w3.org/TR/SVG/coords.html#TransformAttribute
	// The individual transform definitions are separated by whitespace and/or a comma.
	// matrix(a b c d e f) translate(tx [ty]) scale(sx [sy]) rotate(angle [cx cy]) skewX(angle) skewY(angle)
	String(this.attr('transform')).replace(command, function (a, b, c) {
		var d = c.trimmer().split(/[,\s]+/g).map(parseFloat);
		tr[b] = {};
		switch (b) {
			case 'rotate': tr[b].angle = d[0] || 0, tr[b].x = d[1] || 0, tr[b].y = d[2] || 0; break;
			case 'scale': case 'translate': tr[b].x = d[0] || 0, tr[b].y = d[1] || 0; break;
			case 'skewX': case 'skewY': tr[b].angle = d[0] || 0; break;
		}
	});
	return tr;
}
$.fn.root = function(node) {
	var node = node || this[0];
	// hack-ish, node can be bare or wrapped as a jQ obj
	return $($(node)[0].ownerSVGElement)
}
$.fn.svgrect = function(x, y, w, h) {
	return $(this[0].createSVGRect()).attr({x: x || 0, y: y || 0, width: w || 0, height: h || 0})
}
$.fn.svgpoint = function(x, y, w, h) {
	return $(this[0].createSVGPoint()).attr({x: x || 0, y: y || 0})
}
$.fn.path = function() {
	var path = this[0];
	if (!('pathSegList' in path)) return false;
	console.log(path.pathSegList)
	for (var i = 0; i < path.pathSegList.numberOfItems; i++) {
		var s = path.pathSegList.getItem(i),
			z = s.pathSegType
		;
		console.log(s)
	}
}
$.fn.box = function(getBoundingClientRect) {
	if (!('getBBox' in this[0])) return;
	var box;
	if (this[0].ownerSVGElement && !getBoundingClientRect) {
		box = this[0].getBBox();
		box.cx = box.x + box.width / 2;
		box.cy = box.y + box.height / 2;
		return box;
	} else if ('getBoundingClientRect' in this[0]) {
		var rect = this[0].getBoundingClientRect();
		return box = {
			x: rect.left, y: rect.top,
			width: rect.width, height: rect.height,
			cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2
		};
	} else {
		return this[0].innerWidth || null;
	}
}

// FF as of FF20 does not implement getIntersectionList/getEnclosureList
// https://bugzilla.mozilla.org/show_bug.cgi?id=501421
$.fn.getIntersectionList = function(svgrect, svgroot) {
	var intersection;
	try {
		intersection = svgroot.getIntersectionList(svgrect, svgroot)
	} catch(e) {
		intersection = null;
	}
	return intersection;
}
$.fn.hasIntersection = function(rect1, rect2) {
	if (rect1[0].ownerSVGElement != rect2[0].ownerSVGElement) {
		if (console.warn) console.warn('Operation only valid for nodes of the same root SVG element');
		return false;
	}
	var r1 = rect1.box(), r2 = rect2.box();
	// lifted from svg-edit
	return 	 r2.x < (r1.x + r1.width)  && 
			(r2.x + r2.width) > r1.x   &&
			 r2.y < (r1.y + r1.height) &&
			(r2.y + r2.height) > r1.y 
	;
}
