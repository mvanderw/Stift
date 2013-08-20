# Stift

Stift is an in-browser vector graphics editor using SVG powered by JavaScript. It is not usable although much of the core functionality is implemented and working.

The aim was to build a simple editor that could be easily extended to support specific operational modes, such as (semi-automated) line drawing in the clothing industry based on structured AI or PDF input vectors.

This side-project required a lot of digging into browser-specific handling of SVG interfaces. As it turns out, as of 2013-04-22 most of the SVG specification interfaces are implemented, with WebKit and IE leading in terms of support and Mozilla unfortunately lacking a few key methods to really make in-browser SVG editing workable.

Performance is mostly acceptable on my test machine (2007 Intel Quad) but quickly falls off above 10k points, in particular when making selections. Unfortunately, there is probably no workaround for this if AI style selections are the goal. I expect this is the reason [svg-edit](http://code.google.com/p/svg-edit/) selects by group.
