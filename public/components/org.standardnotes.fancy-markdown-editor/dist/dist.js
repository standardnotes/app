/**
 * Markdown and LaTeX Editor
 *
 * (c) Roman Parpalak, 2016-2018
 */

(function (document, window) {
	'use strict';

	var defaults = {
		html:        true,         // Enable HTML tags in source
		xhtmlOut:    false,        // Use '/' to close single tags (<br />)
		breaks:      false,        // Convert '\n' in paragraphs into <br>
		langPrefix:  'language-',  // CSS language prefix for fenced blocks
		linkify:     true,         // autoconvert URL-like texts to links
		typographer: true,         // Enable smartypants and other sweet transforms
		quotes:      '""\'\'',

		// option for tex plugin
		_habr: {protocol: ''},    // no protocol for habrahabr markup

		// options below are for demo only
		_highlight: true,
		_strict:    false
	};

	function domSetResultView(val) {
		var eNode = document.body;

		[
			'result-as-html',
			'result-as-htmltex',
			'result-as-habr',
			'result-as-src',
			'result-as-debug'
		].forEach(function (className) {
			if (eNode.classList) {
				eNode.classList.remove(className);
			}
			else {
				eNode.className = eNode.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
			}
		});

		if (eNode.classList) {
			eNode.classList.add('result-as-' + val);
		}
		else {
			eNode.className += ' ' + 'result-as-' + val;
		}
	}

	function ParserCollection(
		defaults,
		imageLoader,
		markdownit,
		setResultView,
		sourceGetter,
		sourceSetter,
		domSetPreviewHTML,
		domSetHighlightedContent,
		updateCallback
	) {
		var _mdPreview = markdownit(defaults)
			.use(markdownitS2Tex)
			.use(markdownitSub)
			.use(markdownitSup)
		;

		var _mdHtmlAndImages = markdownit(defaults)
			.use(markdownitS2Tex)
			.use(markdownitSub)
			.use(markdownitSup)
		;

		var _mdHtmlAndTex = markdownit(defaults)
			.use(markdownitS2Tex, {noreplace: true})
			.use(markdownitSub)
			.use(markdownitSup)
		;

		var _mdHtmlHabrAndImages = markdownit(defaults)
			.use(markdownitS2Tex, defaults._habr)
			.use(markdownitSub)
			.use(markdownitSup)
		;

		var _mdMdAndImages = markdownit('zero')
			.use(markdownitS2Tex)
		;

		/**
		 * Detects if the paragraph contains the only formula.
		 * Parser gives the class 'tex-block' to such formulas.
		 *
		 * @param tokens
		 * @param idx
		 * @returns {boolean}
		 */
		function hasBlockFormula(tokens, idx) {
			if (idx >= 0 && tokens[idx] && tokens[idx].children) {
				for (var i = tokens[idx].children.length; i--;) {
					if (tokens[idx].children[i].tag === 'tex-block') {
						return true;
					}
				}
			}
			return false;
		}

		/**
		 * Inject line numbers for sync scroll. Notes:
		 * - We track only headings and paragraphs on first level. That's enough.
		 * - Footnotes content causes jumps. Level limit filter it automatically.
		 *
		 * @param tokens
		 * @param idx
		 * @param options
		 * @param env
		 * @param self
		 */
		function injectLineNumbersAndCentering(tokens, idx, options, env, self) {
			var line;
			if (tokens[idx].map && tokens[idx].level === 0) {
				line = tokens[idx].map[0];
				tokens[idx].attrPush(['class', 'line']);
				tokens[idx].attrPush(['data-line', line + '']);
			}

			// Hack (maybe it is better to use block renderers?)
			if (hasBlockFormula(tokens, idx + 1)) {
				tokens[idx].attrPush(['align', 'center']);
				tokens[idx].attrPush(['style', 'text-align: center;']);
			}

			return self.renderToken(tokens, idx, options, env, self);
		}

		// Habrahabr does not ignore <p> tags and meanwhile uses whitespaces
		function habrHeading(tokens, idx, options, env, self) {
			var prefix = "";
			if (idx > 0 && tokens[idx - 1].type === 'paragraph_close' && !hasBlockFormula(tokens, idx - 2)) {
				prefix = "\n";
			}

			return prefix + self.renderToken(tokens, idx, options, env, self);
		}

		function habrParagraphOpen(tokens, idx, options, env, self) {
			var prefix = "";
			if (idx > 0 && tokens[idx - 1].type === 'paragraph_close' && !hasBlockFormula(tokens, idx - 2)) {
				prefix = "\n";
			}
			return prefix; //+ self.renderToken(tokens, idx, options, env, self);
		}

		function habrParagraphClose(tokens, idx, options, env, self) {
			var prefix = "\n";
			return prefix; //+ self.renderToken(tokens, idx, options, env, self);
		}

		function injectCentering(tokens, idx, options, env, self) {
			// Hack (maybe it is better to use block renderers?)
			if (hasBlockFormula(tokens, idx + 1)) {
				tokens[idx].attrPush(['align', 'center']);
				tokens[idx].attrPush(['style', 'text-align: center;']);
			}
			return self.renderToken(tokens, idx, options, env, self);
		}

		_mdPreview.renderer.rules.paragraph_open = _mdPreview.renderer.rules.heading_open = injectLineNumbersAndCentering;
		_mdHtmlAndImages.renderer.rules.paragraph_open = _mdHtmlAndImages.renderer.rules.heading_open = injectCentering;

		_mdHtmlHabrAndImages.renderer.rules.heading_open    = habrHeading;
		_mdHtmlHabrAndImages.renderer.rules.paragraph_open  = habrParagraphOpen;
		_mdHtmlHabrAndImages.renderer.rules.paragraph_close = habrParagraphClose;

		// A copy of Markdown-it original backticks parser.
		// We want to prevent from parsing dollars inside backticks as TeX delimeters (`$$`).
		// But we do not want HTML in result.
		_mdMdAndImages.inline.ruler.before('backticks', 'backticks2', function (state, silent) {
			var start, max, marker, matchStart, matchEnd, token,
				pos = state.pos,
				ch = state.src.charCodeAt(pos);
			if (ch !== 0x60/* ` */) { return false; }

			start = pos;
			pos++;
			max = state.posMax;

			while (pos < max && state.src.charCodeAt(pos) === 0x60/* ` */) { pos++; }

			marker = state.src.slice(start, pos);

			matchStart = matchEnd = pos;

			while ((matchStart = state.src.indexOf('`', matchEnd)) !== -1) {
				matchEnd = matchStart + 1;

				while (matchEnd < max && state.src.charCodeAt(matchEnd) === 0x60/* ` */) { matchEnd++; }

				if (matchEnd - matchStart === marker.length) {
					if (!silent) {
						token         = state.push('backticks2_inline', 'code', 0); // <-- The change
						token.markup  = marker;
						token.content = state.src.slice(pos, matchStart)
					}
					state.pos = matchEnd;
					return true;
				}
			}

			if (!silent) { state.pending += marker; }
			state.pos += marker.length;
			return true;
		});

		_mdMdAndImages.renderer.rules.backticks2_inline = function (tokens, idx /*, options, env, slf*/) {
			var token = tokens[idx];
			return token.markup + token.content + token.markup;
		};

		// Prevents HTML escaping.
		_mdMdAndImages.renderer.rules.text = function (tokens, idx /*, options, env */) {
			return tokens[idx].content;
		};

		/**
		 * Habrahabr "source" tag
		 *
		 * @param tokens
		 * @param idx
		 * @param options
		 * @param env
		 * @param self
		 * @returns {string}
		 */
		_mdHtmlHabrAndImages.renderer.rules.fence = function (tokens, idx, options, env, self) {
			var token    = tokens[idx],
				info     = token.info ? _mdHtmlHabrAndImages.utils.unescapeAll(token.info).trim() : '',
				langName = '',
				highlighted;

			if (info) {
				langName = info.split(/\s+/g)[0];
				token.attrPush(['lang', langName]);
			}

			if (options.highlight) {
				highlighted = options.highlight(token.content, langName) || _mdHtmlHabrAndImages.utils.escapeHtml(token.content);
			} else {
				highlighted = _mdHtmlHabrAndImages.utils.escapeHtml(token.content);
			}

			return '\n<source' + self.renderAttrs(token) + '>'
				+ highlighted
				+ '</source>\n';
		};

		function getHabraMarkup(source) {
			var html = _mdHtmlHabrAndImages.render(source);

			html = html.replace('<spoiler ', '\n<spoiler ');
			return html;
		}

		this.getSource = sourceGetter;

		this.setSource = function (source) {
			sourceSetter(source);
			this.updateResult();
		};

		var _oldSource = null,
			_view      = 'html'; // html / src / debug

		this.updateResult = function () {
			var source = sourceGetter();
			if (_oldSource === source) {
				return;
			}

			_oldSource = source;

			// Always render html because we need it to generate previews for SN
			imageLoader.reset();
			domSetPreviewHTML(_mdPreview.render(source));
			imageLoader.fixDom();

			// Update only active view to avoid slowdowns
			// (debug & src view with highlighting are a bit slow)
			if (_view === 'htmltex') {
				domSetHighlightedContent('result-src-content', _mdHtmlAndTex.render(source), 'html');
			}
			else if (_view === 'debug') {
				domSetHighlightedContent(
					'result-src-content',
					JSON.stringify(_mdHtmlAndImages.parse(source, {references: {}}), null, 2),
					'json'
				);
			}
			else if (_view === 'habr') {
				domSetHighlightedContent('result-src-content', getHabraMarkup(source), 'html');
			}
			else if (_view === 'md') {
				domSetHighlightedContent('result-src-content', _mdMdAndImages.renderInline(source), 'html');
			}
			else { /*_view === 'src'*/
				domSetHighlightedContent('result-src-content', _mdHtmlAndImages.render(source), 'html');
			}

			updateCallback(source);
		};

		this.getDisplayedResult = function () {
			var source = sourceGetter();

			if (_view === 'habr') {
				return _mdHtmlHabrAndImages.render(source);
			}

			if (_view === 'htmltex') {
				return _mdHtmlAndTex.render(source);
			}

			if (_view === 'md') {
				return _mdMdAndImages.renderInline(source);
			}

			return _mdHtmlAndImages.render(source);
		};

		this.getDisplayedResultFilename = function () {
			return _view + '.html';
		};

		setResultView(_view);
		this.switchView = function (view) {
			_view = view;
			setResultView(view);

			_oldSource = null;
			this.updateResult();
		}
	}

	function domSetHighlightedContent(className, content, lang) {
		var eNode = document.getElementsByClassName(className)[0];
		if (window.hljs) {
			eNode.innerHTML = window.hljs.highlight(lang, content).value;
		}
		else {
			eNode.textContent = content;
		}
	}

	function domSetPreviewHTML(html) {
		var result          = document.getElementsByClassName('result-html');
		result[0].innerHTML = html;
	}

	/**
	 * Searches start position for text blocks
	 */
	function domFindScrollMarks() {
		var resElements      = document.querySelectorAll('.result-html .line'),
			resElementHeight = [],
			line,
			mapSrc           = [0],
			mapResult        = [0],
			i                = 0,
			len              = resElements.length;

		for (; i < len; i++) {
			line = parseInt(resElements[i].getAttribute('data-line'));
			if (line) {
				resElementHeight[line] = Math.round(resElements[i].offsetTop);
			}
		}

		var srcElements = document.querySelectorAll('.ldt-pre .block-start');

		len  = srcElements.length;
		line = 0;

		for (i = 0; i < len; i++) {
			var lineDelta = parseInt(srcElements[i].getAttribute('data-line'));
			if (lineDelta) {
				line += lineDelta;

				// We track only lines in both containers
				if (typeof resElementHeight[line] !== 'undefined') {
					mapSrc.push(srcElements[i].offsetTop);
					mapResult.push(resElementHeight[line]);
				}
			}
		}

		var srcScrollHeight = document.querySelector('.ldt-pre').scrollHeight,
			lastSrcElemPos  = mapSrc[mapSrc.length - 1],
			allowedHeight   = 5; // workaround for automatic textarea scrolling on entering new source lines

		mapSrc.push(srcScrollHeight - allowedHeight > lastSrcElemPos ? srcScrollHeight - allowedHeight : lastSrcElemPos);
		mapResult.push(document.querySelector('.result-html').scrollHeight);

		return [mapSrc, mapResult];
	}

	documentReady(function () {
		var eTextarea   = document.getElementById('editor-source'),
			eResultHtml = document.getElementsByClassName('result-html')[0];

		var recalcHeight = debounce(function () {
			decorator.recalcHeight()
		}, 100);

		var scrollMap = new ScrollMap(domFindScrollMarks);

		var parserCollection = new ParserCollection(
			defaults,
			new ImageLoader(new ImagePreloader(), location.protocol === 'https:' ? 'https:' : 'http:'),
			window.markdownit,
			domSetResultView,
			function domGetSource() {
				return eTextarea.value;
			},
			function domSetSource(text) {
				eTextarea.value = text;
				decorator.update();
			},
			domSetPreviewHTML,
			domSetHighlightedContent,
			function (source) {
				// reset lines mapping cache on content update
				scrollMap.reset();
			}
		);

		parserCollection.updateResult();

		// start the decorator
		var decorator = new TextareaDecorator(eTextarea, mdParser);

		// .source has been changed after TextareaDecorator call
		var eNodeSource = document.getElementsByClassName('source')[0];

		var syncScroll = new SyncScroll(
			scrollMap,
			new Animator(function () {
				return eNodeSource.scrollTop;
			}, function (y) {
				eNodeSource.scrollTop = y;
			}),
			new Animator(function () {
				return eResultHtml.scrollTop;
			}, function (y) {
				eResultHtml.scrollTop = y;
			}),
			eNodeSource,
			eResultHtml,
			document.querySelector('[id^="container-block"]')
		);

		// Sync scroll listeners

		// var updateText = debounce(parserCollection.updateResult, 240, {maxWait: 3000});

		// We'll update text on our own
		var updateText = parserCollection.updateResult;

		// eTextarea.addEventListener('keyup', updateText);
		// eTextarea.addEventListener('paste', updateText);
		// eTextarea.addEventListener('cut', updateText);
		// eTextarea.addEventListener('mouseup', updateText);

		eTextarea.addEventListener('touchstart', syncScroll.switchScrollToSrc);
		eTextarea.addEventListener('mouseover', syncScroll.switchScrollToSrc);

		eResultHtml.addEventListener('touchstart', syncScroll.switchScrollToResult);
		eResultHtml.addEventListener('mouseover', syncScroll.switchScrollToResult);

		syncScroll.switchScrollToSrc();

		Array.prototype.forEach.call(document.getElementsByClassName('control-item'), function (eNode, index) {
			eNode.addEventListener('click', function () {
				var view = this.getAttribute('data-result-as');
				if (!view) {
					return;
				}

				parserCollection.switchView(view);

				if (view !== 'preview') {
					// Selecting all block content.
					var contentBlocks = document.getElementsByClassName('result-src-content');
					if (contentBlocks.length) {
						setTimeout(function () {
							selectText(contentBlocks[0]);
						}, 0);
					}
				}
			})
		});

		// Interface element listeners

		document.querySelector('._download-source').addEventListener('click', function () {
			var blob = new Blob([parserCollection.getSource()], {type: 'text/markdown;charset=utf-8'});
			saveAs(blob, 'source.md');
		});

		document.querySelector('._download-result').addEventListener('click', function () {
			var blob = new Blob([parserCollection.getDisplayedResult()], {type: 'text/html;charset=utf-8'});
			saveAs(blob, parserCollection.getDisplayedResultFilename());
		});

		document.querySelector('._upload-source').addEventListener('click', function () {
			var eNode = document.getElementById('fileElem');
			// Fire click on file input
			(eNode.onclick || eNode.click || function () {}).call(eNode);
		});

		document.getElementById('fileElem').addEventListener('change', function () {
			// A file has been chosen
			if (!this.files || !FileReader) {
				return;
			}

			var reader    = new FileReader(),
				fileInput = this;

			reader.onload = function () {
				parserCollection.setSource(this.result);
				fileInput.value = fileInput.defaultValue;
			};
			reader.readAsText(this.files[0]);
		});

		(function () {
			var eSlider     = document.querySelector('.slider'),
				dragSlider  = new Draggabilly(eSlider, {
					axis: 'x'
				}),
				sourceBlock = document.getElementById('source-block'),
				resultBLock = document.getElementById('result-block'),
				windowWidth;

			function setWidth(percent) {
				sourceBlock.style.width = 'calc(' + percent + '% - 3px)';
				resultBLock.style.width = 'calc(' + (100 - percent) + '% - 3px)';

				scrollMap.reset();
			}

			eSlider.addEventListener('dblclick', function () {
				setWidth(50);
			});

			dragSlider.on('dragStart', function (event, pointer, moveVector) {
				windowWidth = window.innerWidth;
			});

			dragSlider.on('dragMove', function (event, pointer, moveVector) {
				setWidth(100.0 * pointer.pageX / windowWidth);
			});
		})();

		window.upmath = {
			updateText: () => {
				updateText();
				decorator.recalcHeight()
				decorator.update();
			},
			getHTML: () => {
				var result = document.getElementsByClassName('result-html');
				return eResultHtml.innerHTML;
			}
		}

		// Need to recalculate line positions on window resize
		window.addEventListener('resize', function () {
			scrollMap.reset();
			recalcHeight();
		});
	});
})(document, window);
;/**
 * Renders LaTeX formulae via KaTeX.
 *
 * Previously connects service to the markdown-it renderer.
 *
 * Inspired by 
 *
 * @copyright 2015 Roman Parpalak
 */

(function (w) {
	'use strict';

	function scanDelims(state, start) {
		var pos = state.pos, lastChar, nextChar, count,
			isLastWhiteSpace, isLastPunctChar,
			isNextWhiteSpace, isNextPunctChar,
			can_open  = true,
			can_close = true,
			max = state.posMax,
			isWhiteSpace   = state.md.utils.isWhiteSpace,
			isPunctChar    = state.md.utils.isPunctChar,
			isMdAsciiPunct = state.md.utils.isMdAsciiPunct;

		// treat beginning of the line as a whitespace
		lastChar = start > 0 ? state.src.charCodeAt(start - 1) : 0x20;
		if (pos >= max) {
			can_open = false;
		}
		count = pos - start;

		// treat end of the line as a whitespace
		nextChar = pos < max ? state.src.charCodeAt(pos) : 0x20;
		isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctChar(String.fromCharCode(lastChar));
		isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctChar(String.fromCharCode(nextChar));
		isLastWhiteSpace = isWhiteSpace(lastChar);
		isNextWhiteSpace = isWhiteSpace(nextChar);

		if (isNextWhiteSpace) {
			can_open = false;
		}
		else if (isNextPunctChar) {
			if (!(isLastWhiteSpace || isLastPunctChar)) {
				can_open = false;
			}
		}
		if (isLastWhiteSpace) {
			can_close = false;
		}
		else if (isLastPunctChar) {
			if (!(isNextWhiteSpace || isNextPunctChar)) {
				can_close = false;
			}
		}

		return {
			can_open: can_open,
			can_close: can_close,
			delims: count
		};
	}


	function makeMath_inline(open, close) {
		return function math_inline(state, silent) {
			var startCount,
				found,
				res,
				token,
				closeDelim,
				max = state.posMax,
				start = state.pos,
				openDelim = state.src.slice(start, start + open.length);

			if (openDelim !== open) {
				return false;
			}
			if (silent) {
				return false;
			}    // Don’t run any pairs in validation mode

			res = scanDelims(state, start + open.length);
			startCount = res.delims;

			if (!res.can_open) {
				state.pos += startCount;
				// Earlier we checked !silent, but this implementation does not need it
				state.pending += state.src.slice(start, state.pos);
				return true;
			}

			state.pos = start + open.length;

			while (state.pos < max) {
				closeDelim = state.src.slice(state.pos, state.pos + close.length);
				if (closeDelim === close) {
					res = scanDelims(state, state.pos + close.length);
					if (res.can_close) {
						found = true;
						break;
					}
				}

				state.md.inline.skipToken(state);
			}

			if (!found) {
				// Parser failed to find ending tag, so it is not a valid math
				state.pos = start;
				return false;
			}

			// Found!

			// Detecting single formula with a line number
			var m = false,
				tag = 'tex-inline';

			if (start == 0) {
				var srcEnd = state.src.substring(state.pos + close.length);
				m = srcEnd.match(/^\s*(\([ \t]*\S+[ \t]*\))\s*$/);
				if (m || srcEnd == '') {
					tag = 'tex-block';
				}
			}

			if (m) {
				token = state.push('math_number', 'tex-number', 0);
				token.content = m[1];
				token.markup = '()';
			}

			state.posMax = state.pos;
			state.pos = start + close.length;

			// Earlier we checked !silent, but this implementation does not need it
			token = state.push('math_inline', tag, 0);
			token.content = state.src.slice(state.pos, state.posMax);
			token.markup = open;

			state.pos = m ? max : state.posMax + close.length;
			state.posMax = max;

			return true;
		};
	}

	w.markdownitS2Tex = function math_plugin(md, options) {
		// Default options
		options = typeof options === 'object' ? options : {};
		var inlineOpen  = options.inlineOpen || '$$',
			inlineClose = options.inlineClose || '$$';

		var math_inline = makeMath_inline(inlineOpen, inlineClose);

		md.inline.ruler.before('escape', 'math_inline', math_inline);

		md.renderer.rules.math_inline = (function () {
			return function (tokens, idx) {
				var formula = tokens[idx].content;

				if (options.noreplace) {
					var str = inlineOpen + formula + inlineClose;
					return str
						.replace(/&/g, '&amp;')
						.replace(/>/g, '&gt;')
						.replace(/</g, '&lt;')
						.replace(/"/g, '&quot;')
					;
				}

				var isInline = "tex-inline" === tokens[idx].tag;

				var rendered = katex.renderToString(formula, {
					throwOnError: false,
					displayMode: !isInline,
					trust: true
				});

				return rendered;
			}
		}());

		md.renderer.rules.math_number = function (tokens, idx) {
			return '<span style="float:right">' + tokens[idx].content + '</span>';
		};
	};
}(window));
;/**
 * Markdown parser with latex extension
 *
 * (c) Roman Parpalak, 2015
 * Based on code by Colin Kuebler, 2012
 */

function MarkdownParser(i) {
	/* INIT */
	var api = this;

	// variables used internally
	i = i ? 'i' : '';
	var parseInlineRE = null,
		parseBlockRE = null,
		ruleMap = {},
		ruleBlockMap = {},
		ruleInlineMap = {},
		runInBlocks = {},
		markers = {};

	var subRules,
		subRulesMap = {},
		subRulesRE = {};

	function addBlockRule(s, rule) {
		var re = new RegExp('^(' + s + ')$', i);
		ruleMap[rule] = re;
		ruleBlockMap[rule] = re;
	}

	function addInlineRule(s, rule) {
		var re = new RegExp('^(' + s + ')$', i);
		ruleMap[rule] = re;
		ruleInlineMap[rule] = re;
	}

	function addSubruleMap(s, rule, block) {
		if (!subRulesMap[block]) {
			subRulesMap[block] = {};
		}
		subRulesMap[block][rule] = new RegExp('^(' + s + ')$', i);
	}

	api.addInlineRules = function (rules) {
		var ruleSrc = [];

		for (var rule in rules) {
			if (rules.hasOwnProperty(rule)) {
				var s = rules[rule].source;
				ruleSrc.push(s);
				addInlineRule(s, rule);
			}
		}

		parseInlineRE = new RegExp('(' + ruleSrc.join('|') + ')', i);

		return this;
	};
	api.addSubRules = function (rules) {
		subRules = rules;

		for (var block in rules) {
			if (rules.hasOwnProperty(block)) {
				var rules2 = rules[block],
					p = [];
				for (var rule in rules2) {
					if (rules2.hasOwnProperty(rule)) {
						var s = rules2[rule].source;
						addSubruleMap(s, rule, block);
						p.push(s);
					}
				}

				subRulesRE[block] = new RegExp('(' + p.join('|') + ')', i);
			}
		}

		return this;
	};
	api.addBlockRules = function (rules) {
		var ruleArray = [];

		for (var rule in rules) {
			if (rules.hasOwnProperty(rule)) {
				var s = rules[rule].source;
				ruleArray.push(s);
				addBlockRule(s, rule);
			}
		}
		parseBlockRE = new RegExp('(' + ruleArray.join('|') + ')', i);

		return this;
	};
	api.addRunIn = function (rules) {
		runInBlocks = rules;

		return this;
	};
	api.addMarkers = function (m) {
		markers = m;

		return this;
	};

	function tokenizeBlock(block, className, lineNum, result) {
		var re = parseInlineRE;

		// Process specific rules for the given block type className
		if (className in subRules) {
			if (subRules[className] === null) {
				result.push({
					token: block,
					block: className,
					line:  lineNum
				});

				return;
			}
			else {
				re = subRulesRE[className];
			}
		}

		// Token for a block marker
		if (typeof markers[className] !== 'undefined') {
			var matches = block.match(markers[className]);
			if (matches[2]) {
				result.push({
					token: matches[1],
					block: className + '-mark',
					line:  lineNum
				});
				block = matches[2];
				lineNum = 0; // Write block position only once
			}
		}

		var items = block.split(re),
			j = 0, token;

		for (; j < items.length; j++) {
			token = items[j];
			if (token != '') {
				result.push({
					token: token,
					block: className,
					line:  lineNum
				});
				lineNum = 0; // Write block position only once
			}
		}
	}

	api.tokenize = function (input) {
		input = input.replace('\r', '');

		var result = [],
			classNames = [],
			blocks = input.split(parseBlockRE),
			blockNum = blocks.length,
			i, prevIndex = 0, prevBlockClass;

		// Merge blocks separated by line breaks
		for (i = 0; i < blockNum; i++) {
			if (blocks[i] === '') {
				continue;
			}

			var className = identify(blocks[i], ruleBlockMap);

			if (prevIndex > 0 && className in runInBlocks) {
				var allowedPrevBlocks = runInBlocks[className].allowedBlocks;
				if (allowedPrevBlocks && allowedPrevBlocks.indexOf(prevBlockClass) >= 0) {
					blocks[prevIndex] += blocks[i];
					blocks[i] = '';
					classNames[i] = '';

					continue;
				}
			}

			classNames[i] = className;

			prevIndex = i;
			prevBlockClass = className;
		}

		var lineBreakCnt = 0;

		for (i = 0; i < blockNum; i++) {
			var block = blocks[i];
			if (block !== '') {
				var lineNum = 0;
				if (classNames[i] != 'empty') { // TODO move to config
					lineNum = lineBreakCnt;
					lineBreakCnt = 0; // Storing diff between line numbers
				}
				tokenizeBlock(block, classNames[i], lineNum, result);
				lineBreakCnt += substrCount('\n', block);
			}
		}

		return result;
	};
	api.identifyInline = function (tokenObj) {
		var className = tokenObj.block,
			map = ruleInlineMap;

		if (className in subRules) {
			if (subRules[className] === null) {
				return '';
			}
			else {
				map = subRulesMap[className];
			}
		}
		return identify(tokenObj.token, map);
	};

	function identify(token, ruleMap) {
		for (var rule in ruleMap) {
			if (ruleMap.hasOwnProperty(rule) && ruleMap[rule].test(token)) {
				return rule;
			}
		}

		return '';
	}

	return api;
}

// Markdown syntax parser
var mdParser = new MarkdownParser();

mdParser
	.addBlockRules({
		latexBlock: /[ \t]*\$\$\n?(?:[^\n]+\n)*(?:[^\n]*[^\\\n])?\$\$(?:[ \t]*\([ \t]*\S+[ \t]*\))?[ \t]*(?:\n|$)/,
		empty:      /(?:[ \t]*\n)+/,
		fence:      /```[\s\S]*?(?:$|```(?:\n|$))/,
		reference:  /\[[^\]]+\]\:[^\n]*(?:\n|$)/,
		header:     /#{1,6} [^\n]*(?:\n|$)/,
		header2:    /[^\n]+\n[ \t]*[=-]{2,}(?:\n|$)/,
		rule:       /(?:[\*]{3,}|[\-]{3,}|[\_]{3,})(?:\n|$)/,
		list:       /[ ]{0,3}(?:[+\-\*]|\d+\.)[ \t]+[^\n]*(?:\n[ \t]*[^\n\t ]+[ \t]*)*(?:\n|$)/,
		quote:      /[ ]{0,3}>[^\n]*(?:\n|$)/,
		paragraph:  /[\s\S]*?(?:\n|$)/
	})
	.addInlineRules({
		latex:      /\$\$(?:[\s\S]*?[^\\])?\$\$/,
		link:       /\[.+?\][\(\[].*?[\)\]]/,
		bold:       /(?:\s|^)__[\s\S]*?\S__|\*\*[\s\S]*?\S\*\*/,
		italic:     /(?:\s|^)_[\s\S]*?[^\\\s]_|\*[^\\\s]\*|\*\S[\s\S]*?[^\\\s]\*/,
		strike:     /~~.+?~~/,
		sup:        /\^.+?\^/,
		sub:        /~.+?~/,
		code:       /``.+?``|`.*?[^`\\]`(?!`)/
	})
	.addSubRules({
		fence: null,
		rule:  null,
		latexBlock: {
			comment:   /%[^\n]*?(?=\$\$)|%[^\n]*/,
			reference: /[ \t]*\([ \t]*\S+[ \t]*\)[ \t\n]*$/,
			index:     /(?:\^|_)(?:\\[a-zA-Zа-яА-я]+[\*]?(?:\{.*?\})|\{[a-zA-Zа-яА-я0-9]*?\}|[a-zA-Zа-яА-я0-9])/,
			bracket:   /(?:(?:\\left|\\right)?[\{\}\[\]\(\)\|])/,
			keyword:   /\\[a-zA-Zа-яА-я]+[\*]?/,
			keyword2:  /\\[^a-zA-Zа-яА-я0-9]/,
			keyword3:  /&/,
			delimeter: /\$\$/
		}
	})
	.addRunIn({
		paragraph: {
			allowedBlocks : ['paragraph', 'quote', 'list']
		}
	})
	.addMarkers({
		list:  /^([ ]{0,3}(?:[+\-\*]|\d+\.)[ \t]+)([\s\S]*)$/,
		quote: /^([ ]{0,3}(?:>[ \t]*)+)([\s\S]*)$/
	});
;'use strict';

/**
 * DOMContentLoaded polyfill
 *
 * @param fn
 */
function documentReady(fn) {
	if (document.readyState != 'loading') {
		fn();
	}
	else {
		document.addEventListener('DOMContentLoaded', fn);
	}
}

/**
 * Find the index of a maximum value in values array
 * which is less than maxValue.
 *
 * @param maxValue
 * @param values
 *
 * @returns {object}
 */
function findBisect(maxValue, values) {
	var a = 0,
		b = values.length - 1,
		f_a = values[a];

	if (f_a >= maxValue) {
		return {val: a, part: 0};
	}

	var f_b = values[b];
	if (f_b < maxValue) {
		return {val: b, part: 0};
	}

	while (b - a > 1) {
		var c = a + Math.round((b - a) / 2),
			f_c = values[c];

		if (f_c >= maxValue) {
			b = c;
			f_b = f_c;
		}
		else {
			a = c;
			f_a = f_c;
		}
	}

	return {val: a, part: (maxValue - f_a) / (f_b - f_a)};
}

/**
 * Count the number of occurances of a substring in a string
 *
 * @param substr
 * @param str
 * @returns {number}
 */
function substrCount(substr, str) {
	var count = -1,
		index = -2;

	while (index != -1) {
		count++;
		index = str.indexOf(substr, index + 1)
	}

	return count;
}

/**
 * Selects the content of the given DOM node.
 *
 * @param eNode
 */
function selectText(eNode) {
	if (!window.getSelection) {
		return;
	}

	var selection = window.getSelection(),
		range = document.createRange();

	range.selectNodeContents(eNode);
	selection.removeAllRanges();
	selection.addRange(range);
}

/**
 * Realistic animation module based on one-dimensional physical model.
 *
 * @param positionGetter
 * @param positionSetter
 * @constructor
 */
function Animator(positionGetter, positionSetter) {
	var x = 0,
		x1 = 0,
		x2 = 0,
		v = 0,
		animationTime = 200,
		timerId,
		startedAt = null;

	var loop = function (timestamp) {
		if (startedAt === null) {
			startedAt = timestamp;
		}

		var moveTime = timestamp - startedAt;

		if (moveTime < moveDuration) {
			// New position and velocity
			x = x2 + A * (Math.cos(omega * (moveTime - moveDuration)) - 1);
			v = A * omega * (Math.sin(omega * (moveDuration - moveTime)));

			positionSetter(x);

			timerId = requestAnimationFrame(loop);

			if (isReInit) {
				/**
				 * If the position has been forced, we run the animation again.
				 */
				initMotion(reInitPosition, x);
				isReInit = false;
				startedAt = timestamp;
			}
		}
		else {
			// Stop the animation
			startedAt = null;

			v = 0;
			positionSetter(x2);
			cancelAnimationFrame(timerId);

			if (isReInit) {
				isReInit = false;
			}
		}
	};

	/**
	 * The moveDuration of animation. It can be less than animationTime in case of high speed.
	 */
	var moveDuration;

	/**
	 * Motion parameters. See the loop formulas.
	 */
	var A, omega;

	/**
	 * Flag fired when the final position has been changed during running amination.
	 */
	var isReInit = false;

	/**
	 * New value for final position (that has been changed during running amination).
	 */
	var reInitPosition;

	/**
	 * Calculate parameters A and omega for the position given by formula
	 *
	 * x(t) = x0 + A * (Math.cos(omega * (t - t0)) - 1);
	 *
	 * @param newPosition
	 * @param oldPosition
	 */
	function initMotion(newPosition, oldPosition) {
		var k;
		x2 = newPosition;
		x1 = oldPosition;

		if (Math.abs(v) < 0.00001) {
			// Rest
			k = Math.PI;
			moveDuration = animationTime;
		}
		else {
			// Motion

			var alpha = (x2 - x1) / v / animationTime; // Motion parameter

			/**
			 * Instead of solving non-linear equation alpha * k = tan(k/2)
			 * we use approximation 0.5/a = 1 - (k/pi)^2
			 */
			if (alpha < 0 || alpha > 0.5) {
				k = Math.PI * Math.sqrt(1 - 0.5 / alpha);
			}
			else {
				k = 0.1;
			}

			/**
			 * After approximate value of k is determined, we redefine alpha
			 * since its value affects the animation. It means that the total
			 * animation duration (moveDuration) differs from animationTime.
			 * However, the difference does not impact the user experience.
			 */
			var alpha1 = (1 - Math.cos(k)) / k / Math.sin(k);
			moveDuration = (x2 - x1) / alpha1 / v;
		}

		omega = k / moveDuration;
		A = (x2 - x1) / (1 - Math.cos(k));
	}

	/**
	 * Public control method
	 *
	 * @param nextPos
	 */
	this.setPos = function (nextPos) {
		isReInit = (startedAt !== null);
		if (!isReInit) {
			x = positionGetter();
			initMotion(nextPos, x);
			timerId = requestAnimationFrame(loop);
		}
		else {
			reInitPosition = nextPos;
		}
	};

	this.stop = function () {
		startedAt = null;
		v = 0;
		cancelAnimationFrame(timerId);
		isReInit = false;
	};
}

function escapeRegExp(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

/**
 * See http://stackoverflow.com/questions/1144783/replacing-all-occurrences-of-a-string-in-javascript
 * @param search
 * @param replacement
 * @returns {string}
 */
String.prototype.replaceAll = function (search, replacement) {
	var target = this;
	return target.replace(new RegExp(escapeRegExp(search), 'g'), replacement);
};

/**
 *
 * @constructor
 */
function ImagePreloader() {
	var data = {},
		uniqueIndex = 0;

	function ajaxReady() {
		var svg;

		if (this.status >= 200 && this.status < 400) {
			svg = this.responseText;
		}
		else {
			// We reached our target server, but it returned an error
			svg = '<svg height="24" version="1.1" width="24" xmlns="http://www.w3.org/2000/svg">' +
				'<g transform="translate(0 -1028.4)">' +
				'<path d="m22 12c0 5.523-4.477 10-10 10-5.5228 0-10-4.477-10-10 0-5.5228 4.4772-10 10-10 5.523 0 10 4.4772 10 10z" fill="#742600" transform="translate(0 1029.4)"/>' +
				'<path d="m22 12c0 5.523-4.477 10-10 10-5.5228 0-10-4.477-10-10 0-5.5228 4.4772-10 10-10 5.523 0 10 4.4772 10 10z" fill="#AB562B" transform="translate(0 1028.4)"/>' +
				'<path d="m7.0503 1037.8 3.5357 3.6-3.5357 3.5 1.4142 1.4 3.5355-3.5 3.536 3.5 1.414-1.4-3.536-3.5 3.536-3.6-1.414-1.4-3.536 3.5-3.5355-3.5-1.4142 1.4z" fill="#742600"/>' +
				'<path d="m7.0503 1036.8 3.5357 3.6-3.5357 3.5 1.4142 1.4 3.5355-3.5 3.536 3.5 1.414-1.4-3.536-3.5 3.536-3.6-1.414-1.4-3.536 3.5-3.5355-3.5-1.4142 1.4z" fill="#ecf0f1"/>' +
				'</g>' +
				'</svg>';
		}
		setImage(this.responseURL || this.s2Url, svg)
	}

	function loadImage(url) {
		var request = new XMLHttpRequest();
		request.open('GET', url, true);
		request.s2Url = url;
		request.onload = ajaxReady;
		request.onerror = function () {
			// There was a connection error of some sort
		};
		request.send();

		return request;
	}

	this.onLoad = function (url, callback) {
		if (!data[url]) {
			data[url] = {
				svg: null,
				baseline: null,
				request: loadImage(url),
				callback: callback
			};
		}
		else if (data[url].svg !== null) {
			callback(url, data[url].svg, data[url].baseline)
		}
		// In case of duplicate pictures we skip duplicates (when data[url].svg === null)
	};

	/**
	 * Make ids in svg unique across the html code by adding a prefix.
	 *
	 * @param svg
	 * @returns {*}
	 */
	function makeSvgIdsUnique(svg) {
		var m = svg.match(/id=["']([^"']*)["']/g);

		if (!m) {
			return svg;
		}

		var i = m.length,
			id, newId, curStr;

		for (; i--;) {
			curStr = m[i];
			id = curStr.match(/id=["']([^"']*)["']/)[1];
			newId = 's' + uniqueIndex + id;

			svg = svg
				.replaceAll(curStr, 'id="' + newId + '"')
				.replaceAll('#' + id, '#' + newId)
			;
		}

		uniqueIndex++;

		return svg;
	}

	/**
	 * Stores sizes, source and removes the xhr object.
	 * @param url
	 * @param svg
	 */
	var setImage = function (url, svg) {
		var urlData = data[url];
		if (!urlData) {
			return;
		}

		svg = makeSvgIdsUnique(svg);

		var m = svg.match(/postMessage\((?:&quot;|")([\d\|\.\-eE]*)(?:&quot;|")/); // ["&quot;2.15299|31.42377|11.65223|&quot;", "2.15299|31.42377|11.65223|"]
		if (m) {
			var baselineShift = m && m[1] ? m[1].split('|').shift() : 0; // 2.15299
		}
		else {
			// svg can be empty like "<svg xmlns="http://www.w3.org/2000/svg"/>"
			// Mark as something is wrong.
			baselineShift = null;
		}

		urlData.callback(url, svg, baselineShift);

		urlData.svg = svg;
		urlData.baseline = baselineShift;
		urlData.request = null;
		urlData.callback = null;
	};

	/**
	 * External API
	 *
	 * @param url
	 * @returns {null}
	 */
	this.getImageDataFromUrl = function (url) {
		var urlData = data[url];
		return urlData ? urlData : null;
	};
}

/**
 *
 * @param preloader
 * @param protocol  Needed for support the "file:" protocol.
 * @constructor
 */
function ImageLoader(preloader, protocol) {
	var curItems = [],  // current formula content
		prevItems = [], // previous formula content
		map = {},       // maps formula content to index
		n = 0,          // current formula number

		placeholderTimer = null,
		placeholderIndex = null,
		placeholderUrl = null;

	/**
	 * Find if user has edited only one formula formula.
	 */
	function detectPlaceholderFormula() {
		if (n == prevItems.length) {
			var editNum = 0, index, i = n;

			for (; i--;) {
				if (curItems[i] != prevItems[i]) {
					editNum++;
					index = i;
				}
			}

			if (editNum == 1) {
				if (placeholderIndex === null) {
					// A formula has been changed.
					// Use previous one as a placeholder.
					placeholderIndex = index;
					placeholderUrl = prevItems[index];
					return;
				}
				if (placeholderIndex === index) {
					// Formula has been changed again since previous change,
					// but the previous image has not been loaded yet.
					// Keep previous placeholder.
					return;
				}
			}
		}

		// Many formulas has been changed. We do not display any placeholders.
		placeholderIndex = null;
		placeholderUrl = null;
	}

	function buildMap() {
		map = {};
		for (var i = n; i--;) {
			var url = curItems[i];

			if (typeof map[url] === 'undefined') {
				map[url] = [i]
			}
			else {
				map[url].push(i);
			}
		}
	}

	/**
	 * Start parsing process.
	 */
	this.reset = function () {
		curItems = [];
		n = 0;
	};

	/**
	 * Insert SVG images.
	 *
	 * @param url
	 * @param svg
	 * @param baselineShift
	 */
	var callback = function (url, svg, baselineShift) {
		var indexes = map[url], i;

		if (indexes && (i = indexes.length)) {
			for (; i--;) {
				var index = indexes[i];

				insertPicture(index, svg, baselineShift, index === placeholderIndex ? 'fade-in' : 'replace');

				if (index === placeholderIndex) {
					// Clear the fade out timer if the new image has just bee
					clearTimeout(placeholderTimer);
					placeholderIndex = null;
					placeholderUrl = null;
				}
			}
		}
	};

	/**
	 * Mark formula as loading.
	 * Use previous image but transparent.
	 *
	 * @param index
	 * @param svg
	 * @param baselineShift
	 * @param mode One of 'replace', 'fade-in', 'fade-out'
	 */
	function insertPicture(index, svg, baselineShift, mode) {
		var id = 's2tex_' + index,
			oldSvgNode = document.getElementById(id),
			parentNode = oldSvgNode.parentNode,
			startOpacity = '1', // mode == 'fade-in' ? '0.5' : '1', // sometimes images opacity can be '1' yet. How can one track it?
			finalOpacity = mode == 'fade-out' ? '0.5' : '1',
			newSvgAttrs = '<svg class="svg-preview" id="' + id + '" ';

		if (baselineShift === null) {
			// svg has been loaded but something went wrong.
			newSvgAttrs += 'width="13px" height="13px" ';
		}
		else {
			newSvgAttrs += 'style="vertical-align:' + (-baselineShift) + 'pt; opacity: ' + startOpacity + '" ';
		}

		// Polyfill for outerHTML
		var divNode = document.createElement('div');
		divNode.innerHTML = svg.replace('<svg ', newSvgAttrs);

		var newSvgNode = divNode.firstElementChild; // there can be comments before <svg>
		divNode.removeChild(newSvgNode);

		parentNode.insertBefore(newSvgNode, oldSvgNode);
		parentNode.removeChild(oldSvgNode);

		if (finalOpacity != startOpacity) {
			placeholderTimer = setTimeout(function () {
				document.getElementById(id).style.opacity = finalOpacity;
			}, 0);
		}
	}

	/**
	 * Finish the parsing process.
	 */
	this.fixDom = function () {
		detectPlaceholderFormula();
		buildMap();
		for (var i = n; i--;) {
			preloader.onLoad(curItems[i], callback);
		}

		if (placeholderIndex !== null) {
			var data = preloader.getImageDataFromUrl(placeholderUrl);
			if (data !== null && data.callback === null) {
				insertPicture(placeholderIndex, data.svg, data.baseline, 'fade-out');
			}
		}

		prevItems = curItems.slice(0);
	};
}

/**
 * Access to the map between blocks in sync scroll.
 *
 * @param mapBuilder
 * @constructor
 */
function ScrollMap(mapBuilder) {
	var map = null;

	this.reset = function () {
		map = [null, null];
	};

	this.getPosition = function (eBlockNode, fromIndex, toIndex) {
		var offsetHeight = eBlockNode.offsetHeight;
		var scrollTop    = eBlockNode.scrollTop;

		if (scrollTop == 0) {
			return 0;
		}

		if (map[fromIndex] === null) {
			map = mapBuilder();
		}

		var maxMapIndex = map[fromIndex].length - 1;
		if (map[fromIndex][maxMapIndex] <= scrollTop + offsetHeight) {
			return map[toIndex][maxMapIndex] - offsetHeight
		}

		var scrollShift    = offsetHeight / 2,
			scrollLevel    = scrollTop + scrollShift,
			blockIndex     = findBisect(scrollLevel, map[fromIndex]),
			srcScrollLevel = parseFloat(map[toIndex][blockIndex.val] * (1 - blockIndex.part));

		if (map[toIndex][blockIndex.val + 1]) {
			srcScrollLevel += parseFloat(map[toIndex][blockIndex.val + 1] * blockIndex.part);
		}

		return srcScrollLevel - scrollShift;
	}
}

/**
 * Controls sync scroll of the source and preview blocks
 *
 * @param scrollMap
 * @param animatorSrc
 * @param animatorResult
 * @param eSrc
 * @param eResult
 * @param eContainer
 * @constructor
 */
function SyncScroll(scrollMap, animatorSrc, animatorResult, eSrc, eResult, eContainer) {
	// Synchronize scroll position from source to result
	var syncResultScroll = function () {
		animatorResult.setPos(scrollMap.getPosition(eSrc, 0, 1));
	};

	// Synchronize scroll position from result to source
	var syncSrcScroll = function () {
		animatorSrc.setPos(scrollMap.getPosition(eResult, 1, 0));
	};

	this.switchScrollToSrc = function () {
		eResult.removeEventListener('scroll', syncSrcScroll);
		eSrc.removeEventListener('scroll', syncResultScroll);
		eSrc.addEventListener('scroll', syncResultScroll);
		eContainer.id = 'container-block-source';
		// animatorSrc.stop();
	};

	this.switchScrollToResult = function () {
		eSrc.removeEventListener('scroll', syncResultScroll);
		eResult.removeEventListener('scroll', syncSrcScroll);
		eResult.addEventListener('scroll', syncSrcScroll);
		eContainer.id = 'container-block-result';
		// animatorResult.stop();
	}
}

/**
 * Functions from lodash.js
 * @see https://github.com/lodash/lodash/
 */

var now = Date.now || function () {
		return new Date().getTime();
	};

function debounce(func, wait, options) {
	var args,
		maxTimeoutId,
		result,
		stamp,
		thisArg,
		timeoutId,
		trailingCall,
		lastCalled = 0,
		leading = false,
		maxWait = false,
		trailing = true;

	if (typeof func != 'function') {
		throw new TypeError(FUNC_ERROR_TEXT);
	}
	wait = wait < 0 ? 0 : (+wait || 0);
	if (typeof options === 'object') {
		leading = !!options.leading;
		maxWait = 'maxWait' in options && Math.max(+options.maxWait || 0, wait);
		trailing = 'trailing' in options ? !!options.trailing : trailing;
	}

	function cancel() {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
		if (maxTimeoutId) {
			clearTimeout(maxTimeoutId);
		}
		lastCalled = 0;
		maxTimeoutId = timeoutId = trailingCall = undefined;
	}

	function complete(isCalled, id) {
		if (id) {
			clearTimeout(id);
		}
		maxTimeoutId = timeoutId = trailingCall = undefined;
		if (isCalled) {
			lastCalled = now();
			result = func.apply(thisArg, args);
			if (!timeoutId && !maxTimeoutId) {
				args = thisArg = undefined;
			}
		}
	}

	function delayed() {
		var remaining = wait - (now() - stamp);
		if (remaining <= 0 || remaining > wait) {
			complete(trailingCall, maxTimeoutId);
		} else {
			timeoutId = setTimeout(delayed, remaining);
		}
	}

	function maxDelayed() {
		complete(trailing, timeoutId);
	}

	function debounced() {
		args = arguments;
		stamp = now();
		thisArg = this;
		trailingCall = trailing && (timeoutId || !leading);

		if (maxWait === false) {
			var leadingCall = leading && !timeoutId;
		} else {
			if (!maxTimeoutId && !leading) {
				lastCalled = stamp;
			}
			var remaining = maxWait - (stamp - lastCalled),
				isCalled = remaining <= 0 || remaining > maxWait;

			if (isCalled) {
				if (maxTimeoutId) {
					maxTimeoutId = clearTimeout(maxTimeoutId);
				}
				lastCalled = stamp;
				result = func.apply(thisArg, args);
			}
			else if (!maxTimeoutId) {
				maxTimeoutId = setTimeout(maxDelayed, remaining);
			}
		}
		if (isCalled && timeoutId) {
			timeoutId = clearTimeout(timeoutId);
		}
		else if (!timeoutId && wait !== maxWait) {
			timeoutId = setTimeout(delayed, wait);
		}
		if (leadingCall) {
			isCalled = true;
			result = func.apply(thisArg, args);
		}
		if (isCalled && !timeoutId && !maxTimeoutId) {
			args = thisArg = undefined;
		}
		return result;
	}
	debounced.cancel = cancel;
	return debounced;
}
;/**
 * TextareaDecorator.js
 * written by Colin Kuebler 2012
 * Updated by Roman Parpalak, 2015.
 * Part of LDT, dual licensed under GPLv3 and MIT
 * Builds and maintains a styled output layer under a textarea input layer
 */

function TextareaDecorator(textarea, parser) {
	/* INIT */
	var api = this,
		output;

	if (textarea.className !== 'ldt-textarea') {
		// construct editor DOM
		var parent = document.createElement("div");
		output = document.createElement("pre");
		output.className = 'ldt-pre';
		parent.appendChild(output);

		var label = document.createElement("label");
		label.className = 'ldt-label';

		parent.appendChild(label);

		// replace the textarea with RTA DOM and reattach on label
		textarea.parentNode.replaceChild(parent, textarea);
		label.appendChild(textarea);

		// transfer the CSS styles to our editor
		parent.className = 'ldt ' + textarea.className;
		textarea.className = 'ldt-textarea';
	} else {
		output = textarea.parentNode.previousSibling;
	}

	/**
	 * Composes token class.
	 *
	 * Tokens are grouped into blocks.
	 * Also a token have its own type.
	 *
	 * @param blockClass  token block type
	 * @param inlineClass token type
	 * @returns {string}
	 */
	function getClass(blockClass, inlineClass) {
		return blockClass + ' ' + inlineClass;
	}

	/**
	 * Detect changes between a token and its DOM representation.
	 *
	 * @param newToken hash object
	 * @param oldNode  DOM node converted from old hash object
	 *
	 * @returns {boolean}
	 */
	function compareTokens(newToken, oldNode) {
		if (newToken.token !== oldNode.textContent) {
			return false;
		}

		var className = oldNode.className,
			oldBlock = className.slice(0, className.indexOf(' '));

		if (oldBlock !== newToken.block) {
			return false;
		}

		var line = oldNode.getAttribute('data-line');

		if (line && line != newToken.line) {
			return false;
		}

		return true;
	}

	/**
	 * Updates a DOM node by a token
	 *
	 * @param node
	 * @param token
	 * @param inlineClass
	 */
	function fillTokenNode(node, token, inlineClass) {
		node.textContent = node.innerText = token.token;

		var c = getClass(token.block, inlineClass);

		if (token.line) {
			node.className = c + ' block-start';
			node.setAttribute('data-line', token.line);
		}
		else {
			node.className = c;
		}
	}

	// coloring algorithm
	var color = function (input, output, parser) {
		var lastChar = input !== '' && input.substring(input.length - 1) || '';
		if (lastChar == "\r" || lastChar == "\n") {
			// Hack for the case when the last line in textarea is empty
			input += ' ';
		}

		var nodes = output.childNodes,
			tokens = parser.tokenize(input),
			firstDiff, lastDiffNew, lastDiffOld;

		// find the first difference
		for (firstDiff = 0; firstDiff < tokens.length && firstDiff < nodes.length; firstDiff++) {
			if (!compareTokens(tokens[firstDiff], nodes[firstDiff])) {
				break;
			}
		}

		// trim the length of output nodes to the size of the input
		while (tokens.length < nodes.length) {
			output.removeChild(nodes[firstDiff]);
		}

		// find the last difference
		for (lastDiffNew = tokens.length - 1, lastDiffOld = nodes.length - 1; firstDiff < lastDiffOld; lastDiffNew--, lastDiffOld--) {
			if (!compareTokens(tokens[lastDiffNew], nodes[lastDiffOld])) {
				break;
			}
		}

		// update modified nodes
		for (; firstDiff <= lastDiffOld; firstDiff++) {
			var token = tokens[firstDiff];
			fillTokenNode(nodes[firstDiff], token, parser.identifyInline(token));
		}

		// add in modified nodes
		for (var insertionPt = nodes[firstDiff] || null; firstDiff <= lastDiffNew; firstDiff++) {
			var span = document.createElement("span");
			token = tokens[firstDiff];
			fillTokenNode(span, token, parser.identifyInline(token));
			output.insertBefore(span, insertionPt);
		}
	};

	api.input = textarea;
	api.output = output;
	api.recalcHeight = function () {
		api.input.style.height = Math.max(api.output.offsetHeight, 100) + 'px';
	};
	api.update = function () {
		var input = textarea.value;
		if (input) {
			color(input, output, parser);

		} else {
			// clear the display
			output.innerHTML = '';
		}
		api.recalcHeight();
	};

	// detect all changes to the textarea,
	// including keyboard input, cut/copy/paste, drag & drop, etc
	if (textarea.addEventListener) {
		// standards browsers: oninput event
		textarea.addEventListener("input", api.update, false);
	} else {
		// MSIE: detect changes to the 'value' property
		textarea.attachEvent("onpropertychange",
			function (e) {
				if (e.propertyName.toLowerCase() === 'value') {
					api.update();
				}
			}
		);
	}
	// initial highlighting
	api.update();

	return api;
}

/* FileSaver.js
 * A saveAs() FileSaver implementation.
 * 2015-05-07.2
 *
 * By Eli Grey, http://eligrey.com
 * License: X11/MIT
 *   See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
 */

/*global self */
/*jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */

var saveAs = saveAs || (function(view) {
	"use strict";
	// IE <10 is explicitly unsupported
	if (typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
		return;
	}
	var
		  doc = view.document
		  // only get URL when necessary in case Blob.js hasn't overridden it yet
		, get_URL = function() {
			return view.URL || view.webkitURL || view;
		}
		, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
		, can_use_save_link = "download" in save_link
		, click = function(node) {
			var event = doc.createEvent("MouseEvents");
			event.initMouseEvent(
				"click", true, false, view, 0, 0, 0, 0, 0
				, false, false, false, false, 0, null
			);
			node.dispatchEvent(event);
		}
		, webkit_req_fs = view.webkitRequestFileSystem
		, req_fs = view.requestFileSystem || webkit_req_fs || view.mozRequestFileSystem
		, throw_outside = function(ex) {
			(view.setImmediate || view.setTimeout)(function() {
				throw ex;
			}, 0);
		}
		, force_saveable_type = "application/octet-stream"
		, fs_min_size = 0
		// See https://code.google.com/p/chromium/issues/detail?id=375297#c7 and
		// https://github.com/eligrey/FileSaver.js/commit/485930a#commitcomment-8768047
		// for the reasoning behind the timeout and revocation flow
		, arbitrary_revoke_timeout = 500 // in ms
		, revoke = function(file) {
			var revoker = function() {
				if (typeof file === "string") { // file is an object URL
					get_URL().revokeObjectURL(file);
				} else { // file is a File
					file.remove();
				}
			};
			if (view.chrome) {
				revoker();
			} else {
				setTimeout(revoker, arbitrary_revoke_timeout);
			}
		}
		, dispatch = function(filesaver, event_types, event) {
			event_types = [].concat(event_types);
			var i = event_types.length;
			while (i--) {
				var listener = filesaver["on" + event_types[i]];
				if (typeof listener === "function") {
					try {
						listener.call(filesaver, event || filesaver);
					} catch (ex) {
						throw_outside(ex);
					}
				}
			}
		}
		, auto_bom = function(blob) {
			// prepend BOM for UTF-8 XML and text/* types (including HTML)
			if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
				return new Blob(["\ufeff", blob], {type: blob.type});
			}
			return blob;
		}
		, FileSaver = function(blob, name) {
			blob = auto_bom(blob);
			// First try a.download, then web filesystem, then object URLs
			var
				  filesaver = this
				, type = blob.type
				, blob_changed = false
				, object_url
				, target_view
				, dispatch_all = function() {
					dispatch(filesaver, "writestart progress write writeend".split(" "));
				}
				// on any filesys errors revert to saving with object URLs
				, fs_error = function() {
					// don't create more object URLs than needed
					if (blob_changed || !object_url) {
						object_url = get_URL().createObjectURL(blob);
					}
					if (target_view) {
						target_view.location.href = object_url;
					} else {
						var new_tab = view.open(object_url, "_blank");
						if (new_tab == undefined && typeof safari !== "undefined") {
							//Apple do not allow window.open, see http://bit.ly/1kZffRI
							view.location.href = object_url
						}
					}
					filesaver.readyState = filesaver.DONE;
					dispatch_all();
					revoke(object_url);
				}
				, abortable = function(func) {
					return function() {
						if (filesaver.readyState !== filesaver.DONE) {
							return func.apply(this, arguments);
						}
					};
				}
				, create_if_not_found = {create: true, exclusive: false}
				, slice
			;
			filesaver.readyState = filesaver.INIT;
			if (!name) {
				name = "download";
			}
			if (can_use_save_link) {
				object_url = get_URL().createObjectURL(blob);
				save_link.href = object_url;
				save_link.download = name;
				click(save_link);
				filesaver.readyState = filesaver.DONE;
				dispatch_all();
				revoke(object_url);
				return;
			}
			// Object and web filesystem URLs have a problem saving in Google Chrome when
			// viewed in a tab, so I force save with application/octet-stream
			// http://code.google.com/p/chromium/issues/detail?id=91158
			// Update: Google errantly closed 91158, I submitted it again:
			// https://code.google.com/p/chromium/issues/detail?id=389642
			if (view.chrome && type && type !== force_saveable_type) {
				slice = blob.slice || blob.webkitSlice;
				blob = slice.call(blob, 0, blob.size, force_saveable_type);
				blob_changed = true;
			}
			// Since I can't be sure that the guessed media type will trigger a download
			// in WebKit, I append .download to the filename.
			// https://bugs.webkit.org/show_bug.cgi?id=65440
			if (webkit_req_fs && name !== "download") {
				name += ".download";
			}
			if (type === force_saveable_type || webkit_req_fs) {
				target_view = view;
			}
			if (!req_fs) {
				fs_error();
				return;
			}
			fs_min_size += blob.size;
			req_fs(view.TEMPORARY, fs_min_size, abortable(function(fs) {
				fs.root.getDirectory("saved", create_if_not_found, abortable(function(dir) {
					var save = function() {
						dir.getFile(name, create_if_not_found, abortable(function(file) {
							file.createWriter(abortable(function(writer) {
								writer.onwriteend = function(event) {
									target_view.location.href = file.toURL();
									filesaver.readyState = filesaver.DONE;
									dispatch(filesaver, "writeend", event);
									revoke(file);
								};
								writer.onerror = function() {
									var error = writer.error;
									if (error.code !== error.ABORT_ERR) {
										fs_error();
									}
								};
								"writestart progress write abort".split(" ").forEach(function(event) {
									writer["on" + event] = filesaver["on" + event];
								});
								writer.write(blob);
								filesaver.abort = function() {
									writer.abort();
									filesaver.readyState = filesaver.DONE;
								};
								filesaver.readyState = filesaver.WRITING;
							}), fs_error);
						}), fs_error);
					};
					dir.getFile(name, {create: false}, abortable(function(file) {
						// delete file if it already exists
						file.remove();
						save();
					}), abortable(function(ex) {
						if (ex.code === ex.NOT_FOUND_ERR) {
							save();
						} else {
							fs_error();
						}
					}));
				}), fs_error);
			}), fs_error);
		}
		, FS_proto = FileSaver.prototype
		, saveAs = function(blob, name) {
			return new FileSaver(blob, name);
		}
	;
	// IE 10+ (native saveAs)
	if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
		return function(blob, name) {
			return navigator.msSaveOrOpenBlob(auto_bom(blob), name);
		};
	}

	FS_proto.abort = function() {
		var filesaver = this;
		filesaver.readyState = filesaver.DONE;
		dispatch(filesaver, "abort");
	};
	FS_proto.readyState = FS_proto.INIT = 0;
	FS_proto.WRITING = 1;
	FS_proto.DONE = 2;

	FS_proto.error =
	FS_proto.onwritestart =
	FS_proto.onprogress =
	FS_proto.onwrite =
	FS_proto.onabort =
	FS_proto.onerror =
	FS_proto.onwriteend =
		null;

	return saveAs;
}(
	   typeof self !== "undefined" && self
	|| typeof window !== "undefined" && window
	|| this.content
));
// `self` is undefined in Firefox for Android content script context
// while `this` is nsIContentFrameMessageManager
// with an attribute `content` that corresponds to the window

if (typeof module !== "undefined" && module.exports) {
  module.exports.saveAs = saveAs;
} else if ((typeof define !== "undefined" && define !== null) && (define.amd != null)) {
  define([], function() {
    return saveAs;
  });
};/*!
 * Draggabilly PACKAGED v2.2.0
 * Make that shiz draggable
 * https://draggabilly.desandro.com
 * MIT license
 */

/**
 * Bridget makes jQuery widgets
 * v2.0.1
 * MIT license
 */

/* jshint browser: true, strict: true, undef: true, unused: true */

( function( window, factory ) {
  // universal module definition
  /*jshint strict: false */ /* globals define, module, require */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'jquery-bridget/jquery-bridget',[ 'jquery' ], function( jQuery ) {
      return factory( window, jQuery );
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      window,
      require('jquery')
    );
  } else {
    // browser global
    window.jQueryBridget = factory(
      window,
      window.jQuery
    );
  }

}( window, function factory( window, jQuery ) {
'use strict';

// ----- utils ----- //

var arraySlice = Array.prototype.slice;

// helper function for logging errors
// $.error breaks jQuery chaining
var console = window.console;
var logError = typeof console == 'undefined' ? function() {} :
  function( message ) {
    console.error( message );
  };

// ----- jQueryBridget ----- //

function jQueryBridget( namespace, PluginClass, $ ) {
  $ = $ || jQuery || window.jQuery;
  if ( !$ ) {
    return;
  }

  // add option method -> $().plugin('option', {...})
  if ( !PluginClass.prototype.option ) {
    // option setter
    PluginClass.prototype.option = function( opts ) {
      // bail out if not an object
      if ( !$.isPlainObject( opts ) ){
        return;
      }
      this.options = $.extend( true, this.options, opts );
    };
  }

  // make jQuery plugin
  $.fn[ namespace ] = function( arg0 /*, arg1 */ ) {
    if ( typeof arg0 == 'string' ) {
      // method call $().plugin( 'methodName', { options } )
      // shift arguments by 1
      var args = arraySlice.call( arguments, 1 );
      return methodCall( this, arg0, args );
    }
    // just $().plugin({ options })
    plainCall( this, arg0 );
    return this;
  };

  // $().plugin('methodName')
  function methodCall( $elems, methodName, args ) {
    var returnValue;
    var pluginMethodStr = '$().' + namespace + '("' + methodName + '")';

    $elems.each( function( i, elem ) {
      // get instance
      var instance = $.data( elem, namespace );
      if ( !instance ) {
        logError( namespace + ' not initialized. Cannot call methods, i.e. ' +
          pluginMethodStr );
        return;
      }

      var method = instance[ methodName ];
      if ( !method || methodName.charAt(0) == '_' ) {
        logError( pluginMethodStr + ' is not a valid method' );
        return;
      }

      // apply method, get return value
      var value = method.apply( instance, args );
      // set return value if value is returned, use only first value
      returnValue = returnValue === undefined ? value : returnValue;
    });

    return returnValue !== undefined ? returnValue : $elems;
  }

  function plainCall( $elems, options ) {
    $elems.each( function( i, elem ) {
      var instance = $.data( elem, namespace );
      if ( instance ) {
        // set options & init
        instance.option( options );
        instance._init();
      } else {
        // initialize new instance
        instance = new PluginClass( elem, options );
        $.data( elem, namespace, instance );
      }
    });
  }

  updateJQuery( $ );

}

// ----- updateJQuery ----- //

// set $.bridget for v1 backwards compatibility
function updateJQuery( $ ) {
  if ( !$ || ( $ && $.bridget ) ) {
    return;
  }
  $.bridget = jQueryBridget;
}

updateJQuery( jQuery || window.jQuery );

// -----  ----- //

return jQueryBridget;

}));

/*!
 * getSize v2.0.2
 * measure size of elements
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true, unused: true */
/*global define: false, module: false, console: false */

( function( window, factory ) {
  'use strict';

  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'get-size/get-size',[],function() {
      return factory();
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory();
  } else {
    // browser global
    window.getSize = factory();
  }

})( window, function factory() {
'use strict';

// -------------------------- helpers -------------------------- //

// get a number from a string, not a percentage
function getStyleSize( value ) {
  var num = parseFloat( value );
  // not a percent like '100%', and a number
  var isValid = value.indexOf('%') == -1 && !isNaN( num );
  return isValid && num;
}

function noop() {}

var logError = typeof console == 'undefined' ? noop :
  function( message ) {
    console.error( message );
  };

// -------------------------- measurements -------------------------- //

var measurements = [
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'paddingBottom',
  'marginLeft',
  'marginRight',
  'marginTop',
  'marginBottom',
  'borderLeftWidth',
  'borderRightWidth',
  'borderTopWidth',
  'borderBottomWidth'
];

var measurementsLength = measurements.length;

function getZeroSize() {
  var size = {
    width: 0,
    height: 0,
    innerWidth: 0,
    innerHeight: 0,
    outerWidth: 0,
    outerHeight: 0
  };
  for ( var i=0; i < measurementsLength; i++ ) {
    var measurement = measurements[i];
    size[ measurement ] = 0;
  }
  return size;
}

// -------------------------- getStyle -------------------------- //

/**
 * getStyle, get style of element, check for Firefox bug
 * https://bugzilla.mozilla.org/show_bug.cgi?id=548397
 */
function getStyle( elem ) {
  var style = getComputedStyle( elem );
  if ( !style ) {
    logError( 'Style returned ' + style +
      '. Are you running this code in a hidden iframe on Firefox? ' +
      'See http://bit.ly/getsizebug1' );
  }
  return style;
}

// -------------------------- setup -------------------------- //

var isSetup = false;

var isBoxSizeOuter;

/**
 * setup
 * check isBoxSizerOuter
 * do on first getSize() rather than on page load for Firefox bug
 */
function setup() {
  // setup once
  if ( isSetup ) {
    return;
  }
  isSetup = true;

  // -------------------------- box sizing -------------------------- //

  /**
   * WebKit measures the outer-width on style.width on border-box elems
   * IE & Firefox<29 measures the inner-width
   */
  var div = document.createElement('div');
  div.style.width = '200px';
  div.style.padding = '1px 2px 3px 4px';
  div.style.borderStyle = 'solid';
  div.style.borderWidth = '1px 2px 3px 4px';
  div.style.boxSizing = 'border-box';

  var body = document.body || document.documentElement;
  body.appendChild( div );
  var style = getStyle( div );

  getSize.isBoxSizeOuter = isBoxSizeOuter = getStyleSize( style.width ) == 200;
  body.removeChild( div );

}

// -------------------------- getSize -------------------------- //

function getSize( elem ) {
  setup();

  // use querySeletor if elem is string
  if ( typeof elem == 'string' ) {
    elem = document.querySelector( elem );
  }

  // do not proceed on non-objects
  if ( !elem || typeof elem != 'object' || !elem.nodeType ) {
    return;
  }

  var style = getStyle( elem );

  // if hidden, everything is 0
  if ( style.display == 'none' ) {
    return getZeroSize();
  }

  var size = {};
  size.width = elem.offsetWidth;
  size.height = elem.offsetHeight;

  var isBorderBox = size.isBorderBox = style.boxSizing == 'border-box';

  // get all measurements
  for ( var i=0; i < measurementsLength; i++ ) {
    var measurement = measurements[i];
    var value = style[ measurement ];
    var num = parseFloat( value );
    // any 'auto', 'medium' value will be 0
    size[ measurement ] = !isNaN( num ) ? num : 0;
  }

  var paddingWidth = size.paddingLeft + size.paddingRight;
  var paddingHeight = size.paddingTop + size.paddingBottom;
  var marginWidth = size.marginLeft + size.marginRight;
  var marginHeight = size.marginTop + size.marginBottom;
  var borderWidth = size.borderLeftWidth + size.borderRightWidth;
  var borderHeight = size.borderTopWidth + size.borderBottomWidth;

  var isBorderBoxSizeOuter = isBorderBox && isBoxSizeOuter;

  // overwrite width and height if we can get it from style
  var styleWidth = getStyleSize( style.width );
  if ( styleWidth !== false ) {
    size.width = styleWidth +
      // add padding and border unless it's already including it
      ( isBorderBoxSizeOuter ? 0 : paddingWidth + borderWidth );
  }

  var styleHeight = getStyleSize( style.height );
  if ( styleHeight !== false ) {
    size.height = styleHeight +
      // add padding and border unless it's already including it
      ( isBorderBoxSizeOuter ? 0 : paddingHeight + borderHeight );
  }

  size.innerWidth = size.width - ( paddingWidth + borderWidth );
  size.innerHeight = size.height - ( paddingHeight + borderHeight );

  size.outerWidth = size.width + marginWidth;
  size.outerHeight = size.height + marginHeight;

  return size;
}

return getSize;

});

/**
 * EvEmitter v1.1.0
 * Lil' event emitter
 * MIT License
 */

/* jshint unused: true, undef: true, strict: true */

( function( global, factory ) {
  // universal module definition
  /* jshint strict: false */ /* globals define, module, window */
  if ( typeof define == 'function' && define.amd ) {
    // AMD - RequireJS
    define( 'ev-emitter/ev-emitter',factory );
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS - Browserify, Webpack
    module.exports = factory();
  } else {
    // Browser globals
    global.EvEmitter = factory();
  }

}( typeof window != 'undefined' ? window : this, function() {



function EvEmitter() {}

var proto = EvEmitter.prototype;

proto.on = function( eventName, listener ) {
  if ( !eventName || !listener ) {
    return;
  }
  // set events hash
  var events = this._events = this._events || {};
  // set listeners array
  var listeners = events[ eventName ] = events[ eventName ] || [];
  // only add once
  if ( listeners.indexOf( listener ) == -1 ) {
    listeners.push( listener );
  }

  return this;
};

proto.once = function( eventName, listener ) {
  if ( !eventName || !listener ) {
    return;
  }
  // add event
  this.on( eventName, listener );
  // set once flag
  // set onceEvents hash
  var onceEvents = this._onceEvents = this._onceEvents || {};
  // set onceListeners object
  var onceListeners = onceEvents[ eventName ] = onceEvents[ eventName ] || {};
  // set flag
  onceListeners[ listener ] = true;

  return this;
};

proto.off = function( eventName, listener ) {
  var listeners = this._events && this._events[ eventName ];
  if ( !listeners || !listeners.length ) {
    return;
  }
  var index = listeners.indexOf( listener );
  if ( index != -1 ) {
    listeners.splice( index, 1 );
  }

  return this;
};

proto.emitEvent = function( eventName, args ) {
  var listeners = this._events && this._events[ eventName ];
  if ( !listeners || !listeners.length ) {
    return;
  }
  // copy over to avoid interference if .off() in listener
  listeners = listeners.slice(0);
  args = args || [];
  // once stuff
  var onceListeners = this._onceEvents && this._onceEvents[ eventName ];

  for ( var i=0; i < listeners.length; i++ ) {
    var listener = listeners[i]
    var isOnce = onceListeners && onceListeners[ listener ];
    if ( isOnce ) {
      // remove listener
      // remove before trigger to prevent recursion
      this.off( eventName, listener );
      // unset once flag
      delete onceListeners[ listener ];
    }
    // trigger listener
    listener.apply( this, args );
  }

  return this;
};

proto.allOff = function() {
  delete this._events;
  delete this._onceEvents;
};

return EvEmitter;

}));

/*!
 * Unipointer v2.3.0
 * base class for doing one thing with pointer event
 * MIT license
 */

/*jshint browser: true, undef: true, unused: true, strict: true */

( function( window, factory ) {
  // universal module definition
  /* jshint strict: false */ /*global define, module, require */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'unipointer/unipointer',[
      'ev-emitter/ev-emitter'
    ], function( EvEmitter ) {
      return factory( window, EvEmitter );
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      window,
      require('ev-emitter')
    );
  } else {
    // browser global
    window.Unipointer = factory(
      window,
      window.EvEmitter
    );
  }

}( window, function factory( window, EvEmitter ) {



function noop() {}

function Unipointer() {}

// inherit EvEmitter
var proto = Unipointer.prototype = Object.create( EvEmitter.prototype );

proto.bindStartEvent = function( elem ) {
  this._bindStartEvent( elem, true );
};

proto.unbindStartEvent = function( elem ) {
  this._bindStartEvent( elem, false );
};

/**
 * Add or remove start event
 * @param {Boolean} isAdd - remove if falsey
 */
proto._bindStartEvent = function( elem, isAdd ) {
  // munge isAdd, default to true
  isAdd = isAdd === undefined ? true : isAdd;
  var bindMethod = isAdd ? 'addEventListener' : 'removeEventListener';

  // default to mouse events
  var startEvent = 'mousedown';
  if ( window.PointerEvent ) {
    // Pointer Events
    startEvent = 'pointerdown';
  } else if ( 'ontouchstart' in window ) {
    // Touch Events. iOS Safari
    startEvent = 'touchstart';
  }
  elem[ bindMethod ]( startEvent, this );
};

// trigger handler methods for events
proto.handleEvent = function( event ) {
  var method = 'on' + event.type;
  if ( this[ method ] ) {
    this[ method ]( event );
  }
};

// returns the touch that we're keeping track of
proto.getTouch = function( touches ) {
  for ( var i=0; i < touches.length; i++ ) {
    var touch = touches[i];
    if ( touch.identifier == this.pointerIdentifier ) {
      return touch;
    }
  }
};

// ----- start event ----- //

proto.onmousedown = function( event ) {
  // dismiss clicks from right or middle buttons
  var button = event.button;
  if ( button && ( button !== 0 && button !== 1 ) ) {
    return;
  }
  this._pointerDown( event, event );
};

proto.ontouchstart = function( event ) {
  this._pointerDown( event, event.changedTouches[0] );
};

proto.onpointerdown = function( event ) {
  this._pointerDown( event, event );
};

/**
 * pointer start
 * @param {Event} event
 * @param {Event or Touch} pointer
 */
proto._pointerDown = function( event, pointer ) {
  // dismiss right click and other pointers
  // button = 0 is okay, 1-4 not
  if ( event.button || this.isPointerDown ) {
    return;
  }

  this.isPointerDown = true;
  // save pointer identifier to match up touch events
  this.pointerIdentifier = pointer.pointerId !== undefined ?
    // pointerId for pointer events, touch.indentifier for touch events
    pointer.pointerId : pointer.identifier;

  this.pointerDown( event, pointer );
};

proto.pointerDown = function( event, pointer ) {
  this._bindPostStartEvents( event );
  this.emitEvent( 'pointerDown', [ event, pointer ] );
};

// hash of events to be bound after start event
var postStartEvents = {
  mousedown: [ 'mousemove', 'mouseup' ],
  touchstart: [ 'touchmove', 'touchend', 'touchcancel' ],
  pointerdown: [ 'pointermove', 'pointerup', 'pointercancel' ],
};

proto._bindPostStartEvents = function( event ) {
  if ( !event ) {
    return;
  }
  // get proper events to match start event
  var events = postStartEvents[ event.type ];
  // bind events to node
  events.forEach( function( eventName ) {
    window.addEventListener( eventName, this );
  }, this );
  // save these arguments
  this._boundPointerEvents = events;
};

proto._unbindPostStartEvents = function() {
  // check for _boundEvents, in case dragEnd triggered twice (old IE8 bug)
  if ( !this._boundPointerEvents ) {
    return;
  }
  this._boundPointerEvents.forEach( function( eventName ) {
    window.removeEventListener( eventName, this );
  }, this );

  delete this._boundPointerEvents;
};

// ----- move event ----- //

proto.onmousemove = function( event ) {
  this._pointerMove( event, event );
};

proto.onpointermove = function( event ) {
  if ( event.pointerId == this.pointerIdentifier ) {
    this._pointerMove( event, event );
  }
};

proto.ontouchmove = function( event ) {
  var touch = this.getTouch( event.changedTouches );
  if ( touch ) {
    this._pointerMove( event, touch );
  }
};

/**
 * pointer move
 * @param {Event} event
 * @param {Event or Touch} pointer
 * @private
 */
proto._pointerMove = function( event, pointer ) {
  this.pointerMove( event, pointer );
};

// public
proto.pointerMove = function( event, pointer ) {
  this.emitEvent( 'pointerMove', [ event, pointer ] );
};

// ----- end event ----- //


proto.onmouseup = function( event ) {
  this._pointerUp( event, event );
};

proto.onpointerup = function( event ) {
  if ( event.pointerId == this.pointerIdentifier ) {
    this._pointerUp( event, event );
  }
};

proto.ontouchend = function( event ) {
  var touch = this.getTouch( event.changedTouches );
  if ( touch ) {
    this._pointerUp( event, touch );
  }
};

/**
 * pointer up
 * @param {Event} event
 * @param {Event or Touch} pointer
 * @private
 */
proto._pointerUp = function( event, pointer ) {
  this._pointerDone();
  this.pointerUp( event, pointer );
};

// public
proto.pointerUp = function( event, pointer ) {
  this.emitEvent( 'pointerUp', [ event, pointer ] );
};

// ----- pointer done ----- //

// triggered on pointer up & pointer cancel
proto._pointerDone = function() {
  this._pointerReset();
  this._unbindPostStartEvents();
  this.pointerDone();
};

proto._pointerReset = function() {
  // reset properties
  this.isPointerDown = false;
  delete this.pointerIdentifier;
};

proto.pointerDone = noop;

// ----- pointer cancel ----- //

proto.onpointercancel = function( event ) {
  if ( event.pointerId == this.pointerIdentifier ) {
    this._pointerCancel( event, event );
  }
};

proto.ontouchcancel = function( event ) {
  var touch = this.getTouch( event.changedTouches );
  if ( touch ) {
    this._pointerCancel( event, touch );
  }
};

/**
 * pointer cancel
 * @param {Event} event
 * @param {Event or Touch} pointer
 * @private
 */
proto._pointerCancel = function( event, pointer ) {
  this._pointerDone();
  this.pointerCancel( event, pointer );
};

// public
proto.pointerCancel = function( event, pointer ) {
  this.emitEvent( 'pointerCancel', [ event, pointer ] );
};

// -----  ----- //

// utility function for getting x/y coords from event
Unipointer.getPointerPoint = function( pointer ) {
  return {
    x: pointer.pageX,
    y: pointer.pageY
  };
};

// -----  ----- //

return Unipointer;

}));

/*!
 * Unidragger v2.3.0
 * Draggable base class
 * MIT license
 */

/*jshint browser: true, unused: true, undef: true, strict: true */

( function( window, factory ) {
  // universal module definition
  /*jshint strict: false */ /*globals define, module, require */

  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'unidragger/unidragger',[
      'unipointer/unipointer'
    ], function( Unipointer ) {
      return factory( window, Unipointer );
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      window,
      require('unipointer')
    );
  } else {
    // browser global
    window.Unidragger = factory(
      window,
      window.Unipointer
    );
  }

}( window, function factory( window, Unipointer ) {



// -------------------------- Unidragger -------------------------- //

function Unidragger() {}

// inherit Unipointer & EvEmitter
var proto = Unidragger.prototype = Object.create( Unipointer.prototype );

// ----- bind start ----- //

proto.bindHandles = function() {
  this._bindHandles( true );
};

proto.unbindHandles = function() {
  this._bindHandles( false );
};

/**
 * Add or remove start event
 * @param {Boolean} isAdd
 */
proto._bindHandles = function( isAdd ) {
  // munge isAdd, default to true
  isAdd = isAdd === undefined ? true : isAdd;
  // bind each handle
  var bindMethod = isAdd ? 'addEventListener' : 'removeEventListener';
  var touchAction = isAdd ? this._touchActionValue : '';
  for ( var i=0; i < this.handles.length; i++ ) {
    var handle = this.handles[i];
    this._bindStartEvent( handle, isAdd );
    handle[ bindMethod ]( 'click', this );
    // touch-action: none to override browser touch gestures. metafizzy/flickity#540
    if ( window.PointerEvent ) {
      handle.style.touchAction = touchAction;
    }
  }
};

// prototype so it can be overwriteable by Flickity
proto._touchActionValue = 'none';

// ----- start event ----- //

/**
 * pointer start
 * @param {Event} event
 * @param {Event or Touch} pointer
 */
proto.pointerDown = function( event, pointer ) {
  var isOkay = this.okayPointerDown( event );
  if ( !isOkay ) {
    return;
  }
  // track start event position
  this.pointerDownPointer = pointer;

  event.preventDefault();
  this.pointerDownBlur();
  // bind move and end events
  this._bindPostStartEvents( event );
  this.emitEvent( 'pointerDown', [ event, pointer ] );
};

// nodes that have text fields
var cursorNodes = {
  TEXTAREA: true,
  INPUT: true,
  SELECT: true,
  OPTION: true,
};

// input types that do not have text fields
var clickTypes = {
  radio: true,
  checkbox: true,
  button: true,
  submit: true,
  image: true,
  file: true,
};

// dismiss inputs with text fields. flickity#403, flickity#404
proto.okayPointerDown = function( event ) {
  var isCursorNode = cursorNodes[ event.target.nodeName ];
  var isClickType = clickTypes[ event.target.type ];
  var isOkay = !isCursorNode || isClickType;
  if ( !isOkay ) {
    this._pointerReset();
  }
  return isOkay;
};

// kludge to blur previously focused input
proto.pointerDownBlur = function() {
  var focused = document.activeElement;
  // do not blur body for IE10, metafizzy/flickity#117
  var canBlur = focused && focused.blur && focused != document.body;
  if ( canBlur ) {
    focused.blur();
  }
};

// ----- move event ----- //

/**
 * drag move
 * @param {Event} event
 * @param {Event or Touch} pointer
 */
proto.pointerMove = function( event, pointer ) {
  var moveVector = this._dragPointerMove( event, pointer );
  this.emitEvent( 'pointerMove', [ event, pointer, moveVector ] );
  this._dragMove( event, pointer, moveVector );
};

// base pointer move logic
proto._dragPointerMove = function( event, pointer ) {
  var moveVector = {
    x: pointer.pageX - this.pointerDownPointer.pageX,
    y: pointer.pageY - this.pointerDownPointer.pageY
  };
  // start drag if pointer has moved far enough to start drag
  if ( !this.isDragging && this.hasDragStarted( moveVector ) ) {
    this._dragStart( event, pointer );
  }
  return moveVector;
};

// condition if pointer has moved far enough to start drag
proto.hasDragStarted = function( moveVector ) {
  return Math.abs( moveVector.x ) > 3 || Math.abs( moveVector.y ) > 3;
};

// ----- end event ----- //

/**
 * pointer up
 * @param {Event} event
 * @param {Event or Touch} pointer
 */
proto.pointerUp = function( event, pointer ) {
  this.emitEvent( 'pointerUp', [ event, pointer ] );
  this._dragPointerUp( event, pointer );
};

proto._dragPointerUp = function( event, pointer ) {
  if ( this.isDragging ) {
    this._dragEnd( event, pointer );
  } else {
    // pointer didn't move enough for drag to start
    this._staticClick( event, pointer );
  }
};

// -------------------------- drag -------------------------- //

// dragStart
proto._dragStart = function( event, pointer ) {
  this.isDragging = true;
  // prevent clicks
  this.isPreventingClicks = true;
  this.dragStart( event, pointer );
};

proto.dragStart = function( event, pointer ) {
  this.emitEvent( 'dragStart', [ event, pointer ] );
};

// dragMove
proto._dragMove = function( event, pointer, moveVector ) {
  // do not drag if not dragging yet
  if ( !this.isDragging ) {
    return;
  }

  this.dragMove( event, pointer, moveVector );
};

proto.dragMove = function( event, pointer, moveVector ) {
  event.preventDefault();
  this.emitEvent( 'dragMove', [ event, pointer, moveVector ] );
};

// dragEnd
proto._dragEnd = function( event, pointer ) {
  // set flags
  this.isDragging = false;
  // re-enable clicking async
  setTimeout( function() {
    delete this.isPreventingClicks;
  }.bind( this ) );

  this.dragEnd( event, pointer );
};

proto.dragEnd = function( event, pointer ) {
  this.emitEvent( 'dragEnd', [ event, pointer ] );
};

// ----- onclick ----- //

// handle all clicks and prevent clicks when dragging
proto.onclick = function( event ) {
  if ( this.isPreventingClicks ) {
    event.preventDefault();
  }
};

// ----- staticClick ----- //

// triggered after pointer down & up with no/tiny movement
proto._staticClick = function( event, pointer ) {
  // ignore emulated mouse up clicks
  if ( this.isIgnoringMouseUp && event.type == 'mouseup' ) {
    return;
  }

  this.staticClick( event, pointer );

  // set flag for emulated clicks 300ms after touchend
  if ( event.type != 'mouseup' ) {
    this.isIgnoringMouseUp = true;
    // reset flag after 300ms
    setTimeout( function() {
      delete this.isIgnoringMouseUp;
    }.bind( this ), 400 );
  }
};

proto.staticClick = function( event, pointer ) {
  this.emitEvent( 'staticClick', [ event, pointer ] );
};

// ----- utils ----- //

Unidragger.getPointerPoint = Unipointer.getPointerPoint;

// -----  ----- //

return Unidragger;

}));

/*!
 * Draggabilly v2.2.0
 * Make that shiz draggable
 * https://draggabilly.desandro.com
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true, unused: true */

( function( window, factory ) {
  // universal module definition
  /* jshint strict: false */ /*globals define, module, require */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( [
        'get-size/get-size',
        'unidragger/unidragger'
      ],
      function( getSize, Unidragger ) {
        return factory( window, getSize, Unidragger );
      });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      window,
      require('get-size'),
      require('unidragger')
    );
  } else {
    // browser global
    window.Draggabilly = factory(
      window,
      window.getSize,
      window.Unidragger
    );
  }

}( window, function factory( window, getSize, Unidragger ) {



// -------------------------- helpers & variables -------------------------- //

// extend objects
function extend( a, b ) {
  for ( var prop in b ) {
    a[ prop ] = b[ prop ];
  }
  return a;
}

function noop() {}

var jQuery = window.jQuery;

// --------------------------  -------------------------- //

function Draggabilly( element, options ) {
  // querySelector if string
  this.element = typeof element == 'string' ?
    document.querySelector( element ) : element;

  if ( jQuery ) {
    this.$element = jQuery( this.element );
  }

  // options
  this.options = extend( {}, this.constructor.defaults );
  this.option( options );

  this._create();
}

// inherit Unidragger methods
var proto = Draggabilly.prototype = Object.create( Unidragger.prototype );

Draggabilly.defaults = {
};

/**
 * set options
 * @param {Object} opts
 */
proto.option = function( opts ) {
  extend( this.options, opts );
};

// css position values that don't need to be set
var positionValues = {
  relative: true,
  absolute: true,
  fixed: true
};

proto._create = function() {
  // properties
  this.position = {};
  this._getPosition();

  this.startPoint = { x: 0, y: 0 };
  this.dragPoint = { x: 0, y: 0 };

  this.startPosition = extend( {}, this.position );

  // set relative positioning
  var style = getComputedStyle( this.element );
  if ( !positionValues[ style.position ] ) {
    this.element.style.position = 'relative';
  }

  // events, bridge jQuery events from vanilla
  this.on( 'pointerDown', this.onPointerDown );
  this.on( 'pointerMove', this.onPointerMove );
  this.on( 'pointerUp', this.onPointerUp );

  this.enable();
  this.setHandles();
};

/**
 * set this.handles and bind start events to 'em
 */
proto.setHandles = function() {
  this.handles = this.options.handle ?
    this.element.querySelectorAll( this.options.handle ) : [ this.element ];

  this.bindHandles();
};

/**
 * emits events via EvEmitter and jQuery events
 * @param {String} type - name of event
 * @param {Event} event - original event
 * @param {Array} args - extra arguments
 */
proto.dispatchEvent = function( type, event, args ) {
  var emitArgs = [ event ].concat( args );
  this.emitEvent( type, emitArgs );
  this.dispatchJQueryEvent( type, event, args );
};

proto.dispatchJQueryEvent = function( type, event, args ) {
  var jQuery = window.jQuery;
  // trigger jQuery event
  if ( !jQuery || !this.$element ) {
    return;
  }
  // create jQuery event
  var $event = jQuery.Event( event );
  $event.type = type;
  this.$element.trigger( $event, args );
};

// -------------------------- position -------------------------- //

// get x/y position from style
proto._getPosition = function() {
  var style = getComputedStyle( this.element );
  var x = this._getPositionCoord( style.left, 'width' );
  var y = this._getPositionCoord( style.top, 'height' );
  // clean up 'auto' or other non-integer values
  this.position.x = isNaN( x ) ? 0 : x;
  this.position.y = isNaN( y ) ? 0 : y;

  this._addTransformPosition( style );
};

proto._getPositionCoord = function( styleSide, measure ) {
  if ( styleSide.indexOf('%') != -1 ) {
    // convert percent into pixel for Safari, #75
    var parentSize = getSize( this.element.parentNode );
    // prevent not-in-DOM element throwing bug, #131
    return !parentSize ? 0 :
      ( parseFloat( styleSide ) / 100 ) * parentSize[ measure ];
  }
  return parseInt( styleSide, 10 );
};

// add transform: translate( x, y ) to position
proto._addTransformPosition = function( style ) {
  var transform = style.transform;
  // bail out if value is 'none'
  if ( transform.indexOf('matrix') !== 0 ) {
    return;
  }
  // split matrix(1, 0, 0, 1, x, y)
  var matrixValues = transform.split(',');
  // translate X value is in 12th or 4th position
  var xIndex = transform.indexOf('matrix3d') === 0 ? 12 : 4;
  var translateX = parseInt( matrixValues[ xIndex ], 10 );
  // translate Y value is in 13th or 5th position
  var translateY = parseInt( matrixValues[ xIndex + 1 ], 10 );
  this.position.x += translateX;
  this.position.y += translateY;
};

// -------------------------- events -------------------------- //

proto.onPointerDown = function( event, pointer ) {
  this.element.classList.add('is-pointer-down');
  this.dispatchJQueryEvent( 'pointerDown', event, [ pointer ] );
};

/**
 * drag start
 * @param {Event} event
 * @param {Event or Touch} pointer
 */
proto.dragStart = function( event, pointer ) {
  if ( !this.isEnabled ) {
    return;
  }
  this._getPosition();
  this.measureContainment();
  // position _when_ drag began
  this.startPosition.x = this.position.x;
  this.startPosition.y = this.position.y;
  // reset left/top style
  this.setLeftTop();

  this.dragPoint.x = 0;
  this.dragPoint.y = 0;

  this.element.classList.add('is-dragging');
  this.dispatchEvent( 'dragStart', event, [ pointer ] );
  // start animation
  this.animate();
};

proto.measureContainment = function() {
  var container = this.getContainer();
  if ( !container ) {
    return;
  }

  var elemSize = getSize( this.element );
  var containerSize = getSize( container );
  var elemRect = this.element.getBoundingClientRect();
  var containerRect = container.getBoundingClientRect();

  var borderSizeX = containerSize.borderLeftWidth + containerSize.borderRightWidth;
  var borderSizeY = containerSize.borderTopWidth + containerSize.borderBottomWidth;

  var position = this.relativeStartPosition = {
    x: elemRect.left - ( containerRect.left + containerSize.borderLeftWidth ),
    y: elemRect.top - ( containerRect.top + containerSize.borderTopWidth )
  };

  this.containSize = {
    width: ( containerSize.width - borderSizeX ) - position.x - elemSize.width,
    height: ( containerSize.height - borderSizeY ) - position.y - elemSize.height
  };
};

proto.getContainer = function() {
  var containment = this.options.containment;
  if ( !containment ) {
    return;
  }
  var isElement = containment instanceof HTMLElement;
  // use as element
  if ( isElement ) {
    return containment;
  }
  // querySelector if string
  if ( typeof containment == 'string' ) {
    return document.querySelector( containment );
  }
  // fallback to parent element
  return this.element.parentNode;
};

// ----- move event ----- //

proto.onPointerMove = function( event, pointer, moveVector ) {
  this.dispatchJQueryEvent( 'pointerMove', event, [ pointer, moveVector ] );
};

/**
 * drag move
 * @param {Event} event
 * @param {Event or Touch} pointer
 */
proto.dragMove = function( event, pointer, moveVector ) {
  if ( !this.isEnabled ) {
    return;
  }
  var dragX = moveVector.x;
  var dragY = moveVector.y;

  var grid = this.options.grid;
  var gridX = grid && grid[0];
  var gridY = grid && grid[1];

  dragX = applyGrid( dragX, gridX );
  dragY = applyGrid( dragY, gridY );

  dragX = this.containDrag( 'x', dragX, gridX );
  dragY = this.containDrag( 'y', dragY, gridY );

  // constrain to axis
  dragX = this.options.axis == 'y' ? 0 : dragX;
  dragY = this.options.axis == 'x' ? 0 : dragY;

  this.position.x = this.startPosition.x + dragX;
  this.position.y = this.startPosition.y + dragY;
  // set dragPoint properties
  this.dragPoint.x = dragX;
  this.dragPoint.y = dragY;

  this.dispatchEvent( 'dragMove', event, [ pointer, moveVector ] );
};

function applyGrid( value, grid, method ) {
  method = method || 'round';
  return grid ? Math[ method ]( value / grid ) * grid : value;
}

proto.containDrag = function( axis, drag, grid ) {
  if ( !this.options.containment ) {
    return drag;
  }
  var measure = axis == 'x' ? 'width' : 'height';

  var rel = this.relativeStartPosition[ axis ];
  var min = applyGrid( -rel, grid, 'ceil' );
  var max = this.containSize[ measure ];
  max = applyGrid( max, grid, 'floor' );
  return  Math.max( min, Math.min( max, drag ) );
};

// ----- end event ----- //

/**
 * pointer up
 * @param {Event} event
 * @param {Event or Touch} pointer
 */
proto.onPointerUp = function( event, pointer ) {
  this.element.classList.remove('is-pointer-down');
  this.dispatchJQueryEvent( 'pointerUp', event, [ pointer ] );
};

/**
 * drag end
 * @param {Event} event
 * @param {Event or Touch} pointer
 */
proto.dragEnd = function( event, pointer ) {
  if ( !this.isEnabled ) {
    return;
  }
  // use top left position when complete
  this.element.style.transform = '';
  this.setLeftTop();
  this.element.classList.remove('is-dragging');
  this.dispatchEvent( 'dragEnd', event, [ pointer ] );
};

// -------------------------- animation -------------------------- //

proto.animate = function() {
  // only render and animate if dragging
  if ( !this.isDragging ) {
    return;
  }

  this.positionDrag();

  var _this = this;
  requestAnimationFrame( function animateFrame() {
    _this.animate();
  });

};

// left/top positioning
proto.setLeftTop = function() {
  this.element.style.left = this.position.x + 'px';
  this.element.style.top  = this.position.y + 'px';
};

proto.positionDrag = function() {
  this.element.style.transform = 'translate3d( ' + this.dragPoint.x +
    'px, ' + this.dragPoint.y + 'px, 0)';
};

// ----- staticClick ----- //

proto.staticClick = function( event, pointer ) {
  this.dispatchEvent( 'staticClick', event, [ pointer ] );
};

// ----- methods ----- //

/**
 * @param {Number} x
 * @param {Number} y
 */
proto.setPosition = function( x, y ) {
  this.position.x = x;
  this.position.y = y;
  this.setLeftTop();
};

proto.enable = function() {
  this.isEnabled = true;
};

proto.disable = function() {
  this.isEnabled = false;
  if ( this.isDragging ) {
    this.dragEnd();
  }
};

proto.destroy = function() {
  this.disable();
  // reset styles
  this.element.style.transform = '';
  this.element.style.left = '';
  this.element.style.top = '';
  this.element.style.position = '';
  // unbind handles
  this.unbindHandles();
  // remove jQuery data
  if ( this.$element ) {
    this.$element.removeData('draggabilly');
  }
};

// ----- jQuery bridget ----- //

// required for jQuery bridget
proto._init = noop;

if ( jQuery && jQuery.bridget ) {
  jQuery.bridget( 'draggabilly', Draggabilly );
}

// -----  ----- //

return Draggabilly;

}));

;!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this).markdownit=e()}}((function(){return function e(r,t,n){function s(i,a){if(!t[i]){if(!r[i]){var c="function"==typeof require&&require;if(!a&&c)return c(i,!0);if(o)return o(i,!0);var l=new Error("Cannot find module '"+i+"'");throw l.code="MODULE_NOT_FOUND",l}var u=t[i]={exports:{}};r[i][0].call(u.exports,(function(e){return s(r[i][1][e]||e)}),u,u.exports,e,r,t,n)}return t[i].exports}for(var o="function"==typeof require&&require,i=0;i<n.length;i++)s(n[i]);return s}({1:[function(e,r,t){"use strict";r.exports=e("entities/lib/maps/entities.json")},{"entities/lib/maps/entities.json":52}],2:[function(e,r,t){"use strict";r.exports=["address","article","aside","base","basefont","blockquote","body","caption","center","col","colgroup","dd","details","dialog","dir","div","dl","dt","fieldset","figcaption","figure","footer","form","frame","frameset","h1","h2","h3","h4","h5","h6","head","header","hr","html","iframe","legend","li","link","main","menu","menuitem","meta","nav","noframes","ol","optgroup","option","p","param","section","source","summary","table","tbody","td","tfoot","th","thead","title","tr","track","ul"]},{}],3:[function(e,r,t){"use strict";var n="<[A-Za-z][A-Za-z0-9\\-]*(?:\\s+[a-zA-Z_:][a-zA-Z0-9:._-]*(?:\\s*=\\s*(?:[^\"'=<>`\\x00-\\x20]+|'[^']*'|\"[^\"]*\"))?)*\\s*\\/?>",s="<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>",o=new RegExp("^(?:"+n+"|"+s+"|\x3c!----\x3e|\x3c!--(?:-?[^>-])(?:-?[^-])*--\x3e|<[?].*?[?]>|<![A-Z]+\\s+[^>]*>|<!\\[CDATA\\[[\\s\\S]*?\\]\\]>)"),i=new RegExp("^(?:"+n+"|"+s+")");r.exports.HTML_TAG_RE=o,r.exports.HTML_OPEN_CLOSE_TAG_RE=i},{}],4:[function(e,r,t){"use strict";var n=Object.prototype.hasOwnProperty;function s(e,r){return n.call(e,r)}function o(e){return!(e>=55296&&e<=57343)&&(!(e>=64976&&e<=65007)&&(65535!=(65535&e)&&65534!=(65535&e)&&(!(e>=0&&e<=8)&&(11!==e&&(!(e>=14&&e<=31)&&(!(e>=127&&e<=159)&&!(e>1114111)))))))}function i(e){if(e>65535){var r=55296+((e-=65536)>>10),t=56320+(1023&e);return String.fromCharCode(r,t)}return String.fromCharCode(e)}var a=/\\([!"#$%&'()*+,\-.\/:;<=>?@[\\\]^_`{|}~])/g,c=new RegExp(a.source+"|"+/&([a-z#][a-z0-9]{1,31});/gi.source,"gi"),l=/^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))/i,u=e("./entities");var p=/[&<>"]/,h=/[&<>"]/g,f={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"};function d(e){return f[e]}var m=/[.?*+^$[\]\\(){}|-]/g;var _=e("uc.micro/categories/P/regex");t.lib={},t.lib.mdurl=e("mdurl"),t.lib.ucmicro=e("uc.micro"),t.assign=function(e){return Array.prototype.slice.call(arguments,1).forEach((function(r){if(r){if("object"!=typeof r)throw new TypeError(r+"must be object");Object.keys(r).forEach((function(t){e[t]=r[t]}))}})),e},t.isString=function(e){return"[object String]"===function(e){return Object.prototype.toString.call(e)}(e)},t.has=s,t.unescapeMd=function(e){return e.indexOf("\\")<0?e:e.replace(a,"$1")},t.unescapeAll=function(e){return e.indexOf("\\")<0&&e.indexOf("&")<0?e:e.replace(c,(function(e,r,t){return r||function(e,r){var t=0;return s(u,r)?u[r]:35===r.charCodeAt(0)&&l.test(r)&&o(t="x"===r[1].toLowerCase()?parseInt(r.slice(2),16):parseInt(r.slice(1),10))?i(t):e}(e,t)}))},t.isValidEntityCode=o,t.fromCodePoint=i,t.escapeHtml=function(e){return p.test(e)?e.replace(h,d):e},t.arrayReplaceAt=function(e,r,t){return[].concat(e.slice(0,r),t,e.slice(r+1))},t.isSpace=function(e){switch(e){case 9:case 32:return!0}return!1},t.isWhiteSpace=function(e){if(e>=8192&&e<=8202)return!0;switch(e){case 9:case 10:case 11:case 12:case 13:case 32:case 160:case 5760:case 8239:case 8287:case 12288:return!0}return!1},t.isMdAsciiPunct=function(e){switch(e){case 33:case 34:case 35:case 36:case 37:case 38:case 39:case 40:case 41:case 42:case 43:case 44:case 45:case 46:case 47:case 58:case 59:case 60:case 61:case 62:case 63:case 64:case 91:case 92:case 93:case 94:case 95:case 96:case 123:case 124:case 125:case 126:return!0;default:return!1}},t.isPunctChar=function(e){return _.test(e)},t.escapeRE=function(e){return e.replace(m,"\\$&")},t.normalizeReference=function(e){return e=e.trim().replace(/\s+/g," "),"\u1e7e"==="\u1e9e".toLowerCase()&&(e=e.replace(/\u1e9e/g,"\xdf")),e.toLowerCase().toUpperCase()}},{"./entities":1,mdurl:58,"uc.micro":65,"uc.micro/categories/P/regex":63}],5:[function(e,r,t){"use strict";t.parseLinkLabel=e("./parse_link_label"),t.parseLinkDestination=e("./parse_link_destination"),t.parseLinkTitle=e("./parse_link_title")},{"./parse_link_destination":6,"./parse_link_label":7,"./parse_link_title":8}],6:[function(e,r,t){"use strict";var n=e("../common/utils").unescapeAll;r.exports=function(e,r,t){var s,o,i=r,a={ok:!1,pos:0,lines:0,str:""};if(60===e.charCodeAt(r)){for(r++;r<t;){if(10===(s=e.charCodeAt(r)))return a;if(62===s)return a.pos=r+1,a.str=n(e.slice(i+1,r)),a.ok=!0,a;92===s&&r+1<t?r+=2:r++}return a}for(o=0;r<t&&32!==(s=e.charCodeAt(r))&&!(s<32||127===s);)if(92===s&&r+1<t)r+=2;else{if(40===s&&o++,41===s){if(0===o)break;o--}r++}return i===r?a:0!==o?a:(a.str=n(e.slice(i,r)),a.lines=0,a.pos=r,a.ok=!0,a)}},{"../common/utils":4}],7:[function(e,r,t){"use strict";r.exports=function(e,r,t){var n,s,o,i,a=-1,c=e.posMax,l=e.pos;for(e.pos=r+1,n=1;e.pos<c;){if(93===(o=e.src.charCodeAt(e.pos))&&0===--n){s=!0;break}if(i=e.pos,e.md.inline.skipToken(e),91===o)if(i===e.pos-1)n++;else if(t)return e.pos=l,-1}return s&&(a=e.pos),e.pos=l,a}},{}],8:[function(e,r,t){"use strict";var n=e("../common/utils").unescapeAll;r.exports=function(e,r,t){var s,o,i=0,a=r,c={ok:!1,pos:0,lines:0,str:""};if(r>=t)return c;if(34!==(o=e.charCodeAt(r))&&39!==o&&40!==o)return c;for(r++,40===o&&(o=41);r<t;){if((s=e.charCodeAt(r))===o)return c.pos=r+1,c.lines=i,c.str=n(e.slice(a+1,r)),c.ok=!0,c;10===s?i++:92===s&&r+1<t&&(r++,10===e.charCodeAt(r)&&i++),r++}return c}},{"../common/utils":4}],9:[function(e,r,t){"use strict";var n=e("./common/utils"),s=e("./helpers"),o=e("./renderer"),i=e("./parser_core"),a=e("./parser_block"),c=e("./parser_inline"),l=e("linkify-it"),u=e("mdurl"),p=e("punycode"),h={default:e("./presets/default"),zero:e("./presets/zero"),commonmark:e("./presets/commonmark")},f=/^(vbscript|javascript|file|data):/,d=/^data:image\/(gif|png|jpeg|webp);/;function m(e){var r=e.trim().toLowerCase();return!f.test(r)||!!d.test(r)}var _=["http:","https:","mailto:"];function g(e){var r=u.parse(e,!0);if(r.hostname&&(!r.protocol||_.indexOf(r.protocol)>=0))try{r.hostname=p.toASCII(r.hostname)}catch(e){}return u.encode(u.format(r))}function k(e){var r=u.parse(e,!0);if(r.hostname&&(!r.protocol||_.indexOf(r.protocol)>=0))try{r.hostname=p.toUnicode(r.hostname)}catch(e){}return u.decode(u.format(r))}function b(e,r){if(!(this instanceof b))return new b(e,r);r||n.isString(e)||(r=e||{},e="default"),this.inline=new c,this.block=new a,this.core=new i,this.renderer=new o,this.linkify=new l,this.validateLink=m,this.normalizeLink=g,this.normalizeLinkText=k,this.utils=n,this.helpers=n.assign({},s),this.options={},this.configure(e),r&&this.set(r)}b.prototype.set=function(e){return n.assign(this.options,e),this},b.prototype.configure=function(e){var r,t=this;if(n.isString(e)&&!(e=h[r=e]))throw new Error('Wrong `markdown-it` preset "'+r+'", check name');if(!e)throw new Error("Wrong `markdown-it` preset, can't be empty");return e.options&&t.set(e.options),e.components&&Object.keys(e.components).forEach((function(r){e.components[r].rules&&t[r].ruler.enableOnly(e.components[r].rules),e.components[r].rules2&&t[r].ruler2.enableOnly(e.components[r].rules2)})),this},b.prototype.enable=function(e,r){var t=[];Array.isArray(e)||(e=[e]),["core","block","inline"].forEach((function(r){t=t.concat(this[r].ruler.enable(e,!0))}),this),t=t.concat(this.inline.ruler2.enable(e,!0));var n=e.filter((function(e){return t.indexOf(e)<0}));if(n.length&&!r)throw new Error("MarkdownIt. Failed to enable unknown rule(s): "+n);return this},b.prototype.disable=function(e,r){var t=[];Array.isArray(e)||(e=[e]),["core","block","inline"].forEach((function(r){t=t.concat(this[r].ruler.disable(e,!0))}),this),t=t.concat(this.inline.ruler2.disable(e,!0));var n=e.filter((function(e){return t.indexOf(e)<0}));if(n.length&&!r)throw new Error("MarkdownIt. Failed to disable unknown rule(s): "+n);return this},b.prototype.use=function(e){var r=[this].concat(Array.prototype.slice.call(arguments,1));return e.apply(e,r),this},b.prototype.parse=function(e,r){if("string"!=typeof e)throw new Error("Input data should be a String");var t=new this.core.State(e,this,r);return this.core.process(t),t.tokens},b.prototype.render=function(e,r){return r=r||{},this.renderer.render(this.parse(e,r),this.options,r)},b.prototype.parseInline=function(e,r){var t=new this.core.State(e,this,r);return t.inlineMode=!0,this.core.process(t),t.tokens},b.prototype.renderInline=function(e,r){return r=r||{},this.renderer.render(this.parseInline(e,r),this.options,r)},r.exports=b},{"./common/utils":4,"./helpers":5,"./parser_block":10,"./parser_core":11,"./parser_inline":12,"./presets/commonmark":13,"./presets/default":14,"./presets/zero":15,"./renderer":16,"linkify-it":53,mdurl:58,punycode:60}],10:[function(e,r,t){"use strict";var n=e("./ruler"),s=[["table",e("./rules_block/table"),["paragraph","reference"]],["code",e("./rules_block/code")],["fence",e("./rules_block/fence"),["paragraph","reference","blockquote","list"]],["blockquote",e("./rules_block/blockquote"),["paragraph","reference","blockquote","list"]],["hr",e("./rules_block/hr"),["paragraph","reference","blockquote","list"]],["list",e("./rules_block/list"),["paragraph","reference","blockquote"]],["reference",e("./rules_block/reference")],["heading",e("./rules_block/heading"),["paragraph","reference","blockquote"]],["lheading",e("./rules_block/lheading")],["html_block",e("./rules_block/html_block"),["paragraph","reference","blockquote"]],["paragraph",e("./rules_block/paragraph")]];function o(){this.ruler=new n;for(var e=0;e<s.length;e++)this.ruler.push(s[e][0],s[e][1],{alt:(s[e][2]||[]).slice()})}o.prototype.tokenize=function(e,r,t){for(var n,s=this.ruler.getRules(""),o=s.length,i=r,a=!1,c=e.md.options.maxNesting;i<t&&(e.line=i=e.skipEmptyLines(i),!(i>=t))&&!(e.sCount[i]<e.blkIndent);){if(e.level>=c){e.line=t;break}for(n=0;n<o&&!s[n](e,i,t,!1);n++);e.tight=!a,e.isEmpty(e.line-1)&&(a=!0),(i=e.line)<t&&e.isEmpty(i)&&(a=!0,i++,e.line=i)}},o.prototype.parse=function(e,r,t,n){var s;e&&(s=new this.State(e,r,t,n),this.tokenize(s,s.line,s.lineMax))},o.prototype.State=e("./rules_block/state_block"),r.exports=o},{"./ruler":17,"./rules_block/blockquote":18,"./rules_block/code":19,"./rules_block/fence":20,"./rules_block/heading":21,"./rules_block/hr":22,"./rules_block/html_block":23,"./rules_block/lheading":24,"./rules_block/list":25,"./rules_block/paragraph":26,"./rules_block/reference":27,"./rules_block/state_block":28,"./rules_block/table":29}],11:[function(e,r,t){"use strict";var n=e("./ruler"),s=[["normalize",e("./rules_core/normalize")],["block",e("./rules_core/block")],["inline",e("./rules_core/inline")],["linkify",e("./rules_core/linkify")],["replacements",e("./rules_core/replacements")],["smartquotes",e("./rules_core/smartquotes")]];function o(){this.ruler=new n;for(var e=0;e<s.length;e++)this.ruler.push(s[e][0],s[e][1])}o.prototype.process=function(e){var r,t,n;for(r=0,t=(n=this.ruler.getRules("")).length;r<t;r++)n[r](e)},o.prototype.State=e("./rules_core/state_core"),r.exports=o},{"./ruler":17,"./rules_core/block":30,"./rules_core/inline":31,"./rules_core/linkify":32,"./rules_core/normalize":33,"./rules_core/replacements":34,"./rules_core/smartquotes":35,"./rules_core/state_core":36}],12:[function(e,r,t){"use strict";var n=e("./ruler"),s=[["text",e("./rules_inline/text")],["newline",e("./rules_inline/newline")],["escape",e("./rules_inline/escape")],["backticks",e("./rules_inline/backticks")],["strikethrough",e("./rules_inline/strikethrough").tokenize],["emphasis",e("./rules_inline/emphasis").tokenize],["link",e("./rules_inline/link")],["image",e("./rules_inline/image")],["autolink",e("./rules_inline/autolink")],["html_inline",e("./rules_inline/html_inline")],["entity",e("./rules_inline/entity")]],o=[["balance_pairs",e("./rules_inline/balance_pairs")],["strikethrough",e("./rules_inline/strikethrough").postProcess],["emphasis",e("./rules_inline/emphasis").postProcess],["text_collapse",e("./rules_inline/text_collapse")]];function i(){var e;for(this.ruler=new n,e=0;e<s.length;e++)this.ruler.push(s[e][0],s[e][1]);for(this.ruler2=new n,e=0;e<o.length;e++)this.ruler2.push(o[e][0],o[e][1])}i.prototype.skipToken=function(e){var r,t,n=e.pos,s=this.ruler.getRules(""),o=s.length,i=e.md.options.maxNesting,a=e.cache;if(void 0===a[n]){if(e.level<i)for(t=0;t<o&&(e.level++,r=s[t](e,!0),e.level--,!r);t++);else e.pos=e.posMax;r||e.pos++,a[n]=e.pos}else e.pos=a[n]},i.prototype.tokenize=function(e){for(var r,t,n=this.ruler.getRules(""),s=n.length,o=e.posMax,i=e.md.options.maxNesting;e.pos<o;){if(e.level<i)for(t=0;t<s&&!(r=n[t](e,!1));t++);if(r){if(e.pos>=o)break}else e.pending+=e.src[e.pos++]}e.pending&&e.pushPending()},i.prototype.parse=function(e,r,t,n){var s,o,i,a=new this.State(e,r,t,n);for(this.tokenize(a),i=(o=this.ruler2.getRules("")).length,s=0;s<i;s++)o[s](a)},i.prototype.State=e("./rules_inline/state_inline"),r.exports=i},{"./ruler":17,"./rules_inline/autolink":37,"./rules_inline/backticks":38,"./rules_inline/balance_pairs":39,"./rules_inline/emphasis":40,"./rules_inline/entity":41,"./rules_inline/escape":42,"./rules_inline/html_inline":43,"./rules_inline/image":44,"./rules_inline/link":45,"./rules_inline/newline":46,"./rules_inline/state_inline":47,"./rules_inline/strikethrough":48,"./rules_inline/text":49,"./rules_inline/text_collapse":50}],13:[function(e,r,t){"use strict";r.exports={options:{html:!0,xhtmlOut:!0,breaks:!1,langPrefix:"language-",linkify:!1,typographer:!1,quotes:"\u201c\u201d\u2018\u2019",highlight:null,maxNesting:20},components:{core:{rules:["normalize","block","inline"]},block:{rules:["blockquote","code","fence","heading","hr","html_block","lheading","list","reference","paragraph"]},inline:{rules:["autolink","backticks","emphasis","entity","escape","html_inline","image","link","newline","text"],rules2:["balance_pairs","emphasis","text_collapse"]}}}},{}],14:[function(e,r,t){"use strict";r.exports={options:{html:!1,xhtmlOut:!1,breaks:!1,langPrefix:"language-",linkify:!1,typographer:!1,quotes:"\u201c\u201d\u2018\u2019",highlight:null,maxNesting:100},components:{core:{},block:{},inline:{}}}},{}],15:[function(e,r,t){"use strict";r.exports={options:{html:!1,xhtmlOut:!1,breaks:!1,langPrefix:"language-",linkify:!1,typographer:!1,quotes:"\u201c\u201d\u2018\u2019",highlight:null,maxNesting:20},components:{core:{rules:["normalize","block","inline"]},block:{rules:["paragraph"]},inline:{rules:["text"],rules2:["balance_pairs","text_collapse"]}}}},{}],16:[function(e,r,t){"use strict";var n=e("./common/utils").assign,s=e("./common/utils").unescapeAll,o=e("./common/utils").escapeHtml,i={};function a(){this.rules=n({},i)}i.code_inline=function(e,r,t,n,s){var i=e[r];return"<code"+s.renderAttrs(i)+">"+o(e[r].content)+"</code>"},i.code_block=function(e,r,t,n,s){var i=e[r];return"<pre"+s.renderAttrs(i)+"><code>"+o(e[r].content)+"</code></pre>\n"},i.fence=function(e,r,t,n,i){var a,c,l,u,p=e[r],h=p.info?s(p.info).trim():"",f="";return h&&(f=h.split(/\s+/g)[0]),0===(a=t.highlight&&t.highlight(p.content,f)||o(p.content)).indexOf("<pre")?a+"\n":h?(c=p.attrIndex("class"),l=p.attrs?p.attrs.slice():[],c<0?l.push(["class",t.langPrefix+f]):l[c][1]+=" "+t.langPrefix+f,u={attrs:l},"<pre><code"+i.renderAttrs(u)+">"+a+"</code></pre>\n"):"<pre><code"+i.renderAttrs(p)+">"+a+"</code></pre>\n"},i.image=function(e,r,t,n,s){var o=e[r];return o.attrs[o.attrIndex("alt")][1]=s.renderInlineAsText(o.children,t,n),s.renderToken(e,r,t)},i.hardbreak=function(e,r,t){return t.xhtmlOut?"<br />\n":"<br>\n"},i.softbreak=function(e,r,t){return t.breaks?t.xhtmlOut?"<br />\n":"<br>\n":"\n"},i.text=function(e,r){return o(e[r].content)},i.html_block=function(e,r){return e[r].content},i.html_inline=function(e,r){return e[r].content},a.prototype.renderAttrs=function(e){var r,t,n;if(!e.attrs)return"";for(n="",r=0,t=e.attrs.length;r<t;r++)n+=" "+o(e.attrs[r][0])+'="'+o(e.attrs[r][1])+'"';return n},a.prototype.renderToken=function(e,r,t){var n,s="",o=!1,i=e[r];return i.hidden?"":(i.block&&-1!==i.nesting&&r&&e[r-1].hidden&&(s+="\n"),s+=(-1===i.nesting?"</":"<")+i.tag,s+=this.renderAttrs(i),0===i.nesting&&t.xhtmlOut&&(s+=" /"),i.block&&(o=!0,1===i.nesting&&r+1<e.length&&("inline"===(n=e[r+1]).type||n.hidden?o=!1:-1===n.nesting&&n.tag===i.tag&&(o=!1))),s+=o?">\n":">")},a.prototype.renderInline=function(e,r,t){for(var n,s="",o=this.rules,i=0,a=e.length;i<a;i++)void 0!==o[n=e[i].type]?s+=o[n](e,i,r,t,this):s+=this.renderToken(e,i,r);return s},a.prototype.renderInlineAsText=function(e,r,t){for(var n="",s=0,o=e.length;s<o;s++)"text"===e[s].type?n+=e[s].content:"image"===e[s].type&&(n+=this.renderInlineAsText(e[s].children,r,t));return n},a.prototype.render=function(e,r,t){var n,s,o,i="",a=this.rules;for(n=0,s=e.length;n<s;n++)"inline"===(o=e[n].type)?i+=this.renderInline(e[n].children,r,t):void 0!==a[o]?i+=a[e[n].type](e,n,r,t,this):i+=this.renderToken(e,n,r,t);return i},r.exports=a},{"./common/utils":4}],17:[function(e,r,t){"use strict";function n(){this.__rules__=[],this.__cache__=null}n.prototype.__find__=function(e){for(var r=0;r<this.__rules__.length;r++)if(this.__rules__[r].name===e)return r;return-1},n.prototype.__compile__=function(){var e=this,r=[""];e.__rules__.forEach((function(e){e.enabled&&e.alt.forEach((function(e){r.indexOf(e)<0&&r.push(e)}))})),e.__cache__={},r.forEach((function(r){e.__cache__[r]=[],e.__rules__.forEach((function(t){t.enabled&&(r&&t.alt.indexOf(r)<0||e.__cache__[r].push(t.fn))}))}))},n.prototype.at=function(e,r,t){var n=this.__find__(e),s=t||{};if(-1===n)throw new Error("Parser rule not found: "+e);this.__rules__[n].fn=r,this.__rules__[n].alt=s.alt||[],this.__cache__=null},n.prototype.before=function(e,r,t,n){var s=this.__find__(e),o=n||{};if(-1===s)throw new Error("Parser rule not found: "+e);this.__rules__.splice(s,0,{name:r,enabled:!0,fn:t,alt:o.alt||[]}),this.__cache__=null},n.prototype.after=function(e,r,t,n){var s=this.__find__(e),o=n||{};if(-1===s)throw new Error("Parser rule not found: "+e);this.__rules__.splice(s+1,0,{name:r,enabled:!0,fn:t,alt:o.alt||[]}),this.__cache__=null},n.prototype.push=function(e,r,t){var n=t||{};this.__rules__.push({name:e,enabled:!0,fn:r,alt:n.alt||[]}),this.__cache__=null},n.prototype.enable=function(e,r){Array.isArray(e)||(e=[e]);var t=[];return e.forEach((function(e){var n=this.__find__(e);if(n<0){if(r)return;throw new Error("Rules manager: invalid rule name "+e)}this.__rules__[n].enabled=!0,t.push(e)}),this),this.__cache__=null,t},n.prototype.enableOnly=function(e,r){Array.isArray(e)||(e=[e]),this.__rules__.forEach((function(e){e.enabled=!1})),this.enable(e,r)},n.prototype.disable=function(e,r){Array.isArray(e)||(e=[e]);var t=[];return e.forEach((function(e){var n=this.__find__(e);if(n<0){if(r)return;throw new Error("Rules manager: invalid rule name "+e)}this.__rules__[n].enabled=!1,t.push(e)}),this),this.__cache__=null,t},n.prototype.getRules=function(e){return null===this.__cache__&&this.__compile__(),this.__cache__[e]||[]},r.exports=n},{}],18:[function(e,r,t){"use strict";var n=e("../common/utils").isSpace;r.exports=function(e,r,t,s){var o,i,a,c,l,u,p,h,f,d,m,_,g,k,b,v,y,C,x,A,w=e.lineMax,D=e.bMarks[r]+e.tShift[r],E=e.eMarks[r];if(e.sCount[r]-e.blkIndent>=4)return!1;if(62!==e.src.charCodeAt(D++))return!1;if(s)return!0;for(c=f=e.sCount[r]+D-(e.bMarks[r]+e.tShift[r]),32===e.src.charCodeAt(D)?(D++,c++,f++,o=!1,v=!0):9===e.src.charCodeAt(D)?(v=!0,(e.bsCount[r]+f)%4==3?(D++,c++,f++,o=!1):o=!0):v=!1,d=[e.bMarks[r]],e.bMarks[r]=D;D<E&&(i=e.src.charCodeAt(D),n(i));)9===i?f+=4-(f+e.bsCount[r]+(o?1:0))%4:f++,D++;for(m=[e.bsCount[r]],e.bsCount[r]=e.sCount[r]+1+(v?1:0),u=D>=E,k=[e.sCount[r]],e.sCount[r]=f-c,b=[e.tShift[r]],e.tShift[r]=D-e.bMarks[r],C=e.md.block.ruler.getRules("blockquote"),g=e.parentType,e.parentType="blockquote",A=!1,h=r+1;h<t&&(e.sCount[h]<e.blkIndent&&(A=!0),!((D=e.bMarks[h]+e.tShift[h])>=(E=e.eMarks[h])));h++)if(62!==e.src.charCodeAt(D++)||A){if(u)break;for(y=!1,a=0,l=C.length;a<l;a++)if(C[a](e,h,t,!0)){y=!0;break}if(y){e.lineMax=h,0!==e.blkIndent&&(d.push(e.bMarks[h]),m.push(e.bsCount[h]),b.push(e.tShift[h]),k.push(e.sCount[h]),e.sCount[h]-=e.blkIndent);break}d.push(e.bMarks[h]),m.push(e.bsCount[h]),b.push(e.tShift[h]),k.push(e.sCount[h]),e.sCount[h]=-1}else{for(c=f=e.sCount[h]+D-(e.bMarks[h]+e.tShift[h]),32===e.src.charCodeAt(D)?(D++,c++,f++,o=!1,v=!0):9===e.src.charCodeAt(D)?(v=!0,(e.bsCount[h]+f)%4==3?(D++,c++,f++,o=!1):o=!0):v=!1,d.push(e.bMarks[h]),e.bMarks[h]=D;D<E&&(i=e.src.charCodeAt(D),n(i));)9===i?f+=4-(f+e.bsCount[h]+(o?1:0))%4:f++,D++;u=D>=E,m.push(e.bsCount[h]),e.bsCount[h]=e.sCount[h]+1+(v?1:0),k.push(e.sCount[h]),e.sCount[h]=f-c,b.push(e.tShift[h]),e.tShift[h]=D-e.bMarks[h]}for(_=e.blkIndent,e.blkIndent=0,(x=e.push("blockquote_open","blockquote",1)).markup=">",x.map=p=[r,0],e.md.block.tokenize(e,r,h),(x=e.push("blockquote_close","blockquote",-1)).markup=">",e.lineMax=w,e.parentType=g,p[1]=e.line,a=0;a<b.length;a++)e.bMarks[a+r]=d[a],e.tShift[a+r]=b[a],e.sCount[a+r]=k[a],e.bsCount[a+r]=m[a];return e.blkIndent=_,!0}},{"../common/utils":4}],19:[function(e,r,t){"use strict";r.exports=function(e,r,t){var n,s,o;if(e.sCount[r]-e.blkIndent<4)return!1;for(s=n=r+1;n<t;)if(e.isEmpty(n))n++;else{if(!(e.sCount[n]-e.blkIndent>=4))break;s=++n}return e.line=s,(o=e.push("code_block","code",0)).content=e.getLines(r,s,4+e.blkIndent,!0),o.map=[r,e.line],!0}},{}],20:[function(e,r,t){"use strict";r.exports=function(e,r,t,n){var s,o,i,a,c,l,u,p=!1,h=e.bMarks[r]+e.tShift[r],f=e.eMarks[r];if(e.sCount[r]-e.blkIndent>=4)return!1;if(h+3>f)return!1;if(126!==(s=e.src.charCodeAt(h))&&96!==s)return!1;if(c=h,(o=(h=e.skipChars(h,s))-c)<3)return!1;if(u=e.src.slice(c,h),i=e.src.slice(h,f),96===s&&i.indexOf(String.fromCharCode(s))>=0)return!1;if(n)return!0;for(a=r;!(++a>=t)&&!((h=c=e.bMarks[a]+e.tShift[a])<(f=e.eMarks[a])&&e.sCount[a]<e.blkIndent);)if(e.src.charCodeAt(h)===s&&!(e.sCount[a]-e.blkIndent>=4||(h=e.skipChars(h,s))-c<o||(h=e.skipSpaces(h))<f)){p=!0;break}return o=e.sCount[r],e.line=a+(p?1:0),(l=e.push("fence","code",0)).info=i,l.content=e.getLines(r+1,a,o,!0),l.markup=u,l.map=[r,e.line],!0}},{}],21:[function(e,r,t){"use strict";var n=e("../common/utils").isSpace;r.exports=function(e,r,t,s){var o,i,a,c,l=e.bMarks[r]+e.tShift[r],u=e.eMarks[r];if(e.sCount[r]-e.blkIndent>=4)return!1;if(35!==(o=e.src.charCodeAt(l))||l>=u)return!1;for(i=1,o=e.src.charCodeAt(++l);35===o&&l<u&&i<=6;)i++,o=e.src.charCodeAt(++l);return!(i>6||l<u&&!n(o))&&(!!s||(u=e.skipSpacesBack(u,l),(a=e.skipCharsBack(u,35,l))>l&&n(e.src.charCodeAt(a-1))&&(u=a),e.line=r+1,(c=e.push("heading_open","h"+String(i),1)).markup="########".slice(0,i),c.map=[r,e.line],(c=e.push("inline","",0)).content=e.src.slice(l,u).trim(),c.map=[r,e.line],c.children=[],(c=e.push("heading_close","h"+String(i),-1)).markup="########".slice(0,i),!0))}},{"../common/utils":4}],22:[function(e,r,t){"use strict";var n=e("../common/utils").isSpace;r.exports=function(e,r,t,s){var o,i,a,c,l=e.bMarks[r]+e.tShift[r],u=e.eMarks[r];if(e.sCount[r]-e.blkIndent>=4)return!1;if(42!==(o=e.src.charCodeAt(l++))&&45!==o&&95!==o)return!1;for(i=1;l<u;){if((a=e.src.charCodeAt(l++))!==o&&!n(a))return!1;a===o&&i++}return!(i<3)&&(!!s||(e.line=r+1,(c=e.push("hr","hr",0)).map=[r,e.line],c.markup=Array(i+1).join(String.fromCharCode(o)),!0))}},{"../common/utils":4}],23:[function(e,r,t){"use strict";var n=e("../common/html_blocks"),s=e("../common/html_re").HTML_OPEN_CLOSE_TAG_RE,o=[[/^<(script|pre|style)(?=(\s|>|$))/i,/<\/(script|pre|style)>/i,!0],[/^<!--/,/-->/,!0],[/^<\?/,/\?>/,!0],[/^<![A-Z]/,/>/,!0],[/^<!\[CDATA\[/,/\]\]>/,!0],[new RegExp("^</?("+n.join("|")+")(?=(\\s|/?>|$))","i"),/^$/,!0],[new RegExp(s.source+"\\s*$"),/^$/,!1]];r.exports=function(e,r,t,n){var s,i,a,c,l=e.bMarks[r]+e.tShift[r],u=e.eMarks[r];if(e.sCount[r]-e.blkIndent>=4)return!1;if(!e.md.options.html)return!1;if(60!==e.src.charCodeAt(l))return!1;for(c=e.src.slice(l,u),s=0;s<o.length&&!o[s][0].test(c);s++);if(s===o.length)return!1;if(n)return o[s][2];if(i=r+1,!o[s][1].test(c))for(;i<t&&!(e.sCount[i]<e.blkIndent);i++)if(l=e.bMarks[i]+e.tShift[i],u=e.eMarks[i],c=e.src.slice(l,u),o[s][1].test(c)){0!==c.length&&i++;break}return e.line=i,(a=e.push("html_block","",0)).map=[r,i],a.content=e.getLines(r,i,e.blkIndent,!0),!0}},{"../common/html_blocks":2,"../common/html_re":3}],24:[function(e,r,t){"use strict";r.exports=function(e,r,t){var n,s,o,i,a,c,l,u,p,h,f=r+1,d=e.md.block.ruler.getRules("paragraph");if(e.sCount[r]-e.blkIndent>=4)return!1;for(h=e.parentType,e.parentType="paragraph";f<t&&!e.isEmpty(f);f++)if(!(e.sCount[f]-e.blkIndent>3)){if(e.sCount[f]>=e.blkIndent&&(c=e.bMarks[f]+e.tShift[f])<(l=e.eMarks[f])&&(45===(p=e.src.charCodeAt(c))||61===p)&&(c=e.skipChars(c,p),(c=e.skipSpaces(c))>=l)){u=61===p?1:2;break}if(!(e.sCount[f]<0)){for(s=!1,o=0,i=d.length;o<i;o++)if(d[o](e,f,t,!0)){s=!0;break}if(s)break}}return!!u&&(n=e.getLines(r,f,e.blkIndent,!1).trim(),e.line=f+1,(a=e.push("heading_open","h"+String(u),1)).markup=String.fromCharCode(p),a.map=[r,e.line],(a=e.push("inline","",0)).content=n,a.map=[r,e.line-1],a.children=[],(a=e.push("heading_close","h"+String(u),-1)).markup=String.fromCharCode(p),e.parentType=h,!0)}},{}],25:[function(e,r,t){"use strict";var n=e("../common/utils").isSpace;function s(e,r){var t,s,o,i;return s=e.bMarks[r]+e.tShift[r],o=e.eMarks[r],42!==(t=e.src.charCodeAt(s++))&&45!==t&&43!==t?-1:s<o&&(i=e.src.charCodeAt(s),!n(i))?-1:s}function o(e,r){var t,s=e.bMarks[r]+e.tShift[r],o=s,i=e.eMarks[r];if(o+1>=i)return-1;if((t=e.src.charCodeAt(o++))<48||t>57)return-1;for(;;){if(o>=i)return-1;if(!((t=e.src.charCodeAt(o++))>=48&&t<=57)){if(41===t||46===t)break;return-1}if(o-s>=10)return-1}return o<i&&(t=e.src.charCodeAt(o),!n(t))?-1:o}r.exports=function(e,r,t,n){var i,a,c,l,u,p,h,f,d,m,_,g,k,b,v,y,C,x,A,w,D,E,q,F,S,L,z,T,I=!1,R=!0;if(e.sCount[r]-e.blkIndent>=4)return!1;if(e.listIndent>=0&&e.sCount[r]-e.listIndent>=4&&e.sCount[r]<e.blkIndent)return!1;if(n&&"paragraph"===e.parentType&&e.tShift[r]>=e.blkIndent&&(I=!0),(q=o(e,r))>=0){if(h=!0,S=e.bMarks[r]+e.tShift[r],k=Number(e.src.substr(S,q-S-1)),I&&1!==k)return!1}else{if(!((q=s(e,r))>=0))return!1;h=!1}if(I&&e.skipSpaces(q)>=e.eMarks[r])return!1;if(g=e.src.charCodeAt(q-1),n)return!0;for(_=e.tokens.length,h?(T=e.push("ordered_list_open","ol",1),1!==k&&(T.attrs=[["start",k]])):T=e.push("bullet_list_open","ul",1),T.map=m=[r,0],T.markup=String.fromCharCode(g),v=r,F=!1,z=e.md.block.ruler.getRules("list"),x=e.parentType,e.parentType="list";v<t;){for(E=q,b=e.eMarks[v],p=y=e.sCount[v]+q-(e.bMarks[r]+e.tShift[r]);E<b;){if(9===(i=e.src.charCodeAt(E)))y+=4-(y+e.bsCount[v])%4;else{if(32!==i)break;y++}E++}if((u=(a=E)>=b?1:y-p)>4&&(u=1),l=p+u,(T=e.push("list_item_open","li",1)).markup=String.fromCharCode(g),T.map=f=[r,0],D=e.tight,w=e.tShift[r],A=e.sCount[r],C=e.listIndent,e.listIndent=e.blkIndent,e.blkIndent=l,e.tight=!0,e.tShift[r]=a-e.bMarks[r],e.sCount[r]=y,a>=b&&e.isEmpty(r+1)?e.line=Math.min(e.line+2,t):e.md.block.tokenize(e,r,t,!0),e.tight&&!F||(R=!1),F=e.line-r>1&&e.isEmpty(e.line-1),e.blkIndent=e.listIndent,e.listIndent=C,e.tShift[r]=w,e.sCount[r]=A,e.tight=D,(T=e.push("list_item_close","li",-1)).markup=String.fromCharCode(g),v=r=e.line,f[1]=v,a=e.bMarks[r],v>=t)break;if(e.sCount[v]<e.blkIndent)break;if(e.sCount[r]-e.blkIndent>=4)break;for(L=!1,c=0,d=z.length;c<d;c++)if(z[c](e,v,t,!0)){L=!0;break}if(L)break;if(h){if((q=o(e,v))<0)break}else if((q=s(e,v))<0)break;if(g!==e.src.charCodeAt(q-1))break}return(T=h?e.push("ordered_list_close","ol",-1):e.push("bullet_list_close","ul",-1)).markup=String.fromCharCode(g),m[1]=v,e.line=v,e.parentType=x,R&&function(e,r){var t,n,s=e.level+2;for(t=r+2,n=e.tokens.length-2;t<n;t++)e.tokens[t].level===s&&"paragraph_open"===e.tokens[t].type&&(e.tokens[t+2].hidden=!0,e.tokens[t].hidden=!0,t+=2)}(e,_),!0}},{"../common/utils":4}],26:[function(e,r,t){"use strict";r.exports=function(e,r){var t,n,s,o,i,a,c=r+1,l=e.md.block.ruler.getRules("paragraph"),u=e.lineMax;for(a=e.parentType,e.parentType="paragraph";c<u&&!e.isEmpty(c);c++)if(!(e.sCount[c]-e.blkIndent>3||e.sCount[c]<0)){for(n=!1,s=0,o=l.length;s<o;s++)if(l[s](e,c,u,!0)){n=!0;break}if(n)break}return t=e.getLines(r,c,e.blkIndent,!1).trim(),e.line=c,(i=e.push("paragraph_open","p",1)).map=[r,e.line],(i=e.push("inline","",0)).content=t,i.map=[r,e.line],i.children=[],i=e.push("paragraph_close","p",-1),e.parentType=a,!0}},{}],27:[function(e,r,t){"use strict";var n=e("../common/utils").normalizeReference,s=e("../common/utils").isSpace;r.exports=function(e,r,t,o){var i,a,c,l,u,p,h,f,d,m,_,g,k,b,v,y,C=0,x=e.bMarks[r]+e.tShift[r],A=e.eMarks[r],w=r+1;if(e.sCount[r]-e.blkIndent>=4)return!1;if(91!==e.src.charCodeAt(x))return!1;for(;++x<A;)if(93===e.src.charCodeAt(x)&&92!==e.src.charCodeAt(x-1)){if(x+1===A)return!1;if(58!==e.src.charCodeAt(x+1))return!1;break}for(l=e.lineMax,v=e.md.block.ruler.getRules("reference"),m=e.parentType,e.parentType="reference";w<l&&!e.isEmpty(w);w++)if(!(e.sCount[w]-e.blkIndent>3||e.sCount[w]<0)){for(b=!1,p=0,h=v.length;p<h;p++)if(v[p](e,w,l,!0)){b=!0;break}if(b)break}for(A=(k=e.getLines(r,w,e.blkIndent,!1).trim()).length,x=1;x<A;x++){if(91===(i=k.charCodeAt(x)))return!1;if(93===i){d=x;break}10===i?C++:92===i&&++x<A&&10===k.charCodeAt(x)&&C++}if(d<0||58!==k.charCodeAt(d+1))return!1;for(x=d+2;x<A;x++)if(10===(i=k.charCodeAt(x)))C++;else if(!s(i))break;if(!(_=e.md.helpers.parseLinkDestination(k,x,A)).ok)return!1;if(u=e.md.normalizeLink(_.str),!e.md.validateLink(u))return!1;for(a=x=_.pos,c=C+=_.lines,g=x;x<A;x++)if(10===(i=k.charCodeAt(x)))C++;else if(!s(i))break;for(_=e.md.helpers.parseLinkTitle(k,x,A),x<A&&g!==x&&_.ok?(y=_.str,x=_.pos,C+=_.lines):(y="",x=a,C=c);x<A&&(i=k.charCodeAt(x),s(i));)x++;if(x<A&&10!==k.charCodeAt(x)&&y)for(y="",x=a,C=c;x<A&&(i=k.charCodeAt(x),s(i));)x++;return!(x<A&&10!==k.charCodeAt(x))&&(!!(f=n(k.slice(1,d)))&&(!!o||(void 0===e.env.references&&(e.env.references={}),void 0===e.env.references[f]&&(e.env.references[f]={title:y,href:u}),e.parentType=m,e.line=r+C+1,!0)))}},{"../common/utils":4}],28:[function(e,r,t){"use strict";var n=e("../token"),s=e("../common/utils").isSpace;function o(e,r,t,n){var o,i,a,c,l,u,p,h;for(this.src=e,this.md=r,this.env=t,this.tokens=n,this.bMarks=[],this.eMarks=[],this.tShift=[],this.sCount=[],this.bsCount=[],this.blkIndent=0,this.line=0,this.lineMax=0,this.tight=!1,this.ddIndent=-1,this.listIndent=-1,this.parentType="root",this.level=0,this.result="",h=!1,a=c=u=p=0,l=(i=this.src).length;c<l;c++){if(o=i.charCodeAt(c),!h){if(s(o)){u++,9===o?p+=4-p%4:p++;continue}h=!0}10!==o&&c!==l-1||(10!==o&&c++,this.bMarks.push(a),this.eMarks.push(c),this.tShift.push(u),this.sCount.push(p),this.bsCount.push(0),h=!1,u=0,p=0,a=c+1)}this.bMarks.push(i.length),this.eMarks.push(i.length),this.tShift.push(0),this.sCount.push(0),this.bsCount.push(0),this.lineMax=this.bMarks.length-1}o.prototype.push=function(e,r,t){var s=new n(e,r,t);return s.block=!0,t<0&&this.level--,s.level=this.level,t>0&&this.level++,this.tokens.push(s),s},o.prototype.isEmpty=function(e){return this.bMarks[e]+this.tShift[e]>=this.eMarks[e]},o.prototype.skipEmptyLines=function(e){for(var r=this.lineMax;e<r&&!(this.bMarks[e]+this.tShift[e]<this.eMarks[e]);e++);return e},o.prototype.skipSpaces=function(e){for(var r,t=this.src.length;e<t&&(r=this.src.charCodeAt(e),s(r));e++);return e},o.prototype.skipSpacesBack=function(e,r){if(e<=r)return e;for(;e>r;)if(!s(this.src.charCodeAt(--e)))return e+1;return e},o.prototype.skipChars=function(e,r){for(var t=this.src.length;e<t&&this.src.charCodeAt(e)===r;e++);return e},o.prototype.skipCharsBack=function(e,r,t){if(e<=t)return e;for(;e>t;)if(r!==this.src.charCodeAt(--e))return e+1;return e},o.prototype.getLines=function(e,r,t,n){var o,i,a,c,l,u,p,h=e;if(e>=r)return"";for(u=new Array(r-e),o=0;h<r;h++,o++){for(i=0,p=c=this.bMarks[h],l=h+1<r||n?this.eMarks[h]+1:this.eMarks[h];c<l&&i<t;){if(a=this.src.charCodeAt(c),s(a))9===a?i+=4-(i+this.bsCount[h])%4:i++;else{if(!(c-p<this.tShift[h]))break;i++}c++}u[o]=i>t?new Array(i-t+1).join(" ")+this.src.slice(c,l):this.src.slice(c,l)}return u.join("")},o.prototype.Token=n,r.exports=o},{"../common/utils":4,"../token":51}],29:[function(e,r,t){"use strict";var n=e("../common/utils").isSpace;function s(e,r){var t=e.bMarks[r]+e.blkIndent,n=e.eMarks[r];return e.src.substr(t,n-t)}function o(e){var r,t=[],n=0,s=e.length,o=0,i=0,a=!1,c=0;for(r=e.charCodeAt(n);n<s;)96===r?a?(a=!1,c=n):o%2==0&&(a=!0,c=n):124!==r||o%2!=0||a||(t.push(e.substring(i,n)),i=n+1),92===r?o++:o=0,++n===s&&a&&(a=!1,n=c+1),r=e.charCodeAt(n);return t.push(e.substring(i)),t}r.exports=function(e,r,t,i){var a,c,l,u,p,h,f,d,m,_,g,k;if(r+2>t)return!1;if(p=r+1,e.sCount[p]<e.blkIndent)return!1;if(e.sCount[p]-e.blkIndent>=4)return!1;if((l=e.bMarks[p]+e.tShift[p])>=e.eMarks[p])return!1;if(124!==(a=e.src.charCodeAt(l++))&&45!==a&&58!==a)return!1;for(;l<e.eMarks[p];){if(124!==(a=e.src.charCodeAt(l))&&45!==a&&58!==a&&!n(a))return!1;l++}for(h=(c=s(e,r+1)).split("|"),m=[],u=0;u<h.length;u++){if(!(_=h[u].trim())){if(0===u||u===h.length-1)continue;return!1}if(!/^:?-+:?$/.test(_))return!1;58===_.charCodeAt(_.length-1)?m.push(58===_.charCodeAt(0)?"center":"right"):58===_.charCodeAt(0)?m.push("left"):m.push("")}if(-1===(c=s(e,r).trim()).indexOf("|"))return!1;if(e.sCount[r]-e.blkIndent>=4)return!1;if((f=(h=o(c.replace(/^\||\|$/g,""))).length)>m.length)return!1;if(i)return!0;for((d=e.push("table_open","table",1)).map=g=[r,0],(d=e.push("thead_open","thead",1)).map=[r,r+1],(d=e.push("tr_open","tr",1)).map=[r,r+1],u=0;u<h.length;u++)(d=e.push("th_open","th",1)).map=[r,r+1],m[u]&&(d.attrs=[["style","text-align:"+m[u]]]),(d=e.push("inline","",0)).content=h[u].trim(),d.map=[r,r+1],d.children=[],d=e.push("th_close","th",-1);for(d=e.push("tr_close","tr",-1),d=e.push("thead_close","thead",-1),(d=e.push("tbody_open","tbody",1)).map=k=[r+2,0],p=r+2;p<t&&!(e.sCount[p]<e.blkIndent)&&-1!==(c=s(e,p).trim()).indexOf("|")&&!(e.sCount[p]-e.blkIndent>=4);p++){for(h=o(c.replace(/^\||\|$/g,"")),d=e.push("tr_open","tr",1),u=0;u<f;u++)d=e.push("td_open","td",1),m[u]&&(d.attrs=[["style","text-align:"+m[u]]]),(d=e.push("inline","",0)).content=h[u]?h[u].trim():"",d.children=[],d=e.push("td_close","td",-1);d=e.push("tr_close","tr",-1)}return d=e.push("tbody_close","tbody",-1),d=e.push("table_close","table",-1),g[1]=k[1]=p,e.line=p,!0}},{"../common/utils":4}],30:[function(e,r,t){"use strict";r.exports=function(e){var r;e.inlineMode?((r=new e.Token("inline","",0)).content=e.src,r.map=[0,1],r.children=[],e.tokens.push(r)):e.md.block.parse(e.src,e.md,e.env,e.tokens)}},{}],31:[function(e,r,t){"use strict";r.exports=function(e){var r,t,n,s=e.tokens;for(t=0,n=s.length;t<n;t++)"inline"===(r=s[t]).type&&e.md.inline.parse(r.content,e.md,e.env,r.children)}},{}],32:[function(e,r,t){"use strict";var n=e("../common/utils").arrayReplaceAt;function s(e){return/^<\/a\s*>/i.test(e)}r.exports=function(e){var r,t,o,i,a,c,l,u,p,h,f,d,m,_,g,k,b,v,y=e.tokens;if(e.md.options.linkify)for(t=0,o=y.length;t<o;t++)if("inline"===y[t].type&&e.md.linkify.pretest(y[t].content))for(m=0,r=(i=y[t].children).length-1;r>=0;r--)if("link_close"!==(c=i[r]).type){if("html_inline"===c.type&&(v=c.content,/^<a[>\s]/i.test(v)&&m>0&&m--,s(c.content)&&m++),!(m>0)&&"text"===c.type&&e.md.linkify.test(c.content)){for(p=c.content,b=e.md.linkify.match(p),l=[],d=c.level,f=0,u=0;u<b.length;u++)_=b[u].url,g=e.md.normalizeLink(_),e.md.validateLink(g)&&(k=b[u].text,k=b[u].schema?"mailto:"!==b[u].schema||/^mailto:/i.test(k)?e.md.normalizeLinkText(k):e.md.normalizeLinkText("mailto:"+k).replace(/^mailto:/,""):e.md.normalizeLinkText("http://"+k).replace(/^http:\/\//,""),(h=b[u].index)>f&&((a=new e.Token("text","",0)).content=p.slice(f,h),a.level=d,l.push(a)),(a=new e.Token("link_open","a",1)).attrs=[["href",g]],a.level=d++,a.markup="linkify",a.info="auto",l.push(a),(a=new e.Token("text","",0)).content=k,a.level=d,l.push(a),(a=new e.Token("link_close","a",-1)).level=--d,a.markup="linkify",a.info="auto",l.push(a),f=b[u].lastIndex);f<p.length&&((a=new e.Token("text","",0)).content=p.slice(f),a.level=d,l.push(a)),y[t].children=i=n(i,r,l)}}else for(r--;i[r].level!==c.level&&"link_open"!==i[r].type;)r--}},{"../common/utils":4}],33:[function(e,r,t){"use strict";var n=/\r\n?|\n/g,s=/\0/g;r.exports=function(e){var r;r=(r=e.src.replace(n,"\n")).replace(s,"\ufffd"),e.src=r}},{}],34:[function(e,r,t){"use strict";var n=/\+-|\.\.|\?\?\?\?|!!!!|,,|--/,s=/\((c|tm|r|p)\)/i,o=/\((c|tm|r|p)\)/gi,i={c:"\xa9",r:"\xae",p:"\xa7",tm:"\u2122"};function a(e,r){return i[r.toLowerCase()]}function c(e){var r,t,n=0;for(r=e.length-1;r>=0;r--)"text"!==(t=e[r]).type||n||(t.content=t.content.replace(o,a)),"link_open"===t.type&&"auto"===t.info&&n--,"link_close"===t.type&&"auto"===t.info&&n++}function l(e){var r,t,s=0;for(r=e.length-1;r>=0;r--)"text"!==(t=e[r]).type||s||n.test(t.content)&&(t.content=t.content.replace(/\+-/g,"\xb1").replace(/\.{2,}/g,"\u2026").replace(/([?!])\u2026/g,"$1..").replace(/([?!]){4,}/g,"$1$1$1").replace(/,{2,}/g,",").replace(/(^|[^-])---([^-]|$)/gm,"$1\u2014$2").replace(/(^|\s)--(\s|$)/gm,"$1\u2013$2").replace(/(^|[^-\s])--([^-\s]|$)/gm,"$1\u2013$2")),"link_open"===t.type&&"auto"===t.info&&s--,"link_close"===t.type&&"auto"===t.info&&s++}r.exports=function(e){var r;if(e.md.options.typographer)for(r=e.tokens.length-1;r>=0;r--)"inline"===e.tokens[r].type&&(s.test(e.tokens[r].content)&&c(e.tokens[r].children),n.test(e.tokens[r].content)&&l(e.tokens[r].children))}},{}],35:[function(e,r,t){"use strict";var n=e("../common/utils").isWhiteSpace,s=e("../common/utils").isPunctChar,o=e("../common/utils").isMdAsciiPunct,i=/['"]/,a=/['"]/g,c="\u2019";function l(e,r,t){return e.substr(0,r)+t+e.substr(r+1)}function u(e,r){var t,i,u,p,h,f,d,m,_,g,k,b,v,y,C,x,A,w,D,E,q;for(D=[],t=0;t<e.length;t++){for(i=e[t],d=e[t].level,A=D.length-1;A>=0&&!(D[A].level<=d);A--);if(D.length=A+1,"text"===i.type){h=0,f=(u=i.content).length;e:for(;h<f&&(a.lastIndex=h,p=a.exec(u));){if(C=x=!0,h=p.index+1,w="'"===p[0],_=32,p.index-1>=0)_=u.charCodeAt(p.index-1);else for(A=t-1;A>=0&&("softbreak"!==e[A].type&&"hardbreak"!==e[A].type);A--)if("text"===e[A].type){_=e[A].content.charCodeAt(e[A].content.length-1);break}if(g=32,h<f)g=u.charCodeAt(h);else for(A=t+1;A<e.length&&("softbreak"!==e[A].type&&"hardbreak"!==e[A].type);A++)if("text"===e[A].type){g=e[A].content.charCodeAt(0);break}if(k=o(_)||s(String.fromCharCode(_)),b=o(g)||s(String.fromCharCode(g)),v=n(_),(y=n(g))?C=!1:b&&(v||k||(C=!1)),v?x=!1:k&&(y||b||(x=!1)),34===g&&'"'===p[0]&&_>=48&&_<=57&&(x=C=!1),C&&x&&(C=!1,x=b),C||x){if(x)for(A=D.length-1;A>=0&&(m=D[A],!(D[A].level<d));A--)if(m.single===w&&D[A].level===d){m=D[A],w?(E=r.md.options.quotes[2],q=r.md.options.quotes[3]):(E=r.md.options.quotes[0],q=r.md.options.quotes[1]),i.content=l(i.content,p.index,q),e[m.token].content=l(e[m.token].content,m.pos,E),h+=q.length-1,m.token===t&&(h+=E.length-1),f=(u=i.content).length,D.length=A;continue e}C?D.push({token:t,pos:p.index,single:w,level:d}):x&&w&&(i.content=l(i.content,p.index,c))}else w&&(i.content=l(i.content,p.index,c))}}}}r.exports=function(e){var r;if(e.md.options.typographer)for(r=e.tokens.length-1;r>=0;r--)"inline"===e.tokens[r].type&&i.test(e.tokens[r].content)&&u(e.tokens[r].children,e)}},{"../common/utils":4}],36:[function(e,r,t){"use strict";var n=e("../token");function s(e,r,t){this.src=e,this.env=t,this.tokens=[],this.inlineMode=!1,this.md=r}s.prototype.Token=n,r.exports=s},{"../token":51}],37:[function(e,r,t){"use strict";var n=/^<([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)>/,s=/^<([a-zA-Z][a-zA-Z0-9+.\-]{1,31}):([^<>\x00-\x20]*)>/;r.exports=function(e,r){var t,o,i,a,c,l,u=e.pos;return 60===e.src.charCodeAt(u)&&(!((t=e.src.slice(u)).indexOf(">")<0)&&(s.test(t)?(a=(o=t.match(s))[0].slice(1,-1),c=e.md.normalizeLink(a),!!e.md.validateLink(c)&&(r||((l=e.push("link_open","a",1)).attrs=[["href",c]],l.markup="autolink",l.info="auto",(l=e.push("text","",0)).content=e.md.normalizeLinkText(a),(l=e.push("link_close","a",-1)).markup="autolink",l.info="auto"),e.pos+=o[0].length,!0)):!!n.test(t)&&(a=(i=t.match(n))[0].slice(1,-1),c=e.md.normalizeLink("mailto:"+a),!!e.md.validateLink(c)&&(r||((l=e.push("link_open","a",1)).attrs=[["href",c]],l.markup="autolink",l.info="auto",(l=e.push("text","",0)).content=e.md.normalizeLinkText(a),(l=e.push("link_close","a",-1)).markup="autolink",l.info="auto"),e.pos+=i[0].length,!0))))}},{}],38:[function(e,r,t){"use strict";r.exports=function(e,r){var t,n,s,o,i,a,c=e.pos;if(96!==e.src.charCodeAt(c))return!1;for(t=c,c++,n=e.posMax;c<n&&96===e.src.charCodeAt(c);)c++;for(s=e.src.slice(t,c),o=i=c;-1!==(o=e.src.indexOf("`",i));){for(i=o+1;i<n&&96===e.src.charCodeAt(i);)i++;if(i-o===s.length)return r||((a=e.push("code_inline","code",0)).markup=s,a.content=e.src.slice(c,o).replace(/\n/g," ").replace(/^ (.+) $/,"$1")),e.pos=i,!0}return r||(e.pending+=s),e.pos+=s.length,!0}},{}],39:[function(e,r,t){"use strict";function n(e,r){var t,n,s,o,i,a,c,l,u={},p=r.length;for(t=0;t<p;t++)if((s=r[t]).length=s.length||0,s.close){for(u.hasOwnProperty(s.marker)||(u[s.marker]=[-1,-1,-1]),i=u[s.marker][s.length%3],a=-1,n=t-s.jump-1;n>i;n-=o.jump+1)if((o=r[n]).marker===s.marker&&(-1===a&&(a=n),o.open&&o.end<0&&o.level===s.level&&(c=!1,(o.close||s.open)&&(o.length+s.length)%3==0&&(o.length%3==0&&s.length%3==0||(c=!0)),!c))){l=n>0&&!r[n-1].open?r[n-1].jump+1:0,s.jump=t-n+l,s.open=!1,o.end=t,o.jump=l,o.close=!1,a=-1;break}-1!==a&&(u[s.marker][(s.length||0)%3]=a)}}r.exports=function(e){var r,t=e.tokens_meta,s=e.tokens_meta.length;for(n(0,e.delimiters),r=0;r<s;r++)t[r]&&t[r].delimiters&&n(0,t[r].delimiters)}},{}],40:[function(e,r,t){"use strict";function n(e,r){var t,n,s,o,i,a;for(t=r.length-1;t>=0;t--)95!==(n=r[t]).marker&&42!==n.marker||-1!==n.end&&(s=r[n.end],a=t>0&&r[t-1].end===n.end+1&&r[t-1].token===n.token-1&&r[n.end+1].token===s.token+1&&r[t-1].marker===n.marker,i=String.fromCharCode(n.marker),(o=e.tokens[n.token]).type=a?"strong_open":"em_open",o.tag=a?"strong":"em",o.nesting=1,o.markup=a?i+i:i,o.content="",(o=e.tokens[s.token]).type=a?"strong_close":"em_close",o.tag=a?"strong":"em",o.nesting=-1,o.markup=a?i+i:i,o.content="",a&&(e.tokens[r[t-1].token].content="",e.tokens[r[n.end+1].token].content="",t--))}r.exports.tokenize=function(e,r){var t,n,s=e.pos,o=e.src.charCodeAt(s);if(r)return!1;if(95!==o&&42!==o)return!1;for(n=e.scanDelims(e.pos,42===o),t=0;t<n.length;t++)e.push("text","",0).content=String.fromCharCode(o),e.delimiters.push({marker:o,length:n.length,jump:t,token:e.tokens.length-1,end:-1,open:n.can_open,close:n.can_close});return e.pos+=n.length,!0},r.exports.postProcess=function(e){var r,t=e.tokens_meta,s=e.tokens_meta.length;for(n(e,e.delimiters),r=0;r<s;r++)t[r]&&t[r].delimiters&&n(e,t[r].delimiters)}},{}],41:[function(e,r,t){"use strict";var n=e("../common/entities"),s=e("../common/utils").has,o=e("../common/utils").isValidEntityCode,i=e("../common/utils").fromCodePoint,a=/^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i,c=/^&([a-z][a-z0-9]{1,31});/i;r.exports=function(e,r){var t,l,u=e.pos,p=e.posMax;if(38!==e.src.charCodeAt(u))return!1;if(u+1<p)if(35===e.src.charCodeAt(u+1)){if(l=e.src.slice(u).match(a))return r||(t="x"===l[1][0].toLowerCase()?parseInt(l[1].slice(1),16):parseInt(l[1],10),e.pending+=o(t)?i(t):i(65533)),e.pos+=l[0].length,!0}else if((l=e.src.slice(u).match(c))&&s(n,l[1]))return r||(e.pending+=n[l[1]]),e.pos+=l[0].length,!0;return r||(e.pending+="&"),e.pos++,!0}},{"../common/entities":1,"../common/utils":4}],42:[function(e,r,t){"use strict";for(var n=e("../common/utils").isSpace,s=[],o=0;o<256;o++)s.push(0);"\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach((function(e){s[e.charCodeAt(0)]=1})),r.exports=function(e,r){var t,o=e.pos,i=e.posMax;if(92!==e.src.charCodeAt(o))return!1;if(++o<i){if((t=e.src.charCodeAt(o))<256&&0!==s[t])return r||(e.pending+=e.src[o]),e.pos+=2,!0;if(10===t){for(r||e.push("hardbreak","br",0),o++;o<i&&(t=e.src.charCodeAt(o),n(t));)o++;return e.pos=o,!0}}return r||(e.pending+="\\"),e.pos++,!0}},{"../common/utils":4}],43:[function(e,r,t){"use strict";var n=e("../common/html_re").HTML_TAG_RE;r.exports=function(e,r){var t,s,o,i=e.pos;return!!e.md.options.html&&(o=e.posMax,!(60!==e.src.charCodeAt(i)||i+2>=o)&&(!(33!==(t=e.src.charCodeAt(i+1))&&63!==t&&47!==t&&!function(e){var r=32|e;return r>=97&&r<=122}(t))&&(!!(s=e.src.slice(i).match(n))&&(r||(e.push("html_inline","",0).content=e.src.slice(i,i+s[0].length)),e.pos+=s[0].length,!0))))}},{"../common/html_re":3}],44:[function(e,r,t){"use strict";var n=e("../common/utils").normalizeReference,s=e("../common/utils").isSpace;r.exports=function(e,r){var t,o,i,a,c,l,u,p,h,f,d,m,_,g="",k=e.pos,b=e.posMax;if(33!==e.src.charCodeAt(e.pos))return!1;if(91!==e.src.charCodeAt(e.pos+1))return!1;if(l=e.pos+2,(c=e.md.helpers.parseLinkLabel(e,e.pos+1,!1))<0)return!1;if((u=c+1)<b&&40===e.src.charCodeAt(u)){for(u++;u<b&&(o=e.src.charCodeAt(u),s(o)||10===o);u++);if(u>=b)return!1;for(_=u,(h=e.md.helpers.parseLinkDestination(e.src,u,e.posMax)).ok&&(g=e.md.normalizeLink(h.str),e.md.validateLink(g)?u=h.pos:g=""),_=u;u<b&&(o=e.src.charCodeAt(u),s(o)||10===o);u++);if(h=e.md.helpers.parseLinkTitle(e.src,u,e.posMax),u<b&&_!==u&&h.ok)for(f=h.str,u=h.pos;u<b&&(o=e.src.charCodeAt(u),s(o)||10===o);u++);else f="";if(u>=b||41!==e.src.charCodeAt(u))return e.pos=k,!1;u++}else{if(void 0===e.env.references)return!1;if(u<b&&91===e.src.charCodeAt(u)?(_=u+1,(u=e.md.helpers.parseLinkLabel(e,u))>=0?a=e.src.slice(_,u++):u=c+1):u=c+1,a||(a=e.src.slice(l,c)),!(p=e.env.references[n(a)]))return e.pos=k,!1;g=p.href,f=p.title}return r||(i=e.src.slice(l,c),e.md.inline.parse(i,e.md,e.env,m=[]),(d=e.push("image","img",0)).attrs=t=[["src",g],["alt",""]],d.children=m,d.content=i,f&&t.push(["title",f])),e.pos=u,e.posMax=b,!0}},{"../common/utils":4}],45:[function(e,r,t){"use strict";var n=e("../common/utils").normalizeReference,s=e("../common/utils").isSpace;r.exports=function(e,r){var t,o,i,a,c,l,u,p,h,f="",d=e.pos,m=e.posMax,_=e.pos,g=!0;if(91!==e.src.charCodeAt(e.pos))return!1;if(c=e.pos+1,(a=e.md.helpers.parseLinkLabel(e,e.pos,!0))<0)return!1;if((l=a+1)<m&&40===e.src.charCodeAt(l)){for(g=!1,l++;l<m&&(o=e.src.charCodeAt(l),s(o)||10===o);l++);if(l>=m)return!1;for(_=l,(u=e.md.helpers.parseLinkDestination(e.src,l,e.posMax)).ok&&(f=e.md.normalizeLink(u.str),e.md.validateLink(f)?l=u.pos:f=""),_=l;l<m&&(o=e.src.charCodeAt(l),s(o)||10===o);l++);if(u=e.md.helpers.parseLinkTitle(e.src,l,e.posMax),l<m&&_!==l&&u.ok)for(h=u.str,l=u.pos;l<m&&(o=e.src.charCodeAt(l),s(o)||10===o);l++);else h="";(l>=m||41!==e.src.charCodeAt(l))&&(g=!0),l++}if(g){if(void 0===e.env.references)return!1;if(l<m&&91===e.src.charCodeAt(l)?(_=l+1,(l=e.md.helpers.parseLinkLabel(e,l))>=0?i=e.src.slice(_,l++):l=a+1):l=a+1,i||(i=e.src.slice(c,a)),!(p=e.env.references[n(i)]))return e.pos=d,!1;f=p.href,h=p.title}return r||(e.pos=c,e.posMax=a,e.push("link_open","a",1).attrs=t=[["href",f]],h&&t.push(["title",h]),e.md.inline.tokenize(e),e.push("link_close","a",-1)),e.pos=l,e.posMax=m,!0}},{"../common/utils":4}],46:[function(e,r,t){"use strict";var n=e("../common/utils").isSpace;r.exports=function(e,r){var t,s,o=e.pos;if(10!==e.src.charCodeAt(o))return!1;for(t=e.pending.length-1,s=e.posMax,r||(t>=0&&32===e.pending.charCodeAt(t)?t>=1&&32===e.pending.charCodeAt(t-1)?(e.pending=e.pending.replace(/ +$/,""),e.push("hardbreak","br",0)):(e.pending=e.pending.slice(0,-1),e.push("softbreak","br",0)):e.push("softbreak","br",0)),o++;o<s&&n(e.src.charCodeAt(o));)o++;return e.pos=o,!0}},{"../common/utils":4}],47:[function(e,r,t){"use strict";var n=e("../token"),s=e("../common/utils").isWhiteSpace,o=e("../common/utils").isPunctChar,i=e("../common/utils").isMdAsciiPunct;function a(e,r,t,n){this.src=e,this.env=t,this.md=r,this.tokens=n,this.tokens_meta=Array(n.length),this.pos=0,this.posMax=this.src.length,this.level=0,this.pending="",this.pendingLevel=0,this.cache={},this.delimiters=[],this._prev_delimiters=[]}a.prototype.pushPending=function(){var e=new n("text","",0);return e.content=this.pending,e.level=this.pendingLevel,this.tokens.push(e),this.pending="",e},a.prototype.push=function(e,r,t){this.pending&&this.pushPending();var s=new n(e,r,t),o=null;return t<0&&(this.level--,this.delimiters=this._prev_delimiters.pop()),s.level=this.level,t>0&&(this.level++,this._prev_delimiters.push(this.delimiters),this.delimiters=[],o={delimiters:this.delimiters}),this.pendingLevel=this.level,this.tokens.push(s),this.tokens_meta.push(o),s},a.prototype.scanDelims=function(e,r){var t,n,a,c,l,u,p,h,f,d=e,m=!0,_=!0,g=this.posMax,k=this.src.charCodeAt(e);for(t=e>0?this.src.charCodeAt(e-1):32;d<g&&this.src.charCodeAt(d)===k;)d++;return a=d-e,n=d<g?this.src.charCodeAt(d):32,p=i(t)||o(String.fromCharCode(t)),f=i(n)||o(String.fromCharCode(n)),u=s(t),(h=s(n))?m=!1:f&&(u||p||(m=!1)),u?_=!1:p&&(h||f||(_=!1)),r?(c=m,l=_):(c=m&&(!_||p),l=_&&(!m||f)),{can_open:c,can_close:l,length:a}},a.prototype.Token=n,r.exports=a},{"../common/utils":4,"../token":51}],48:[function(e,r,t){"use strict";function n(e,r){var t,n,s,o,i,a=[],c=r.length;for(t=0;t<c;t++)126===(s=r[t]).marker&&-1!==s.end&&(o=r[s.end],(i=e.tokens[s.token]).type="s_open",i.tag="s",i.nesting=1,i.markup="~~",i.content="",(i=e.tokens[o.token]).type="s_close",i.tag="s",i.nesting=-1,i.markup="~~",i.content="","text"===e.tokens[o.token-1].type&&"~"===e.tokens[o.token-1].content&&a.push(o.token-1));for(;a.length;){for(n=(t=a.pop())+1;n<e.tokens.length&&"s_close"===e.tokens[n].type;)n++;t!==--n&&(i=e.tokens[n],e.tokens[n]=e.tokens[t],e.tokens[t]=i)}}r.exports.tokenize=function(e,r){var t,n,s,o,i=e.pos,a=e.src.charCodeAt(i);if(r)return!1;if(126!==a)return!1;if(s=(n=e.scanDelims(e.pos,!0)).length,o=String.fromCharCode(a),s<2)return!1;for(s%2&&(e.push("text","",0).content=o,s--),t=0;t<s;t+=2)e.push("text","",0).content=o+o,e.delimiters.push({marker:a,length:0,jump:t,token:e.tokens.length-1,end:-1,open:n.can_open,close:n.can_close});return e.pos+=n.length,!0},r.exports.postProcess=function(e){var r,t=e.tokens_meta,s=e.tokens_meta.length;for(n(e,e.delimiters),r=0;r<s;r++)t[r]&&t[r].delimiters&&n(e,t[r].delimiters)}},{}],49:[function(e,r,t){"use strict";function n(e){switch(e){case 10:case 33:case 35:case 36:case 37:case 38:case 42:case 43:case 45:case 58:case 60:case 61:case 62:case 64:case 91:case 92:case 93:case 94:case 95:case 96:case 123:case 125:case 126:return!0;default:return!1}}r.exports=function(e,r){for(var t=e.pos;t<e.posMax&&!n(e.src.charCodeAt(t));)t++;return t!==e.pos&&(r||(e.pending+=e.src.slice(e.pos,t)),e.pos=t,!0)}},{}],50:[function(e,r,t){"use strict";r.exports=function(e){var r,t,n=0,s=e.tokens,o=e.tokens.length;for(r=t=0;r<o;r++)s[r].nesting<0&&n--,s[r].level=n,s[r].nesting>0&&n++,"text"===s[r].type&&r+1<o&&"text"===s[r+1].type?s[r+1].content=s[r].content+s[r+1].content:(r!==t&&(s[t]=s[r]),t++);r!==t&&(s.length=t)}},{}],51:[function(e,r,t){"use strict";function n(e,r,t){this.type=e,this.tag=r,this.attrs=null,this.map=null,this.nesting=t,this.level=0,this.children=null,this.content="",this.markup="",this.info="",this.meta=null,this.block=!1,this.hidden=!1}n.prototype.attrIndex=function(e){var r,t,n;if(!this.attrs)return-1;for(t=0,n=(r=this.attrs).length;t<n;t++)if(r[t][0]===e)return t;return-1},n.prototype.attrPush=function(e){this.attrs?this.attrs.push(e):this.attrs=[e]},n.prototype.attrSet=function(e,r){var t=this.attrIndex(e),n=[e,r];t<0?this.attrPush(n):this.attrs[t]=n},n.prototype.attrGet=function(e){var r=this.attrIndex(e),t=null;return r>=0&&(t=this.attrs[r][1]),t},n.prototype.attrJoin=function(e,r){var t=this.attrIndex(e);t<0?this.attrPush([e,r]):this.attrs[t][1]=this.attrs[t][1]+" "+r},r.exports=n},{}],52:[function(e,r,t){r.exports={Aacute:"\xc1",aacute:"\xe1",Abreve:"\u0102",abreve:"\u0103",ac:"\u223e",acd:"\u223f",acE:"\u223e\u0333",Acirc:"\xc2",acirc:"\xe2",acute:"\xb4",Acy:"\u0410",acy:"\u0430",AElig:"\xc6",aelig:"\xe6",af:"\u2061",Afr:"\ud835\udd04",afr:"\ud835\udd1e",Agrave:"\xc0",agrave:"\xe0",alefsym:"\u2135",aleph:"\u2135",Alpha:"\u0391",alpha:"\u03b1",Amacr:"\u0100",amacr:"\u0101",amalg:"\u2a3f",amp:"&",AMP:"&",andand:"\u2a55",And:"\u2a53",and:"\u2227",andd:"\u2a5c",andslope:"\u2a58",andv:"\u2a5a",ang:"\u2220",ange:"\u29a4",angle:"\u2220",angmsdaa:"\u29a8",angmsdab:"\u29a9",angmsdac:"\u29aa",angmsdad:"\u29ab",angmsdae:"\u29ac",angmsdaf:"\u29ad",angmsdag:"\u29ae",angmsdah:"\u29af",angmsd:"\u2221",angrt:"\u221f",angrtvb:"\u22be",angrtvbd:"\u299d",angsph:"\u2222",angst:"\xc5",angzarr:"\u237c",Aogon:"\u0104",aogon:"\u0105",Aopf:"\ud835\udd38",aopf:"\ud835\udd52",apacir:"\u2a6f",ap:"\u2248",apE:"\u2a70",ape:"\u224a",apid:"\u224b",apos:"'",ApplyFunction:"\u2061",approx:"\u2248",approxeq:"\u224a",Aring:"\xc5",aring:"\xe5",Ascr:"\ud835\udc9c",ascr:"\ud835\udcb6",Assign:"\u2254",ast:"*",asymp:"\u2248",asympeq:"\u224d",Atilde:"\xc3",atilde:"\xe3",Auml:"\xc4",auml:"\xe4",awconint:"\u2233",awint:"\u2a11",backcong:"\u224c",backepsilon:"\u03f6",backprime:"\u2035",backsim:"\u223d",backsimeq:"\u22cd",Backslash:"\u2216",Barv:"\u2ae7",barvee:"\u22bd",barwed:"\u2305",Barwed:"\u2306",barwedge:"\u2305",bbrk:"\u23b5",bbrktbrk:"\u23b6",bcong:"\u224c",Bcy:"\u0411",bcy:"\u0431",bdquo:"\u201e",becaus:"\u2235",because:"\u2235",Because:"\u2235",bemptyv:"\u29b0",bepsi:"\u03f6",bernou:"\u212c",Bernoullis:"\u212c",Beta:"\u0392",beta:"\u03b2",beth:"\u2136",between:"\u226c",Bfr:"\ud835\udd05",bfr:"\ud835\udd1f",bigcap:"\u22c2",bigcirc:"\u25ef",bigcup:"\u22c3",bigodot:"\u2a00",bigoplus:"\u2a01",bigotimes:"\u2a02",bigsqcup:"\u2a06",bigstar:"\u2605",bigtriangledown:"\u25bd",bigtriangleup:"\u25b3",biguplus:"\u2a04",bigvee:"\u22c1",bigwedge:"\u22c0",bkarow:"\u290d",blacklozenge:"\u29eb",blacksquare:"\u25aa",blacktriangle:"\u25b4",blacktriangledown:"\u25be",blacktriangleleft:"\u25c2",blacktriangleright:"\u25b8",blank:"\u2423",blk12:"\u2592",blk14:"\u2591",blk34:"\u2593",block:"\u2588",bne:"=\u20e5",bnequiv:"\u2261\u20e5",bNot:"\u2aed",bnot:"\u2310",Bopf:"\ud835\udd39",bopf:"\ud835\udd53",bot:"\u22a5",bottom:"\u22a5",bowtie:"\u22c8",boxbox:"\u29c9",boxdl:"\u2510",boxdL:"\u2555",boxDl:"\u2556",boxDL:"\u2557",boxdr:"\u250c",boxdR:"\u2552",boxDr:"\u2553",boxDR:"\u2554",boxh:"\u2500",boxH:"\u2550",boxhd:"\u252c",boxHd:"\u2564",boxhD:"\u2565",boxHD:"\u2566",boxhu:"\u2534",boxHu:"\u2567",boxhU:"\u2568",boxHU:"\u2569",boxminus:"\u229f",boxplus:"\u229e",boxtimes:"\u22a0",boxul:"\u2518",boxuL:"\u255b",boxUl:"\u255c",boxUL:"\u255d",boxur:"\u2514",boxuR:"\u2558",boxUr:"\u2559",boxUR:"\u255a",boxv:"\u2502",boxV:"\u2551",boxvh:"\u253c",boxvH:"\u256a",boxVh:"\u256b",boxVH:"\u256c",boxvl:"\u2524",boxvL:"\u2561",boxVl:"\u2562",boxVL:"\u2563",boxvr:"\u251c",boxvR:"\u255e",boxVr:"\u255f",boxVR:"\u2560",bprime:"\u2035",breve:"\u02d8",Breve:"\u02d8",brvbar:"\xa6",bscr:"\ud835\udcb7",Bscr:"\u212c",bsemi:"\u204f",bsim:"\u223d",bsime:"\u22cd",bsolb:"\u29c5",bsol:"\\",bsolhsub:"\u27c8",bull:"\u2022",bullet:"\u2022",bump:"\u224e",bumpE:"\u2aae",bumpe:"\u224f",Bumpeq:"\u224e",bumpeq:"\u224f",Cacute:"\u0106",cacute:"\u0107",capand:"\u2a44",capbrcup:"\u2a49",capcap:"\u2a4b",cap:"\u2229",Cap:"\u22d2",capcup:"\u2a47",capdot:"\u2a40",CapitalDifferentialD:"\u2145",caps:"\u2229\ufe00",caret:"\u2041",caron:"\u02c7",Cayleys:"\u212d",ccaps:"\u2a4d",Ccaron:"\u010c",ccaron:"\u010d",Ccedil:"\xc7",ccedil:"\xe7",Ccirc:"\u0108",ccirc:"\u0109",Cconint:"\u2230",ccups:"\u2a4c",ccupssm:"\u2a50",Cdot:"\u010a",cdot:"\u010b",cedil:"\xb8",Cedilla:"\xb8",cemptyv:"\u29b2",cent:"\xa2",centerdot:"\xb7",CenterDot:"\xb7",cfr:"\ud835\udd20",Cfr:"\u212d",CHcy:"\u0427",chcy:"\u0447",check:"\u2713",checkmark:"\u2713",Chi:"\u03a7",chi:"\u03c7",circ:"\u02c6",circeq:"\u2257",circlearrowleft:"\u21ba",circlearrowright:"\u21bb",circledast:"\u229b",circledcirc:"\u229a",circleddash:"\u229d",CircleDot:"\u2299",circledR:"\xae",circledS:"\u24c8",CircleMinus:"\u2296",CirclePlus:"\u2295",CircleTimes:"\u2297",cir:"\u25cb",cirE:"\u29c3",cire:"\u2257",cirfnint:"\u2a10",cirmid:"\u2aef",cirscir:"\u29c2",ClockwiseContourIntegral:"\u2232",CloseCurlyDoubleQuote:"\u201d",CloseCurlyQuote:"\u2019",clubs:"\u2663",clubsuit:"\u2663",colon:":",Colon:"\u2237",Colone:"\u2a74",colone:"\u2254",coloneq:"\u2254",comma:",",commat:"@",comp:"\u2201",compfn:"\u2218",complement:"\u2201",complexes:"\u2102",cong:"\u2245",congdot:"\u2a6d",Congruent:"\u2261",conint:"\u222e",Conint:"\u222f",ContourIntegral:"\u222e",copf:"\ud835\udd54",Copf:"\u2102",coprod:"\u2210",Coproduct:"\u2210",copy:"\xa9",COPY:"\xa9",copysr:"\u2117",CounterClockwiseContourIntegral:"\u2233",crarr:"\u21b5",cross:"\u2717",Cross:"\u2a2f",Cscr:"\ud835\udc9e",cscr:"\ud835\udcb8",csub:"\u2acf",csube:"\u2ad1",csup:"\u2ad0",csupe:"\u2ad2",ctdot:"\u22ef",cudarrl:"\u2938",cudarrr:"\u2935",cuepr:"\u22de",cuesc:"\u22df",cularr:"\u21b6",cularrp:"\u293d",cupbrcap:"\u2a48",cupcap:"\u2a46",CupCap:"\u224d",cup:"\u222a",Cup:"\u22d3",cupcup:"\u2a4a",cupdot:"\u228d",cupor:"\u2a45",cups:"\u222a\ufe00",curarr:"\u21b7",curarrm:"\u293c",curlyeqprec:"\u22de",curlyeqsucc:"\u22df",curlyvee:"\u22ce",curlywedge:"\u22cf",curren:"\xa4",curvearrowleft:"\u21b6",curvearrowright:"\u21b7",cuvee:"\u22ce",cuwed:"\u22cf",cwconint:"\u2232",cwint:"\u2231",cylcty:"\u232d",dagger:"\u2020",Dagger:"\u2021",daleth:"\u2138",darr:"\u2193",Darr:"\u21a1",dArr:"\u21d3",dash:"\u2010",Dashv:"\u2ae4",dashv:"\u22a3",dbkarow:"\u290f",dblac:"\u02dd",Dcaron:"\u010e",dcaron:"\u010f",Dcy:"\u0414",dcy:"\u0434",ddagger:"\u2021",ddarr:"\u21ca",DD:"\u2145",dd:"\u2146",DDotrahd:"\u2911",ddotseq:"\u2a77",deg:"\xb0",Del:"\u2207",Delta:"\u0394",delta:"\u03b4",demptyv:"\u29b1",dfisht:"\u297f",Dfr:"\ud835\udd07",dfr:"\ud835\udd21",dHar:"\u2965",dharl:"\u21c3",dharr:"\u21c2",DiacriticalAcute:"\xb4",DiacriticalDot:"\u02d9",DiacriticalDoubleAcute:"\u02dd",DiacriticalGrave:"`",DiacriticalTilde:"\u02dc",diam:"\u22c4",diamond:"\u22c4",Diamond:"\u22c4",diamondsuit:"\u2666",diams:"\u2666",die:"\xa8",DifferentialD:"\u2146",digamma:"\u03dd",disin:"\u22f2",div:"\xf7",divide:"\xf7",divideontimes:"\u22c7",divonx:"\u22c7",DJcy:"\u0402",djcy:"\u0452",dlcorn:"\u231e",dlcrop:"\u230d",dollar:"$",Dopf:"\ud835\udd3b",dopf:"\ud835\udd55",Dot:"\xa8",dot:"\u02d9",DotDot:"\u20dc",doteq:"\u2250",doteqdot:"\u2251",DotEqual:"\u2250",dotminus:"\u2238",dotplus:"\u2214",dotsquare:"\u22a1",doublebarwedge:"\u2306",DoubleContourIntegral:"\u222f",DoubleDot:"\xa8",DoubleDownArrow:"\u21d3",DoubleLeftArrow:"\u21d0",DoubleLeftRightArrow:"\u21d4",DoubleLeftTee:"\u2ae4",DoubleLongLeftArrow:"\u27f8",DoubleLongLeftRightArrow:"\u27fa",DoubleLongRightArrow:"\u27f9",DoubleRightArrow:"\u21d2",DoubleRightTee:"\u22a8",DoubleUpArrow:"\u21d1",DoubleUpDownArrow:"\u21d5",DoubleVerticalBar:"\u2225",DownArrowBar:"\u2913",downarrow:"\u2193",DownArrow:"\u2193",Downarrow:"\u21d3",DownArrowUpArrow:"\u21f5",DownBreve:"\u0311",downdownarrows:"\u21ca",downharpoonleft:"\u21c3",downharpoonright:"\u21c2",DownLeftRightVector:"\u2950",DownLeftTeeVector:"\u295e",DownLeftVectorBar:"\u2956",DownLeftVector:"\u21bd",DownRightTeeVector:"\u295f",DownRightVectorBar:"\u2957",DownRightVector:"\u21c1",DownTeeArrow:"\u21a7",DownTee:"\u22a4",drbkarow:"\u2910",drcorn:"\u231f",drcrop:"\u230c",Dscr:"\ud835\udc9f",dscr:"\ud835\udcb9",DScy:"\u0405",dscy:"\u0455",dsol:"\u29f6",Dstrok:"\u0110",dstrok:"\u0111",dtdot:"\u22f1",dtri:"\u25bf",dtrif:"\u25be",duarr:"\u21f5",duhar:"\u296f",dwangle:"\u29a6",DZcy:"\u040f",dzcy:"\u045f",dzigrarr:"\u27ff",Eacute:"\xc9",eacute:"\xe9",easter:"\u2a6e",Ecaron:"\u011a",ecaron:"\u011b",Ecirc:"\xca",ecirc:"\xea",ecir:"\u2256",ecolon:"\u2255",Ecy:"\u042d",ecy:"\u044d",eDDot:"\u2a77",Edot:"\u0116",edot:"\u0117",eDot:"\u2251",ee:"\u2147",efDot:"\u2252",Efr:"\ud835\udd08",efr:"\ud835\udd22",eg:"\u2a9a",Egrave:"\xc8",egrave:"\xe8",egs:"\u2a96",egsdot:"\u2a98",el:"\u2a99",Element:"\u2208",elinters:"\u23e7",ell:"\u2113",els:"\u2a95",elsdot:"\u2a97",Emacr:"\u0112",emacr:"\u0113",empty:"\u2205",emptyset:"\u2205",EmptySmallSquare:"\u25fb",emptyv:"\u2205",EmptyVerySmallSquare:"\u25ab",emsp13:"\u2004",emsp14:"\u2005",emsp:"\u2003",ENG:"\u014a",eng:"\u014b",ensp:"\u2002",Eogon:"\u0118",eogon:"\u0119",Eopf:"\ud835\udd3c",eopf:"\ud835\udd56",epar:"\u22d5",eparsl:"\u29e3",eplus:"\u2a71",epsi:"\u03b5",Epsilon:"\u0395",epsilon:"\u03b5",epsiv:"\u03f5",eqcirc:"\u2256",eqcolon:"\u2255",eqsim:"\u2242",eqslantgtr:"\u2a96",eqslantless:"\u2a95",Equal:"\u2a75",equals:"=",EqualTilde:"\u2242",equest:"\u225f",Equilibrium:"\u21cc",equiv:"\u2261",equivDD:"\u2a78",eqvparsl:"\u29e5",erarr:"\u2971",erDot:"\u2253",escr:"\u212f",Escr:"\u2130",esdot:"\u2250",Esim:"\u2a73",esim:"\u2242",Eta:"\u0397",eta:"\u03b7",ETH:"\xd0",eth:"\xf0",Euml:"\xcb",euml:"\xeb",euro:"\u20ac",excl:"!",exist:"\u2203",Exists:"\u2203",expectation:"\u2130",exponentiale:"\u2147",ExponentialE:"\u2147",fallingdotseq:"\u2252",Fcy:"\u0424",fcy:"\u0444",female:"\u2640",ffilig:"\ufb03",fflig:"\ufb00",ffllig:"\ufb04",Ffr:"\ud835\udd09",ffr:"\ud835\udd23",filig:"\ufb01",FilledSmallSquare:"\u25fc",FilledVerySmallSquare:"\u25aa",fjlig:"fj",flat:"\u266d",fllig:"\ufb02",fltns:"\u25b1",fnof:"\u0192",Fopf:"\ud835\udd3d",fopf:"\ud835\udd57",forall:"\u2200",ForAll:"\u2200",fork:"\u22d4",forkv:"\u2ad9",Fouriertrf:"\u2131",fpartint:"\u2a0d",frac12:"\xbd",frac13:"\u2153",frac14:"\xbc",frac15:"\u2155",frac16:"\u2159",frac18:"\u215b",frac23:"\u2154",frac25:"\u2156",frac34:"\xbe",frac35:"\u2157",frac38:"\u215c",frac45:"\u2158",frac56:"\u215a",frac58:"\u215d",frac78:"\u215e",frasl:"\u2044",frown:"\u2322",fscr:"\ud835\udcbb",Fscr:"\u2131",gacute:"\u01f5",Gamma:"\u0393",gamma:"\u03b3",Gammad:"\u03dc",gammad:"\u03dd",gap:"\u2a86",Gbreve:"\u011e",gbreve:"\u011f",Gcedil:"\u0122",Gcirc:"\u011c",gcirc:"\u011d",Gcy:"\u0413",gcy:"\u0433",Gdot:"\u0120",gdot:"\u0121",ge:"\u2265",gE:"\u2267",gEl:"\u2a8c",gel:"\u22db",geq:"\u2265",geqq:"\u2267",geqslant:"\u2a7e",gescc:"\u2aa9",ges:"\u2a7e",gesdot:"\u2a80",gesdoto:"\u2a82",gesdotol:"\u2a84",gesl:"\u22db\ufe00",gesles:"\u2a94",Gfr:"\ud835\udd0a",gfr:"\ud835\udd24",gg:"\u226b",Gg:"\u22d9",ggg:"\u22d9",gimel:"\u2137",GJcy:"\u0403",gjcy:"\u0453",gla:"\u2aa5",gl:"\u2277",glE:"\u2a92",glj:"\u2aa4",gnap:"\u2a8a",gnapprox:"\u2a8a",gne:"\u2a88",gnE:"\u2269",gneq:"\u2a88",gneqq:"\u2269",gnsim:"\u22e7",Gopf:"\ud835\udd3e",gopf:"\ud835\udd58",grave:"`",GreaterEqual:"\u2265",GreaterEqualLess:"\u22db",GreaterFullEqual:"\u2267",GreaterGreater:"\u2aa2",GreaterLess:"\u2277",GreaterSlantEqual:"\u2a7e",GreaterTilde:"\u2273",Gscr:"\ud835\udca2",gscr:"\u210a",gsim:"\u2273",gsime:"\u2a8e",gsiml:"\u2a90",gtcc:"\u2aa7",gtcir:"\u2a7a",gt:">",GT:">",Gt:"\u226b",gtdot:"\u22d7",gtlPar:"\u2995",gtquest:"\u2a7c",gtrapprox:"\u2a86",gtrarr:"\u2978",gtrdot:"\u22d7",gtreqless:"\u22db",gtreqqless:"\u2a8c",gtrless:"\u2277",gtrsim:"\u2273",gvertneqq:"\u2269\ufe00",gvnE:"\u2269\ufe00",Hacek:"\u02c7",hairsp:"\u200a",half:"\xbd",hamilt:"\u210b",HARDcy:"\u042a",hardcy:"\u044a",harrcir:"\u2948",harr:"\u2194",hArr:"\u21d4",harrw:"\u21ad",Hat:"^",hbar:"\u210f",Hcirc:"\u0124",hcirc:"\u0125",hearts:"\u2665",heartsuit:"\u2665",hellip:"\u2026",hercon:"\u22b9",hfr:"\ud835\udd25",Hfr:"\u210c",HilbertSpace:"\u210b",hksearow:"\u2925",hkswarow:"\u2926",hoarr:"\u21ff",homtht:"\u223b",hookleftarrow:"\u21a9",hookrightarrow:"\u21aa",hopf:"\ud835\udd59",Hopf:"\u210d",horbar:"\u2015",HorizontalLine:"\u2500",hscr:"\ud835\udcbd",Hscr:"\u210b",hslash:"\u210f",Hstrok:"\u0126",hstrok:"\u0127",HumpDownHump:"\u224e",HumpEqual:"\u224f",hybull:"\u2043",hyphen:"\u2010",Iacute:"\xcd",iacute:"\xed",ic:"\u2063",Icirc:"\xce",icirc:"\xee",Icy:"\u0418",icy:"\u0438",Idot:"\u0130",IEcy:"\u0415",iecy:"\u0435",iexcl:"\xa1",iff:"\u21d4",ifr:"\ud835\udd26",Ifr:"\u2111",Igrave:"\xcc",igrave:"\xec",ii:"\u2148",iiiint:"\u2a0c",iiint:"\u222d",iinfin:"\u29dc",iiota:"\u2129",IJlig:"\u0132",ijlig:"\u0133",Imacr:"\u012a",imacr:"\u012b",image:"\u2111",ImaginaryI:"\u2148",imagline:"\u2110",imagpart:"\u2111",imath:"\u0131",Im:"\u2111",imof:"\u22b7",imped:"\u01b5",Implies:"\u21d2",incare:"\u2105",in:"\u2208",infin:"\u221e",infintie:"\u29dd",inodot:"\u0131",intcal:"\u22ba",int:"\u222b",Int:"\u222c",integers:"\u2124",Integral:"\u222b",intercal:"\u22ba",Intersection:"\u22c2",intlarhk:"\u2a17",intprod:"\u2a3c",InvisibleComma:"\u2063",InvisibleTimes:"\u2062",IOcy:"\u0401",iocy:"\u0451",Iogon:"\u012e",iogon:"\u012f",Iopf:"\ud835\udd40",iopf:"\ud835\udd5a",Iota:"\u0399",iota:"\u03b9",iprod:"\u2a3c",iquest:"\xbf",iscr:"\ud835\udcbe",Iscr:"\u2110",isin:"\u2208",isindot:"\u22f5",isinE:"\u22f9",isins:"\u22f4",isinsv:"\u22f3",isinv:"\u2208",it:"\u2062",Itilde:"\u0128",itilde:"\u0129",Iukcy:"\u0406",iukcy:"\u0456",Iuml:"\xcf",iuml:"\xef",Jcirc:"\u0134",jcirc:"\u0135",Jcy:"\u0419",jcy:"\u0439",Jfr:"\ud835\udd0d",jfr:"\ud835\udd27",jmath:"\u0237",Jopf:"\ud835\udd41",jopf:"\ud835\udd5b",Jscr:"\ud835\udca5",jscr:"\ud835\udcbf",Jsercy:"\u0408",jsercy:"\u0458",Jukcy:"\u0404",jukcy:"\u0454",Kappa:"\u039a",kappa:"\u03ba",kappav:"\u03f0",Kcedil:"\u0136",kcedil:"\u0137",Kcy:"\u041a",kcy:"\u043a",Kfr:"\ud835\udd0e",kfr:"\ud835\udd28",kgreen:"\u0138",KHcy:"\u0425",khcy:"\u0445",KJcy:"\u040c",kjcy:"\u045c",Kopf:"\ud835\udd42",kopf:"\ud835\udd5c",Kscr:"\ud835\udca6",kscr:"\ud835\udcc0",lAarr:"\u21da",Lacute:"\u0139",lacute:"\u013a",laemptyv:"\u29b4",lagran:"\u2112",Lambda:"\u039b",lambda:"\u03bb",lang:"\u27e8",Lang:"\u27ea",langd:"\u2991",langle:"\u27e8",lap:"\u2a85",Laplacetrf:"\u2112",laquo:"\xab",larrb:"\u21e4",larrbfs:"\u291f",larr:"\u2190",Larr:"\u219e",lArr:"\u21d0",larrfs:"\u291d",larrhk:"\u21a9",larrlp:"\u21ab",larrpl:"\u2939",larrsim:"\u2973",larrtl:"\u21a2",latail:"\u2919",lAtail:"\u291b",lat:"\u2aab",late:"\u2aad",lates:"\u2aad\ufe00",lbarr:"\u290c",lBarr:"\u290e",lbbrk:"\u2772",lbrace:"{",lbrack:"[",lbrke:"\u298b",lbrksld:"\u298f",lbrkslu:"\u298d",Lcaron:"\u013d",lcaron:"\u013e",Lcedil:"\u013b",lcedil:"\u013c",lceil:"\u2308",lcub:"{",Lcy:"\u041b",lcy:"\u043b",ldca:"\u2936",ldquo:"\u201c",ldquor:"\u201e",ldrdhar:"\u2967",ldrushar:"\u294b",ldsh:"\u21b2",le:"\u2264",lE:"\u2266",LeftAngleBracket:"\u27e8",LeftArrowBar:"\u21e4",leftarrow:"\u2190",LeftArrow:"\u2190",Leftarrow:"\u21d0",LeftArrowRightArrow:"\u21c6",leftarrowtail:"\u21a2",LeftCeiling:"\u2308",LeftDoubleBracket:"\u27e6",LeftDownTeeVector:"\u2961",LeftDownVectorBar:"\u2959",LeftDownVector:"\u21c3",LeftFloor:"\u230a",leftharpoondown:"\u21bd",leftharpoonup:"\u21bc",leftleftarrows:"\u21c7",leftrightarrow:"\u2194",LeftRightArrow:"\u2194",Leftrightarrow:"\u21d4",leftrightarrows:"\u21c6",leftrightharpoons:"\u21cb",leftrightsquigarrow:"\u21ad",LeftRightVector:"\u294e",LeftTeeArrow:"\u21a4",LeftTee:"\u22a3",LeftTeeVector:"\u295a",leftthreetimes:"\u22cb",LeftTriangleBar:"\u29cf",LeftTriangle:"\u22b2",LeftTriangleEqual:"\u22b4",LeftUpDownVector:"\u2951",LeftUpTeeVector:"\u2960",LeftUpVectorBar:"\u2958",LeftUpVector:"\u21bf",LeftVectorBar:"\u2952",LeftVector:"\u21bc",lEg:"\u2a8b",leg:"\u22da",leq:"\u2264",leqq:"\u2266",leqslant:"\u2a7d",lescc:"\u2aa8",les:"\u2a7d",lesdot:"\u2a7f",lesdoto:"\u2a81",lesdotor:"\u2a83",lesg:"\u22da\ufe00",lesges:"\u2a93",lessapprox:"\u2a85",lessdot:"\u22d6",lesseqgtr:"\u22da",lesseqqgtr:"\u2a8b",LessEqualGreater:"\u22da",LessFullEqual:"\u2266",LessGreater:"\u2276",lessgtr:"\u2276",LessLess:"\u2aa1",lesssim:"\u2272",LessSlantEqual:"\u2a7d",LessTilde:"\u2272",lfisht:"\u297c",lfloor:"\u230a",Lfr:"\ud835\udd0f",lfr:"\ud835\udd29",lg:"\u2276",lgE:"\u2a91",lHar:"\u2962",lhard:"\u21bd",lharu:"\u21bc",lharul:"\u296a",lhblk:"\u2584",LJcy:"\u0409",ljcy:"\u0459",llarr:"\u21c7",ll:"\u226a",Ll:"\u22d8",llcorner:"\u231e",Lleftarrow:"\u21da",llhard:"\u296b",lltri:"\u25fa",Lmidot:"\u013f",lmidot:"\u0140",lmoustache:"\u23b0",lmoust:"\u23b0",lnap:"\u2a89",lnapprox:"\u2a89",lne:"\u2a87",lnE:"\u2268",lneq:"\u2a87",lneqq:"\u2268",lnsim:"\u22e6",loang:"\u27ec",loarr:"\u21fd",lobrk:"\u27e6",longleftarrow:"\u27f5",LongLeftArrow:"\u27f5",Longleftarrow:"\u27f8",longleftrightarrow:"\u27f7",LongLeftRightArrow:"\u27f7",Longleftrightarrow:"\u27fa",longmapsto:"\u27fc",longrightarrow:"\u27f6",LongRightArrow:"\u27f6",Longrightarrow:"\u27f9",looparrowleft:"\u21ab",looparrowright:"\u21ac",lopar:"\u2985",Lopf:"\ud835\udd43",lopf:"\ud835\udd5d",loplus:"\u2a2d",lotimes:"\u2a34",lowast:"\u2217",lowbar:"_",LowerLeftArrow:"\u2199",LowerRightArrow:"\u2198",loz:"\u25ca",lozenge:"\u25ca",lozf:"\u29eb",lpar:"(",lparlt:"\u2993",lrarr:"\u21c6",lrcorner:"\u231f",lrhar:"\u21cb",lrhard:"\u296d",lrm:"\u200e",lrtri:"\u22bf",lsaquo:"\u2039",lscr:"\ud835\udcc1",Lscr:"\u2112",lsh:"\u21b0",Lsh:"\u21b0",lsim:"\u2272",lsime:"\u2a8d",lsimg:"\u2a8f",lsqb:"[",lsquo:"\u2018",lsquor:"\u201a",Lstrok:"\u0141",lstrok:"\u0142",ltcc:"\u2aa6",ltcir:"\u2a79",lt:"<",LT:"<",Lt:"\u226a",ltdot:"\u22d6",lthree:"\u22cb",ltimes:"\u22c9",ltlarr:"\u2976",ltquest:"\u2a7b",ltri:"\u25c3",ltrie:"\u22b4",ltrif:"\u25c2",ltrPar:"\u2996",lurdshar:"\u294a",luruhar:"\u2966",lvertneqq:"\u2268\ufe00",lvnE:"\u2268\ufe00",macr:"\xaf",male:"\u2642",malt:"\u2720",maltese:"\u2720",Map:"\u2905",map:"\u21a6",mapsto:"\u21a6",mapstodown:"\u21a7",mapstoleft:"\u21a4",mapstoup:"\u21a5",marker:"\u25ae",mcomma:"\u2a29",Mcy:"\u041c",mcy:"\u043c",mdash:"\u2014",mDDot:"\u223a",measuredangle:"\u2221",MediumSpace:"\u205f",Mellintrf:"\u2133",Mfr:"\ud835\udd10",mfr:"\ud835\udd2a",mho:"\u2127",micro:"\xb5",midast:"*",midcir:"\u2af0",mid:"\u2223",middot:"\xb7",minusb:"\u229f",minus:"\u2212",minusd:"\u2238",minusdu:"\u2a2a",MinusPlus:"\u2213",mlcp:"\u2adb",mldr:"\u2026",mnplus:"\u2213",models:"\u22a7",Mopf:"\ud835\udd44",mopf:"\ud835\udd5e",mp:"\u2213",mscr:"\ud835\udcc2",Mscr:"\u2133",mstpos:"\u223e",Mu:"\u039c",mu:"\u03bc",multimap:"\u22b8",mumap:"\u22b8",nabla:"\u2207",Nacute:"\u0143",nacute:"\u0144",nang:"\u2220\u20d2",nap:"\u2249",napE:"\u2a70\u0338",napid:"\u224b\u0338",napos:"\u0149",napprox:"\u2249",natural:"\u266e",naturals:"\u2115",natur:"\u266e",nbsp:"\xa0",nbump:"\u224e\u0338",nbumpe:"\u224f\u0338",ncap:"\u2a43",Ncaron:"\u0147",ncaron:"\u0148",Ncedil:"\u0145",ncedil:"\u0146",ncong:"\u2247",ncongdot:"\u2a6d\u0338",ncup:"\u2a42",Ncy:"\u041d",ncy:"\u043d",ndash:"\u2013",nearhk:"\u2924",nearr:"\u2197",neArr:"\u21d7",nearrow:"\u2197",ne:"\u2260",nedot:"\u2250\u0338",NegativeMediumSpace:"\u200b",NegativeThickSpace:"\u200b",NegativeThinSpace:"\u200b",NegativeVeryThinSpace:"\u200b",nequiv:"\u2262",nesear:"\u2928",nesim:"\u2242\u0338",NestedGreaterGreater:"\u226b",NestedLessLess:"\u226a",NewLine:"\n",nexist:"\u2204",nexists:"\u2204",Nfr:"\ud835\udd11",nfr:"\ud835\udd2b",ngE:"\u2267\u0338",nge:"\u2271",ngeq:"\u2271",ngeqq:"\u2267\u0338",ngeqslant:"\u2a7e\u0338",nges:"\u2a7e\u0338",nGg:"\u22d9\u0338",ngsim:"\u2275",nGt:"\u226b\u20d2",ngt:"\u226f",ngtr:"\u226f",nGtv:"\u226b\u0338",nharr:"\u21ae",nhArr:"\u21ce",nhpar:"\u2af2",ni:"\u220b",nis:"\u22fc",nisd:"\u22fa",niv:"\u220b",NJcy:"\u040a",njcy:"\u045a",nlarr:"\u219a",nlArr:"\u21cd",nldr:"\u2025",nlE:"\u2266\u0338",nle:"\u2270",nleftarrow:"\u219a",nLeftarrow:"\u21cd",nleftrightarrow:"\u21ae",nLeftrightarrow:"\u21ce",nleq:"\u2270",nleqq:"\u2266\u0338",nleqslant:"\u2a7d\u0338",nles:"\u2a7d\u0338",nless:"\u226e",nLl:"\u22d8\u0338",nlsim:"\u2274",nLt:"\u226a\u20d2",nlt:"\u226e",nltri:"\u22ea",nltrie:"\u22ec",nLtv:"\u226a\u0338",nmid:"\u2224",NoBreak:"\u2060",NonBreakingSpace:"\xa0",nopf:"\ud835\udd5f",Nopf:"\u2115",Not:"\u2aec",not:"\xac",NotCongruent:"\u2262",NotCupCap:"\u226d",NotDoubleVerticalBar:"\u2226",NotElement:"\u2209",NotEqual:"\u2260",NotEqualTilde:"\u2242\u0338",NotExists:"\u2204",NotGreater:"\u226f",NotGreaterEqual:"\u2271",NotGreaterFullEqual:"\u2267\u0338",NotGreaterGreater:"\u226b\u0338",NotGreaterLess:"\u2279",NotGreaterSlantEqual:"\u2a7e\u0338",NotGreaterTilde:"\u2275",NotHumpDownHump:"\u224e\u0338",NotHumpEqual:"\u224f\u0338",notin:"\u2209",notindot:"\u22f5\u0338",notinE:"\u22f9\u0338",notinva:"\u2209",notinvb:"\u22f7",notinvc:"\u22f6",NotLeftTriangleBar:"\u29cf\u0338",NotLeftTriangle:"\u22ea",NotLeftTriangleEqual:"\u22ec",NotLess:"\u226e",NotLessEqual:"\u2270",NotLessGreater:"\u2278",NotLessLess:"\u226a\u0338",NotLessSlantEqual:"\u2a7d\u0338",NotLessTilde:"\u2274",NotNestedGreaterGreater:"\u2aa2\u0338",NotNestedLessLess:"\u2aa1\u0338",notni:"\u220c",notniva:"\u220c",notnivb:"\u22fe",notnivc:"\u22fd",NotPrecedes:"\u2280",NotPrecedesEqual:"\u2aaf\u0338",NotPrecedesSlantEqual:"\u22e0",NotReverseElement:"\u220c",NotRightTriangleBar:"\u29d0\u0338",NotRightTriangle:"\u22eb",NotRightTriangleEqual:"\u22ed",NotSquareSubset:"\u228f\u0338",NotSquareSubsetEqual:"\u22e2",NotSquareSuperset:"\u2290\u0338",NotSquareSupersetEqual:"\u22e3",NotSubset:"\u2282\u20d2",NotSubsetEqual:"\u2288",NotSucceeds:"\u2281",NotSucceedsEqual:"\u2ab0\u0338",NotSucceedsSlantEqual:"\u22e1",NotSucceedsTilde:"\u227f\u0338",NotSuperset:"\u2283\u20d2",NotSupersetEqual:"\u2289",NotTilde:"\u2241",NotTildeEqual:"\u2244",NotTildeFullEqual:"\u2247",NotTildeTilde:"\u2249",NotVerticalBar:"\u2224",nparallel:"\u2226",npar:"\u2226",nparsl:"\u2afd\u20e5",npart:"\u2202\u0338",npolint:"\u2a14",npr:"\u2280",nprcue:"\u22e0",nprec:"\u2280",npreceq:"\u2aaf\u0338",npre:"\u2aaf\u0338",nrarrc:"\u2933\u0338",nrarr:"\u219b",nrArr:"\u21cf",nrarrw:"\u219d\u0338",nrightarrow:"\u219b",nRightarrow:"\u21cf",nrtri:"\u22eb",nrtrie:"\u22ed",nsc:"\u2281",nsccue:"\u22e1",nsce:"\u2ab0\u0338",Nscr:"\ud835\udca9",nscr:"\ud835\udcc3",nshortmid:"\u2224",nshortparallel:"\u2226",nsim:"\u2241",nsime:"\u2244",nsimeq:"\u2244",nsmid:"\u2224",nspar:"\u2226",nsqsube:"\u22e2",nsqsupe:"\u22e3",nsub:"\u2284",nsubE:"\u2ac5\u0338",nsube:"\u2288",nsubset:"\u2282\u20d2",nsubseteq:"\u2288",nsubseteqq:"\u2ac5\u0338",nsucc:"\u2281",nsucceq:"\u2ab0\u0338",nsup:"\u2285",nsupE:"\u2ac6\u0338",nsupe:"\u2289",nsupset:"\u2283\u20d2",nsupseteq:"\u2289",nsupseteqq:"\u2ac6\u0338",ntgl:"\u2279",Ntilde:"\xd1",ntilde:"\xf1",ntlg:"\u2278",ntriangleleft:"\u22ea",ntrianglelefteq:"\u22ec",ntriangleright:"\u22eb",ntrianglerighteq:"\u22ed",Nu:"\u039d",nu:"\u03bd",num:"#",numero:"\u2116",numsp:"\u2007",nvap:"\u224d\u20d2",nvdash:"\u22ac",nvDash:"\u22ad",nVdash:"\u22ae",nVDash:"\u22af",nvge:"\u2265\u20d2",nvgt:">\u20d2",nvHarr:"\u2904",nvinfin:"\u29de",nvlArr:"\u2902",nvle:"\u2264\u20d2",nvlt:"<\u20d2",nvltrie:"\u22b4\u20d2",nvrArr:"\u2903",nvrtrie:"\u22b5\u20d2",nvsim:"\u223c\u20d2",nwarhk:"\u2923",nwarr:"\u2196",nwArr:"\u21d6",nwarrow:"\u2196",nwnear:"\u2927",Oacute:"\xd3",oacute:"\xf3",oast:"\u229b",Ocirc:"\xd4",ocirc:"\xf4",ocir:"\u229a",Ocy:"\u041e",ocy:"\u043e",odash:"\u229d",Odblac:"\u0150",odblac:"\u0151",odiv:"\u2a38",odot:"\u2299",odsold:"\u29bc",OElig:"\u0152",oelig:"\u0153",ofcir:"\u29bf",Ofr:"\ud835\udd12",ofr:"\ud835\udd2c",ogon:"\u02db",Ograve:"\xd2",ograve:"\xf2",ogt:"\u29c1",ohbar:"\u29b5",ohm:"\u03a9",oint:"\u222e",olarr:"\u21ba",olcir:"\u29be",olcross:"\u29bb",oline:"\u203e",olt:"\u29c0",Omacr:"\u014c",omacr:"\u014d",Omega:"\u03a9",omega:"\u03c9",Omicron:"\u039f",omicron:"\u03bf",omid:"\u29b6",ominus:"\u2296",Oopf:"\ud835\udd46",oopf:"\ud835\udd60",opar:"\u29b7",OpenCurlyDoubleQuote:"\u201c",OpenCurlyQuote:"\u2018",operp:"\u29b9",oplus:"\u2295",orarr:"\u21bb",Or:"\u2a54",or:"\u2228",ord:"\u2a5d",order:"\u2134",orderof:"\u2134",ordf:"\xaa",ordm:"\xba",origof:"\u22b6",oror:"\u2a56",orslope:"\u2a57",orv:"\u2a5b",oS:"\u24c8",Oscr:"\ud835\udcaa",oscr:"\u2134",Oslash:"\xd8",oslash:"\xf8",osol:"\u2298",Otilde:"\xd5",otilde:"\xf5",otimesas:"\u2a36",Otimes:"\u2a37",otimes:"\u2297",Ouml:"\xd6",ouml:"\xf6",ovbar:"\u233d",OverBar:"\u203e",OverBrace:"\u23de",OverBracket:"\u23b4",OverParenthesis:"\u23dc",para:"\xb6",parallel:"\u2225",par:"\u2225",parsim:"\u2af3",parsl:"\u2afd",part:"\u2202",PartialD:"\u2202",Pcy:"\u041f",pcy:"\u043f",percnt:"%",period:".",permil:"\u2030",perp:"\u22a5",pertenk:"\u2031",Pfr:"\ud835\udd13",pfr:"\ud835\udd2d",Phi:"\u03a6",phi:"\u03c6",phiv:"\u03d5",phmmat:"\u2133",phone:"\u260e",Pi:"\u03a0",pi:"\u03c0",pitchfork:"\u22d4",piv:"\u03d6",planck:"\u210f",planckh:"\u210e",plankv:"\u210f",plusacir:"\u2a23",plusb:"\u229e",pluscir:"\u2a22",plus:"+",plusdo:"\u2214",plusdu:"\u2a25",pluse:"\u2a72",PlusMinus:"\xb1",plusmn:"\xb1",plussim:"\u2a26",plustwo:"\u2a27",pm:"\xb1",Poincareplane:"\u210c",pointint:"\u2a15",popf:"\ud835\udd61",Popf:"\u2119",pound:"\xa3",prap:"\u2ab7",Pr:"\u2abb",pr:"\u227a",prcue:"\u227c",precapprox:"\u2ab7",prec:"\u227a",preccurlyeq:"\u227c",Precedes:"\u227a",PrecedesEqual:"\u2aaf",PrecedesSlantEqual:"\u227c",PrecedesTilde:"\u227e",preceq:"\u2aaf",precnapprox:"\u2ab9",precneqq:"\u2ab5",precnsim:"\u22e8",pre:"\u2aaf",prE:"\u2ab3",precsim:"\u227e",prime:"\u2032",Prime:"\u2033",primes:"\u2119",prnap:"\u2ab9",prnE:"\u2ab5",prnsim:"\u22e8",prod:"\u220f",Product:"\u220f",profalar:"\u232e",profline:"\u2312",profsurf:"\u2313",prop:"\u221d",Proportional:"\u221d",Proportion:"\u2237",propto:"\u221d",prsim:"\u227e",prurel:"\u22b0",Pscr:"\ud835\udcab",pscr:"\ud835\udcc5",Psi:"\u03a8",psi:"\u03c8",puncsp:"\u2008",Qfr:"\ud835\udd14",qfr:"\ud835\udd2e",qint:"\u2a0c",qopf:"\ud835\udd62",Qopf:"\u211a",qprime:"\u2057",Qscr:"\ud835\udcac",qscr:"\ud835\udcc6",quaternions:"\u210d",quatint:"\u2a16",quest:"?",questeq:"\u225f",quot:'"',QUOT:'"',rAarr:"\u21db",race:"\u223d\u0331",Racute:"\u0154",racute:"\u0155",radic:"\u221a",raemptyv:"\u29b3",rang:"\u27e9",Rang:"\u27eb",rangd:"\u2992",range:"\u29a5",rangle:"\u27e9",raquo:"\xbb",rarrap:"\u2975",rarrb:"\u21e5",rarrbfs:"\u2920",rarrc:"\u2933",rarr:"\u2192",Rarr:"\u21a0",rArr:"\u21d2",rarrfs:"\u291e",rarrhk:"\u21aa",rarrlp:"\u21ac",rarrpl:"\u2945",rarrsim:"\u2974",Rarrtl:"\u2916",rarrtl:"\u21a3",rarrw:"\u219d",ratail:"\u291a",rAtail:"\u291c",ratio:"\u2236",rationals:"\u211a",rbarr:"\u290d",rBarr:"\u290f",RBarr:"\u2910",rbbrk:"\u2773",rbrace:"}",rbrack:"]",rbrke:"\u298c",rbrksld:"\u298e",rbrkslu:"\u2990",Rcaron:"\u0158",rcaron:"\u0159",Rcedil:"\u0156",rcedil:"\u0157",rceil:"\u2309",rcub:"}",Rcy:"\u0420",rcy:"\u0440",rdca:"\u2937",rdldhar:"\u2969",rdquo:"\u201d",rdquor:"\u201d",rdsh:"\u21b3",real:"\u211c",realine:"\u211b",realpart:"\u211c",reals:"\u211d",Re:"\u211c",rect:"\u25ad",reg:"\xae",REG:"\xae",ReverseElement:"\u220b",ReverseEquilibrium:"\u21cb",ReverseUpEquilibrium:"\u296f",rfisht:"\u297d",rfloor:"\u230b",rfr:"\ud835\udd2f",Rfr:"\u211c",rHar:"\u2964",rhard:"\u21c1",rharu:"\u21c0",rharul:"\u296c",Rho:"\u03a1",rho:"\u03c1",rhov:"\u03f1",RightAngleBracket:"\u27e9",RightArrowBar:"\u21e5",rightarrow:"\u2192",RightArrow:"\u2192",Rightarrow:"\u21d2",RightArrowLeftArrow:"\u21c4",rightarrowtail:"\u21a3",RightCeiling:"\u2309",RightDoubleBracket:"\u27e7",RightDownTeeVector:"\u295d",RightDownVectorBar:"\u2955",RightDownVector:"\u21c2",RightFloor:"\u230b",rightharpoondown:"\u21c1",rightharpoonup:"\u21c0",rightleftarrows:"\u21c4",rightleftharpoons:"\u21cc",rightrightarrows:"\u21c9",rightsquigarrow:"\u219d",RightTeeArrow:"\u21a6",RightTee:"\u22a2",RightTeeVector:"\u295b",rightthreetimes:"\u22cc",RightTriangleBar:"\u29d0",RightTriangle:"\u22b3",RightTriangleEqual:"\u22b5",RightUpDownVector:"\u294f",RightUpTeeVector:"\u295c",RightUpVectorBar:"\u2954",RightUpVector:"\u21be",RightVectorBar:"\u2953",RightVector:"\u21c0",ring:"\u02da",risingdotseq:"\u2253",rlarr:"\u21c4",rlhar:"\u21cc",rlm:"\u200f",rmoustache:"\u23b1",rmoust:"\u23b1",rnmid:"\u2aee",roang:"\u27ed",roarr:"\u21fe",robrk:"\u27e7",ropar:"\u2986",ropf:"\ud835\udd63",Ropf:"\u211d",roplus:"\u2a2e",rotimes:"\u2a35",RoundImplies:"\u2970",rpar:")",rpargt:"\u2994",rppolint:"\u2a12",rrarr:"\u21c9",Rrightarrow:"\u21db",rsaquo:"\u203a",rscr:"\ud835\udcc7",Rscr:"\u211b",rsh:"\u21b1",Rsh:"\u21b1",rsqb:"]",rsquo:"\u2019",rsquor:"\u2019",rthree:"\u22cc",rtimes:"\u22ca",rtri:"\u25b9",rtrie:"\u22b5",rtrif:"\u25b8",rtriltri:"\u29ce",RuleDelayed:"\u29f4",ruluhar:"\u2968",rx:"\u211e",Sacute:"\u015a",sacute:"\u015b",sbquo:"\u201a",scap:"\u2ab8",Scaron:"\u0160",scaron:"\u0161",Sc:"\u2abc",sc:"\u227b",sccue:"\u227d",sce:"\u2ab0",scE:"\u2ab4",Scedil:"\u015e",scedil:"\u015f",Scirc:"\u015c",scirc:"\u015d",scnap:"\u2aba",scnE:"\u2ab6",scnsim:"\u22e9",scpolint:"\u2a13",scsim:"\u227f",Scy:"\u0421",scy:"\u0441",sdotb:"\u22a1",sdot:"\u22c5",sdote:"\u2a66",searhk:"\u2925",searr:"\u2198",seArr:"\u21d8",searrow:"\u2198",sect:"\xa7",semi:";",seswar:"\u2929",setminus:"\u2216",setmn:"\u2216",sext:"\u2736",Sfr:"\ud835\udd16",sfr:"\ud835\udd30",sfrown:"\u2322",sharp:"\u266f",SHCHcy:"\u0429",shchcy:"\u0449",SHcy:"\u0428",shcy:"\u0448",ShortDownArrow:"\u2193",ShortLeftArrow:"\u2190",shortmid:"\u2223",shortparallel:"\u2225",ShortRightArrow:"\u2192",ShortUpArrow:"\u2191",shy:"\xad",Sigma:"\u03a3",sigma:"\u03c3",sigmaf:"\u03c2",sigmav:"\u03c2",sim:"\u223c",simdot:"\u2a6a",sime:"\u2243",simeq:"\u2243",simg:"\u2a9e",simgE:"\u2aa0",siml:"\u2a9d",simlE:"\u2a9f",simne:"\u2246",simplus:"\u2a24",simrarr:"\u2972",slarr:"\u2190",SmallCircle:"\u2218",smallsetminus:"\u2216",smashp:"\u2a33",smeparsl:"\u29e4",smid:"\u2223",smile:"\u2323",smt:"\u2aaa",smte:"\u2aac",smtes:"\u2aac\ufe00",SOFTcy:"\u042c",softcy:"\u044c",solbar:"\u233f",solb:"\u29c4",sol:"/",Sopf:"\ud835\udd4a",sopf:"\ud835\udd64",spades:"\u2660",spadesuit:"\u2660",spar:"\u2225",sqcap:"\u2293",sqcaps:"\u2293\ufe00",sqcup:"\u2294",sqcups:"\u2294\ufe00",Sqrt:"\u221a",sqsub:"\u228f",sqsube:"\u2291",sqsubset:"\u228f",sqsubseteq:"\u2291",sqsup:"\u2290",sqsupe:"\u2292",sqsupset:"\u2290",sqsupseteq:"\u2292",square:"\u25a1",Square:"\u25a1",SquareIntersection:"\u2293",SquareSubset:"\u228f",SquareSubsetEqual:"\u2291",SquareSuperset:"\u2290",SquareSupersetEqual:"\u2292",SquareUnion:"\u2294",squarf:"\u25aa",squ:"\u25a1",squf:"\u25aa",srarr:"\u2192",Sscr:"\ud835\udcae",sscr:"\ud835\udcc8",ssetmn:"\u2216",ssmile:"\u2323",sstarf:"\u22c6",Star:"\u22c6",star:"\u2606",starf:"\u2605",straightepsilon:"\u03f5",straightphi:"\u03d5",strns:"\xaf",sub:"\u2282",Sub:"\u22d0",subdot:"\u2abd",subE:"\u2ac5",sube:"\u2286",subedot:"\u2ac3",submult:"\u2ac1",subnE:"\u2acb",subne:"\u228a",subplus:"\u2abf",subrarr:"\u2979",subset:"\u2282",Subset:"\u22d0",subseteq:"\u2286",subseteqq:"\u2ac5",SubsetEqual:"\u2286",subsetneq:"\u228a",subsetneqq:"\u2acb",subsim:"\u2ac7",subsub:"\u2ad5",subsup:"\u2ad3",succapprox:"\u2ab8",succ:"\u227b",succcurlyeq:"\u227d",Succeeds:"\u227b",SucceedsEqual:"\u2ab0",SucceedsSlantEqual:"\u227d",SucceedsTilde:"\u227f",succeq:"\u2ab0",succnapprox:"\u2aba",succneqq:"\u2ab6",succnsim:"\u22e9",succsim:"\u227f",SuchThat:"\u220b",sum:"\u2211",Sum:"\u2211",sung:"\u266a",sup1:"\xb9",sup2:"\xb2",sup3:"\xb3",sup:"\u2283",Sup:"\u22d1",supdot:"\u2abe",supdsub:"\u2ad8",supE:"\u2ac6",supe:"\u2287",supedot:"\u2ac4",Superset:"\u2283",SupersetEqual:"\u2287",suphsol:"\u27c9",suphsub:"\u2ad7",suplarr:"\u297b",supmult:"\u2ac2",supnE:"\u2acc",supne:"\u228b",supplus:"\u2ac0",supset:"\u2283",Supset:"\u22d1",supseteq:"\u2287",supseteqq:"\u2ac6",supsetneq:"\u228b",supsetneqq:"\u2acc",supsim:"\u2ac8",supsub:"\u2ad4",supsup:"\u2ad6",swarhk:"\u2926",swarr:"\u2199",swArr:"\u21d9",swarrow:"\u2199",swnwar:"\u292a",szlig:"\xdf",Tab:"\t",target:"\u2316",Tau:"\u03a4",tau:"\u03c4",tbrk:"\u23b4",Tcaron:"\u0164",tcaron:"\u0165",Tcedil:"\u0162",tcedil:"\u0163",Tcy:"\u0422",tcy:"\u0442",tdot:"\u20db",telrec:"\u2315",Tfr:"\ud835\udd17",tfr:"\ud835\udd31",there4:"\u2234",therefore:"\u2234",Therefore:"\u2234",Theta:"\u0398",theta:"\u03b8",thetasym:"\u03d1",thetav:"\u03d1",thickapprox:"\u2248",thicksim:"\u223c",ThickSpace:"\u205f\u200a",ThinSpace:"\u2009",thinsp:"\u2009",thkap:"\u2248",thksim:"\u223c",THORN:"\xde",thorn:"\xfe",tilde:"\u02dc",Tilde:"\u223c",TildeEqual:"\u2243",TildeFullEqual:"\u2245",TildeTilde:"\u2248",timesbar:"\u2a31",timesb:"\u22a0",times:"\xd7",timesd:"\u2a30",tint:"\u222d",toea:"\u2928",topbot:"\u2336",topcir:"\u2af1",top:"\u22a4",Topf:"\ud835\udd4b",topf:"\ud835\udd65",topfork:"\u2ada",tosa:"\u2929",tprime:"\u2034",trade:"\u2122",TRADE:"\u2122",triangle:"\u25b5",triangledown:"\u25bf",triangleleft:"\u25c3",trianglelefteq:"\u22b4",triangleq:"\u225c",triangleright:"\u25b9",trianglerighteq:"\u22b5",tridot:"\u25ec",trie:"\u225c",triminus:"\u2a3a",TripleDot:"\u20db",triplus:"\u2a39",trisb:"\u29cd",tritime:"\u2a3b",trpezium:"\u23e2",Tscr:"\ud835\udcaf",tscr:"\ud835\udcc9",TScy:"\u0426",tscy:"\u0446",TSHcy:"\u040b",tshcy:"\u045b",Tstrok:"\u0166",tstrok:"\u0167",twixt:"\u226c",twoheadleftarrow:"\u219e",twoheadrightarrow:"\u21a0",Uacute:"\xda",uacute:"\xfa",uarr:"\u2191",Uarr:"\u219f",uArr:"\u21d1",Uarrocir:"\u2949",Ubrcy:"\u040e",ubrcy:"\u045e",Ubreve:"\u016c",ubreve:"\u016d",Ucirc:"\xdb",ucirc:"\xfb",Ucy:"\u0423",ucy:"\u0443",udarr:"\u21c5",Udblac:"\u0170",udblac:"\u0171",udhar:"\u296e",ufisht:"\u297e",Ufr:"\ud835\udd18",ufr:"\ud835\udd32",Ugrave:"\xd9",ugrave:"\xf9",uHar:"\u2963",uharl:"\u21bf",uharr:"\u21be",uhblk:"\u2580",ulcorn:"\u231c",ulcorner:"\u231c",ulcrop:"\u230f",ultri:"\u25f8",Umacr:"\u016a",umacr:"\u016b",uml:"\xa8",UnderBar:"_",UnderBrace:"\u23df",UnderBracket:"\u23b5",UnderParenthesis:"\u23dd",Union:"\u22c3",UnionPlus:"\u228e",Uogon:"\u0172",uogon:"\u0173",Uopf:"\ud835\udd4c",uopf:"\ud835\udd66",UpArrowBar:"\u2912",uparrow:"\u2191",UpArrow:"\u2191",Uparrow:"\u21d1",UpArrowDownArrow:"\u21c5",updownarrow:"\u2195",UpDownArrow:"\u2195",Updownarrow:"\u21d5",UpEquilibrium:"\u296e",upharpoonleft:"\u21bf",upharpoonright:"\u21be",uplus:"\u228e",UpperLeftArrow:"\u2196",UpperRightArrow:"\u2197",upsi:"\u03c5",Upsi:"\u03d2",upsih:"\u03d2",Upsilon:"\u03a5",upsilon:"\u03c5",UpTeeArrow:"\u21a5",UpTee:"\u22a5",upuparrows:"\u21c8",urcorn:"\u231d",urcorner:"\u231d",urcrop:"\u230e",Uring:"\u016e",uring:"\u016f",urtri:"\u25f9",Uscr:"\ud835\udcb0",uscr:"\ud835\udcca",utdot:"\u22f0",Utilde:"\u0168",utilde:"\u0169",utri:"\u25b5",utrif:"\u25b4",uuarr:"\u21c8",Uuml:"\xdc",uuml:"\xfc",uwangle:"\u29a7",vangrt:"\u299c",varepsilon:"\u03f5",varkappa:"\u03f0",varnothing:"\u2205",varphi:"\u03d5",varpi:"\u03d6",varpropto:"\u221d",varr:"\u2195",vArr:"\u21d5",varrho:"\u03f1",varsigma:"\u03c2",varsubsetneq:"\u228a\ufe00",varsubsetneqq:"\u2acb\ufe00",varsupsetneq:"\u228b\ufe00",varsupsetneqq:"\u2acc\ufe00",vartheta:"\u03d1",vartriangleleft:"\u22b2",vartriangleright:"\u22b3",vBar:"\u2ae8",Vbar:"\u2aeb",vBarv:"\u2ae9",Vcy:"\u0412",vcy:"\u0432",vdash:"\u22a2",vDash:"\u22a8",Vdash:"\u22a9",VDash:"\u22ab",Vdashl:"\u2ae6",veebar:"\u22bb",vee:"\u2228",Vee:"\u22c1",veeeq:"\u225a",vellip:"\u22ee",verbar:"|",Verbar:"\u2016",vert:"|",Vert:"\u2016",VerticalBar:"\u2223",VerticalLine:"|",VerticalSeparator:"\u2758",VerticalTilde:"\u2240",VeryThinSpace:"\u200a",Vfr:"\ud835\udd19",vfr:"\ud835\udd33",vltri:"\u22b2",vnsub:"\u2282\u20d2",vnsup:"\u2283\u20d2",Vopf:"\ud835\udd4d",vopf:"\ud835\udd67",vprop:"\u221d",vrtri:"\u22b3",Vscr:"\ud835\udcb1",vscr:"\ud835\udccb",vsubnE:"\u2acb\ufe00",vsubne:"\u228a\ufe00",vsupnE:"\u2acc\ufe00",vsupne:"\u228b\ufe00",Vvdash:"\u22aa",vzigzag:"\u299a",Wcirc:"\u0174",wcirc:"\u0175",wedbar:"\u2a5f",wedge:"\u2227",Wedge:"\u22c0",wedgeq:"\u2259",weierp:"\u2118",Wfr:"\ud835\udd1a",wfr:"\ud835\udd34",Wopf:"\ud835\udd4e",wopf:"\ud835\udd68",wp:"\u2118",wr:"\u2240",wreath:"\u2240",Wscr:"\ud835\udcb2",wscr:"\ud835\udccc",xcap:"\u22c2",xcirc:"\u25ef",xcup:"\u22c3",xdtri:"\u25bd",Xfr:"\ud835\udd1b",xfr:"\ud835\udd35",xharr:"\u27f7",xhArr:"\u27fa",Xi:"\u039e",xi:"\u03be",xlarr:"\u27f5",xlArr:"\u27f8",xmap:"\u27fc",xnis:"\u22fb",xodot:"\u2a00",Xopf:"\ud835\udd4f",xopf:"\ud835\udd69",xoplus:"\u2a01",xotime:"\u2a02",xrarr:"\u27f6",xrArr:"\u27f9",Xscr:"\ud835\udcb3",xscr:"\ud835\udccd",xsqcup:"\u2a06",xuplus:"\u2a04",xutri:"\u25b3",xvee:"\u22c1",xwedge:"\u22c0",Yacute:"\xdd",yacute:"\xfd",YAcy:"\u042f",yacy:"\u044f",Ycirc:"\u0176",ycirc:"\u0177",Ycy:"\u042b",ycy:"\u044b",yen:"\xa5",Yfr:"\ud835\udd1c",yfr:"\ud835\udd36",YIcy:"\u0407",yicy:"\u0457",Yopf:"\ud835\udd50",yopf:"\ud835\udd6a",Yscr:"\ud835\udcb4",yscr:"\ud835\udcce",YUcy:"\u042e",yucy:"\u044e",yuml:"\xff",Yuml:"\u0178",Zacute:"\u0179",zacute:"\u017a",Zcaron:"\u017d",zcaron:"\u017e",Zcy:"\u0417",zcy:"\u0437",Zdot:"\u017b",zdot:"\u017c",zeetrf:"\u2128",ZeroWidthSpace:"\u200b",Zeta:"\u0396",zeta:"\u03b6",zfr:"\ud835\udd37",Zfr:"\u2128",ZHcy:"\u0416",zhcy:"\u0436",zigrarr:"\u21dd",zopf:"\ud835\udd6b",Zopf:"\u2124",Zscr:"\ud835\udcb5",zscr:"\ud835\udccf",zwj:"\u200d",zwnj:"\u200c"}},{}],53:[function(e,r,t){"use strict";function n(e){return Array.prototype.slice.call(arguments,1).forEach((function(r){r&&Object.keys(r).forEach((function(t){e[t]=r[t]}))})),e}function s(e){return Object.prototype.toString.call(e)}function o(e){return"[object Function]"===s(e)}function i(e){return e.replace(/[.?*+^$[\]\\(){}|-]/g,"\\$&")}var a={fuzzyLink:!0,fuzzyEmail:!0,fuzzyIP:!1};var c={"http:":{validate:function(e,r,t){var n=e.slice(r);return t.re.http||(t.re.http=new RegExp("^\\/\\/"+t.re.src_auth+t.re.src_host_port_strict+t.re.src_path,"i")),t.re.http.test(n)?n.match(t.re.http)[0].length:0}},"https:":"http:","ftp:":"http:","//":{validate:function(e,r,t){var n=e.slice(r);return t.re.no_http||(t.re.no_http=new RegExp("^"+t.re.src_auth+"(?:localhost|(?:(?:"+t.re.src_domain+")\\.)+"+t.re.src_domain_root+")"+t.re.src_port+t.re.src_host_terminator+t.re.src_path,"i")),t.re.no_http.test(n)?r>=3&&":"===e[r-3]?0:r>=3&&"/"===e[r-3]?0:n.match(t.re.no_http)[0].length:0}},"mailto:":{validate:function(e,r,t){var n=e.slice(r);return t.re.mailto||(t.re.mailto=new RegExp("^"+t.re.src_email_name+"@"+t.re.src_host_strict,"i")),t.re.mailto.test(n)?n.match(t.re.mailto)[0].length:0}}},l="a[cdefgilmnoqrstuwxz]|b[abdefghijmnorstvwyz]|c[acdfghiklmnoruvwxyz]|d[ejkmoz]|e[cegrstu]|f[ijkmor]|g[abdefghilmnpqrstuwy]|h[kmnrtu]|i[delmnoqrst]|j[emop]|k[eghimnprwyz]|l[abcikrstuvy]|m[acdeghklmnopqrstuvwxyz]|n[acefgilopruz]|om|p[aefghklmnrstwy]|qa|r[eosuw]|s[abcdeghijklmnortuvxyz]|t[cdfghjklmnortvwz]|u[agksyz]|v[aceginu]|w[fs]|y[et]|z[amw]",u="biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|\u0440\u0444".split("|");function p(r){var t=r.re=e("./lib/re")(r.__opts__),n=r.__tlds__.slice();function a(e){return e.replace("%TLDS%",t.src_tlds)}r.onCompile(),r.__tlds_replaced__||n.push(l),n.push(t.src_xn),t.src_tlds=n.join("|"),t.email_fuzzy=RegExp(a(t.tpl_email_fuzzy),"i"),t.link_fuzzy=RegExp(a(t.tpl_link_fuzzy),"i"),t.link_no_ip_fuzzy=RegExp(a(t.tpl_link_no_ip_fuzzy),"i"),t.host_fuzzy_test=RegExp(a(t.tpl_host_fuzzy_test),"i");var c=[];function u(e,r){throw new Error('(LinkifyIt) Invalid schema "'+e+'": '+r)}r.__compiled__={},Object.keys(r.__schemas__).forEach((function(e){var t=r.__schemas__[e];if(null!==t){var n={validate:null,link:null};if(r.__compiled__[e]=n,"[object Object]"===s(t))return!function(e){return"[object RegExp]"===s(e)}(t.validate)?o(t.validate)?n.validate=t.validate:u(e,t):n.validate=function(e){return function(r,t){var n=r.slice(t);return e.test(n)?n.match(e)[0].length:0}}(t.validate),void(o(t.normalize)?n.normalize=t.normalize:t.normalize?u(e,t):n.normalize=function(e,r){r.normalize(e)});!function(e){return"[object String]"===s(e)}(t)?u(e,t):c.push(e)}})),c.forEach((function(e){r.__compiled__[r.__schemas__[e]]&&(r.__compiled__[e].validate=r.__compiled__[r.__schemas__[e]].validate,r.__compiled__[e].normalize=r.__compiled__[r.__schemas__[e]].normalize)})),r.__compiled__[""]={validate:null,normalize:function(e,r){r.normalize(e)}};var p=Object.keys(r.__compiled__).filter((function(e){return e.length>0&&r.__compiled__[e]})).map(i).join("|");r.re.schema_test=RegExp("(^|(?!_)(?:[><\uff5c]|"+t.src_ZPCc+"))("+p+")","i"),r.re.schema_search=RegExp("(^|(?!_)(?:[><\uff5c]|"+t.src_ZPCc+"))("+p+")","ig"),r.re.pretest=RegExp("("+r.re.schema_test.source+")|("+r.re.host_fuzzy_test.source+")|@","i"),function(e){e.__index__=-1,e.__text_cache__=""}(r)}function h(e,r){var t=e.__index__,n=e.__last_index__,s=e.__text_cache__.slice(t,n);this.schema=e.__schema__.toLowerCase(),this.index=t+r,this.lastIndex=n+r,this.raw=s,this.text=s,this.url=s}function f(e,r){var t=new h(e,r);return e.__compiled__[t.schema].normalize(t,e),t}function d(e,r){if(!(this instanceof d))return new d(e,r);var t;r||(t=e,Object.keys(t||{}).reduce((function(e,r){return e||a.hasOwnProperty(r)}),!1)&&(r=e,e={})),this.__opts__=n({},a,r),this.__index__=-1,this.__last_index__=-1,this.__schema__="",this.__text_cache__="",this.__schemas__=n({},c,e),this.__compiled__={},this.__tlds__=u,this.__tlds_replaced__=!1,this.re={},p(this)}d.prototype.add=function(e,r){return this.__schemas__[e]=r,p(this),this},d.prototype.set=function(e){return this.__opts__=n(this.__opts__,e),this},d.prototype.test=function(e){if(this.__text_cache__=e,this.__index__=-1,!e.length)return!1;var r,t,n,s,o,i,a,c;if(this.re.schema_test.test(e))for((a=this.re.schema_search).lastIndex=0;null!==(r=a.exec(e));)if(s=this.testSchemaAt(e,r[2],a.lastIndex)){this.__schema__=r[2],this.__index__=r.index+r[1].length,this.__last_index__=r.index+r[0].length+s;break}return this.__opts__.fuzzyLink&&this.__compiled__["http:"]&&(c=e.search(this.re.host_fuzzy_test))>=0&&(this.__index__<0||c<this.__index__)&&null!==(t=e.match(this.__opts__.fuzzyIP?this.re.link_fuzzy:this.re.link_no_ip_fuzzy))&&(o=t.index+t[1].length,(this.__index__<0||o<this.__index__)&&(this.__schema__="",this.__index__=o,this.__last_index__=t.index+t[0].length)),this.__opts__.fuzzyEmail&&this.__compiled__["mailto:"]&&e.indexOf("@")>=0&&null!==(n=e.match(this.re.email_fuzzy))&&(o=n.index+n[1].length,i=n.index+n[0].length,(this.__index__<0||o<this.__index__||o===this.__index__&&i>this.__last_index__)&&(this.__schema__="mailto:",this.__index__=o,this.__last_index__=i)),this.__index__>=0},d.prototype.pretest=function(e){return this.re.pretest.test(e)},d.prototype.testSchemaAt=function(e,r,t){return this.__compiled__[r.toLowerCase()]?this.__compiled__[r.toLowerCase()].validate(e,t,this):0},d.prototype.match=function(e){var r=0,t=[];this.__index__>=0&&this.__text_cache__===e&&(t.push(f(this,r)),r=this.__last_index__);for(var n=r?e.slice(r):e;this.test(n);)t.push(f(this,r)),n=n.slice(this.__last_index__),r+=this.__last_index__;return t.length?t:null},d.prototype.tlds=function(e,r){return e=Array.isArray(e)?e:[e],r?(this.__tlds__=this.__tlds__.concat(e).sort().filter((function(e,r,t){return e!==t[r-1]})).reverse(),p(this),this):(this.__tlds__=e.slice(),this.__tlds_replaced__=!0,p(this),this)},d.prototype.normalize=function(e){e.schema||(e.url="http://"+e.url),"mailto:"!==e.schema||/^mailto:/i.test(e.url)||(e.url="mailto:"+e.url)},d.prototype.onCompile=function(){},r.exports=d},{"./lib/re":54}],54:[function(e,r,t){"use strict";r.exports=function(r){var t={};t.src_Any=e("uc.micro/properties/Any/regex").source,t.src_Cc=e("uc.micro/categories/Cc/regex").source,t.src_Z=e("uc.micro/categories/Z/regex").source,t.src_P=e("uc.micro/categories/P/regex").source,t.src_ZPCc=[t.src_Z,t.src_P,t.src_Cc].join("|"),t.src_ZCc=[t.src_Z,t.src_Cc].join("|");return t.src_pseudo_letter="(?:(?![><\uff5c]|"+t.src_ZPCc+")"+t.src_Any+")",t.src_ip4="(?:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)",t.src_auth="(?:(?:(?!"+t.src_ZCc+"|[@/\\[\\]()]).)+@)?",t.src_port="(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?",t.src_host_terminator="(?=$|[><\uff5c]|"+t.src_ZPCc+")(?!-|_|:\\d|\\.-|\\.(?!$|"+t.src_ZPCc+"))",t.src_path="(?:[/?#](?:(?!"+t.src_ZCc+"|[><\uff5c]|[()[\\]{}.,\"'?!\\-]).|\\[(?:(?!"+t.src_ZCc+"|\\]).)*\\]|\\((?:(?!"+t.src_ZCc+"|[)]).)*\\)|\\{(?:(?!"+t.src_ZCc+'|[}]).)*\\}|\\"(?:(?!'+t.src_ZCc+'|["]).)+\\"|\\\'(?:(?!'+t.src_ZCc+"|[']).)+\\'|\\'(?="+t.src_pseudo_letter+"|[-]).|\\.{2,4}[a-zA-Z0-9%/]|\\.(?!"+t.src_ZCc+"|[.]).|"+(r&&r["---"]?"\\-(?!--(?:[^-]|$))(?:-*)|":"\\-+|")+"\\,(?!"+t.src_ZCc+").|\\!(?!"+t.src_ZCc+"|[!]).|\\?(?!"+t.src_ZCc+"|[?]).)+|\\/)?",t.src_email_name='[\\-;:&=\\+\\$,\\.a-zA-Z0-9_][\\-;:&=\\+\\$,\\"\\.a-zA-Z0-9_]*',t.src_xn="xn--[a-z0-9\\-]{1,59}",t.src_domain_root="(?:"+t.src_xn+"|"+t.src_pseudo_letter+"{1,63})",t.src_domain="(?:"+t.src_xn+"|(?:"+t.src_pseudo_letter+")|(?:"+t.src_pseudo_letter+"(?:-|"+t.src_pseudo_letter+"){0,61}"+t.src_pseudo_letter+"))",t.src_host="(?:(?:(?:(?:"+t.src_domain+")\\.)*"+t.src_domain+"))",t.tpl_host_fuzzy="(?:"+t.src_ip4+"|(?:(?:(?:"+t.src_domain+")\\.)+(?:%TLDS%)))",t.tpl_host_no_ip_fuzzy="(?:(?:(?:"+t.src_domain+")\\.)+(?:%TLDS%))",t.src_host_strict=t.src_host+t.src_host_terminator,t.tpl_host_fuzzy_strict=t.tpl_host_fuzzy+t.src_host_terminator,t.src_host_port_strict=t.src_host+t.src_port+t.src_host_terminator,t.tpl_host_port_fuzzy_strict=t.tpl_host_fuzzy+t.src_port+t.src_host_terminator,t.tpl_host_port_no_ip_fuzzy_strict=t.tpl_host_no_ip_fuzzy+t.src_port+t.src_host_terminator,t.tpl_host_fuzzy_test="localhost|www\\.|\\.\\d{1,3}\\.|(?:\\.(?:%TLDS%)(?:"+t.src_ZPCc+"|>|$))",t.tpl_email_fuzzy='(^|[><\uff5c]|"|\\(|'+t.src_ZCc+")("+t.src_email_name+"@"+t.tpl_host_fuzzy_strict+")",t.tpl_link_fuzzy="(^|(?![.:/\\-_@])(?:[$+<=>^`|\uff5c]|"+t.src_ZPCc+"))((?![$+<=>^`|\uff5c])"+t.tpl_host_port_fuzzy_strict+t.src_path+")",t.tpl_link_no_ip_fuzzy="(^|(?![.:/\\-_@])(?:[$+<=>^`|\uff5c]|"+t.src_ZPCc+"))((?![$+<=>^`|\uff5c])"+t.tpl_host_port_no_ip_fuzzy_strict+t.src_path+")",t}},{"uc.micro/categories/Cc/regex":61,"uc.micro/categories/P/regex":63,"uc.micro/categories/Z/regex":64,"uc.micro/properties/Any/regex":66}],55:[function(e,r,t){"use strict";var n={};function s(e,r){var t;return"string"!=typeof r&&(r=s.defaultChars),t=function(e){var r,t,s=n[e];if(s)return s;for(s=n[e]=[],r=0;r<128;r++)t=String.fromCharCode(r),s.push(t);for(r=0;r<e.length;r++)s[t=e.charCodeAt(r)]="%"+("0"+t.toString(16).toUpperCase()).slice(-2);return s}(r),e.replace(/(%[a-f0-9]{2})+/gi,(function(e){var r,n,s,o,i,a,c,l="";for(r=0,n=e.length;r<n;r+=3)(s=parseInt(e.slice(r+1,r+3),16))<128?l+=t[s]:192==(224&s)&&r+3<n&&128==(192&(o=parseInt(e.slice(r+4,r+6),16)))?(l+=(c=s<<6&1984|63&o)<128?"\ufffd\ufffd":String.fromCharCode(c),r+=3):224==(240&s)&&r+6<n&&(o=parseInt(e.slice(r+4,r+6),16),i=parseInt(e.slice(r+7,r+9),16),128==(192&o)&&128==(192&i))?(l+=(c=s<<12&61440|o<<6&4032|63&i)<2048||c>=55296&&c<=57343?"\ufffd\ufffd\ufffd":String.fromCharCode(c),r+=6):240==(248&s)&&r+9<n&&(o=parseInt(e.slice(r+4,r+6),16),i=parseInt(e.slice(r+7,r+9),16),a=parseInt(e.slice(r+10,r+12),16),128==(192&o)&&128==(192&i)&&128==(192&a))?((c=s<<18&1835008|o<<12&258048|i<<6&4032|63&a)<65536||c>1114111?l+="\ufffd\ufffd\ufffd\ufffd":(c-=65536,l+=String.fromCharCode(55296+(c>>10),56320+(1023&c))),r+=9):l+="\ufffd";return l}))}s.defaultChars=";/?:@&=+$,#",s.componentChars="",r.exports=s},{}],56:[function(e,r,t){"use strict";var n={};function s(e,r,t){var o,i,a,c,l,u="";for("string"!=typeof r&&(t=r,r=s.defaultChars),void 0===t&&(t=!0),l=function(e){var r,t,s=n[e];if(s)return s;for(s=n[e]=[],r=0;r<128;r++)t=String.fromCharCode(r),/^[0-9a-z]$/i.test(t)?s.push(t):s.push("%"+("0"+r.toString(16).toUpperCase()).slice(-2));for(r=0;r<e.length;r++)s[e.charCodeAt(r)]=e[r];return s}(r),o=0,i=e.length;o<i;o++)if(a=e.charCodeAt(o),t&&37===a&&o+2<i&&/^[0-9a-f]{2}$/i.test(e.slice(o+1,o+3)))u+=e.slice(o,o+3),o+=2;else if(a<128)u+=l[a];else if(a>=55296&&a<=57343){if(a>=55296&&a<=56319&&o+1<i&&(c=e.charCodeAt(o+1))>=56320&&c<=57343){u+=encodeURIComponent(e[o]+e[o+1]),o++;continue}u+="%EF%BF%BD"}else u+=encodeURIComponent(e[o]);return u}s.defaultChars=";/?:@&=+$,-_.!~*'()#",s.componentChars="-_.!~*'()",r.exports=s},{}],57:[function(e,r,t){"use strict";r.exports=function(e){var r="";return r+=e.protocol||"",r+=e.slashes?"//":"",r+=e.auth?e.auth+"@":"",e.hostname&&-1!==e.hostname.indexOf(":")?r+="["+e.hostname+"]":r+=e.hostname||"",r+=e.port?":"+e.port:"",r+=e.pathname||"",r+=e.search||"",r+=e.hash||""}},{}],58:[function(e,r,t){"use strict";r.exports.encode=e("./encode"),r.exports.decode=e("./decode"),r.exports.format=e("./format"),r.exports.parse=e("./parse")},{"./decode":55,"./encode":56,"./format":57,"./parse":59}],59:[function(e,r,t){"use strict";function n(){this.protocol=null,this.slashes=null,this.auth=null,this.port=null,this.hostname=null,this.hash=null,this.search=null,this.pathname=null}var s=/^([a-z0-9.+-]+:)/i,o=/:[0-9]*$/,i=/^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,a=["{","}","|","\\","^","`"].concat(["<",">",'"',"`"," ","\r","\n","\t"]),c=["'"].concat(a),l=["%","/","?",";","#"].concat(c),u=["/","?","#"],p=/^[+a-z0-9A-Z_-]{0,63}$/,h=/^([+a-z0-9A-Z_-]{0,63})(.*)$/,f={javascript:!0,"javascript:":!0},d={http:!0,https:!0,ftp:!0,gopher:!0,file:!0,"http:":!0,"https:":!0,"ftp:":!0,"gopher:":!0,"file:":!0};n.prototype.parse=function(e,r){var t,n,o,a,c,m=e;if(m=m.trim(),!r&&1===e.split("#").length){var _=i.exec(m);if(_)return this.pathname=_[1],_[2]&&(this.search=_[2]),this}var g=s.exec(m);if(g&&(o=(g=g[0]).toLowerCase(),this.protocol=g,m=m.substr(g.length)),(r||g||m.match(/^\/\/[^@\/]+@[^@\/]+/))&&(!(c="//"===m.substr(0,2))||g&&f[g]||(m=m.substr(2),this.slashes=!0)),!f[g]&&(c||g&&!d[g])){var k,b,v=-1;for(t=0;t<u.length;t++)-1!==(a=m.indexOf(u[t]))&&(-1===v||a<v)&&(v=a);for(-1!==(b=-1===v?m.lastIndexOf("@"):m.lastIndexOf("@",v))&&(k=m.slice(0,b),m=m.slice(b+1),this.auth=k),v=-1,t=0;t<l.length;t++)-1!==(a=m.indexOf(l[t]))&&(-1===v||a<v)&&(v=a);-1===v&&(v=m.length),":"===m[v-1]&&v--;var y=m.slice(0,v);m=m.slice(v),this.parseHost(y),this.hostname=this.hostname||"";var C="["===this.hostname[0]&&"]"===this.hostname[this.hostname.length-1];if(!C){var x=this.hostname.split(/\./);for(t=0,n=x.length;t<n;t++){var A=x[t];if(A&&!A.match(p)){for(var w="",D=0,E=A.length;D<E;D++)A.charCodeAt(D)>127?w+="x":w+=A[D];if(!w.match(p)){var q=x.slice(0,t),F=x.slice(t+1),S=A.match(h);S&&(q.push(S[1]),F.unshift(S[2])),F.length&&(m=F.join(".")+m),this.hostname=q.join(".");break}}}}this.hostname.length>255&&(this.hostname=""),C&&(this.hostname=this.hostname.substr(1,this.hostname.length-2))}var L=m.indexOf("#");-1!==L&&(this.hash=m.substr(L),m=m.slice(0,L));var z=m.indexOf("?");return-1!==z&&(this.search=m.substr(z),m=m.slice(0,z)),m&&(this.pathname=m),d[o]&&this.hostname&&!this.pathname&&(this.pathname=""),this},n.prototype.parseHost=function(e){var r=o.exec(e);r&&(":"!==(r=r[0])&&(this.port=r.substr(1)),e=e.substr(0,e.length-r.length)),e&&(this.hostname=e)},r.exports=function(e,r){if(e&&e instanceof n)return e;var t=new n;return t.parse(e,r),t}},{}],60:[function(e,r,t){(function(e){!function(n){var s="object"==typeof t&&t&&!t.nodeType&&t,o="object"==typeof r&&r&&!r.nodeType&&r,i="object"==typeof e&&e;i.global!==i&&i.window!==i&&i.self!==i||(n=i);var a,c,l=2147483647,u=36,p=1,h=26,f=38,d=700,m=72,_=128,g="-",k=/^xn--/,b=/[^\x20-\x7E]/,v=/[\x2E\u3002\uFF0E\uFF61]/g,y={overflow:"Overflow: input needs wider integers to process","not-basic":"Illegal input >= 0x80 (not a basic code point)","invalid-input":"Invalid input"},C=u-p,x=Math.floor,A=String.fromCharCode;function w(e){throw new RangeError(y[e])}function D(e,r){for(var t=e.length,n=[];t--;)n[t]=r(e[t]);return n}function E(e,r){var t=e.split("@"),n="";return t.length>1&&(n=t[0]+"@",e=t[1]),n+D((e=e.replace(v,".")).split("."),r).join(".")}function q(e){for(var r,t,n=[],s=0,o=e.length;s<o;)(r=e.charCodeAt(s++))>=55296&&r<=56319&&s<o?56320==(64512&(t=e.charCodeAt(s++)))?n.push(((1023&r)<<10)+(1023&t)+65536):(n.push(r),s--):n.push(r);return n}function F(e){return D(e,(function(e){var r="";return e>65535&&(r+=A((e-=65536)>>>10&1023|55296),e=56320|1023&e),r+=A(e)})).join("")}function S(e,r){return e+22+75*(e<26)-((0!=r)<<5)}function L(e,r,t){var n=0;for(e=t?x(e/d):e>>1,e+=x(e/r);e>C*h>>1;n+=u)e=x(e/C);return x(n+(C+1)*e/(e+f))}function z(e){var r,t,n,s,o,i,a,c,f,d,k,b=[],v=e.length,y=0,C=_,A=m;for((t=e.lastIndexOf(g))<0&&(t=0),n=0;n<t;++n)e.charCodeAt(n)>=128&&w("not-basic"),b.push(e.charCodeAt(n));for(s=t>0?t+1:0;s<v;){for(o=y,i=1,a=u;s>=v&&w("invalid-input"),((c=(k=e.charCodeAt(s++))-48<10?k-22:k-65<26?k-65:k-97<26?k-97:u)>=u||c>x((l-y)/i))&&w("overflow"),y+=c*i,!(c<(f=a<=A?p:a>=A+h?h:a-A));a+=u)i>x(l/(d=u-f))&&w("overflow"),i*=d;A=L(y-o,r=b.length+1,0==o),x(y/r)>l-C&&w("overflow"),C+=x(y/r),y%=r,b.splice(y++,0,C)}return F(b)}function T(e){var r,t,n,s,o,i,a,c,f,d,k,b,v,y,C,D=[];for(b=(e=q(e)).length,r=_,t=0,o=m,i=0;i<b;++i)(k=e[i])<128&&D.push(A(k));for(n=s=D.length,s&&D.push(g);n<b;){for(a=l,i=0;i<b;++i)(k=e[i])>=r&&k<a&&(a=k);for(a-r>x((l-t)/(v=n+1))&&w("overflow"),t+=(a-r)*v,r=a,i=0;i<b;++i)if((k=e[i])<r&&++t>l&&w("overflow"),k==r){for(c=t,f=u;!(c<(d=f<=o?p:f>=o+h?h:f-o));f+=u)C=c-d,y=u-d,D.push(A(S(d+C%y,0))),c=x(C/y);D.push(A(S(c,0))),o=L(t,v,n==s),t=0,++n}++t,++r}return D.join("")}if(a={version:"1.4.1",ucs2:{decode:q,encode:F},decode:z,encode:T,toASCII:function(e){return E(e,(function(e){return b.test(e)?"xn--"+T(e):e}))},toUnicode:function(e){return E(e,(function(e){return k.test(e)?z(e.slice(4).toLowerCase()):e}))}},s&&o)if(r.exports==s)o.exports=a;else for(c in a)a.hasOwnProperty(c)&&(s[c]=a[c]);else n.punycode=a}(this)}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}],61:[function(e,r,t){r.exports=/[\0-\x1F\x7F-\x9F]/},{}],62:[function(e,r,t){r.exports=/[\xAD\u0600-\u0605\u061C\u06DD\u070F\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/},{}],63:[function(e,r,t){r.exports=/[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4E\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDF55-\uDF59]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDF3C-\uDF3E]|\uD806[\uDC3B\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/},{}],64:[function(e,r,t){r.exports=/[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/},{}],65:[function(e,r,t){"use strict";t.Any=e("./properties/Any/regex"),t.Cc=e("./categories/Cc/regex"),t.Cf=e("./categories/Cf/regex"),t.P=e("./categories/P/regex"),t.Z=e("./categories/Z/regex")},{"./categories/Cc/regex":61,"./categories/Cf/regex":62,"./categories/P/regex":63,"./categories/Z/regex":64,"./properties/Any/regex":66}],66:[function(e,r,t){r.exports=/[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/},{}],67:[function(e,r,t){"use strict";r.exports=e("./lib/")},{"./lib/":9}]},{},[67])(67)}));
;/*! markdown-it-sub 1.0.0 https://github.com//markdown-it/markdown-it-sub @license MIT */
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var r;r="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,r.markdownitSub=e()}}(function(){return function e(r,o,n){function t(i,u){if(!o[i]){if(!r[i]){var f="function"==typeof require&&require;if(!u&&f)return f(i,!0);if(s)return s(i,!0);var p=new Error("Cannot find module '"+i+"'");throw p.code="MODULE_NOT_FOUND",p}var a=o[i]={exports:{}};r[i][0].call(a.exports,function(e){var o=r[i][1][e];return t(o?o:e)},a,a.exports,e,r,o,n)}return o[i].exports}for(var s="function"==typeof require&&require,i=0;i<n.length;i++)t(n[i]);return t}({1:[function(e,r){"use strict";function o(e,r){var o,t,s,i=e.posMax,u=e.pos;if(126!==e.src.charCodeAt(u))return!1;if(r)return!1;if(u+2>=i)return!1;for(e.pos=u+1;e.pos<i;){if(126===e.src.charCodeAt(e.pos)){o=!0;break}e.md.inline.skipToken(e)}return o&&u+1!==e.pos?(t=e.src.slice(u+1,e.pos),t.match(/(^|[^\\])(\\\\)*\s/)?(e.pos=u,!1):(e.posMax=e.pos,e.pos=u+1,s=e.push("sub_open","sub",1),s.markup="~",s=e.push("text","",0),s.content=t.replace(n,"$1"),s=e.push("sub_close","sub",-1),s.markup="~",e.pos=e.posMax+1,e.posMax=i,!0)):(e.pos=u,!1)}var n=/\\([ \\!"#$%&'()*+,.\/:;<=>?@[\]^_`{|}~-])/g;r.exports=function(e){e.inline.ruler.after("emphasis","sub",o)}},{}]},{},[1])(1)});;/*! markdown-it-sup 1.0.0 https://github.com//markdown-it/markdown-it-sup @license MIT */
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var r;r="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,r.markdownitSup=e()}}(function(){return function e(r,o,n){function t(i,p){if(!o[i]){if(!r[i]){var u="function"==typeof require&&require;if(!p&&u)return u(i,!0);if(s)return s(i,!0);var f=new Error("Cannot find module '"+i+"'");throw f.code="MODULE_NOT_FOUND",f}var a=o[i]={exports:{}};r[i][0].call(a.exports,function(e){var o=r[i][1][e];return t(o?o:e)},a,a.exports,e,r,o,n)}return o[i].exports}for(var s="function"==typeof require&&require,i=0;i<n.length;i++)t(n[i]);return t}({1:[function(e,r){"use strict";function o(e,r){var o,t,s,i=e.posMax,p=e.pos;if(94!==e.src.charCodeAt(p))return!1;if(r)return!1;if(p+2>=i)return!1;for(e.pos=p+1;e.pos<i;){if(94===e.src.charCodeAt(e.pos)){o=!0;break}e.md.inline.skipToken(e)}return o&&p+1!==e.pos?(t=e.src.slice(p+1,e.pos),t.match(/(^|[^\\])(\\\\)*\s/)?(e.pos=p,!1):(e.posMax=e.pos,e.pos=p+1,s=e.push("sup_open","sup",1),s.markup="^",s=e.push("text","",0),s.content=t.replace(n,"$1"),s=e.push("sup_close","sup",-1),s.markup="^",e.pos=e.posMax+1,e.posMax=i,!0)):(e.pos=p,!1)}var n=/\\([ \\!"#$%&'()*+,.\/:;<=>?@[\]^_`{|}~-])/g;r.exports=function(e){e.inline.ruler.after("emphasis","sup",o)}},{}]},{},[1])(1)});;!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this).markdownitFootnote=e()}}(function(){return function(){return function e(o,t,n){function r(f,l){if(!t[f]){if(!o[f]){var i="function"==typeof require&&require;if(!l&&i)return i(f,!0);if(s)return s(f,!0);var u=new Error("Cannot find module '"+f+"'");throw u.code="MODULE_NOT_FOUND",u}var a=t[f]={exports:{}};o[f][0].call(a.exports,function(e){return r(o[f][1][e]||e)},a,a.exports,e,o,t,n)}return t[f].exports}for(var s="function"==typeof require&&require,f=0;f<n.length;f++)r(n[f]);return r}}()({1:[function(e,o,t){"use strict";function n(e,o,t,n){var r=Number(e[o].meta.id+1).toString(),s="";return"string"==typeof n.docId&&(s="-"+n.docId+"-"),s+r}function r(e,o){var t=Number(e[o].meta.id+1).toString();return e[o].meta.subId>0&&(t+=":"+e[o].meta.subId),"["+t+"]"}function s(e,o,t,n,r){var s=r.rules.footnote_anchor_name(e,o,t,n,r),f=r.rules.footnote_caption(e,o,t,n,r),l=s;return e[o].meta.subId>0&&(l+=":"+e[o].meta.subId),'<sup class="footnote-ref"><a href="#fn'+s+'" id="fnref'+l+'">'+f+"</a></sup>"}function f(e,o,t){return(t.xhtmlOut?'<hr class="footnotes-sep" />\n':'<hr class="footnotes-sep">\n')+'<section class="footnotes">\n<ol class="footnotes-list">\n'}function l(){return"</ol>\n</section>\n"}function i(e,o,t,n,r){var s=r.rules.footnote_anchor_name(e,o,t,n,r);return e[o].meta.subId>0&&(s+=":"+e[o].meta.subId),'<li id="fn'+s+'" class="footnote-item">'}function u(){return"</li>\n"}function a(e,o,t,n,r){var s=r.rules.footnote_anchor_name(e,o,t,n,r);return e[o].meta.subId>0&&(s+=":"+e[o].meta.subId),' <a href="#fnref'+s+'" class="footnote-backref">\u21a9\ufe0e</a>'}o.exports=function(e){var o=e.helpers.parseLinkLabel,t=e.utils.isSpace;e.renderer.rules.footnote_ref=s,e.renderer.rules.footnote_block_open=f,e.renderer.rules.footnote_block_close=l,e.renderer.rules.footnote_open=i,e.renderer.rules.footnote_close=u,e.renderer.rules.footnote_anchor=a,e.renderer.rules.footnote_caption=r,e.renderer.rules.footnote_anchor_name=n,e.block.ruler.before("reference","footnote_def",function(e,o,n,r){var s,f,l,i,u,a,c,p,d,h,k,b=e.bMarks[o]+e.tShift[o],v=e.eMarks[o];if(b+4>v)return!1;if(91!==e.src.charCodeAt(b))return!1;if(94!==e.src.charCodeAt(b+1))return!1;for(u=b+2;u<v;u++){if(32===e.src.charCodeAt(u))return!1;if(93===e.src.charCodeAt(u))break}if(u===b+2)return!1;if(u+1>=v||58!==e.src.charCodeAt(++u))return!1;if(r)return!0;for(u++,e.env.footnotes||(e.env.footnotes={}),e.env.footnotes.refs||(e.env.footnotes.refs={}),a=e.src.slice(b+2,u-2),e.env.footnotes.refs[":"+a]=-1,(c=new e.Token("footnote_reference_open","",1)).meta={label:a},c.level=e.level++,e.tokens.push(c),s=e.bMarks[o],f=e.tShift[o],l=e.sCount[o],i=e.parentType,k=u,p=d=e.sCount[o]+u-(e.bMarks[o]+e.tShift[o]);u<v&&(h=e.src.charCodeAt(u),t(h));)9===h?d+=4-d%4:d++,u++;return e.tShift[o]=u-k,e.sCount[o]=d-p,e.bMarks[o]=k,e.blkIndent+=4,e.parentType="footnote",e.sCount[o]<e.blkIndent&&(e.sCount[o]+=e.blkIndent),e.md.block.tokenize(e,o,n,!0),e.parentType=i,e.blkIndent-=4,e.tShift[o]=f,e.sCount[o]=l,e.bMarks[o]=s,(c=new e.Token("footnote_reference_close","",-1)).level=--e.level,e.tokens.push(c),!0},{alt:["paragraph","reference"]}),e.inline.ruler.after("image","footnote_inline",function(e,t){var n,r,s,f,l=e.posMax,i=e.pos;return!(i+2>=l||94!==e.src.charCodeAt(i)||91!==e.src.charCodeAt(i+1)||(n=i+2,(r=o(e,i+1))<0||(t||(e.env.footnotes||(e.env.footnotes={}),e.env.footnotes.list||(e.env.footnotes.list=[]),s=e.env.footnotes.list.length,e.md.inline.parse(e.src.slice(n,r),e.md,e.env,f=[]),e.push("footnote_ref","",0).meta={id:s},e.env.footnotes.list[s]={content:e.src.slice(n,r),tokens:f}),e.pos=r+1,e.posMax=l,0)))}),e.inline.ruler.after("footnote_inline","footnote_ref",function(e,o){var t,n,r,s,f=e.posMax,l=e.pos;if(l+3>f)return!1;if(!e.env.footnotes||!e.env.footnotes.refs)return!1;if(91!==e.src.charCodeAt(l))return!1;if(94!==e.src.charCodeAt(l+1))return!1;for(n=l+2;n<f;n++){if(32===e.src.charCodeAt(n))return!1;if(10===e.src.charCodeAt(n))return!1;if(93===e.src.charCodeAt(n))break}return!(n===l+2||n>=f||(n++,t=e.src.slice(l+2,n-1),void 0===e.env.footnotes.refs[":"+t]||(o||(e.env.footnotes.list||(e.env.footnotes.list=[]),e.env.footnotes.refs[":"+t]<0?(r=e.env.footnotes.list.length,e.env.footnotes.list[r]={label:t,count:0},e.env.footnotes.refs[":"+t]=r):r=e.env.footnotes.refs[":"+t],s=e.env.footnotes.list[r].count,e.env.footnotes.list[r].count++,e.push("footnote_ref","",0).meta={id:r,subId:s,label:t}),e.pos=n,e.posMax=f,0)))}),e.core.ruler.after("inline","footnote_tail",function(e){var o,t,n,r,s,f,l,i,u,a,c=!1,p={};if(e.env.footnotes&&(e.tokens=e.tokens.filter(function(e){return"footnote_reference_open"===e.type?(c=!0,u=[],a=e.meta.label,!1):"footnote_reference_close"===e.type?(c=!1,p[":"+a]=u,!1):(c&&u.push(e),!c)}),e.env.footnotes.list)){for(f=e.env.footnotes.list,l=new e.Token("footnote_block_open","",1),e.tokens.push(l),o=0,t=f.length;o<t;o++){for((l=new e.Token("footnote_open","",1)).meta={id:o,label:f[o].label},e.tokens.push(l),f[o].tokens?(i=[],(l=new e.Token("paragraph_open","p",1)).block=!0,i.push(l),(l=new e.Token("inline","",0)).children=f[o].tokens,l.content=f[o].content,i.push(l),(l=new e.Token("paragraph_close","p",-1)).block=!0,i.push(l)):f[o].label&&(i=p[":"+f[o].label]),e.tokens=e.tokens.concat(i),s="paragraph_close"===e.tokens[e.tokens.length-1].type?e.tokens.pop():null,r=f[o].count>0?f[o].count:1,n=0;n<r;n++)(l=new e.Token("footnote_anchor","",0)).meta={id:o,subId:n,label:f[o].label},e.tokens.push(l);s&&e.tokens.push(s),l=new e.Token("footnote_close","",-1),e.tokens.push(l)}l=new e.Token("footnote_block_close","",-1),e.tokens.push(l)}})}},{}]},{},[1])(1)});
;/*! markdown-it-task-lists 2.1.0 https://github.com/revin/markdown-it-task-lists#readme by  @license {ISC} */
!function(n){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=n();else if("function"==typeof define&&define.amd)define([],n);else{var e;e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,e.markdownitTaskLists=n()}}(function(){return function(){function n(e,t,i){function r(c,l){if(!t[c]){if(!e[c]){var f="function"==typeof require&&require;if(!l&&f)return f(c,!0);if(o)return o(c,!0);var u=new Error("Cannot find module '"+c+"'");throw u.code="MODULE_NOT_FOUND",u}var a=t[c]={exports:{}};e[c][0].call(a.exports,function(n){var t=e[c][1][n];return r(t?t:n)},a,a.exports,n,e,t,i)}return t[c].exports}for(var o="function"==typeof require&&require,c=0;c<i.length;c++)r(i[c]);return r}return n}()({1:[function(n,e,t){function i(n,e,t){var i=n.attrIndex(e),r=[e,t];0>i?n.attrPush(r):n.attrs[i]=r}function r(n,e){for(var t=n[e].level-1,i=e-1;i>=0;i--)if(n[i].level===t)return i;return-1}function o(n,e){return s(n[e])&&d(n[e-1])&&h(n[e-2])&&p(n[e])}function c(n,e){if(n.children.unshift(l(n,e)),n.children[1].content=n.children[1].content.slice(3),n.content=n.content.slice(3),b)if(v){n.children.pop();var t="task-item-"+Math.ceil(1e7*Math.random()-1e3);n.children[0].content=n.children[0].content.slice(0,-1)+' id="'+t+'">',n.children.push(a(n.content,t,e))}else n.children.unshift(f(e)),n.children.push(u(e))}function l(n,e){var t=new e("html_inline","",0),i=x?' disabled="" ':"";return 0===n.content.indexOf("[ ] ")?t.content='<input class="task-list-item-checkbox"'+i+'type="checkbox">':(0===n.content.indexOf("[x] ")||0===n.content.indexOf("[X] "))&&(t.content='<input class="task-list-item-checkbox" checked=""'+i+'type="checkbox">'),t}function f(n){var e=new n("html_inline","",0);return e.content="<label>",e}function u(n){var e=new n("html_inline","",0);return e.content="</label>",e}function a(n,e,t){var i=new t("html_inline","",0);return i.content='<label class="task-list-item-label" for="'+e+'">'+n+"</label>",i.attrs=[{"for":e}],i}function s(n){return"inline"===n.type}function d(n){return"paragraph_open"===n.type}function h(n){return"list_item_open"===n.type}function p(n){return 0===n.content.indexOf("[ ] ")||0===n.content.indexOf("[x] ")||0===n.content.indexOf("[X] ")}var x=!0,b=!1,v=!1;e.exports=function(n,e){e&&(x=!e.enabled,b=!!e.label,v=!!e.labelAfter),n.core.ruler.after("inline","github-task-lists",function(n){for(var e=n.tokens,t=2;t<e.length;t++)o(e,t)&&(c(e[t],n.Token),i(e[t-2],"class","task-list-item"+(x?"":" enabled")),i(e[r(e,t-2)],"class","contains-task-list"))})}},{}]},{},[1])(1)});
;!function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define([],e):"object"==typeof exports?exports.katex=e():t.katex=e()}("undefined"!=typeof self?self:this,function(){return function(t){var e={};function r(a){if(e[a])return e[a].exports;var n=e[a]={i:a,l:!1,exports:{}};return t[a].call(n.exports,n,n.exports,r),n.l=!0,n.exports}return r.m=t,r.c=e,r.d=function(t,e,a){r.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:a})},r.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},r.t=function(t,e){if(1&e&&(t=r(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var a=Object.create(null);if(r.r(a),Object.defineProperty(a,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var n in t)r.d(a,n,function(e){return t[e]}.bind(null,n));return a},r.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return r.d(e,"a",e),e},r.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},r.p="",r(r.s=1)}([function(t,e,r){},function(t,e,r){"use strict";r.r(e);r(0);var a=function(){function t(t,e,r){this.lexer=void 0,this.start=void 0,this.end=void 0,this.lexer=t,this.start=e,this.end=r}return t.range=function(e,r){return r?e&&e.loc&&r.loc&&e.loc.lexer===r.loc.lexer?new t(e.loc.lexer,e.loc.start,r.loc.end):null:e&&e.loc},t}(),n=function(){function t(t,e){this.text=void 0,this.loc=void 0,this.text=t,this.loc=e}return t.prototype.range=function(e,r){return new t(r,a.range(this,e))},t}(),i=function t(e,r){this.position=void 0;var a,n="KaTeX parse error: "+e,i=r&&r.loc;if(i&&i.start<=i.end){var o=i.lexer.input;a=i.start;var s=i.end;a===o.length?n+=" at end of input: ":n+=" at position "+(a+1)+": ";var h=o.slice(a,s).replace(/[^]/g,"$&\u0332");n+=(a>15?"\u2026"+o.slice(a-15,a):o.slice(0,a))+h+(s+15<o.length?o.slice(s,s+15)+"\u2026":o.slice(s))}var l=new Error(n);return l.name="ParseError",l.__proto__=t.prototype,l.position=a,l};i.prototype.__proto__=Error.prototype;var o=i,s=/([A-Z])/g,h={"&":"&amp;",">":"&gt;","<":"&lt;",'"':"&quot;","'":"&#x27;"},l=/[&><"']/g;var m=function t(e){return"ordgroup"===e.type?1===e.body.length?t(e.body[0]):e:"color"===e.type?1===e.body.length?t(e.body[0]):e:"font"===e.type?t(e.body):e},c={contains:function(t,e){return-1!==t.indexOf(e)},deflt:function(t,e){return void 0===t?e:t},escape:function(t){return String(t).replace(l,function(t){return h[t]})},hyphenate:function(t){return t.replace(s,"-$1").toLowerCase()},getBaseElem:m,isCharacterBox:function(t){var e=m(t);return"mathord"===e.type||"textord"===e.type||"atom"===e.type},protocolFromUrl:function(t){var e=/^\s*([^\\\/#]*?)(?::|&#0*58|&#x0*3a)/i.exec(t);return null!=e?e[1]:"_relative"}},u=function(){function t(t){this.displayMode=void 0,this.output=void 0,this.leqno=void 0,this.fleqn=void 0,this.throwOnError=void 0,this.errorColor=void 0,this.macros=void 0,this.minRuleThickness=void 0,this.colorIsTextColor=void 0,this.strict=void 0,this.trust=void 0,this.maxSize=void 0,this.maxExpand=void 0,t=t||{},this.displayMode=c.deflt(t.displayMode,!1),this.output=c.deflt(t.output,"htmlAndMathml"),this.leqno=c.deflt(t.leqno,!1),this.fleqn=c.deflt(t.fleqn,!1),this.throwOnError=c.deflt(t.throwOnError,!0),this.errorColor=c.deflt(t.errorColor,"#cc0000"),this.macros=t.macros||{},this.minRuleThickness=Math.max(0,c.deflt(t.minRuleThickness,0)),this.colorIsTextColor=c.deflt(t.colorIsTextColor,!1),this.strict=c.deflt(t.strict,"warn"),this.trust=c.deflt(t.trust,!1),this.maxSize=Math.max(0,c.deflt(t.maxSize,1/0)),this.maxExpand=Math.max(0,c.deflt(t.maxExpand,1e3))}var e=t.prototype;return e.reportNonstrict=function(t,e,r){var a=this.strict;if("function"==typeof a&&(a=a(t,e,r)),a&&"ignore"!==a){if(!0===a||"error"===a)throw new o("LaTeX-incompatible input and strict mode is set to 'error': "+e+" ["+t+"]",r);"warn"===a?"undefined"!=typeof console&&console.warn("LaTeX-incompatible input and strict mode is set to 'warn': "+e+" ["+t+"]"):"undefined"!=typeof console&&console.warn("LaTeX-incompatible input and strict mode is set to unrecognized '"+a+"': "+e+" ["+t+"]")}},e.useStrictBehavior=function(t,e,r){var a=this.strict;if("function"==typeof a)try{a=a(t,e,r)}catch(t){a="error"}return!(!a||"ignore"===a)&&(!0===a||"error"===a||("warn"===a?("undefined"!=typeof console&&console.warn("LaTeX-incompatible input and strict mode is set to 'warn': "+e+" ["+t+"]"),!1):("undefined"!=typeof console&&console.warn("LaTeX-incompatible input and strict mode is set to unrecognized '"+a+"': "+e+" ["+t+"]"),!1)))},e.isTrusted=function(t){t.url&&!t.protocol&&(t.protocol=c.protocolFromUrl(t.url));var e="function"==typeof this.trust?this.trust(t):this.trust;return Boolean(e)},t}(),p=function(){function t(t,e,r){this.id=void 0,this.size=void 0,this.cramped=void 0,this.id=t,this.size=e,this.cramped=r}var e=t.prototype;return e.sup=function(){return d[f[this.id]]},e.sub=function(){return d[g[this.id]]},e.fracNum=function(){return d[x[this.id]]},e.fracDen=function(){return d[v[this.id]]},e.cramp=function(){return d[b[this.id]]},e.text=function(){return d[y[this.id]]},e.isTight=function(){return this.size>=2},t}(),d=[new p(0,0,!1),new p(1,0,!0),new p(2,1,!1),new p(3,1,!0),new p(4,2,!1),new p(5,2,!0),new p(6,3,!1),new p(7,3,!0)],f=[4,5,4,5,6,7,6,7],g=[5,5,5,5,7,7,7,7],x=[2,3,4,5,6,7,6,7],v=[3,3,5,5,7,7,7,7],b=[1,1,3,3,5,5,7,7],y=[0,1,2,3,2,3,2,3],w={DISPLAY:d[0],TEXT:d[2],SCRIPT:d[4],SCRIPTSCRIPT:d[6]},k=[{name:"latin",blocks:[[256,591],[768,879]]},{name:"cyrillic",blocks:[[1024,1279]]},{name:"brahmic",blocks:[[2304,4255]]},{name:"georgian",blocks:[[4256,4351]]},{name:"cjk",blocks:[[12288,12543],[19968,40879],[65280,65376]]},{name:"hangul",blocks:[[44032,55215]]}];var S=[];function M(t){for(var e=0;e<S.length;e+=2)if(t>=S[e]&&t<=S[e+1])return!0;return!1}k.forEach(function(t){return t.blocks.forEach(function(t){return S.push.apply(S,t)})});var z={doubleleftarrow:"M262 157\nl10-10c34-36 62.7-77 86-123 3.3-8 5-13.3 5-16 0-5.3-6.7-8-20-8-7.3\n 0-12.2.5-14.5 1.5-2.3 1-4.8 4.5-7.5 10.5-49.3 97.3-121.7 169.3-217 216-28\n 14-57.3 25-88 33-6.7 2-11 3.8-13 5.5-2 1.7-3 4.2-3 7.5s1 5.8 3 7.5\nc2 1.7 6.3 3.5 13 5.5 68 17.3 128.2 47.8 180.5 91.5 52.3 43.7 93.8 96.2 124.5\n 157.5 9.3 8 15.3 12.3 18 13h6c12-.7 18-4 18-10 0-2-1.7-7-5-15-23.3-46-52-87\n-86-123l-10-10h399738v-40H218c328 0 0 0 0 0l-10-8c-26.7-20-65.7-43-117-69 2.7\n-2 6-3.7 10-5 36.7-16 72.3-37.3 107-64l10-8h399782v-40z\nm8 0v40h399730v-40zm0 194v40h399730v-40z",doublerightarrow:"M399738 392l\n-10 10c-34 36-62.7 77-86 123-3.3 8-5 13.3-5 16 0 5.3 6.7 8 20 8 7.3 0 12.2-.5\n 14.5-1.5 2.3-1 4.8-4.5 7.5-10.5 49.3-97.3 121.7-169.3 217-216 28-14 57.3-25 88\n-33 6.7-2 11-3.8 13-5.5 2-1.7 3-4.2 3-7.5s-1-5.8-3-7.5c-2-1.7-6.3-3.5-13-5.5-68\n-17.3-128.2-47.8-180.5-91.5-52.3-43.7-93.8-96.2-124.5-157.5-9.3-8-15.3-12.3-18\n-13h-6c-12 .7-18 4-18 10 0 2 1.7 7 5 15 23.3 46 52 87 86 123l10 10H0v40h399782\nc-328 0 0 0 0 0l10 8c26.7 20 65.7 43 117 69-2.7 2-6 3.7-10 5-36.7 16-72.3 37.3\n-107 64l-10 8H0v40zM0 157v40h399730v-40zm0 194v40h399730v-40z",leftarrow:"M400000 241H110l3-3c68.7-52.7 113.7-120\n 135-202 4-14.7 6-23 6-25 0-7.3-7-11-21-11-8 0-13.2.8-15.5 2.5-2.3 1.7-4.2 5.8\n-5.5 12.5-1.3 4.7-2.7 10.3-4 17-12 48.7-34.8 92-68.5 130S65.3 228.3 18 247\nc-10 4-16 7.7-18 11 0 8.7 6 14.3 18 17 47.3 18.7 87.8 47 121.5 85S196 441.3 208\n 490c.7 2 1.3 5 2 9s1.2 6.7 1.5 8c.3 1.3 1 3.3 2 6s2.2 4.5 3.5 5.5c1.3 1 3.3\n 1.8 6 2.5s6 1 10 1c14 0 21-3.7 21-11 0-2-2-10.3-6-25-20-79.3-65-146.7-135-202\n l-3-3h399890zM100 241v40h399900v-40z",leftbrace:"M6 548l-6-6v-35l6-11c56-104 135.3-181.3 238-232 57.3-28.7 117\n-45 179-50h399577v120H403c-43.3 7-81 15-113 26-100.7 33-179.7 91-237 174-2.7\n 5-6 9-10 13-.7 1-7.3 1-20 1H6z",leftbraceunder:"M0 6l6-6h17c12.688 0 19.313.3 20 1 4 4 7.313 8.3 10 13\n 35.313 51.3 80.813 93.8 136.5 127.5 55.688 33.7 117.188 55.8 184.5 66.5.688\n 0 2 .3 4 1 18.688 2.7 76 4.3 172 5h399450v120H429l-6-1c-124.688-8-235-61.7\n-331-161C60.687 138.7 32.312 99.3 7 54L0 41V6z",leftgroup:"M400000 80\nH435C64 80 168.3 229.4 21 260c-5.9 1.2-18 0-18 0-2 0-3-1-3-3v-38C76 61 257 0\n 435 0h399565z",leftgroupunder:"M400000 262\nH435C64 262 168.3 112.6 21 82c-5.9-1.2-18 0-18 0-2 0-3 1-3 3v38c76 158 257 219\n 435 219h399565z",leftharpoon:"M0 267c.7 5.3 3 10 7 14h399993v-40H93c3.3\n-3.3 10.2-9.5 20.5-18.5s17.8-15.8 22.5-20.5c50.7-52 88-110.3 112-175 4-11.3 5\n-18.3 3-21-1.3-4-7.3-6-18-6-8 0-13 .7-15 2s-4.7 6.7-8 16c-42 98.7-107.3 174.7\n-196 228-6.7 4.7-10.7 8-12 10-1.3 2-2 5.7-2 11zm100-26v40h399900v-40z",leftharpoonplus:"M0 267c.7 5.3 3 10 7 14h399993v-40H93c3.3-3.3 10.2-9.5\n 20.5-18.5s17.8-15.8 22.5-20.5c50.7-52 88-110.3 112-175 4-11.3 5-18.3 3-21-1.3\n-4-7.3-6-18-6-8 0-13 .7-15 2s-4.7 6.7-8 16c-42 98.7-107.3 174.7-196 228-6.7 4.7\n-10.7 8-12 10-1.3 2-2 5.7-2 11zm100-26v40h399900v-40zM0 435v40h400000v-40z\nm0 0v40h400000v-40z",leftharpoondown:"M7 241c-4 4-6.333 8.667-7 14 0 5.333.667 9 2 11s5.333\n 5.333 12 10c90.667 54 156 130 196 228 3.333 10.667 6.333 16.333 9 17 2 .667 5\n 1 9 1h5c10.667 0 16.667-2 18-6 2-2.667 1-9.667-3-21-32-87.333-82.667-157.667\n-152-211l-3-3h399907v-40zM93 281 H400000 v-40L7 241z",leftharpoondownplus:"M7 435c-4 4-6.3 8.7-7 14 0 5.3.7 9 2 11s5.3 5.3 12\n 10c90.7 54 156 130 196 228 3.3 10.7 6.3 16.3 9 17 2 .7 5 1 9 1h5c10.7 0 16.7\n-2 18-6 2-2.7 1-9.7-3-21-32-87.3-82.7-157.7-152-211l-3-3h399907v-40H7zm93 0\nv40h399900v-40zM0 241v40h399900v-40zm0 0v40h399900v-40z",lefthook:"M400000 281 H103s-33-11.2-61-33.5S0 197.3 0 164s14.2-61.2 42.5\n-83.5C70.8 58.2 104 47 142 47 c16.7 0 25 6.7 25 20 0 12-8.7 18.7-26 20-40 3.3\n-68.7 15.7-86 37-10 12-15 25.3-15 40 0 22.7 9.8 40.7 29.5 54 19.7 13.3 43.5 21\n 71.5 23h399859zM103 281v-40h399897v40z",leftlinesegment:"M40 281 V428 H0 V94 H40 V241 H400000 v40z\nM40 281 V428 H0 V94 H40 V241 H400000 v40z",leftmapsto:"M40 281 V448H0V74H40V241H400000v40z\nM40 281 V448H0V74H40V241H400000v40z",leftToFrom:"M0 147h400000v40H0zm0 214c68 40 115.7 95.7 143 167h22c15.3 0 23\n-.3 23-1 0-1.3-5.3-13.7-16-37-18-35.3-41.3-69-70-101l-7-8h399905v-40H95l7-8\nc28.7-32 52-65.7 70-101 10.7-23.3 16-35.7 16-37 0-.7-7.7-1-23-1h-22C115.7 265.3\n 68 321 0 361zm0-174v-40h399900v40zm100 154v40h399900v-40z",longequal:"M0 50 h400000 v40H0z m0 194h40000v40H0z\nM0 50 h400000 v40H0z m0 194h40000v40H0z",midbrace:"M200428 334\nc-100.7-8.3-195.3-44-280-108-55.3-42-101.7-93-139-153l-9-14c-2.7 4-5.7 8.7-9 14\n-53.3 86.7-123.7 153-211 199-66.7 36-137.3 56.3-212 62H0V214h199568c178.3-11.7\n 311.7-78.3 403-201 6-8 9.7-12 11-12 .7-.7 6.7-1 18-1s17.3.3 18 1c1.3 0 5 4 11\n 12 44.7 59.3 101.3 106.3 170 141s145.3 54.3 229 60h199572v120z",midbraceunder:"M199572 214\nc100.7 8.3 195.3 44 280 108 55.3 42 101.7 93 139 153l9 14c2.7-4 5.7-8.7 9-14\n 53.3-86.7 123.7-153 211-199 66.7-36 137.3-56.3 212-62h199568v120H200432c-178.3\n 11.7-311.7 78.3-403 201-6 8-9.7 12-11 12-.7.7-6.7 1-18 1s-17.3-.3-18-1c-1.3 0\n-5-4-11-12-44.7-59.3-101.3-106.3-170-141s-145.3-54.3-229-60H0V214z",oiintSize1:"M512.6 71.6c272.6 0 320.3 106.8 320.3 178.2 0 70.8-47.7 177.6\n-320.3 177.6S193.1 320.6 193.1 249.8c0-71.4 46.9-178.2 319.5-178.2z\nm368.1 178.2c0-86.4-60.9-215.4-368.1-215.4-306.4 0-367.3 129-367.3 215.4 0 85.8\n60.9 214.8 367.3 214.8 307.2 0 368.1-129 368.1-214.8z",oiintSize2:"M757.8 100.1c384.7 0 451.1 137.6 451.1 230 0 91.3-66.4 228.8\n-451.1 228.8-386.3 0-452.7-137.5-452.7-228.8 0-92.4 66.4-230 452.7-230z\nm502.4 230c0-111.2-82.4-277.2-502.4-277.2s-504 166-504 277.2\nc0 110 84 276 504 276s502.4-166 502.4-276z",oiiintSize1:"M681.4 71.6c408.9 0 480.5 106.8 480.5 178.2 0 70.8-71.6 177.6\n-480.5 177.6S202.1 320.6 202.1 249.8c0-71.4 70.5-178.2 479.3-178.2z\nm525.8 178.2c0-86.4-86.8-215.4-525.7-215.4-437.9 0-524.7 129-524.7 215.4 0\n85.8 86.8 214.8 524.7 214.8 438.9 0 525.7-129 525.7-214.8z",oiiintSize2:"M1021.2 53c603.6 0 707.8 165.8 707.8 277.2 0 110-104.2 275.8\n-707.8 275.8-606 0-710.2-165.8-710.2-275.8C311 218.8 415.2 53 1021.2 53z\nm770.4 277.1c0-131.2-126.4-327.6-770.5-327.6S248.4 198.9 248.4 330.1\nc0 130 128.8 326.4 772.7 326.4s770.5-196.4 770.5-326.4z",rightarrow:"M0 241v40h399891c-47.3 35.3-84 78-110 128\n-16.7 32-27.7 63.7-33 95 0 1.3-.2 2.7-.5 4-.3 1.3-.5 2.3-.5 3 0 7.3 6.7 11 20\n 11 8 0 13.2-.8 15.5-2.5 2.3-1.7 4.2-5.5 5.5-11.5 2-13.3 5.7-27 11-41 14.7-44.7\n 39-84.5 73-119.5s73.7-60.2 119-75.5c6-2 9-5.7 9-11s-3-9-9-11c-45.3-15.3-85\n-40.5-119-75.5s-58.3-74.8-73-119.5c-4.7-14-8.3-27.3-11-40-1.3-6.7-3.2-10.8-5.5\n-12.5-2.3-1.7-7.5-2.5-15.5-2.5-14 0-21 3.7-21 11 0 2 2 10.3 6 25 20.7 83.3 67\n 151.7 139 205zm0 0v40h399900v-40z",rightbrace:"M400000 542l\n-6 6h-17c-12.7 0-19.3-.3-20-1-4-4-7.3-8.3-10-13-35.3-51.3-80.8-93.8-136.5-127.5\ns-117.2-55.8-184.5-66.5c-.7 0-2-.3-4-1-18.7-2.7-76-4.3-172-5H0V214h399571l6 1\nc124.7 8 235 61.7 331 161 31.3 33.3 59.7 72.7 85 118l7 13v35z",rightbraceunder:"M399994 0l6 6v35l-6 11c-56 104-135.3 181.3-238 232-57.3\n 28.7-117 45-179 50H-300V214h399897c43.3-7 81-15 113-26 100.7-33 179.7-91 237\n-174 2.7-5 6-9 10-13 .7-1 7.3-1 20-1h17z",rightgroup:"M0 80h399565c371 0 266.7 149.4 414 180 5.9 1.2 18 0 18 0 2 0\n 3-1 3-3v-38c-76-158-257-219-435-219H0z",rightgroupunder:"M0 262h399565c371 0 266.7-149.4 414-180 5.9-1.2 18 0 18\n 0 2 0 3 1 3 3v38c-76 158-257 219-435 219H0z",rightharpoon:"M0 241v40h399993c4.7-4.7 7-9.3 7-14 0-9.3\n-3.7-15.3-11-18-92.7-56.7-159-133.7-199-231-3.3-9.3-6-14.7-8-16-2-1.3-7-2-15-2\n-10.7 0-16.7 2-18 6-2 2.7-1 9.7 3 21 15.3 42 36.7 81.8 64 119.5 27.3 37.7 58\n 69.2 92 94.5zm0 0v40h399900v-40z",rightharpoonplus:"M0 241v40h399993c4.7-4.7 7-9.3 7-14 0-9.3-3.7-15.3-11\n-18-92.7-56.7-159-133.7-199-231-3.3-9.3-6-14.7-8-16-2-1.3-7-2-15-2-10.7 0-16.7\n 2-18 6-2 2.7-1 9.7 3 21 15.3 42 36.7 81.8 64 119.5 27.3 37.7 58 69.2 92 94.5z\nm0 0v40h399900v-40z m100 194v40h399900v-40zm0 0v40h399900v-40z",rightharpoondown:"M399747 511c0 7.3 6.7 11 20 11 8 0 13-.8 15-2.5s4.7-6.8\n 8-15.5c40-94 99.3-166.3 178-217 13.3-8 20.3-12.3 21-13 5.3-3.3 8.5-5.8 9.5\n-7.5 1-1.7 1.5-5.2 1.5-10.5s-2.3-10.3-7-15H0v40h399908c-34 25.3-64.7 57-92 95\n-27.3 38-48.7 77.7-64 119-3.3 8.7-5 14-5 16zM0 241v40h399900v-40z",rightharpoondownplus:"M399747 705c0 7.3 6.7 11 20 11 8 0 13-.8\n 15-2.5s4.7-6.8 8-15.5c40-94 99.3-166.3 178-217 13.3-8 20.3-12.3 21-13 5.3-3.3\n 8.5-5.8 9.5-7.5 1-1.7 1.5-5.2 1.5-10.5s-2.3-10.3-7-15H0v40h399908c-34 25.3\n-64.7 57-92 95-27.3 38-48.7 77.7-64 119-3.3 8.7-5 14-5 16zM0 435v40h399900v-40z\nm0-194v40h400000v-40zm0 0v40h400000v-40z",righthook:"M399859 241c-764 0 0 0 0 0 40-3.3 68.7-15.7 86-37 10-12 15-25.3\n 15-40 0-22.7-9.8-40.7-29.5-54-19.7-13.3-43.5-21-71.5-23-17.3-1.3-26-8-26-20 0\n-13.3 8.7-20 26-20 38 0 71 11.2 99 33.5 0 0 7 5.6 21 16.7 14 11.2 21 33.5 21\n 66.8s-14 61.2-42 83.5c-28 22.3-61 33.5-99 33.5L0 241z M0 281v-40h399859v40z",rightlinesegment:"M399960 241 V94 h40 V428 h-40 V281 H0 v-40z\nM399960 241 V94 h40 V428 h-40 V281 H0 v-40z",rightToFrom:"M400000 167c-70.7-42-118-97.7-142-167h-23c-15.3 0-23 .3-23\n 1 0 1.3 5.3 13.7 16 37 18 35.3 41.3 69 70 101l7 8H0v40h399905l-7 8c-28.7 32\n-52 65.7-70 101-10.7 23.3-16 35.7-16 37 0 .7 7.7 1 23 1h23c24-69.3 71.3-125 142\n-167z M100 147v40h399900v-40zM0 341v40h399900v-40z",twoheadleftarrow:"M0 167c68 40\n 115.7 95.7 143 167h22c15.3 0 23-.3 23-1 0-1.3-5.3-13.7-16-37-18-35.3-41.3-69\n-70-101l-7-8h125l9 7c50.7 39.3 85 86 103 140h46c0-4.7-6.3-18.7-19-42-18-35.3\n-40-67.3-66-96l-9-9h399716v-40H284l9-9c26-28.7 48-60.7 66-96 12.7-23.333 19\n-37.333 19-42h-46c-18 54-52.3 100.7-103 140l-9 7H95l7-8c28.7-32 52-65.7 70-101\n 10.7-23.333 16-35.7 16-37 0-.7-7.7-1-23-1h-22C115.7 71.3 68 127 0 167z",twoheadrightarrow:"M400000 167\nc-68-40-115.7-95.7-143-167h-22c-15.3 0-23 .3-23 1 0 1.3 5.3 13.7 16 37 18 35.3\n 41.3 69 70 101l7 8h-125l-9-7c-50.7-39.3-85-86-103-140h-46c0 4.7 6.3 18.7 19 42\n 18 35.3 40 67.3 66 96l9 9H0v40h399716l-9 9c-26 28.7-48 60.7-66 96-12.7 23.333\n-19 37.333-19 42h46c18-54 52.3-100.7 103-140l9-7h125l-7 8c-28.7 32-52 65.7-70\n 101-10.7 23.333-16 35.7-16 37 0 .7 7.7 1 23 1h22c27.3-71.3 75-127 143-167z",tilde1:"M200 55.538c-77 0-168 73.953-177 73.953-3 0-7\n-2.175-9-5.437L2 97c-1-2-2-4-2-6 0-4 2-7 5-9l20-12C116 12 171 0 207 0c86 0\n 114 68 191 68 78 0 168-68 177-68 4 0 7 2 9 5l12 19c1 2.175 2 4.35 2 6.525 0\n 4.35-2 7.613-5 9.788l-19 13.05c-92 63.077-116.937 75.308-183 76.128\n-68.267.847-113-73.952-191-73.952z",tilde2:"M344 55.266c-142 0-300.638 81.316-311.5 86.418\n-8.01 3.762-22.5 10.91-23.5 5.562L1 120c-1-2-1-3-1-4 0-5 3-9 8-10l18.4-9C160.9\n 31.9 283 0 358 0c148 0 188 122 331 122s314-97 326-97c4 0 8 2 10 7l7 21.114\nc1 2.14 1 3.21 1 4.28 0 5.347-3 9.626-7 10.696l-22.3 12.622C852.6 158.372 751\n 181.476 676 181.476c-149 0-189-126.21-332-126.21z",tilde3:"M786 59C457 59 32 175.242 13 175.242c-6 0-10-3.457\n-11-10.37L.15 138c-1-7 3-12 10-13l19.2-6.4C378.4 40.7 634.3 0 804.3 0c337 0\n 411.8 157 746.8 157 328 0 754-112 773-112 5 0 10 3 11 9l1 14.075c1 8.066-.697\n 16.595-6.697 17.492l-21.052 7.31c-367.9 98.146-609.15 122.696-778.15 122.696\n -338 0-409-156.573-744-156.573z",tilde4:"M786 58C457 58 32 177.487 13 177.487c-6 0-10-3.345\n-11-10.035L.15 143c-1-7 3-12 10-13l22-6.7C381.2 35 637.15 0 807.15 0c337 0 409\n 177 744 177 328 0 754-127 773-127 5 0 10 3 11 9l1 14.794c1 7.805-3 13.38-9\n 14.495l-20.7 5.574c-366.85 99.79-607.3 139.372-776.3 139.372-338 0-409\n -175.236-744-175.236z",vec:"M377 20c0-5.333 1.833-10 5.5-14S391 0 397 0c4.667 0 8.667 1.667 12 5\n3.333 2.667 6.667 9 10 19 6.667 24.667 20.333 43.667 41 57 7.333 4.667 11\n10.667 11 18 0 6-1 10-3 12s-6.667 5-14 9c-28.667 14.667-53.667 35.667-75 63\n-1.333 1.333-3.167 3.5-5.5 6.5s-4 4.833-5 5.5c-1 .667-2.5 1.333-4.5 2s-4.333 1\n-7 1c-4.667 0-9.167-1.833-13.5-5.5S337 184 337 178c0-12.667 15.667-32.333 47-59\nH213l-171-1c-8.667-6-13-12.333-13-19 0-4.667 4.333-11.333 13-20h359\nc-16-25.333-24-45-24-59z",widehat1:"M529 0h5l519 115c5 1 9 5 9 10 0 1-1 2-1 3l-4 22\nc-1 5-5 9-11 9h-2L532 67 19 159h-2c-5 0-9-4-11-9l-5-22c-1-6 2-12 8-13z",widehat2:"M1181 0h2l1171 176c6 0 10 5 10 11l-2 23c-1 6-5 10\n-11 10h-1L1182 67 15 220h-1c-6 0-10-4-11-10l-2-23c-1-6 4-11 10-11z",widehat3:"M1181 0h2l1171 236c6 0 10 5 10 11l-2 23c-1 6-5 10\n-11 10h-1L1182 67 15 280h-1c-6 0-10-4-11-10l-2-23c-1-6 4-11 10-11z",widehat4:"M1181 0h2l1171 296c6 0 10 5 10 11l-2 23c-1 6-5 10\n-11 10h-1L1182 67 15 340h-1c-6 0-10-4-11-10l-2-23c-1-6 4-11 10-11z",widecheck1:"M529,159h5l519,-115c5,-1,9,-5,9,-10c0,-1,-1,-2,-1,-3l-4,-22c-1,\n-5,-5,-9,-11,-9h-2l-512,92l-513,-92h-2c-5,0,-9,4,-11,9l-5,22c-1,6,2,12,8,13z",widecheck2:"M1181,220h2l1171,-176c6,0,10,-5,10,-11l-2,-23c-1,-6,-5,-10,\n-11,-10h-1l-1168,153l-1167,-153h-1c-6,0,-10,4,-11,10l-2,23c-1,6,4,11,10,11z",widecheck3:"M1181,280h2l1171,-236c6,0,10,-5,10,-11l-2,-23c-1,-6,-5,-10,\n-11,-10h-1l-1168,213l-1167,-213h-1c-6,0,-10,4,-11,10l-2,23c-1,6,4,11,10,11z",widecheck4:"M1181,340h2l1171,-296c6,0,10,-5,10,-11l-2,-23c-1,-6,-5,-10,\n-11,-10h-1l-1168,273l-1167,-273h-1c-6,0,-10,4,-11,10l-2,23c-1,6,4,11,10,11z",baraboveleftarrow:"M400000 620h-399890l3 -3c68.7 -52.7 113.7 -120 135 -202\nc4 -14.7 6 -23 6 -25c0 -7.3 -7 -11 -21 -11c-8 0 -13.2 0.8 -15.5 2.5\nc-2.3 1.7 -4.2 5.8 -5.5 12.5c-1.3 4.7 -2.7 10.3 -4 17c-12 48.7 -34.8 92 -68.5 130\ns-74.2 66.3 -121.5 85c-10 4 -16 7.7 -18 11c0 8.7 6 14.3 18 17c47.3 18.7 87.8 47\n121.5 85s56.5 81.3 68.5 130c0.7 2 1.3 5 2 9s1.2 6.7 1.5 8c0.3 1.3 1 3.3 2 6\ns2.2 4.5 3.5 5.5c1.3 1 3.3 1.8 6 2.5s6 1 10 1c14 0 21 -3.7 21 -11\nc0 -2 -2 -10.3 -6 -25c-20 -79.3 -65 -146.7 -135 -202l-3 -3h399890z\nM100 620v40h399900v-40z M0 241v40h399900v-40zM0 241v40h399900v-40z",rightarrowabovebar:"M0 241v40h399891c-47.3 35.3-84 78-110 128-16.7 32\n-27.7 63.7-33 95 0 1.3-.2 2.7-.5 4-.3 1.3-.5 2.3-.5 3 0 7.3 6.7 11 20 11 8 0\n13.2-.8 15.5-2.5 2.3-1.7 4.2-5.5 5.5-11.5 2-13.3 5.7-27 11-41 14.7-44.7 39\n-84.5 73-119.5s73.7-60.2 119-75.5c6-2 9-5.7 9-11s-3-9-9-11c-45.3-15.3-85-40.5\n-119-75.5s-58.3-74.8-73-119.5c-4.7-14-8.3-27.3-11-40-1.3-6.7-3.2-10.8-5.5\n-12.5-2.3-1.7-7.5-2.5-15.5-2.5-14 0-21 3.7-21 11 0 2 2 10.3 6 25 20.7 83.3 67\n151.7 139 205zm96 379h399894v40H0zm0 0h399904v40H0z",baraboveshortleftharpoon:"M507,435c-4,4,-6.3,8.7,-7,14c0,5.3,0.7,9,2,11\nc1.3,2,5.3,5.3,12,10c90.7,54,156,130,196,228c3.3,10.7,6.3,16.3,9,17\nc2,0.7,5,1,9,1c0,0,5,0,5,0c10.7,0,16.7,-2,18,-6c2,-2.7,1,-9.7,-3,-21\nc-32,-87.3,-82.7,-157.7,-152,-211c0,0,-3,-3,-3,-3l399351,0l0,-40\nc-398570,0,-399437,0,-399437,0z M593 435 v40 H399500 v-40z\nM0 281 v-40 H399908 v40z M0 281 v-40 H399908 v40z",rightharpoonaboveshortbar:"M0,241 l0,40c399126,0,399993,0,399993,0\nc4.7,-4.7,7,-9.3,7,-14c0,-9.3,-3.7,-15.3,-11,-18c-92.7,-56.7,-159,-133.7,-199,\n-231c-3.3,-9.3,-6,-14.7,-8,-16c-2,-1.3,-7,-2,-15,-2c-10.7,0,-16.7,2,-18,6\nc-2,2.7,-1,9.7,3,21c15.3,42,36.7,81.8,64,119.5c27.3,37.7,58,69.2,92,94.5z\nM0 241 v40 H399908 v-40z M0 475 v-40 H399500 v40z M0 475 v-40 H399500 v40z",shortbaraboveleftharpoon:"M7,435c-4,4,-6.3,8.7,-7,14c0,5.3,0.7,9,2,11\nc1.3,2,5.3,5.3,12,10c90.7,54,156,130,196,228c3.3,10.7,6.3,16.3,9,17c2,0.7,5,1,9,\n1c0,0,5,0,5,0c10.7,0,16.7,-2,18,-6c2,-2.7,1,-9.7,-3,-21c-32,-87.3,-82.7,-157.7,\n-152,-211c0,0,-3,-3,-3,-3l399907,0l0,-40c-399126,0,-399993,0,-399993,0z\nM93 435 v40 H400000 v-40z M500 241 v40 H400000 v-40z M500 241 v40 H400000 v-40z",shortrightharpoonabovebar:"M53,241l0,40c398570,0,399437,0,399437,0\nc4.7,-4.7,7,-9.3,7,-14c0,-9.3,-3.7,-15.3,-11,-18c-92.7,-56.7,-159,-133.7,-199,\n-231c-3.3,-9.3,-6,-14.7,-8,-16c-2,-1.3,-7,-2,-15,-2c-10.7,0,-16.7,2,-18,6\nc-2,2.7,-1,9.7,3,21c15.3,42,36.7,81.8,64,119.5c27.3,37.7,58,69.2,92,94.5z\nM500 241 v40 H399408 v-40z M500 435 v40 H400000 v-40z"},A=function(){function t(t){this.children=void 0,this.classes=void 0,this.height=void 0,this.depth=void 0,this.maxFontSize=void 0,this.style=void 0,this.children=t,this.classes=[],this.height=0,this.depth=0,this.maxFontSize=0,this.style={}}var e=t.prototype;return e.hasClass=function(t){return c.contains(this.classes,t)},e.toNode=function(){for(var t=document.createDocumentFragment(),e=0;e<this.children.length;e++)t.appendChild(this.children[e].toNode());return t},e.toMarkup=function(){for(var t="",e=0;e<this.children.length;e++)t+=this.children[e].toMarkup();return t},e.toText=function(){var t=function(t){return t.toText()};return this.children.map(t).join("")},t}(),T=function(t){return t.filter(function(t){return t}).join(" ")},B=function(t,e,r){if(this.classes=t||[],this.attributes={},this.height=0,this.depth=0,this.maxFontSize=0,this.style=r||{},e){e.style.isTight()&&this.classes.push("mtight");var a=e.getColor();a&&(this.style.color=a)}},C=function(t){var e=document.createElement(t);for(var r in e.className=T(this.classes),this.style)this.style.hasOwnProperty(r)&&(e.style[r]=this.style[r]);for(var a in this.attributes)this.attributes.hasOwnProperty(a)&&e.setAttribute(a,this.attributes[a]);for(var n=0;n<this.children.length;n++)e.appendChild(this.children[n].toNode());return e},q=function(t){var e="<"+t;this.classes.length&&(e+=' class="'+c.escape(T(this.classes))+'"');var r="";for(var a in this.style)this.style.hasOwnProperty(a)&&(r+=c.hyphenate(a)+":"+this.style[a]+";");for(var n in r&&(e+=' style="'+c.escape(r)+'"'),this.attributes)this.attributes.hasOwnProperty(n)&&(e+=" "+n+'="'+c.escape(this.attributes[n])+'"');e+=">";for(var i=0;i<this.children.length;i++)e+=this.children[i].toMarkup();return e+="</"+t+">"},N=function(){function t(t,e,r,a){this.children=void 0,this.attributes=void 0,this.classes=void 0,this.height=void 0,this.depth=void 0,this.width=void 0,this.maxFontSize=void 0,this.style=void 0,B.call(this,t,r,a),this.children=e||[]}var e=t.prototype;return e.setAttribute=function(t,e){this.attributes[t]=e},e.hasClass=function(t){return c.contains(this.classes,t)},e.toNode=function(){return C.call(this,"span")},e.toMarkup=function(){return q.call(this,"span")},t}(),I=function(){function t(t,e,r,a){this.children=void 0,this.attributes=void 0,this.classes=void 0,this.height=void 0,this.depth=void 0,this.maxFontSize=void 0,this.style=void 0,B.call(this,e,a),this.children=r||[],this.setAttribute("href",t)}var e=t.prototype;return e.setAttribute=function(t,e){this.attributes[t]=e},e.hasClass=function(t){return c.contains(this.classes,t)},e.toNode=function(){return C.call(this,"a")},e.toMarkup=function(){return q.call(this,"a")},t}(),R=function(){function t(t,e,r){this.src=void 0,this.alt=void 0,this.classes=void 0,this.height=void 0,this.depth=void 0,this.maxFontSize=void 0,this.style=void 0,this.alt=e,this.src=t,this.classes=["mord"],this.style=r}var e=t.prototype;return e.hasClass=function(t){return c.contains(this.classes,t)},e.toNode=function(){var t=document.createElement("img");for(var e in t.src=this.src,t.alt=this.alt,t.className="mord",this.style)this.style.hasOwnProperty(e)&&(t.style[e]=this.style[e]);return t},e.toMarkup=function(){var t="<img  src='"+this.src+" 'alt='"+this.alt+"' ",e="";for(var r in this.style)this.style.hasOwnProperty(r)&&(e+=c.hyphenate(r)+":"+this.style[r]+";");return e&&(t+=' style="'+c.escape(e)+'"'),t+="'/>"},t}(),O={"\xee":"\u0131\u0302","\xef":"\u0131\u0308","\xed":"\u0131\u0301","\xec":"\u0131\u0300"},E=function(){function t(t,e,r,a,n,i,o,s){this.text=void 0,this.height=void 0,this.depth=void 0,this.italic=void 0,this.skew=void 0,this.width=void 0,this.maxFontSize=void 0,this.classes=void 0,this.style=void 0,this.text=t,this.height=e||0,this.depth=r||0,this.italic=a||0,this.skew=n||0,this.width=i||0,this.classes=o||[],this.style=s||{},this.maxFontSize=0;var h=function(t){for(var e=0;e<k.length;e++)for(var r=k[e],a=0;a<r.blocks.length;a++){var n=r.blocks[a];if(t>=n[0]&&t<=n[1])return r.name}return null}(this.text.charCodeAt(0));h&&this.classes.push(h+"_fallback"),/[\xee\xef\xed\xec]/.test(this.text)&&(this.text=O[this.text])}var e=t.prototype;return e.hasClass=function(t){return c.contains(this.classes,t)},e.toNode=function(){var t=document.createTextNode(this.text),e=null;for(var r in this.italic>0&&((e=document.createElement("span")).style.marginRight=this.italic+"em"),this.classes.length>0&&((e=e||document.createElement("span")).className=T(this.classes)),this.style)this.style.hasOwnProperty(r)&&((e=e||document.createElement("span")).style[r]=this.style[r]);return e?(e.appendChild(t),e):t},e.toMarkup=function(){var t=!1,e="<span";this.classes.length&&(t=!0,e+=' class="',e+=c.escape(T(this.classes)),e+='"');var r="";for(var a in this.italic>0&&(r+="margin-right:"+this.italic+"em;"),this.style)this.style.hasOwnProperty(a)&&(r+=c.hyphenate(a)+":"+this.style[a]+";");r&&(t=!0,e+=' style="'+c.escape(r)+'"');var n=c.escape(this.text);return t?(e+=">",e+=n,e+="</span>"):n},t}(),L=function(){function t(t,e){this.children=void 0,this.attributes=void 0,this.children=t||[],this.attributes=e||{}}var e=t.prototype;return e.toNode=function(){var t=document.createElementNS("http://www.w3.org/2000/svg","svg");for(var e in this.attributes)Object.prototype.hasOwnProperty.call(this.attributes,e)&&t.setAttribute(e,this.attributes[e]);for(var r=0;r<this.children.length;r++)t.appendChild(this.children[r].toNode());return t},e.toMarkup=function(){var t="<svg";for(var e in this.attributes)Object.prototype.hasOwnProperty.call(this.attributes,e)&&(t+=" "+e+"='"+this.attributes[e]+"'");t+=">";for(var r=0;r<this.children.length;r++)t+=this.children[r].toMarkup();return t+="</svg>"},t}(),H=function(){function t(t,e){this.pathName=void 0,this.alternate=void 0,this.pathName=t,this.alternate=e}var e=t.prototype;return e.toNode=function(){var t=document.createElementNS("http://www.w3.org/2000/svg","path");return this.alternate?t.setAttribute("d",this.alternate):t.setAttribute("d",z[this.pathName]),t},e.toMarkup=function(){return this.alternate?"<path d='"+this.alternate+"'/>":"<path d='"+z[this.pathName]+"'/>"},t}(),P=function(){function t(t){this.attributes=void 0,this.attributes=t||{}}var e=t.prototype;return e.toNode=function(){var t=document.createElementNS("http://www.w3.org/2000/svg","line");for(var e in this.attributes)Object.prototype.hasOwnProperty.call(this.attributes,e)&&t.setAttribute(e,this.attributes[e]);return t},e.toMarkup=function(){var t="<line";for(var e in this.attributes)Object.prototype.hasOwnProperty.call(this.attributes,e)&&(t+=" "+e+"='"+this.attributes[e]+"'");return t+="/>"},t}();function D(t){if(t instanceof E)return t;throw new Error("Expected symbolNode but got "+String(t)+".")}var F={"AMS-Regular":{65:[0,.68889,0,0,.72222],66:[0,.68889,0,0,.66667],67:[0,.68889,0,0,.72222],68:[0,.68889,0,0,.72222],69:[0,.68889,0,0,.66667],70:[0,.68889,0,0,.61111],71:[0,.68889,0,0,.77778],72:[0,.68889,0,0,.77778],73:[0,.68889,0,0,.38889],74:[.16667,.68889,0,0,.5],75:[0,.68889,0,0,.77778],76:[0,.68889,0,0,.66667],77:[0,.68889,0,0,.94445],78:[0,.68889,0,0,.72222],79:[.16667,.68889,0,0,.77778],80:[0,.68889,0,0,.61111],81:[.16667,.68889,0,0,.77778],82:[0,.68889,0,0,.72222],83:[0,.68889,0,0,.55556],84:[0,.68889,0,0,.66667],85:[0,.68889,0,0,.72222],86:[0,.68889,0,0,.72222],87:[0,.68889,0,0,1],88:[0,.68889,0,0,.72222],89:[0,.68889,0,0,.72222],90:[0,.68889,0,0,.66667],107:[0,.68889,0,0,.55556],165:[0,.675,.025,0,.75],174:[.15559,.69224,0,0,.94666],240:[0,.68889,0,0,.55556],295:[0,.68889,0,0,.54028],710:[0,.825,0,0,2.33334],732:[0,.9,0,0,2.33334],770:[0,.825,0,0,2.33334],771:[0,.9,0,0,2.33334],989:[.08167,.58167,0,0,.77778],1008:[0,.43056,.04028,0,.66667],8245:[0,.54986,0,0,.275],8463:[0,.68889,0,0,.54028],8487:[0,.68889,0,0,.72222],8498:[0,.68889,0,0,.55556],8502:[0,.68889,0,0,.66667],8503:[0,.68889,0,0,.44445],8504:[0,.68889,0,0,.66667],8513:[0,.68889,0,0,.63889],8592:[-.03598,.46402,0,0,.5],8594:[-.03598,.46402,0,0,.5],8602:[-.13313,.36687,0,0,1],8603:[-.13313,.36687,0,0,1],8606:[.01354,.52239,0,0,1],8608:[.01354,.52239,0,0,1],8610:[.01354,.52239,0,0,1.11111],8611:[.01354,.52239,0,0,1.11111],8619:[0,.54986,0,0,1],8620:[0,.54986,0,0,1],8621:[-.13313,.37788,0,0,1.38889],8622:[-.13313,.36687,0,0,1],8624:[0,.69224,0,0,.5],8625:[0,.69224,0,0,.5],8630:[0,.43056,0,0,1],8631:[0,.43056,0,0,1],8634:[.08198,.58198,0,0,.77778],8635:[.08198,.58198,0,0,.77778],8638:[.19444,.69224,0,0,.41667],8639:[.19444,.69224,0,0,.41667],8642:[.19444,.69224,0,0,.41667],8643:[.19444,.69224,0,0,.41667],8644:[.1808,.675,0,0,1],8646:[.1808,.675,0,0,1],8647:[.1808,.675,0,0,1],8648:[.19444,.69224,0,0,.83334],8649:[.1808,.675,0,0,1],8650:[.19444,.69224,0,0,.83334],8651:[.01354,.52239,0,0,1],8652:[.01354,.52239,0,0,1],8653:[-.13313,.36687,0,0,1],8654:[-.13313,.36687,0,0,1],8655:[-.13313,.36687,0,0,1],8666:[.13667,.63667,0,0,1],8667:[.13667,.63667,0,0,1],8669:[-.13313,.37788,0,0,1],8672:[-.064,.437,0,0,1.334],8674:[-.064,.437,0,0,1.334],8705:[0,.825,0,0,.5],8708:[0,.68889,0,0,.55556],8709:[.08167,.58167,0,0,.77778],8717:[0,.43056,0,0,.42917],8722:[-.03598,.46402,0,0,.5],8724:[.08198,.69224,0,0,.77778],8726:[.08167,.58167,0,0,.77778],8733:[0,.69224,0,0,.77778],8736:[0,.69224,0,0,.72222],8737:[0,.69224,0,0,.72222],8738:[.03517,.52239,0,0,.72222],8739:[.08167,.58167,0,0,.22222],8740:[.25142,.74111,0,0,.27778],8741:[.08167,.58167,0,0,.38889],8742:[.25142,.74111,0,0,.5],8756:[0,.69224,0,0,.66667],8757:[0,.69224,0,0,.66667],8764:[-.13313,.36687,0,0,.77778],8765:[-.13313,.37788,0,0,.77778],8769:[-.13313,.36687,0,0,.77778],8770:[-.03625,.46375,0,0,.77778],8774:[.30274,.79383,0,0,.77778],8776:[-.01688,.48312,0,0,.77778],8778:[.08167,.58167,0,0,.77778],8782:[.06062,.54986,0,0,.77778],8783:[.06062,.54986,0,0,.77778],8785:[.08198,.58198,0,0,.77778],8786:[.08198,.58198,0,0,.77778],8787:[.08198,.58198,0,0,.77778],8790:[0,.69224,0,0,.77778],8791:[.22958,.72958,0,0,.77778],8796:[.08198,.91667,0,0,.77778],8806:[.25583,.75583,0,0,.77778],8807:[.25583,.75583,0,0,.77778],8808:[.25142,.75726,0,0,.77778],8809:[.25142,.75726,0,0,.77778],8812:[.25583,.75583,0,0,.5],8814:[.20576,.70576,0,0,.77778],8815:[.20576,.70576,0,0,.77778],8816:[.30274,.79383,0,0,.77778],8817:[.30274,.79383,0,0,.77778],8818:[.22958,.72958,0,0,.77778],8819:[.22958,.72958,0,0,.77778],8822:[.1808,.675,0,0,.77778],8823:[.1808,.675,0,0,.77778],8828:[.13667,.63667,0,0,.77778],8829:[.13667,.63667,0,0,.77778],8830:[.22958,.72958,0,0,.77778],8831:[.22958,.72958,0,0,.77778],8832:[.20576,.70576,0,0,.77778],8833:[.20576,.70576,0,0,.77778],8840:[.30274,.79383,0,0,.77778],8841:[.30274,.79383,0,0,.77778],8842:[.13597,.63597,0,0,.77778],8843:[.13597,.63597,0,0,.77778],8847:[.03517,.54986,0,0,.77778],8848:[.03517,.54986,0,0,.77778],8858:[.08198,.58198,0,0,.77778],8859:[.08198,.58198,0,0,.77778],8861:[.08198,.58198,0,0,.77778],8862:[0,.675,0,0,.77778],8863:[0,.675,0,0,.77778],8864:[0,.675,0,0,.77778],8865:[0,.675,0,0,.77778],8872:[0,.69224,0,0,.61111],8873:[0,.69224,0,0,.72222],8874:[0,.69224,0,0,.88889],8876:[0,.68889,0,0,.61111],8877:[0,.68889,0,0,.61111],8878:[0,.68889,0,0,.72222],8879:[0,.68889,0,0,.72222],8882:[.03517,.54986,0,0,.77778],8883:[.03517,.54986,0,0,.77778],8884:[.13667,.63667,0,0,.77778],8885:[.13667,.63667,0,0,.77778],8888:[0,.54986,0,0,1.11111],8890:[.19444,.43056,0,0,.55556],8891:[.19444,.69224,0,0,.61111],8892:[.19444,.69224,0,0,.61111],8901:[0,.54986,0,0,.27778],8903:[.08167,.58167,0,0,.77778],8905:[.08167,.58167,0,0,.77778],8906:[.08167,.58167,0,0,.77778],8907:[0,.69224,0,0,.77778],8908:[0,.69224,0,0,.77778],8909:[-.03598,.46402,0,0,.77778],8910:[0,.54986,0,0,.76042],8911:[0,.54986,0,0,.76042],8912:[.03517,.54986,0,0,.77778],8913:[.03517,.54986,0,0,.77778],8914:[0,.54986,0,0,.66667],8915:[0,.54986,0,0,.66667],8916:[0,.69224,0,0,.66667],8918:[.0391,.5391,0,0,.77778],8919:[.0391,.5391,0,0,.77778],8920:[.03517,.54986,0,0,1.33334],8921:[.03517,.54986,0,0,1.33334],8922:[.38569,.88569,0,0,.77778],8923:[.38569,.88569,0,0,.77778],8926:[.13667,.63667,0,0,.77778],8927:[.13667,.63667,0,0,.77778],8928:[.30274,.79383,0,0,.77778],8929:[.30274,.79383,0,0,.77778],8934:[.23222,.74111,0,0,.77778],8935:[.23222,.74111,0,0,.77778],8936:[.23222,.74111,0,0,.77778],8937:[.23222,.74111,0,0,.77778],8938:[.20576,.70576,0,0,.77778],8939:[.20576,.70576,0,0,.77778],8940:[.30274,.79383,0,0,.77778],8941:[.30274,.79383,0,0,.77778],8994:[.19444,.69224,0,0,.77778],8995:[.19444,.69224,0,0,.77778],9416:[.15559,.69224,0,0,.90222],9484:[0,.69224,0,0,.5],9488:[0,.69224,0,0,.5],9492:[0,.37788,0,0,.5],9496:[0,.37788,0,0,.5],9585:[.19444,.68889,0,0,.88889],9586:[.19444,.74111,0,0,.88889],9632:[0,.675,0,0,.77778],9633:[0,.675,0,0,.77778],9650:[0,.54986,0,0,.72222],9651:[0,.54986,0,0,.72222],9654:[.03517,.54986,0,0,.77778],9660:[0,.54986,0,0,.72222],9661:[0,.54986,0,0,.72222],9664:[.03517,.54986,0,0,.77778],9674:[.11111,.69224,0,0,.66667],9733:[.19444,.69224,0,0,.94445],10003:[0,.69224,0,0,.83334],10016:[0,.69224,0,0,.83334],10731:[.11111,.69224,0,0,.66667],10846:[.19444,.75583,0,0,.61111],10877:[.13667,.63667,0,0,.77778],10878:[.13667,.63667,0,0,.77778],10885:[.25583,.75583,0,0,.77778],10886:[.25583,.75583,0,0,.77778],10887:[.13597,.63597,0,0,.77778],10888:[.13597,.63597,0,0,.77778],10889:[.26167,.75726,0,0,.77778],10890:[.26167,.75726,0,0,.77778],10891:[.48256,.98256,0,0,.77778],10892:[.48256,.98256,0,0,.77778],10901:[.13667,.63667,0,0,.77778],10902:[.13667,.63667,0,0,.77778],10933:[.25142,.75726,0,0,.77778],10934:[.25142,.75726,0,0,.77778],10935:[.26167,.75726,0,0,.77778],10936:[.26167,.75726,0,0,.77778],10937:[.26167,.75726,0,0,.77778],10938:[.26167,.75726,0,0,.77778],10949:[.25583,.75583,0,0,.77778],10950:[.25583,.75583,0,0,.77778],10955:[.28481,.79383,0,0,.77778],10956:[.28481,.79383,0,0,.77778],57350:[.08167,.58167,0,0,.22222],57351:[.08167,.58167,0,0,.38889],57352:[.08167,.58167,0,0,.77778],57353:[0,.43056,.04028,0,.66667],57356:[.25142,.75726,0,0,.77778],57357:[.25142,.75726,0,0,.77778],57358:[.41951,.91951,0,0,.77778],57359:[.30274,.79383,0,0,.77778],57360:[.30274,.79383,0,0,.77778],57361:[.41951,.91951,0,0,.77778],57366:[.25142,.75726,0,0,.77778],57367:[.25142,.75726,0,0,.77778],57368:[.25142,.75726,0,0,.77778],57369:[.25142,.75726,0,0,.77778],57370:[.13597,.63597,0,0,.77778],57371:[.13597,.63597,0,0,.77778]},"Caligraphic-Regular":{48:[0,.43056,0,0,.5],49:[0,.43056,0,0,.5],50:[0,.43056,0,0,.5],51:[.19444,.43056,0,0,.5],52:[.19444,.43056,0,0,.5],53:[.19444,.43056,0,0,.5],54:[0,.64444,0,0,.5],55:[.19444,.43056,0,0,.5],56:[0,.64444,0,0,.5],57:[.19444,.43056,0,0,.5],65:[0,.68333,0,.19445,.79847],66:[0,.68333,.03041,.13889,.65681],67:[0,.68333,.05834,.13889,.52653],68:[0,.68333,.02778,.08334,.77139],69:[0,.68333,.08944,.11111,.52778],70:[0,.68333,.09931,.11111,.71875],71:[.09722,.68333,.0593,.11111,.59487],72:[0,.68333,.00965,.11111,.84452],73:[0,.68333,.07382,0,.54452],74:[.09722,.68333,.18472,.16667,.67778],75:[0,.68333,.01445,.05556,.76195],76:[0,.68333,0,.13889,.68972],77:[0,.68333,0,.13889,1.2009],78:[0,.68333,.14736,.08334,.82049],79:[0,.68333,.02778,.11111,.79611],80:[0,.68333,.08222,.08334,.69556],81:[.09722,.68333,0,.11111,.81667],82:[0,.68333,0,.08334,.8475],83:[0,.68333,.075,.13889,.60556],84:[0,.68333,.25417,0,.54464],85:[0,.68333,.09931,.08334,.62583],86:[0,.68333,.08222,0,.61278],87:[0,.68333,.08222,.08334,.98778],88:[0,.68333,.14643,.13889,.7133],89:[.09722,.68333,.08222,.08334,.66834],90:[0,.68333,.07944,.13889,.72473]},"Fraktur-Regular":{33:[0,.69141,0,0,.29574],34:[0,.69141,0,0,.21471],38:[0,.69141,0,0,.73786],39:[0,.69141,0,0,.21201],40:[.24982,.74947,0,0,.38865],41:[.24982,.74947,0,0,.38865],42:[0,.62119,0,0,.27764],43:[.08319,.58283,0,0,.75623],44:[0,.10803,0,0,.27764],45:[.08319,.58283,0,0,.75623],46:[0,.10803,0,0,.27764],47:[.24982,.74947,0,0,.50181],48:[0,.47534,0,0,.50181],49:[0,.47534,0,0,.50181],50:[0,.47534,0,0,.50181],51:[.18906,.47534,0,0,.50181],52:[.18906,.47534,0,0,.50181],53:[.18906,.47534,0,0,.50181],54:[0,.69141,0,0,.50181],55:[.18906,.47534,0,0,.50181],56:[0,.69141,0,0,.50181],57:[.18906,.47534,0,0,.50181],58:[0,.47534,0,0,.21606],59:[.12604,.47534,0,0,.21606],61:[-.13099,.36866,0,0,.75623],63:[0,.69141,0,0,.36245],65:[0,.69141,0,0,.7176],66:[0,.69141,0,0,.88397],67:[0,.69141,0,0,.61254],68:[0,.69141,0,0,.83158],69:[0,.69141,0,0,.66278],70:[.12604,.69141,0,0,.61119],71:[0,.69141,0,0,.78539],72:[.06302,.69141,0,0,.7203],73:[0,.69141,0,0,.55448],74:[.12604,.69141,0,0,.55231],75:[0,.69141,0,0,.66845],76:[0,.69141,0,0,.66602],77:[0,.69141,0,0,1.04953],78:[0,.69141,0,0,.83212],79:[0,.69141,0,0,.82699],80:[.18906,.69141,0,0,.82753],81:[.03781,.69141,0,0,.82699],82:[0,.69141,0,0,.82807],83:[0,.69141,0,0,.82861],84:[0,.69141,0,0,.66899],85:[0,.69141,0,0,.64576],86:[0,.69141,0,0,.83131],87:[0,.69141,0,0,1.04602],88:[0,.69141,0,0,.71922],89:[.18906,.69141,0,0,.83293],90:[.12604,.69141,0,0,.60201],91:[.24982,.74947,0,0,.27764],93:[.24982,.74947,0,0,.27764],94:[0,.69141,0,0,.49965],97:[0,.47534,0,0,.50046],98:[0,.69141,0,0,.51315],99:[0,.47534,0,0,.38946],100:[0,.62119,0,0,.49857],101:[0,.47534,0,0,.40053],102:[.18906,.69141,0,0,.32626],103:[.18906,.47534,0,0,.5037],104:[.18906,.69141,0,0,.52126],105:[0,.69141,0,0,.27899],106:[0,.69141,0,0,.28088],107:[0,.69141,0,0,.38946],108:[0,.69141,0,0,.27953],109:[0,.47534,0,0,.76676],110:[0,.47534,0,0,.52666],111:[0,.47534,0,0,.48885],112:[.18906,.52396,0,0,.50046],113:[.18906,.47534,0,0,.48912],114:[0,.47534,0,0,.38919],115:[0,.47534,0,0,.44266],116:[0,.62119,0,0,.33301],117:[0,.47534,0,0,.5172],118:[0,.52396,0,0,.5118],119:[0,.52396,0,0,.77351],120:[.18906,.47534,0,0,.38865],121:[.18906,.47534,0,0,.49884],122:[.18906,.47534,0,0,.39054],8216:[0,.69141,0,0,.21471],8217:[0,.69141,0,0,.21471],58112:[0,.62119,0,0,.49749],58113:[0,.62119,0,0,.4983],58114:[.18906,.69141,0,0,.33328],58115:[.18906,.69141,0,0,.32923],58116:[.18906,.47534,0,0,.50343],58117:[0,.69141,0,0,.33301],58118:[0,.62119,0,0,.33409],58119:[0,.47534,0,0,.50073]},"Main-Bold":{33:[0,.69444,0,0,.35],34:[0,.69444,0,0,.60278],35:[.19444,.69444,0,0,.95833],36:[.05556,.75,0,0,.575],37:[.05556,.75,0,0,.95833],38:[0,.69444,0,0,.89444],39:[0,.69444,0,0,.31944],40:[.25,.75,0,0,.44722],41:[.25,.75,0,0,.44722],42:[0,.75,0,0,.575],43:[.13333,.63333,0,0,.89444],44:[.19444,.15556,0,0,.31944],45:[0,.44444,0,0,.38333],46:[0,.15556,0,0,.31944],47:[.25,.75,0,0,.575],48:[0,.64444,0,0,.575],49:[0,.64444,0,0,.575],50:[0,.64444,0,0,.575],51:[0,.64444,0,0,.575],52:[0,.64444,0,0,.575],53:[0,.64444,0,0,.575],54:[0,.64444,0,0,.575],55:[0,.64444,0,0,.575],56:[0,.64444,0,0,.575],57:[0,.64444,0,0,.575],58:[0,.44444,0,0,.31944],59:[.19444,.44444,0,0,.31944],60:[.08556,.58556,0,0,.89444],61:[-.10889,.39111,0,0,.89444],62:[.08556,.58556,0,0,.89444],63:[0,.69444,0,0,.54305],64:[0,.69444,0,0,.89444],65:[0,.68611,0,0,.86944],66:[0,.68611,0,0,.81805],67:[0,.68611,0,0,.83055],68:[0,.68611,0,0,.88194],69:[0,.68611,0,0,.75555],70:[0,.68611,0,0,.72361],71:[0,.68611,0,0,.90416],72:[0,.68611,0,0,.9],73:[0,.68611,0,0,.43611],74:[0,.68611,0,0,.59444],75:[0,.68611,0,0,.90138],76:[0,.68611,0,0,.69166],77:[0,.68611,0,0,1.09166],78:[0,.68611,0,0,.9],79:[0,.68611,0,0,.86388],80:[0,.68611,0,0,.78611],81:[.19444,.68611,0,0,.86388],82:[0,.68611,0,0,.8625],83:[0,.68611,0,0,.63889],84:[0,.68611,0,0,.8],85:[0,.68611,0,0,.88472],86:[0,.68611,.01597,0,.86944],87:[0,.68611,.01597,0,1.18888],88:[0,.68611,0,0,.86944],89:[0,.68611,.02875,0,.86944],90:[0,.68611,0,0,.70277],91:[.25,.75,0,0,.31944],92:[.25,.75,0,0,.575],93:[.25,.75,0,0,.31944],94:[0,.69444,0,0,.575],95:[.31,.13444,.03194,0,.575],97:[0,.44444,0,0,.55902],98:[0,.69444,0,0,.63889],99:[0,.44444,0,0,.51111],100:[0,.69444,0,0,.63889],101:[0,.44444,0,0,.52708],102:[0,.69444,.10903,0,.35139],103:[.19444,.44444,.01597,0,.575],104:[0,.69444,0,0,.63889],105:[0,.69444,0,0,.31944],106:[.19444,.69444,0,0,.35139],107:[0,.69444,0,0,.60694],108:[0,.69444,0,0,.31944],109:[0,.44444,0,0,.95833],110:[0,.44444,0,0,.63889],111:[0,.44444,0,0,.575],112:[.19444,.44444,0,0,.63889],113:[.19444,.44444,0,0,.60694],114:[0,.44444,0,0,.47361],115:[0,.44444,0,0,.45361],116:[0,.63492,0,0,.44722],117:[0,.44444,0,0,.63889],118:[0,.44444,.01597,0,.60694],119:[0,.44444,.01597,0,.83055],120:[0,.44444,0,0,.60694],121:[.19444,.44444,.01597,0,.60694],122:[0,.44444,0,0,.51111],123:[.25,.75,0,0,.575],124:[.25,.75,0,0,.31944],125:[.25,.75,0,0,.575],126:[.35,.34444,0,0,.575],168:[0,.69444,0,0,.575],172:[0,.44444,0,0,.76666],176:[0,.69444,0,0,.86944],177:[.13333,.63333,0,0,.89444],184:[.17014,0,0,0,.51111],198:[0,.68611,0,0,1.04166],215:[.13333,.63333,0,0,.89444],216:[.04861,.73472,0,0,.89444],223:[0,.69444,0,0,.59722],230:[0,.44444,0,0,.83055],247:[.13333,.63333,0,0,.89444],248:[.09722,.54167,0,0,.575],305:[0,.44444,0,0,.31944],338:[0,.68611,0,0,1.16944],339:[0,.44444,0,0,.89444],567:[.19444,.44444,0,0,.35139],710:[0,.69444,0,0,.575],711:[0,.63194,0,0,.575],713:[0,.59611,0,0,.575],714:[0,.69444,0,0,.575],715:[0,.69444,0,0,.575],728:[0,.69444,0,0,.575],729:[0,.69444,0,0,.31944],730:[0,.69444,0,0,.86944],732:[0,.69444,0,0,.575],733:[0,.69444,0,0,.575],915:[0,.68611,0,0,.69166],916:[0,.68611,0,0,.95833],920:[0,.68611,0,0,.89444],923:[0,.68611,0,0,.80555],926:[0,.68611,0,0,.76666],928:[0,.68611,0,0,.9],931:[0,.68611,0,0,.83055],933:[0,.68611,0,0,.89444],934:[0,.68611,0,0,.83055],936:[0,.68611,0,0,.89444],937:[0,.68611,0,0,.83055],8211:[0,.44444,.03194,0,.575],8212:[0,.44444,.03194,0,1.14999],8216:[0,.69444,0,0,.31944],8217:[0,.69444,0,0,.31944],8220:[0,.69444,0,0,.60278],8221:[0,.69444,0,0,.60278],8224:[.19444,.69444,0,0,.51111],8225:[.19444,.69444,0,0,.51111],8242:[0,.55556,0,0,.34444],8407:[0,.72444,.15486,0,.575],8463:[0,.69444,0,0,.66759],8465:[0,.69444,0,0,.83055],8467:[0,.69444,0,0,.47361],8472:[.19444,.44444,0,0,.74027],8476:[0,.69444,0,0,.83055],8501:[0,.69444,0,0,.70277],8592:[-.10889,.39111,0,0,1.14999],8593:[.19444,.69444,0,0,.575],8594:[-.10889,.39111,0,0,1.14999],8595:[.19444,.69444,0,0,.575],8596:[-.10889,.39111,0,0,1.14999],8597:[.25,.75,0,0,.575],8598:[.19444,.69444,0,0,1.14999],8599:[.19444,.69444,0,0,1.14999],8600:[.19444,.69444,0,0,1.14999],8601:[.19444,.69444,0,0,1.14999],8636:[-.10889,.39111,0,0,1.14999],8637:[-.10889,.39111,0,0,1.14999],8640:[-.10889,.39111,0,0,1.14999],8641:[-.10889,.39111,0,0,1.14999],8656:[-.10889,.39111,0,0,1.14999],8657:[.19444,.69444,0,0,.70277],8658:[-.10889,.39111,0,0,1.14999],8659:[.19444,.69444,0,0,.70277],8660:[-.10889,.39111,0,0,1.14999],8661:[.25,.75,0,0,.70277],8704:[0,.69444,0,0,.63889],8706:[0,.69444,.06389,0,.62847],8707:[0,.69444,0,0,.63889],8709:[.05556,.75,0,0,.575],8711:[0,.68611,0,0,.95833],8712:[.08556,.58556,0,0,.76666],8715:[.08556,.58556,0,0,.76666],8722:[.13333,.63333,0,0,.89444],8723:[.13333,.63333,0,0,.89444],8725:[.25,.75,0,0,.575],8726:[.25,.75,0,0,.575],8727:[-.02778,.47222,0,0,.575],8728:[-.02639,.47361,0,0,.575],8729:[-.02639,.47361,0,0,.575],8730:[.18,.82,0,0,.95833],8733:[0,.44444,0,0,.89444],8734:[0,.44444,0,0,1.14999],8736:[0,.69224,0,0,.72222],8739:[.25,.75,0,0,.31944],8741:[.25,.75,0,0,.575],8743:[0,.55556,0,0,.76666],8744:[0,.55556,0,0,.76666],8745:[0,.55556,0,0,.76666],8746:[0,.55556,0,0,.76666],8747:[.19444,.69444,.12778,0,.56875],8764:[-.10889,.39111,0,0,.89444],8768:[.19444,.69444,0,0,.31944],8771:[.00222,.50222,0,0,.89444],8776:[.02444,.52444,0,0,.89444],8781:[.00222,.50222,0,0,.89444],8801:[.00222,.50222,0,0,.89444],8804:[.19667,.69667,0,0,.89444],8805:[.19667,.69667,0,0,.89444],8810:[.08556,.58556,0,0,1.14999],8811:[.08556,.58556,0,0,1.14999],8826:[.08556,.58556,0,0,.89444],8827:[.08556,.58556,0,0,.89444],8834:[.08556,.58556,0,0,.89444],8835:[.08556,.58556,0,0,.89444],8838:[.19667,.69667,0,0,.89444],8839:[.19667,.69667,0,0,.89444],8846:[0,.55556,0,0,.76666],8849:[.19667,.69667,0,0,.89444],8850:[.19667,.69667,0,0,.89444],8851:[0,.55556,0,0,.76666],8852:[0,.55556,0,0,.76666],8853:[.13333,.63333,0,0,.89444],8854:[.13333,.63333,0,0,.89444],8855:[.13333,.63333,0,0,.89444],8856:[.13333,.63333,0,0,.89444],8857:[.13333,.63333,0,0,.89444],8866:[0,.69444,0,0,.70277],8867:[0,.69444,0,0,.70277],8868:[0,.69444,0,0,.89444],8869:[0,.69444,0,0,.89444],8900:[-.02639,.47361,0,0,.575],8901:[-.02639,.47361,0,0,.31944],8902:[-.02778,.47222,0,0,.575],8968:[.25,.75,0,0,.51111],8969:[.25,.75,0,0,.51111],8970:[.25,.75,0,0,.51111],8971:[.25,.75,0,0,.51111],8994:[-.13889,.36111,0,0,1.14999],8995:[-.13889,.36111,0,0,1.14999],9651:[.19444,.69444,0,0,1.02222],9657:[-.02778,.47222,0,0,.575],9661:[.19444,.69444,0,0,1.02222],9667:[-.02778,.47222,0,0,.575],9711:[.19444,.69444,0,0,1.14999],9824:[.12963,.69444,0,0,.89444],9825:[.12963,.69444,0,0,.89444],9826:[.12963,.69444,0,0,.89444],9827:[.12963,.69444,0,0,.89444],9837:[0,.75,0,0,.44722],9838:[.19444,.69444,0,0,.44722],9839:[.19444,.69444,0,0,.44722],10216:[.25,.75,0,0,.44722],10217:[.25,.75,0,0,.44722],10815:[0,.68611,0,0,.9],10927:[.19667,.69667,0,0,.89444],10928:[.19667,.69667,0,0,.89444],57376:[.19444,.69444,0,0,0]},"Main-BoldItalic":{33:[0,.69444,.11417,0,.38611],34:[0,.69444,.07939,0,.62055],35:[.19444,.69444,.06833,0,.94444],37:[.05556,.75,.12861,0,.94444],38:[0,.69444,.08528,0,.88555],39:[0,.69444,.12945,0,.35555],40:[.25,.75,.15806,0,.47333],41:[.25,.75,.03306,0,.47333],42:[0,.75,.14333,0,.59111],43:[.10333,.60333,.03306,0,.88555],44:[.19444,.14722,0,0,.35555],45:[0,.44444,.02611,0,.41444],46:[0,.14722,0,0,.35555],47:[.25,.75,.15806,0,.59111],48:[0,.64444,.13167,0,.59111],49:[0,.64444,.13167,0,.59111],50:[0,.64444,.13167,0,.59111],51:[0,.64444,.13167,0,.59111],52:[.19444,.64444,.13167,0,.59111],53:[0,.64444,.13167,0,.59111],54:[0,.64444,.13167,0,.59111],55:[.19444,.64444,.13167,0,.59111],56:[0,.64444,.13167,0,.59111],57:[0,.64444,.13167,0,.59111],58:[0,.44444,.06695,0,.35555],59:[.19444,.44444,.06695,0,.35555],61:[-.10889,.39111,.06833,0,.88555],63:[0,.69444,.11472,0,.59111],64:[0,.69444,.09208,0,.88555],65:[0,.68611,0,0,.86555],66:[0,.68611,.0992,0,.81666],67:[0,.68611,.14208,0,.82666],68:[0,.68611,.09062,0,.87555],69:[0,.68611,.11431,0,.75666],70:[0,.68611,.12903,0,.72722],71:[0,.68611,.07347,0,.89527],72:[0,.68611,.17208,0,.8961],73:[0,.68611,.15681,0,.47166],74:[0,.68611,.145,0,.61055],75:[0,.68611,.14208,0,.89499],76:[0,.68611,0,0,.69777],77:[0,.68611,.17208,0,1.07277],78:[0,.68611,.17208,0,.8961],79:[0,.68611,.09062,0,.85499],80:[0,.68611,.0992,0,.78721],81:[.19444,.68611,.09062,0,.85499],82:[0,.68611,.02559,0,.85944],83:[0,.68611,.11264,0,.64999],84:[0,.68611,.12903,0,.7961],85:[0,.68611,.17208,0,.88083],86:[0,.68611,.18625,0,.86555],87:[0,.68611,.18625,0,1.15999],88:[0,.68611,.15681,0,.86555],89:[0,.68611,.19803,0,.86555],90:[0,.68611,.14208,0,.70888],91:[.25,.75,.1875,0,.35611],93:[.25,.75,.09972,0,.35611],94:[0,.69444,.06709,0,.59111],95:[.31,.13444,.09811,0,.59111],97:[0,.44444,.09426,0,.59111],98:[0,.69444,.07861,0,.53222],99:[0,.44444,.05222,0,.53222],100:[0,.69444,.10861,0,.59111],101:[0,.44444,.085,0,.53222],102:[.19444,.69444,.21778,0,.4],103:[.19444,.44444,.105,0,.53222],104:[0,.69444,.09426,0,.59111],105:[0,.69326,.11387,0,.35555],106:[.19444,.69326,.1672,0,.35555],107:[0,.69444,.11111,0,.53222],108:[0,.69444,.10861,0,.29666],109:[0,.44444,.09426,0,.94444],110:[0,.44444,.09426,0,.64999],111:[0,.44444,.07861,0,.59111],112:[.19444,.44444,.07861,0,.59111],113:[.19444,.44444,.105,0,.53222],114:[0,.44444,.11111,0,.50167],115:[0,.44444,.08167,0,.48694],116:[0,.63492,.09639,0,.385],117:[0,.44444,.09426,0,.62055],118:[0,.44444,.11111,0,.53222],119:[0,.44444,.11111,0,.76777],120:[0,.44444,.12583,0,.56055],121:[.19444,.44444,.105,0,.56166],122:[0,.44444,.13889,0,.49055],126:[.35,.34444,.11472,0,.59111],163:[0,.69444,0,0,.86853],168:[0,.69444,.11473,0,.59111],176:[0,.69444,0,0,.94888],184:[.17014,0,0,0,.53222],198:[0,.68611,.11431,0,1.02277],216:[.04861,.73472,.09062,0,.88555],223:[.19444,.69444,.09736,0,.665],230:[0,.44444,.085,0,.82666],248:[.09722,.54167,.09458,0,.59111],305:[0,.44444,.09426,0,.35555],338:[0,.68611,.11431,0,1.14054],339:[0,.44444,.085,0,.82666],567:[.19444,.44444,.04611,0,.385],710:[0,.69444,.06709,0,.59111],711:[0,.63194,.08271,0,.59111],713:[0,.59444,.10444,0,.59111],714:[0,.69444,.08528,0,.59111],715:[0,.69444,0,0,.59111],728:[0,.69444,.10333,0,.59111],729:[0,.69444,.12945,0,.35555],730:[0,.69444,0,0,.94888],732:[0,.69444,.11472,0,.59111],733:[0,.69444,.11472,0,.59111],915:[0,.68611,.12903,0,.69777],916:[0,.68611,0,0,.94444],920:[0,.68611,.09062,0,.88555],923:[0,.68611,0,0,.80666],926:[0,.68611,.15092,0,.76777],928:[0,.68611,.17208,0,.8961],931:[0,.68611,.11431,0,.82666],933:[0,.68611,.10778,0,.88555],934:[0,.68611,.05632,0,.82666],936:[0,.68611,.10778,0,.88555],937:[0,.68611,.0992,0,.82666],8211:[0,.44444,.09811,0,.59111],8212:[0,.44444,.09811,0,1.18221],8216:[0,.69444,.12945,0,.35555],8217:[0,.69444,.12945,0,.35555],8220:[0,.69444,.16772,0,.62055],8221:[0,.69444,.07939,0,.62055]},"Main-Italic":{33:[0,.69444,.12417,0,.30667],34:[0,.69444,.06961,0,.51444],35:[.19444,.69444,.06616,0,.81777],37:[.05556,.75,.13639,0,.81777],38:[0,.69444,.09694,0,.76666],39:[0,.69444,.12417,0,.30667],40:[.25,.75,.16194,0,.40889],41:[.25,.75,.03694,0,.40889],42:[0,.75,.14917,0,.51111],43:[.05667,.56167,.03694,0,.76666],44:[.19444,.10556,0,0,.30667],45:[0,.43056,.02826,0,.35778],46:[0,.10556,0,0,.30667],47:[.25,.75,.16194,0,.51111],48:[0,.64444,.13556,0,.51111],49:[0,.64444,.13556,0,.51111],50:[0,.64444,.13556,0,.51111],51:[0,.64444,.13556,0,.51111],52:[.19444,.64444,.13556,0,.51111],53:[0,.64444,.13556,0,.51111],54:[0,.64444,.13556,0,.51111],55:[.19444,.64444,.13556,0,.51111],56:[0,.64444,.13556,0,.51111],57:[0,.64444,.13556,0,.51111],58:[0,.43056,.0582,0,.30667],59:[.19444,.43056,.0582,0,.30667],61:[-.13313,.36687,.06616,0,.76666],63:[0,.69444,.1225,0,.51111],64:[0,.69444,.09597,0,.76666],65:[0,.68333,0,0,.74333],66:[0,.68333,.10257,0,.70389],67:[0,.68333,.14528,0,.71555],68:[0,.68333,.09403,0,.755],69:[0,.68333,.12028,0,.67833],70:[0,.68333,.13305,0,.65277],71:[0,.68333,.08722,0,.77361],72:[0,.68333,.16389,0,.74333],73:[0,.68333,.15806,0,.38555],74:[0,.68333,.14028,0,.525],75:[0,.68333,.14528,0,.76888],76:[0,.68333,0,0,.62722],77:[0,.68333,.16389,0,.89666],78:[0,.68333,.16389,0,.74333],79:[0,.68333,.09403,0,.76666],80:[0,.68333,.10257,0,.67833],81:[.19444,.68333,.09403,0,.76666],82:[0,.68333,.03868,0,.72944],83:[0,.68333,.11972,0,.56222],84:[0,.68333,.13305,0,.71555],85:[0,.68333,.16389,0,.74333],86:[0,.68333,.18361,0,.74333],87:[0,.68333,.18361,0,.99888],88:[0,.68333,.15806,0,.74333],89:[0,.68333,.19383,0,.74333],90:[0,.68333,.14528,0,.61333],91:[.25,.75,.1875,0,.30667],93:[.25,.75,.10528,0,.30667],94:[0,.69444,.06646,0,.51111],95:[.31,.12056,.09208,0,.51111],97:[0,.43056,.07671,0,.51111],98:[0,.69444,.06312,0,.46],99:[0,.43056,.05653,0,.46],100:[0,.69444,.10333,0,.51111],101:[0,.43056,.07514,0,.46],102:[.19444,.69444,.21194,0,.30667],103:[.19444,.43056,.08847,0,.46],104:[0,.69444,.07671,0,.51111],105:[0,.65536,.1019,0,.30667],106:[.19444,.65536,.14467,0,.30667],107:[0,.69444,.10764,0,.46],108:[0,.69444,.10333,0,.25555],109:[0,.43056,.07671,0,.81777],110:[0,.43056,.07671,0,.56222],111:[0,.43056,.06312,0,.51111],112:[.19444,.43056,.06312,0,.51111],113:[.19444,.43056,.08847,0,.46],114:[0,.43056,.10764,0,.42166],115:[0,.43056,.08208,0,.40889],116:[0,.61508,.09486,0,.33222],117:[0,.43056,.07671,0,.53666],118:[0,.43056,.10764,0,.46],119:[0,.43056,.10764,0,.66444],120:[0,.43056,.12042,0,.46389],121:[.19444,.43056,.08847,0,.48555],122:[0,.43056,.12292,0,.40889],126:[.35,.31786,.11585,0,.51111],163:[0,.69444,0,0,.76909],168:[0,.66786,.10474,0,.51111],176:[0,.69444,0,0,.83129],184:[.17014,0,0,0,.46],198:[0,.68333,.12028,0,.88277],216:[.04861,.73194,.09403,0,.76666],223:[.19444,.69444,.10514,0,.53666],230:[0,.43056,.07514,0,.71555],248:[.09722,.52778,.09194,0,.51111],305:[0,.43056,0,.02778,.32246],338:[0,.68333,.12028,0,.98499],339:[0,.43056,.07514,0,.71555],567:[.19444,.43056,0,.08334,.38403],710:[0,.69444,.06646,0,.51111],711:[0,.62847,.08295,0,.51111],713:[0,.56167,.10333,0,.51111],714:[0,.69444,.09694,0,.51111],715:[0,.69444,0,0,.51111],728:[0,.69444,.10806,0,.51111],729:[0,.66786,.11752,0,.30667],730:[0,.69444,0,0,.83129],732:[0,.66786,.11585,0,.51111],733:[0,.69444,.1225,0,.51111],915:[0,.68333,.13305,0,.62722],916:[0,.68333,0,0,.81777],920:[0,.68333,.09403,0,.76666],923:[0,.68333,0,0,.69222],926:[0,.68333,.15294,0,.66444],928:[0,.68333,.16389,0,.74333],931:[0,.68333,.12028,0,.71555],933:[0,.68333,.11111,0,.76666],934:[0,.68333,.05986,0,.71555],936:[0,.68333,.11111,0,.76666],937:[0,.68333,.10257,0,.71555],8211:[0,.43056,.09208,0,.51111],8212:[0,.43056,.09208,0,1.02222],8216:[0,.69444,.12417,0,.30667],8217:[0,.69444,.12417,0,.30667],8220:[0,.69444,.1685,0,.51444],8221:[0,.69444,.06961,0,.51444],8463:[0,.68889,0,0,.54028]},"Main-Regular":{32:[0,0,0,0,.25],33:[0,.69444,0,0,.27778],34:[0,.69444,0,0,.5],35:[.19444,.69444,0,0,.83334],36:[.05556,.75,0,0,.5],37:[.05556,.75,0,0,.83334],38:[0,.69444,0,0,.77778],39:[0,.69444,0,0,.27778],40:[.25,.75,0,0,.38889],41:[.25,.75,0,0,.38889],42:[0,.75,0,0,.5],43:[.08333,.58333,0,0,.77778],44:[.19444,.10556,0,0,.27778],45:[0,.43056,0,0,.33333],46:[0,.10556,0,0,.27778],47:[.25,.75,0,0,.5],48:[0,.64444,0,0,.5],49:[0,.64444,0,0,.5],50:[0,.64444,0,0,.5],51:[0,.64444,0,0,.5],52:[0,.64444,0,0,.5],53:[0,.64444,0,0,.5],54:[0,.64444,0,0,.5],55:[0,.64444,0,0,.5],56:[0,.64444,0,0,.5],57:[0,.64444,0,0,.5],58:[0,.43056,0,0,.27778],59:[.19444,.43056,0,0,.27778],60:[.0391,.5391,0,0,.77778],61:[-.13313,.36687,0,0,.77778],62:[.0391,.5391,0,0,.77778],63:[0,.69444,0,0,.47222],64:[0,.69444,0,0,.77778],65:[0,.68333,0,0,.75],66:[0,.68333,0,0,.70834],67:[0,.68333,0,0,.72222],68:[0,.68333,0,0,.76389],69:[0,.68333,0,0,.68056],70:[0,.68333,0,0,.65278],71:[0,.68333,0,0,.78472],72:[0,.68333,0,0,.75],73:[0,.68333,0,0,.36111],74:[0,.68333,0,0,.51389],75:[0,.68333,0,0,.77778],76:[0,.68333,0,0,.625],77:[0,.68333,0,0,.91667],78:[0,.68333,0,0,.75],79:[0,.68333,0,0,.77778],80:[0,.68333,0,0,.68056],81:[.19444,.68333,0,0,.77778],82:[0,.68333,0,0,.73611],83:[0,.68333,0,0,.55556],84:[0,.68333,0,0,.72222],85:[0,.68333,0,0,.75],86:[0,.68333,.01389,0,.75],87:[0,.68333,.01389,0,1.02778],88:[0,.68333,0,0,.75],89:[0,.68333,.025,0,.75],90:[0,.68333,0,0,.61111],91:[.25,.75,0,0,.27778],92:[.25,.75,0,0,.5],93:[.25,.75,0,0,.27778],94:[0,.69444,0,0,.5],95:[.31,.12056,.02778,0,.5],97:[0,.43056,0,0,.5],98:[0,.69444,0,0,.55556],99:[0,.43056,0,0,.44445],100:[0,.69444,0,0,.55556],101:[0,.43056,0,0,.44445],102:[0,.69444,.07778,0,.30556],103:[.19444,.43056,.01389,0,.5],104:[0,.69444,0,0,.55556],105:[0,.66786,0,0,.27778],106:[.19444,.66786,0,0,.30556],107:[0,.69444,0,0,.52778],108:[0,.69444,0,0,.27778],109:[0,.43056,0,0,.83334],110:[0,.43056,0,0,.55556],111:[0,.43056,0,0,.5],112:[.19444,.43056,0,0,.55556],113:[.19444,.43056,0,0,.52778],114:[0,.43056,0,0,.39167],115:[0,.43056,0,0,.39445],116:[0,.61508,0,0,.38889],117:[0,.43056,0,0,.55556],118:[0,.43056,.01389,0,.52778],119:[0,.43056,.01389,0,.72222],120:[0,.43056,0,0,.52778],121:[.19444,.43056,.01389,0,.52778],122:[0,.43056,0,0,.44445],123:[.25,.75,0,0,.5],124:[.25,.75,0,0,.27778],125:[.25,.75,0,0,.5],126:[.35,.31786,0,0,.5],160:[0,0,0,0,.25],167:[.19444,.69444,0,0,.44445],168:[0,.66786,0,0,.5],172:[0,.43056,0,0,.66667],176:[0,.69444,0,0,.75],177:[.08333,.58333,0,0,.77778],182:[.19444,.69444,0,0,.61111],184:[.17014,0,0,0,.44445],198:[0,.68333,0,0,.90278],215:[.08333,.58333,0,0,.77778],216:[.04861,.73194,0,0,.77778],223:[0,.69444,0,0,.5],230:[0,.43056,0,0,.72222],247:[.08333,.58333,0,0,.77778],248:[.09722,.52778,0,0,.5],305:[0,.43056,0,0,.27778],338:[0,.68333,0,0,1.01389],339:[0,.43056,0,0,.77778],567:[.19444,.43056,0,0,.30556],710:[0,.69444,0,0,.5],711:[0,.62847,0,0,.5],713:[0,.56778,0,0,.5],714:[0,.69444,0,0,.5],715:[0,.69444,0,0,.5],728:[0,.69444,0,0,.5],729:[0,.66786,0,0,.27778],730:[0,.69444,0,0,.75],732:[0,.66786,0,0,.5],733:[0,.69444,0,0,.5],915:[0,.68333,0,0,.625],916:[0,.68333,0,0,.83334],920:[0,.68333,0,0,.77778],923:[0,.68333,0,0,.69445],926:[0,.68333,0,0,.66667],928:[0,.68333,0,0,.75],931:[0,.68333,0,0,.72222],933:[0,.68333,0,0,.77778],934:[0,.68333,0,0,.72222],936:[0,.68333,0,0,.77778],937:[0,.68333,0,0,.72222],8211:[0,.43056,.02778,0,.5],8212:[0,.43056,.02778,0,1],8216:[0,.69444,0,0,.27778],8217:[0,.69444,0,0,.27778],8220:[0,.69444,0,0,.5],8221:[0,.69444,0,0,.5],8224:[.19444,.69444,0,0,.44445],8225:[.19444,.69444,0,0,.44445],8230:[0,.12,0,0,1.172],8242:[0,.55556,0,0,.275],8407:[0,.71444,.15382,0,.5],8463:[0,.68889,0,0,.54028],8465:[0,.69444,0,0,.72222],8467:[0,.69444,0,.11111,.41667],8472:[.19444,.43056,0,.11111,.63646],8476:[0,.69444,0,0,.72222],8501:[0,.69444,0,0,.61111],8592:[-.13313,.36687,0,0,1],8593:[.19444,.69444,0,0,.5],8594:[-.13313,.36687,0,0,1],8595:[.19444,.69444,0,0,.5],8596:[-.13313,.36687,0,0,1],8597:[.25,.75,0,0,.5],8598:[.19444,.69444,0,0,1],8599:[.19444,.69444,0,0,1],8600:[.19444,.69444,0,0,1],8601:[.19444,.69444,0,0,1],8614:[.011,.511,0,0,1],8617:[.011,.511,0,0,1.126],8618:[.011,.511,0,0,1.126],8636:[-.13313,.36687,0,0,1],8637:[-.13313,.36687,0,0,1],8640:[-.13313,.36687,0,0,1],8641:[-.13313,.36687,0,0,1],8652:[.011,.671,0,0,1],8656:[-.13313,.36687,0,0,1],8657:[.19444,.69444,0,0,.61111],8658:[-.13313,.36687,0,0,1],8659:[.19444,.69444,0,0,.61111],8660:[-.13313,.36687,0,0,1],8661:[.25,.75,0,0,.61111],8704:[0,.69444,0,0,.55556],8706:[0,.69444,.05556,.08334,.5309],8707:[0,.69444,0,0,.55556],8709:[.05556,.75,0,0,.5],8711:[0,.68333,0,0,.83334],8712:[.0391,.5391,0,0,.66667],8715:[.0391,.5391,0,0,.66667],8722:[.08333,.58333,0,0,.77778],8723:[.08333,.58333,0,0,.77778],8725:[.25,.75,0,0,.5],8726:[.25,.75,0,0,.5],8727:[-.03472,.46528,0,0,.5],8728:[-.05555,.44445,0,0,.5],8729:[-.05555,.44445,0,0,.5],8730:[.2,.8,0,0,.83334],8733:[0,.43056,0,0,.77778],8734:[0,.43056,0,0,1],8736:[0,.69224,0,0,.72222],8739:[.25,.75,0,0,.27778],8741:[.25,.75,0,0,.5],8743:[0,.55556,0,0,.66667],8744:[0,.55556,0,0,.66667],8745:[0,.55556,0,0,.66667],8746:[0,.55556,0,0,.66667],8747:[.19444,.69444,.11111,0,.41667],8764:[-.13313,.36687,0,0,.77778],8768:[.19444,.69444,0,0,.27778],8771:[-.03625,.46375,0,0,.77778],8773:[-.022,.589,0,0,1],8776:[-.01688,.48312,0,0,.77778],8781:[-.03625,.46375,0,0,.77778],8784:[-.133,.67,0,0,.778],8801:[-.03625,.46375,0,0,.77778],8804:[.13597,.63597,0,0,.77778],8805:[.13597,.63597,0,0,.77778],8810:[.0391,.5391,0,0,1],8811:[.0391,.5391,0,0,1],8826:[.0391,.5391,0,0,.77778],8827:[.0391,.5391,0,0,.77778],8834:[.0391,.5391,0,0,.77778],8835:[.0391,.5391,0,0,.77778],8838:[.13597,.63597,0,0,.77778],8839:[.13597,.63597,0,0,.77778],8846:[0,.55556,0,0,.66667],8849:[.13597,.63597,0,0,.77778],8850:[.13597,.63597,0,0,.77778],8851:[0,.55556,0,0,.66667],8852:[0,.55556,0,0,.66667],8853:[.08333,.58333,0,0,.77778],8854:[.08333,.58333,0,0,.77778],8855:[.08333,.58333,0,0,.77778],8856:[.08333,.58333,0,0,.77778],8857:[.08333,.58333,0,0,.77778],8866:[0,.69444,0,0,.61111],8867:[0,.69444,0,0,.61111],8868:[0,.69444,0,0,.77778],8869:[0,.69444,0,0,.77778],8872:[.249,.75,0,0,.867],8900:[-.05555,.44445,0,0,.5],8901:[-.05555,.44445,0,0,.27778],8902:[-.03472,.46528,0,0,.5],8904:[.005,.505,0,0,.9],8942:[.03,.9,0,0,.278],8943:[-.19,.31,0,0,1.172],8945:[-.1,.82,0,0,1.282],8968:[.25,.75,0,0,.44445],8969:[.25,.75,0,0,.44445],8970:[.25,.75,0,0,.44445],8971:[.25,.75,0,0,.44445],8994:[-.14236,.35764,0,0,1],8995:[-.14236,.35764,0,0,1],9136:[.244,.744,0,0,.412],9137:[.244,.744,0,0,.412],9651:[.19444,.69444,0,0,.88889],9657:[-.03472,.46528,0,0,.5],9661:[.19444,.69444,0,0,.88889],9667:[-.03472,.46528,0,0,.5],9711:[.19444,.69444,0,0,1],9824:[.12963,.69444,0,0,.77778],9825:[.12963,.69444,0,0,.77778],9826:[.12963,.69444,0,0,.77778],9827:[.12963,.69444,0,0,.77778],9837:[0,.75,0,0,.38889],9838:[.19444,.69444,0,0,.38889],9839:[.19444,.69444,0,0,.38889],10216:[.25,.75,0,0,.38889],10217:[.25,.75,0,0,.38889],10222:[.244,.744,0,0,.412],10223:[.244,.744,0,0,.412],10229:[.011,.511,0,0,1.609],10230:[.011,.511,0,0,1.638],10231:[.011,.511,0,0,1.859],10232:[.024,.525,0,0,1.609],10233:[.024,.525,0,0,1.638],10234:[.024,.525,0,0,1.858],10236:[.011,.511,0,0,1.638],10815:[0,.68333,0,0,.75],10927:[.13597,.63597,0,0,.77778],10928:[.13597,.63597,0,0,.77778],57376:[.19444,.69444,0,0,0]},"Math-BoldItalic":{65:[0,.68611,0,0,.86944],66:[0,.68611,.04835,0,.8664],67:[0,.68611,.06979,0,.81694],68:[0,.68611,.03194,0,.93812],69:[0,.68611,.05451,0,.81007],70:[0,.68611,.15972,0,.68889],71:[0,.68611,0,0,.88673],72:[0,.68611,.08229,0,.98229],73:[0,.68611,.07778,0,.51111],74:[0,.68611,.10069,0,.63125],75:[0,.68611,.06979,0,.97118],76:[0,.68611,0,0,.75555],77:[0,.68611,.11424,0,1.14201],78:[0,.68611,.11424,0,.95034],79:[0,.68611,.03194,0,.83666],80:[0,.68611,.15972,0,.72309],81:[.19444,.68611,0,0,.86861],82:[0,.68611,.00421,0,.87235],83:[0,.68611,.05382,0,.69271],84:[0,.68611,.15972,0,.63663],85:[0,.68611,.11424,0,.80027],86:[0,.68611,.25555,0,.67778],87:[0,.68611,.15972,0,1.09305],88:[0,.68611,.07778,0,.94722],89:[0,.68611,.25555,0,.67458],90:[0,.68611,.06979,0,.77257],97:[0,.44444,0,0,.63287],98:[0,.69444,0,0,.52083],99:[0,.44444,0,0,.51342],100:[0,.69444,0,0,.60972],101:[0,.44444,0,0,.55361],102:[.19444,.69444,.11042,0,.56806],103:[.19444,.44444,.03704,0,.5449],104:[0,.69444,0,0,.66759],105:[0,.69326,0,0,.4048],106:[.19444,.69326,.0622,0,.47083],107:[0,.69444,.01852,0,.6037],108:[0,.69444,.0088,0,.34815],109:[0,.44444,0,0,1.0324],110:[0,.44444,0,0,.71296],111:[0,.44444,0,0,.58472],112:[.19444,.44444,0,0,.60092],113:[.19444,.44444,.03704,0,.54213],114:[0,.44444,.03194,0,.5287],115:[0,.44444,0,0,.53125],116:[0,.63492,0,0,.41528],117:[0,.44444,0,0,.68102],118:[0,.44444,.03704,0,.56666],119:[0,.44444,.02778,0,.83148],120:[0,.44444,0,0,.65903],121:[.19444,.44444,.03704,0,.59028],122:[0,.44444,.04213,0,.55509],915:[0,.68611,.15972,0,.65694],916:[0,.68611,0,0,.95833],920:[0,.68611,.03194,0,.86722],923:[0,.68611,0,0,.80555],926:[0,.68611,.07458,0,.84125],928:[0,.68611,.08229,0,.98229],931:[0,.68611,.05451,0,.88507],933:[0,.68611,.15972,0,.67083],934:[0,.68611,0,0,.76666],936:[0,.68611,.11653,0,.71402],937:[0,.68611,.04835,0,.8789],945:[0,.44444,0,0,.76064],946:[.19444,.69444,.03403,0,.65972],947:[.19444,.44444,.06389,0,.59003],948:[0,.69444,.03819,0,.52222],949:[0,.44444,0,0,.52882],950:[.19444,.69444,.06215,0,.50833],951:[.19444,.44444,.03704,0,.6],952:[0,.69444,.03194,0,.5618],953:[0,.44444,0,0,.41204],954:[0,.44444,0,0,.66759],955:[0,.69444,0,0,.67083],956:[.19444,.44444,0,0,.70787],957:[0,.44444,.06898,0,.57685],958:[.19444,.69444,.03021,0,.50833],959:[0,.44444,0,0,.58472],960:[0,.44444,.03704,0,.68241],961:[.19444,.44444,0,0,.6118],962:[.09722,.44444,.07917,0,.42361],963:[0,.44444,.03704,0,.68588],964:[0,.44444,.13472,0,.52083],965:[0,.44444,.03704,0,.63055],966:[.19444,.44444,0,0,.74722],967:[.19444,.44444,0,0,.71805],968:[.19444,.69444,.03704,0,.75833],969:[0,.44444,.03704,0,.71782],977:[0,.69444,0,0,.69155],981:[.19444,.69444,0,0,.7125],982:[0,.44444,.03194,0,.975],1009:[.19444,.44444,0,0,.6118],1013:[0,.44444,0,0,.48333]},"Math-Italic":{65:[0,.68333,0,.13889,.75],66:[0,.68333,.05017,.08334,.75851],67:[0,.68333,.07153,.08334,.71472],68:[0,.68333,.02778,.05556,.82792],69:[0,.68333,.05764,.08334,.7382],70:[0,.68333,.13889,.08334,.64306],71:[0,.68333,0,.08334,.78625],72:[0,.68333,.08125,.05556,.83125],73:[0,.68333,.07847,.11111,.43958],74:[0,.68333,.09618,.16667,.55451],75:[0,.68333,.07153,.05556,.84931],76:[0,.68333,0,.02778,.68056],77:[0,.68333,.10903,.08334,.97014],78:[0,.68333,.10903,.08334,.80347],79:[0,.68333,.02778,.08334,.76278],80:[0,.68333,.13889,.08334,.64201],81:[.19444,.68333,0,.08334,.79056],82:[0,.68333,.00773,.08334,.75929],83:[0,.68333,.05764,.08334,.6132],84:[0,.68333,.13889,.08334,.58438],85:[0,.68333,.10903,.02778,.68278],86:[0,.68333,.22222,0,.58333],87:[0,.68333,.13889,0,.94445],88:[0,.68333,.07847,.08334,.82847],89:[0,.68333,.22222,0,.58056],90:[0,.68333,.07153,.08334,.68264],97:[0,.43056,0,0,.52859],98:[0,.69444,0,0,.42917],99:[0,.43056,0,.05556,.43276],100:[0,.69444,0,.16667,.52049],101:[0,.43056,0,.05556,.46563],102:[.19444,.69444,.10764,.16667,.48959],103:[.19444,.43056,.03588,.02778,.47697],104:[0,.69444,0,0,.57616],105:[0,.65952,0,0,.34451],106:[.19444,.65952,.05724,0,.41181],107:[0,.69444,.03148,0,.5206],108:[0,.69444,.01968,.08334,.29838],109:[0,.43056,0,0,.87801],110:[0,.43056,0,0,.60023],111:[0,.43056,0,.05556,.48472],112:[.19444,.43056,0,.08334,.50313],113:[.19444,.43056,.03588,.08334,.44641],114:[0,.43056,.02778,.05556,.45116],115:[0,.43056,0,.05556,.46875],116:[0,.61508,0,.08334,.36111],117:[0,.43056,0,.02778,.57246],118:[0,.43056,.03588,.02778,.48472],119:[0,.43056,.02691,.08334,.71592],120:[0,.43056,0,.02778,.57153],121:[.19444,.43056,.03588,.05556,.49028],122:[0,.43056,.04398,.05556,.46505],915:[0,.68333,.13889,.08334,.61528],916:[0,.68333,0,.16667,.83334],920:[0,.68333,.02778,.08334,.76278],923:[0,.68333,0,.16667,.69445],926:[0,.68333,.07569,.08334,.74236],928:[0,.68333,.08125,.05556,.83125],931:[0,.68333,.05764,.08334,.77986],933:[0,.68333,.13889,.05556,.58333],934:[0,.68333,0,.08334,.66667],936:[0,.68333,.11,.05556,.61222],937:[0,.68333,.05017,.08334,.7724],945:[0,.43056,.0037,.02778,.6397],946:[.19444,.69444,.05278,.08334,.56563],947:[.19444,.43056,.05556,0,.51773],948:[0,.69444,.03785,.05556,.44444],949:[0,.43056,0,.08334,.46632],950:[.19444,.69444,.07378,.08334,.4375],951:[.19444,.43056,.03588,.05556,.49653],952:[0,.69444,.02778,.08334,.46944],953:[0,.43056,0,.05556,.35394],954:[0,.43056,0,0,.57616],955:[0,.69444,0,0,.58334],956:[.19444,.43056,0,.02778,.60255],957:[0,.43056,.06366,.02778,.49398],958:[.19444,.69444,.04601,.11111,.4375],959:[0,.43056,0,.05556,.48472],960:[0,.43056,.03588,0,.57003],961:[.19444,.43056,0,.08334,.51702],962:[.09722,.43056,.07986,.08334,.36285],963:[0,.43056,.03588,0,.57141],964:[0,.43056,.1132,.02778,.43715],965:[0,.43056,.03588,.02778,.54028],966:[.19444,.43056,0,.08334,.65417],967:[.19444,.43056,0,.05556,.62569],968:[.19444,.69444,.03588,.11111,.65139],969:[0,.43056,.03588,0,.62245],977:[0,.69444,0,.08334,.59144],981:[.19444,.69444,0,.08334,.59583],982:[0,.43056,.02778,0,.82813],1009:[.19444,.43056,0,.08334,.51702],1013:[0,.43056,0,.05556,.4059]},"Math-Regular":{65:[0,.68333,0,.13889,.75],66:[0,.68333,.05017,.08334,.75851],67:[0,.68333,.07153,.08334,.71472],68:[0,.68333,.02778,.05556,.82792],69:[0,.68333,.05764,.08334,.7382],70:[0,.68333,.13889,.08334,.64306],71:[0,.68333,0,.08334,.78625],72:[0,.68333,.08125,.05556,.83125],73:[0,.68333,.07847,.11111,.43958],74:[0,.68333,.09618,.16667,.55451],75:[0,.68333,.07153,.05556,.84931],76:[0,.68333,0,.02778,.68056],77:[0,.68333,.10903,.08334,.97014],78:[0,.68333,.10903,.08334,.80347],79:[0,.68333,.02778,.08334,.76278],80:[0,.68333,.13889,.08334,.64201],81:[.19444,.68333,0,.08334,.79056],82:[0,.68333,.00773,.08334,.75929],83:[0,.68333,.05764,.08334,.6132],84:[0,.68333,.13889,.08334,.58438],85:[0,.68333,.10903,.02778,.68278],86:[0,.68333,.22222,0,.58333],87:[0,.68333,.13889,0,.94445],88:[0,.68333,.07847,.08334,.82847],89:[0,.68333,.22222,0,.58056],90:[0,.68333,.07153,.08334,.68264],97:[0,.43056,0,0,.52859],98:[0,.69444,0,0,.42917],99:[0,.43056,0,.05556,.43276],100:[0,.69444,0,.16667,.52049],101:[0,.43056,0,.05556,.46563],102:[.19444,.69444,.10764,.16667,.48959],103:[.19444,.43056,.03588,.02778,.47697],104:[0,.69444,0,0,.57616],105:[0,.65952,0,0,.34451],106:[.19444,.65952,.05724,0,.41181],107:[0,.69444,.03148,0,.5206],108:[0,.69444,.01968,.08334,.29838],109:[0,.43056,0,0,.87801],110:[0,.43056,0,0,.60023],111:[0,.43056,0,.05556,.48472],112:[.19444,.43056,0,.08334,.50313],113:[.19444,.43056,.03588,.08334,.44641],114:[0,.43056,.02778,.05556,.45116],115:[0,.43056,0,.05556,.46875],116:[0,.61508,0,.08334,.36111],117:[0,.43056,0,.02778,.57246],118:[0,.43056,.03588,.02778,.48472],119:[0,.43056,.02691,.08334,.71592],120:[0,.43056,0,.02778,.57153],121:[.19444,.43056,.03588,.05556,.49028],122:[0,.43056,.04398,.05556,.46505],915:[0,.68333,.13889,.08334,.61528],916:[0,.68333,0,.16667,.83334],920:[0,.68333,.02778,.08334,.76278],923:[0,.68333,0,.16667,.69445],926:[0,.68333,.07569,.08334,.74236],928:[0,.68333,.08125,.05556,.83125],931:[0,.68333,.05764,.08334,.77986],933:[0,.68333,.13889,.05556,.58333],934:[0,.68333,0,.08334,.66667],936:[0,.68333,.11,.05556,.61222],937:[0,.68333,.05017,.08334,.7724],945:[0,.43056,.0037,.02778,.6397],946:[.19444,.69444,.05278,.08334,.56563],947:[.19444,.43056,.05556,0,.51773],948:[0,.69444,.03785,.05556,.44444],949:[0,.43056,0,.08334,.46632],950:[.19444,.69444,.07378,.08334,.4375],951:[.19444,.43056,.03588,.05556,.49653],952:[0,.69444,.02778,.08334,.46944],953:[0,.43056,0,.05556,.35394],954:[0,.43056,0,0,.57616],955:[0,.69444,0,0,.58334],956:[.19444,.43056,0,.02778,.60255],957:[0,.43056,.06366,.02778,.49398],958:[.19444,.69444,.04601,.11111,.4375],959:[0,.43056,0,.05556,.48472],960:[0,.43056,.03588,0,.57003],961:[.19444,.43056,0,.08334,.51702],962:[.09722,.43056,.07986,.08334,.36285],963:[0,.43056,.03588,0,.57141],964:[0,.43056,.1132,.02778,.43715],965:[0,.43056,.03588,.02778,.54028],966:[.19444,.43056,0,.08334,.65417],967:[.19444,.43056,0,.05556,.62569],968:[.19444,.69444,.03588,.11111,.65139],969:[0,.43056,.03588,0,.62245],977:[0,.69444,0,.08334,.59144],981:[.19444,.69444,0,.08334,.59583],982:[0,.43056,.02778,0,.82813],1009:[.19444,.43056,0,.08334,.51702],1013:[0,.43056,0,.05556,.4059]},"SansSerif-Bold":{33:[0,.69444,0,0,.36667],34:[0,.69444,0,0,.55834],35:[.19444,.69444,0,0,.91667],36:[.05556,.75,0,0,.55],37:[.05556,.75,0,0,1.02912],38:[0,.69444,0,0,.83056],39:[0,.69444,0,0,.30556],40:[.25,.75,0,0,.42778],41:[.25,.75,0,0,.42778],42:[0,.75,0,0,.55],43:[.11667,.61667,0,0,.85556],44:[.10556,.13056,0,0,.30556],45:[0,.45833,0,0,.36667],46:[0,.13056,0,0,.30556],47:[.25,.75,0,0,.55],48:[0,.69444,0,0,.55],49:[0,.69444,0,0,.55],50:[0,.69444,0,0,.55],51:[0,.69444,0,0,.55],52:[0,.69444,0,0,.55],53:[0,.69444,0,0,.55],54:[0,.69444,0,0,.55],55:[0,.69444,0,0,.55],56:[0,.69444,0,0,.55],57:[0,.69444,0,0,.55],58:[0,.45833,0,0,.30556],59:[.10556,.45833,0,0,.30556],61:[-.09375,.40625,0,0,.85556],63:[0,.69444,0,0,.51945],64:[0,.69444,0,0,.73334],65:[0,.69444,0,0,.73334],66:[0,.69444,0,0,.73334],67:[0,.69444,0,0,.70278],68:[0,.69444,0,0,.79445],69:[0,.69444,0,0,.64167],70:[0,.69444,0,0,.61111],71:[0,.69444,0,0,.73334],72:[0,.69444,0,0,.79445],73:[0,.69444,0,0,.33056],74:[0,.69444,0,0,.51945],75:[0,.69444,0,0,.76389],76:[0,.69444,0,0,.58056],77:[0,.69444,0,0,.97778],78:[0,.69444,0,0,.79445],79:[0,.69444,0,0,.79445],80:[0,.69444,0,0,.70278],81:[.10556,.69444,0,0,.79445],82:[0,.69444,0,0,.70278],83:[0,.69444,0,0,.61111],84:[0,.69444,0,0,.73334],85:[0,.69444,0,0,.76389],86:[0,.69444,.01528,0,.73334],87:[0,.69444,.01528,0,1.03889],88:[0,.69444,0,0,.73334],89:[0,.69444,.0275,0,.73334],90:[0,.69444,0,0,.67223],91:[.25,.75,0,0,.34306],93:[.25,.75,0,0,.34306],94:[0,.69444,0,0,.55],95:[.35,.10833,.03056,0,.55],97:[0,.45833,0,0,.525],98:[0,.69444,0,0,.56111],99:[0,.45833,0,0,.48889],100:[0,.69444,0,0,.56111],101:[0,.45833,0,0,.51111],102:[0,.69444,.07639,0,.33611],103:[.19444,.45833,.01528,0,.55],104:[0,.69444,0,0,.56111],105:[0,.69444,0,0,.25556],106:[.19444,.69444,0,0,.28611],107:[0,.69444,0,0,.53056],108:[0,.69444,0,0,.25556],109:[0,.45833,0,0,.86667],110:[0,.45833,0,0,.56111],111:[0,.45833,0,0,.55],112:[.19444,.45833,0,0,.56111],113:[.19444,.45833,0,0,.56111],114:[0,.45833,.01528,0,.37222],115:[0,.45833,0,0,.42167],116:[0,.58929,0,0,.40417],117:[0,.45833,0,0,.56111],118:[0,.45833,.01528,0,.5],119:[0,.45833,.01528,0,.74445],120:[0,.45833,0,0,.5],121:[.19444,.45833,.01528,0,.5],122:[0,.45833,0,0,.47639],126:[.35,.34444,0,0,.55],168:[0,.69444,0,0,.55],176:[0,.69444,0,0,.73334],180:[0,.69444,0,0,.55],184:[.17014,0,0,0,.48889],305:[0,.45833,0,0,.25556],567:[.19444,.45833,0,0,.28611],710:[0,.69444,0,0,.55],711:[0,.63542,0,0,.55],713:[0,.63778,0,0,.55],728:[0,.69444,0,0,.55],729:[0,.69444,0,0,.30556],730:[0,.69444,0,0,.73334],732:[0,.69444,0,0,.55],733:[0,.69444,0,0,.55],915:[0,.69444,0,0,.58056],916:[0,.69444,0,0,.91667],920:[0,.69444,0,0,.85556],923:[0,.69444,0,0,.67223],926:[0,.69444,0,0,.73334],928:[0,.69444,0,0,.79445],931:[0,.69444,0,0,.79445],933:[0,.69444,0,0,.85556],934:[0,.69444,0,0,.79445],936:[0,.69444,0,0,.85556],937:[0,.69444,0,0,.79445],8211:[0,.45833,.03056,0,.55],8212:[0,.45833,.03056,0,1.10001],8216:[0,.69444,0,0,.30556],8217:[0,.69444,0,0,.30556],8220:[0,.69444,0,0,.55834],8221:[0,.69444,0,0,.55834]},"SansSerif-Italic":{33:[0,.69444,.05733,0,.31945],34:[0,.69444,.00316,0,.5],35:[.19444,.69444,.05087,0,.83334],36:[.05556,.75,.11156,0,.5],37:[.05556,.75,.03126,0,.83334],38:[0,.69444,.03058,0,.75834],39:[0,.69444,.07816,0,.27778],40:[.25,.75,.13164,0,.38889],41:[.25,.75,.02536,0,.38889],42:[0,.75,.11775,0,.5],43:[.08333,.58333,.02536,0,.77778],44:[.125,.08333,0,0,.27778],45:[0,.44444,.01946,0,.33333],46:[0,.08333,0,0,.27778],47:[.25,.75,.13164,0,.5],48:[0,.65556,.11156,0,.5],49:[0,.65556,.11156,0,.5],50:[0,.65556,.11156,0,.5],51:[0,.65556,.11156,0,.5],52:[0,.65556,.11156,0,.5],53:[0,.65556,.11156,0,.5],54:[0,.65556,.11156,0,.5],55:[0,.65556,.11156,0,.5],56:[0,.65556,.11156,0,.5],57:[0,.65556,.11156,0,.5],58:[0,.44444,.02502,0,.27778],59:[.125,.44444,.02502,0,.27778],61:[-.13,.37,.05087,0,.77778],63:[0,.69444,.11809,0,.47222],64:[0,.69444,.07555,0,.66667],65:[0,.69444,0,0,.66667],66:[0,.69444,.08293,0,.66667],67:[0,.69444,.11983,0,.63889],68:[0,.69444,.07555,0,.72223],69:[0,.69444,.11983,0,.59722],70:[0,.69444,.13372,0,.56945],71:[0,.69444,.11983,0,.66667],72:[0,.69444,.08094,0,.70834],73:[0,.69444,.13372,0,.27778],74:[0,.69444,.08094,0,.47222],75:[0,.69444,.11983,0,.69445],76:[0,.69444,0,0,.54167],77:[0,.69444,.08094,0,.875],78:[0,.69444,.08094,0,.70834],79:[0,.69444,.07555,0,.73611],80:[0,.69444,.08293,0,.63889],81:[.125,.69444,.07555,0,.73611],82:[0,.69444,.08293,0,.64584],83:[0,.69444,.09205,0,.55556],84:[0,.69444,.13372,0,.68056],85:[0,.69444,.08094,0,.6875],86:[0,.69444,.1615,0,.66667],87:[0,.69444,.1615,0,.94445],88:[0,.69444,.13372,0,.66667],89:[0,.69444,.17261,0,.66667],90:[0,.69444,.11983,0,.61111],91:[.25,.75,.15942,0,.28889],93:[.25,.75,.08719,0,.28889],94:[0,.69444,.0799,0,.5],95:[.35,.09444,.08616,0,.5],97:[0,.44444,.00981,0,.48056],98:[0,.69444,.03057,0,.51667],99:[0,.44444,.08336,0,.44445],100:[0,.69444,.09483,0,.51667],101:[0,.44444,.06778,0,.44445],102:[0,.69444,.21705,0,.30556],103:[.19444,.44444,.10836,0,.5],104:[0,.69444,.01778,0,.51667],105:[0,.67937,.09718,0,.23889],106:[.19444,.67937,.09162,0,.26667],107:[0,.69444,.08336,0,.48889],108:[0,.69444,.09483,0,.23889],109:[0,.44444,.01778,0,.79445],110:[0,.44444,.01778,0,.51667],111:[0,.44444,.06613,0,.5],112:[.19444,.44444,.0389,0,.51667],113:[.19444,.44444,.04169,0,.51667],114:[0,.44444,.10836,0,.34167],115:[0,.44444,.0778,0,.38333],116:[0,.57143,.07225,0,.36111],117:[0,.44444,.04169,0,.51667],118:[0,.44444,.10836,0,.46111],119:[0,.44444,.10836,0,.68334],120:[0,.44444,.09169,0,.46111],121:[.19444,.44444,.10836,0,.46111],122:[0,.44444,.08752,0,.43472],126:[.35,.32659,.08826,0,.5],168:[0,.67937,.06385,0,.5],176:[0,.69444,0,0,.73752],184:[.17014,0,0,0,.44445],305:[0,.44444,.04169,0,.23889],567:[.19444,.44444,.04169,0,.26667],710:[0,.69444,.0799,0,.5],711:[0,.63194,.08432,0,.5],713:[0,.60889,.08776,0,.5],714:[0,.69444,.09205,0,.5],715:[0,.69444,0,0,.5],728:[0,.69444,.09483,0,.5],729:[0,.67937,.07774,0,.27778],730:[0,.69444,0,0,.73752],732:[0,.67659,.08826,0,.5],733:[0,.69444,.09205,0,.5],915:[0,.69444,.13372,0,.54167],916:[0,.69444,0,0,.83334],920:[0,.69444,.07555,0,.77778],923:[0,.69444,0,0,.61111],926:[0,.69444,.12816,0,.66667],928:[0,.69444,.08094,0,.70834],931:[0,.69444,.11983,0,.72222],933:[0,.69444,.09031,0,.77778],934:[0,.69444,.04603,0,.72222],936:[0,.69444,.09031,0,.77778],937:[0,.69444,.08293,0,.72222],8211:[0,.44444,.08616,0,.5],8212:[0,.44444,.08616,0,1],8216:[0,.69444,.07816,0,.27778],8217:[0,.69444,.07816,0,.27778],8220:[0,.69444,.14205,0,.5],8221:[0,.69444,.00316,0,.5]},"SansSerif-Regular":{33:[0,.69444,0,0,.31945],34:[0,.69444,0,0,.5],35:[.19444,.69444,0,0,.83334],36:[.05556,.75,0,0,.5],37:[.05556,.75,0,0,.83334],38:[0,.69444,0,0,.75834],39:[0,.69444,0,0,.27778],40:[.25,.75,0,0,.38889],41:[.25,.75,0,0,.38889],42:[0,.75,0,0,.5],43:[.08333,.58333,0,0,.77778],44:[.125,.08333,0,0,.27778],45:[0,.44444,0,0,.33333],46:[0,.08333,0,0,.27778],47:[.25,.75,0,0,.5],48:[0,.65556,0,0,.5],49:[0,.65556,0,0,.5],50:[0,.65556,0,0,.5],51:[0,.65556,0,0,.5],52:[0,.65556,0,0,.5],53:[0,.65556,0,0,.5],54:[0,.65556,0,0,.5],55:[0,.65556,0,0,.5],56:[0,.65556,0,0,.5],57:[0,.65556,0,0,.5],58:[0,.44444,0,0,.27778],59:[.125,.44444,0,0,.27778],61:[-.13,.37,0,0,.77778],63:[0,.69444,0,0,.47222],64:[0,.69444,0,0,.66667],65:[0,.69444,0,0,.66667],66:[0,.69444,0,0,.66667],67:[0,.69444,0,0,.63889],68:[0,.69444,0,0,.72223],69:[0,.69444,0,0,.59722],70:[0,.69444,0,0,.56945],71:[0,.69444,0,0,.66667],72:[0,.69444,0,0,.70834],73:[0,.69444,0,0,.27778],74:[0,.69444,0,0,.47222],75:[0,.69444,0,0,.69445],76:[0,.69444,0,0,.54167],77:[0,.69444,0,0,.875],78:[0,.69444,0,0,.70834],79:[0,.69444,0,0,.73611],80:[0,.69444,0,0,.63889],81:[.125,.69444,0,0,.73611],82:[0,.69444,0,0,.64584],83:[0,.69444,0,0,.55556],84:[0,.69444,0,0,.68056],85:[0,.69444,0,0,.6875],86:[0,.69444,.01389,0,.66667],87:[0,.69444,.01389,0,.94445],88:[0,.69444,0,0,.66667],89:[0,.69444,.025,0,.66667],90:[0,.69444,0,0,.61111],91:[.25,.75,0,0,.28889],93:[.25,.75,0,0,.28889],94:[0,.69444,0,0,.5],95:[.35,.09444,.02778,0,.5],97:[0,.44444,0,0,.48056],98:[0,.69444,0,0,.51667],99:[0,.44444,0,0,.44445],100:[0,.69444,0,0,.51667],101:[0,.44444,0,0,.44445],102:[0,.69444,.06944,0,.30556],103:[.19444,.44444,.01389,0,.5],104:[0,.69444,0,0,.51667],105:[0,.67937,0,0,.23889],106:[.19444,.67937,0,0,.26667],107:[0,.69444,0,0,.48889],108:[0,.69444,0,0,.23889],109:[0,.44444,0,0,.79445],110:[0,.44444,0,0,.51667],111:[0,.44444,0,0,.5],112:[.19444,.44444,0,0,.51667],113:[.19444,.44444,0,0,.51667],114:[0,.44444,.01389,0,.34167],115:[0,.44444,0,0,.38333],116:[0,.57143,0,0,.36111],117:[0,.44444,0,0,.51667],118:[0,.44444,.01389,0,.46111],119:[0,.44444,.01389,0,.68334],120:[0,.44444,0,0,.46111],121:[.19444,.44444,.01389,0,.46111],122:[0,.44444,0,0,.43472],126:[.35,.32659,0,0,.5],168:[0,.67937,0,0,.5],176:[0,.69444,0,0,.66667],184:[.17014,0,0,0,.44445],305:[0,.44444,0,0,.23889],567:[.19444,.44444,0,0,.26667],710:[0,.69444,0,0,.5],711:[0,.63194,0,0,.5],713:[0,.60889,0,0,.5],714:[0,.69444,0,0,.5],715:[0,.69444,0,0,.5],728:[0,.69444,0,0,.5],729:[0,.67937,0,0,.27778],730:[0,.69444,0,0,.66667],732:[0,.67659,0,0,.5],733:[0,.69444,0,0,.5],915:[0,.69444,0,0,.54167],916:[0,.69444,0,0,.83334],920:[0,.69444,0,0,.77778],923:[0,.69444,0,0,.61111],926:[0,.69444,0,0,.66667],928:[0,.69444,0,0,.70834],931:[0,.69444,0,0,.72222],933:[0,.69444,0,0,.77778],934:[0,.69444,0,0,.72222],936:[0,.69444,0,0,.77778],937:[0,.69444,0,0,.72222],8211:[0,.44444,.02778,0,.5],8212:[0,.44444,.02778,0,1],8216:[0,.69444,0,0,.27778],8217:[0,.69444,0,0,.27778],8220:[0,.69444,0,0,.5],8221:[0,.69444,0,0,.5]},"Script-Regular":{65:[0,.7,.22925,0,.80253],66:[0,.7,.04087,0,.90757],67:[0,.7,.1689,0,.66619],68:[0,.7,.09371,0,.77443],69:[0,.7,.18583,0,.56162],70:[0,.7,.13634,0,.89544],71:[0,.7,.17322,0,.60961],72:[0,.7,.29694,0,.96919],73:[0,.7,.19189,0,.80907],74:[.27778,.7,.19189,0,1.05159],75:[0,.7,.31259,0,.91364],76:[0,.7,.19189,0,.87373],77:[0,.7,.15981,0,1.08031],78:[0,.7,.3525,0,.9015],79:[0,.7,.08078,0,.73787],80:[0,.7,.08078,0,1.01262],81:[0,.7,.03305,0,.88282],82:[0,.7,.06259,0,.85],83:[0,.7,.19189,0,.86767],84:[0,.7,.29087,0,.74697],85:[0,.7,.25815,0,.79996],86:[0,.7,.27523,0,.62204],87:[0,.7,.27523,0,.80532],88:[0,.7,.26006,0,.94445],89:[0,.7,.2939,0,.70961],90:[0,.7,.24037,0,.8212]},"Size1-Regular":{40:[.35001,.85,0,0,.45834],41:[.35001,.85,0,0,.45834],47:[.35001,.85,0,0,.57778],91:[.35001,.85,0,0,.41667],92:[.35001,.85,0,0,.57778],93:[.35001,.85,0,0,.41667],123:[.35001,.85,0,0,.58334],125:[.35001,.85,0,0,.58334],710:[0,.72222,0,0,.55556],732:[0,.72222,0,0,.55556],770:[0,.72222,0,0,.55556],771:[0,.72222,0,0,.55556],8214:[-99e-5,.601,0,0,.77778],8593:[1e-5,.6,0,0,.66667],8595:[1e-5,.6,0,0,.66667],8657:[1e-5,.6,0,0,.77778],8659:[1e-5,.6,0,0,.77778],8719:[.25001,.75,0,0,.94445],8720:[.25001,.75,0,0,.94445],8721:[.25001,.75,0,0,1.05556],8730:[.35001,.85,0,0,1],8739:[-.00599,.606,0,0,.33333],8741:[-.00599,.606,0,0,.55556],8747:[.30612,.805,.19445,0,.47222],8748:[.306,.805,.19445,0,.47222],8749:[.306,.805,.19445,0,.47222],8750:[.30612,.805,.19445,0,.47222],8896:[.25001,.75,0,0,.83334],8897:[.25001,.75,0,0,.83334],8898:[.25001,.75,0,0,.83334],8899:[.25001,.75,0,0,.83334],8968:[.35001,.85,0,0,.47222],8969:[.35001,.85,0,0,.47222],8970:[.35001,.85,0,0,.47222],8971:[.35001,.85,0,0,.47222],9168:[-99e-5,.601,0,0,.66667],10216:[.35001,.85,0,0,.47222],10217:[.35001,.85,0,0,.47222],10752:[.25001,.75,0,0,1.11111],10753:[.25001,.75,0,0,1.11111],10754:[.25001,.75,0,0,1.11111],10756:[.25001,.75,0,0,.83334],10758:[.25001,.75,0,0,.83334]},"Size2-Regular":{40:[.65002,1.15,0,0,.59722],41:[.65002,1.15,0,0,.59722],47:[.65002,1.15,0,0,.81111],91:[.65002,1.15,0,0,.47222],92:[.65002,1.15,0,0,.81111],93:[.65002,1.15,0,0,.47222],123:[.65002,1.15,0,0,.66667],125:[.65002,1.15,0,0,.66667],710:[0,.75,0,0,1],732:[0,.75,0,0,1],770:[0,.75,0,0,1],771:[0,.75,0,0,1],8719:[.55001,1.05,0,0,1.27778],8720:[.55001,1.05,0,0,1.27778],8721:[.55001,1.05,0,0,1.44445],8730:[.65002,1.15,0,0,1],8747:[.86225,1.36,.44445,0,.55556],8748:[.862,1.36,.44445,0,.55556],8749:[.862,1.36,.44445,0,.55556],8750:[.86225,1.36,.44445,0,.55556],8896:[.55001,1.05,0,0,1.11111],8897:[.55001,1.05,0,0,1.11111],8898:[.55001,1.05,0,0,1.11111],8899:[.55001,1.05,0,0,1.11111],8968:[.65002,1.15,0,0,.52778],8969:[.65002,1.15,0,0,.52778],8970:[.65002,1.15,0,0,.52778],8971:[.65002,1.15,0,0,.52778],10216:[.65002,1.15,0,0,.61111],10217:[.65002,1.15,0,0,.61111],10752:[.55001,1.05,0,0,1.51112],10753:[.55001,1.05,0,0,1.51112],10754:[.55001,1.05,0,0,1.51112],10756:[.55001,1.05,0,0,1.11111],10758:[.55001,1.05,0,0,1.11111]},"Size3-Regular":{40:[.95003,1.45,0,0,.73611],41:[.95003,1.45,0,0,.73611],47:[.95003,1.45,0,0,1.04445],91:[.95003,1.45,0,0,.52778],92:[.95003,1.45,0,0,1.04445],93:[.95003,1.45,0,0,.52778],123:[.95003,1.45,0,0,.75],125:[.95003,1.45,0,0,.75],710:[0,.75,0,0,1.44445],732:[0,.75,0,0,1.44445],770:[0,.75,0,0,1.44445],771:[0,.75,0,0,1.44445],8730:[.95003,1.45,0,0,1],8968:[.95003,1.45,0,0,.58334],8969:[.95003,1.45,0,0,.58334],8970:[.95003,1.45,0,0,.58334],8971:[.95003,1.45,0,0,.58334],10216:[.95003,1.45,0,0,.75],10217:[.95003,1.45,0,0,.75]},"Size4-Regular":{40:[1.25003,1.75,0,0,.79167],41:[1.25003,1.75,0,0,.79167],47:[1.25003,1.75,0,0,1.27778],91:[1.25003,1.75,0,0,.58334],92:[1.25003,1.75,0,0,1.27778],93:[1.25003,1.75,0,0,.58334],123:[1.25003,1.75,0,0,.80556],125:[1.25003,1.75,0,0,.80556],710:[0,.825,0,0,1.8889],732:[0,.825,0,0,1.8889],770:[0,.825,0,0,1.8889],771:[0,.825,0,0,1.8889],8730:[1.25003,1.75,0,0,1],8968:[1.25003,1.75,0,0,.63889],8969:[1.25003,1.75,0,0,.63889],8970:[1.25003,1.75,0,0,.63889],8971:[1.25003,1.75,0,0,.63889],9115:[.64502,1.155,0,0,.875],9116:[1e-5,.6,0,0,.875],9117:[.64502,1.155,0,0,.875],9118:[.64502,1.155,0,0,.875],9119:[1e-5,.6,0,0,.875],9120:[.64502,1.155,0,0,.875],9121:[.64502,1.155,0,0,.66667],9122:[-99e-5,.601,0,0,.66667],9123:[.64502,1.155,0,0,.66667],9124:[.64502,1.155,0,0,.66667],9125:[-99e-5,.601,0,0,.66667],9126:[.64502,1.155,0,0,.66667],9127:[1e-5,.9,0,0,.88889],9128:[.65002,1.15,0,0,.88889],9129:[.90001,0,0,0,.88889],9130:[0,.3,0,0,.88889],9131:[1e-5,.9,0,0,.88889],9132:[.65002,1.15,0,0,.88889],9133:[.90001,0,0,0,.88889],9143:[.88502,.915,0,0,1.05556],10216:[1.25003,1.75,0,0,.80556],10217:[1.25003,1.75,0,0,.80556],57344:[-.00499,.605,0,0,1.05556],57345:[-.00499,.605,0,0,1.05556],57680:[0,.12,0,0,.45],57681:[0,.12,0,0,.45],57682:[0,.12,0,0,.45],57683:[0,.12,0,0,.45]},"Typewriter-Regular":{32:[0,0,0,0,.525],33:[0,.61111,0,0,.525],34:[0,.61111,0,0,.525],35:[0,.61111,0,0,.525],36:[.08333,.69444,0,0,.525],37:[.08333,.69444,0,0,.525],38:[0,.61111,0,0,.525],39:[0,.61111,0,0,.525],40:[.08333,.69444,0,0,.525],41:[.08333,.69444,0,0,.525],42:[0,.52083,0,0,.525],43:[-.08056,.53055,0,0,.525],44:[.13889,.125,0,0,.525],45:[-.08056,.53055,0,0,.525],46:[0,.125,0,0,.525],47:[.08333,.69444,0,0,.525],48:[0,.61111,0,0,.525],49:[0,.61111,0,0,.525],50:[0,.61111,0,0,.525],51:[0,.61111,0,0,.525],52:[0,.61111,0,0,.525],53:[0,.61111,0,0,.525],54:[0,.61111,0,0,.525],55:[0,.61111,0,0,.525],56:[0,.61111,0,0,.525],57:[0,.61111,0,0,.525],58:[0,.43056,0,0,.525],59:[.13889,.43056,0,0,.525],60:[-.05556,.55556,0,0,.525],61:[-.19549,.41562,0,0,.525],62:[-.05556,.55556,0,0,.525],63:[0,.61111,0,0,.525],64:[0,.61111,0,0,.525],65:[0,.61111,0,0,.525],66:[0,.61111,0,0,.525],67:[0,.61111,0,0,.525],68:[0,.61111,0,0,.525],69:[0,.61111,0,0,.525],70:[0,.61111,0,0,.525],71:[0,.61111,0,0,.525],72:[0,.61111,0,0,.525],73:[0,.61111,0,0,.525],74:[0,.61111,0,0,.525],75:[0,.61111,0,0,.525],76:[0,.61111,0,0,.525],77:[0,.61111,0,0,.525],78:[0,.61111,0,0,.525],79:[0,.61111,0,0,.525],80:[0,.61111,0,0,.525],81:[.13889,.61111,0,0,.525],82:[0,.61111,0,0,.525],83:[0,.61111,0,0,.525],84:[0,.61111,0,0,.525],85:[0,.61111,0,0,.525],86:[0,.61111,0,0,.525],87:[0,.61111,0,0,.525],88:[0,.61111,0,0,.525],89:[0,.61111,0,0,.525],90:[0,.61111,0,0,.525],91:[.08333,.69444,0,0,.525],92:[.08333,.69444,0,0,.525],93:[.08333,.69444,0,0,.525],94:[0,.61111,0,0,.525],95:[.09514,0,0,0,.525],96:[0,.61111,0,0,.525],97:[0,.43056,0,0,.525],98:[0,.61111,0,0,.525],99:[0,.43056,0,0,.525],100:[0,.61111,0,0,.525],101:[0,.43056,0,0,.525],102:[0,.61111,0,0,.525],103:[.22222,.43056,0,0,.525],104:[0,.61111,0,0,.525],105:[0,.61111,0,0,.525],106:[.22222,.61111,0,0,.525],107:[0,.61111,0,0,.525],108:[0,.61111,0,0,.525],109:[0,.43056,0,0,.525],110:[0,.43056,0,0,.525],111:[0,.43056,0,0,.525],112:[.22222,.43056,0,0,.525],113:[.22222,.43056,0,0,.525],114:[0,.43056,0,0,.525],115:[0,.43056,0,0,.525],116:[0,.55358,0,0,.525],117:[0,.43056,0,0,.525],118:[0,.43056,0,0,.525],119:[0,.43056,0,0,.525],120:[0,.43056,0,0,.525],121:[.22222,.43056,0,0,.525],122:[0,.43056,0,0,.525],123:[.08333,.69444,0,0,.525],124:[.08333,.69444,0,0,.525],125:[.08333,.69444,0,0,.525],126:[0,.61111,0,0,.525],127:[0,.61111,0,0,.525],160:[0,0,0,0,.525],176:[0,.61111,0,0,.525],184:[.19445,0,0,0,.525],305:[0,.43056,0,0,.525],567:[.22222,.43056,0,0,.525],711:[0,.56597,0,0,.525],713:[0,.56555,0,0,.525],714:[0,.61111,0,0,.525],715:[0,.61111,0,0,.525],728:[0,.61111,0,0,.525],730:[0,.61111,0,0,.525],770:[0,.61111,0,0,.525],771:[0,.61111,0,0,.525],776:[0,.61111,0,0,.525],915:[0,.61111,0,0,.525],916:[0,.61111,0,0,.525],920:[0,.61111,0,0,.525],923:[0,.61111,0,0,.525],926:[0,.61111,0,0,.525],928:[0,.61111,0,0,.525],931:[0,.61111,0,0,.525],933:[0,.61111,0,0,.525],934:[0,.61111,0,0,.525],936:[0,.61111,0,0,.525],937:[0,.61111,0,0,.525],8216:[0,.61111,0,0,.525],8217:[0,.61111,0,0,.525],8242:[0,.61111,0,0,.525],9251:[.11111,.21944,0,0,.525]}},V={slant:[.25,.25,.25],space:[0,0,0],stretch:[0,0,0],shrink:[0,0,0],xHeight:[.431,.431,.431],quad:[1,1.171,1.472],extraSpace:[0,0,0],num1:[.677,.732,.925],num2:[.394,.384,.387],num3:[.444,.471,.504],denom1:[.686,.752,1.025],denom2:[.345,.344,.532],sup1:[.413,.503,.504],sup2:[.363,.431,.404],sup3:[.289,.286,.294],sub1:[.15,.143,.2],sub2:[.247,.286,.4],supDrop:[.386,.353,.494],subDrop:[.05,.071,.1],delim1:[2.39,1.7,1.98],delim2:[1.01,1.157,1.42],axisHeight:[.25,.25,.25],defaultRuleThickness:[.04,.049,.049],bigOpSpacing1:[.111,.111,.111],bigOpSpacing2:[.166,.166,.166],bigOpSpacing3:[.2,.2,.2],bigOpSpacing4:[.6,.611,.611],bigOpSpacing5:[.1,.143,.143],sqrtRuleThickness:[.04,.04,.04],ptPerEm:[10,10,10],doubleRuleSep:[.2,.2,.2],arrayRuleWidth:[.04,.04,.04],fboxsep:[.3,.3,.3],fboxrule:[.04,.04,.04]},U={"\xc5":"A","\xc7":"C","\xd0":"D","\xde":"o","\xe5":"a","\xe7":"c","\xf0":"d","\xfe":"o","\u0410":"A","\u0411":"B","\u0412":"B","\u0413":"F","\u0414":"A","\u0415":"E","\u0416":"K","\u0417":"3","\u0418":"N","\u0419":"N","\u041a":"K","\u041b":"N","\u041c":"M","\u041d":"H","\u041e":"O","\u041f":"N","\u0420":"P","\u0421":"C","\u0422":"T","\u0423":"y","\u0424":"O","\u0425":"X","\u0426":"U","\u0427":"h","\u0428":"W","\u0429":"W","\u042a":"B","\u042b":"X","\u042c":"B","\u042d":"3","\u042e":"X","\u042f":"R","\u0430":"a","\u0431":"b","\u0432":"a","\u0433":"r","\u0434":"y","\u0435":"e","\u0436":"m","\u0437":"e","\u0438":"n","\u0439":"n","\u043a":"n","\u043b":"n","\u043c":"m","\u043d":"n","\u043e":"o","\u043f":"n","\u0440":"p","\u0441":"c","\u0442":"o","\u0443":"y","\u0444":"b","\u0445":"x","\u0446":"n","\u0447":"n","\u0448":"w","\u0449":"w","\u044a":"a","\u044b":"m","\u044c":"a","\u044d":"e","\u044e":"m","\u044f":"r"};function G(t,e,r){if(!F[e])throw new Error("Font metrics not found for font: "+e+".");var a=t.charCodeAt(0),n=F[e][a];if(!n&&t[0]in U&&(a=U[t[0]].charCodeAt(0),n=F[e][a]),n||"text"!==r||M(a)&&(n=F[e][77]),n)return{depth:n[0],height:n[1],italic:n[2],skew:n[3],width:n[4]}}var Y={};var W={bin:1,close:1,inner:1,open:1,punct:1,rel:1},X={"accent-token":1,mathord:1,"op-token":1,spacing:1,textord:1},_={math:{},text:{}},j=_;function $(t,e,r,a,n,i){_[t][n]={font:e,group:r,replace:a},i&&a&&(_[t][a]=_[t][n])}var Z="main",K="ams",J="bin",Q="mathord",tt="op-token",et="rel";$("math",Z,et,"\u2261","\\equiv",!0),$("math",Z,et,"\u227a","\\prec",!0),$("math",Z,et,"\u227b","\\succ",!0),$("math",Z,et,"\u223c","\\sim",!0),$("math",Z,et,"\u22a5","\\perp"),$("math",Z,et,"\u2aaf","\\preceq",!0),$("math",Z,et,"\u2ab0","\\succeq",!0),$("math",Z,et,"\u2243","\\simeq",!0),$("math",Z,et,"\u2223","\\mid",!0),$("math",Z,et,"\u226a","\\ll",!0),$("math",Z,et,"\u226b","\\gg",!0),$("math",Z,et,"\u224d","\\asymp",!0),$("math",Z,et,"\u2225","\\parallel"),$("math",Z,et,"\u22c8","\\bowtie",!0),$("math",Z,et,"\u2323","\\smile",!0),$("math",Z,et,"\u2291","\\sqsubseteq",!0),$("math",Z,et,"\u2292","\\sqsupseteq",!0),$("math",Z,et,"\u2250","\\doteq",!0),$("math",Z,et,"\u2322","\\frown",!0),$("math",Z,et,"\u220b","\\ni",!0),$("math",Z,et,"\u221d","\\propto",!0),$("math",Z,et,"\u22a2","\\vdash",!0),$("math",Z,et,"\u22a3","\\dashv",!0),$("math",Z,et,"\u220b","\\owns"),$("math",Z,"punct",".","\\ldotp"),$("math",Z,"punct","\u22c5","\\cdotp"),$("math",Z,"textord","#","\\#"),$("text",Z,"textord","#","\\#"),$("math",Z,"textord","&","\\&"),$("text",Z,"textord","&","\\&"),$("math",Z,"textord","\u2135","\\aleph",!0),$("math",Z,"textord","\u2200","\\forall",!0),$("math",Z,"textord","\u210f","\\hbar",!0),$("math",Z,"textord","\u2203","\\exists",!0),$("math",Z,"textord","\u2207","\\nabla",!0),$("math",Z,"textord","\u266d","\\flat",!0),$("math",Z,"textord","\u2113","\\ell",!0),$("math",Z,"textord","\u266e","\\natural",!0),$("math",Z,"textord","\u2663","\\clubsuit",!0),$("math",Z,"textord","\u2118","\\wp",!0),$("math",Z,"textord","\u266f","\\sharp",!0),$("math",Z,"textord","\u2662","\\diamondsuit",!0),$("math",Z,"textord","\u211c","\\Re",!0),$("math",Z,"textord","\u2661","\\heartsuit",!0),$("math",Z,"textord","\u2111","\\Im",!0),$("math",Z,"textord","\u2660","\\spadesuit",!0),$("text",Z,"textord","\xa7","\\S",!0),$("text",Z,"textord","\xb6","\\P",!0),$("math",Z,"textord","\u2020","\\dag"),$("text",Z,"textord","\u2020","\\dag"),$("text",Z,"textord","\u2020","\\textdagger"),$("math",Z,"textord","\u2021","\\ddag"),$("text",Z,"textord","\u2021","\\ddag"),$("text",Z,"textord","\u2021","\\textdaggerdbl"),$("math",Z,"close","\u23b1","\\rmoustache",!0),$("math",Z,"open","\u23b0","\\lmoustache",!0),$("math",Z,"close","\u27ef","\\rgroup",!0),$("math",Z,"open","\u27ee","\\lgroup",!0),$("math",Z,J,"\u2213","\\mp",!0),$("math",Z,J,"\u2296","\\ominus",!0),$("math",Z,J,"\u228e","\\uplus",!0),$("math",Z,J,"\u2293","\\sqcap",!0),$("math",Z,J,"\u2217","\\ast"),$("math",Z,J,"\u2294","\\sqcup",!0),$("math",Z,J,"\u25ef","\\bigcirc"),$("math",Z,J,"\u2219","\\bullet"),$("math",Z,J,"\u2021","\\ddagger"),$("math",Z,J,"\u2240","\\wr",!0),$("math",Z,J,"\u2a3f","\\amalg"),$("math",Z,J,"&","\\And"),$("math",Z,et,"\u27f5","\\longleftarrow",!0),$("math",Z,et,"\u21d0","\\Leftarrow",!0),$("math",Z,et,"\u27f8","\\Longleftarrow",!0),$("math",Z,et,"\u27f6","\\longrightarrow",!0),$("math",Z,et,"\u21d2","\\Rightarrow",!0),$("math",Z,et,"\u27f9","\\Longrightarrow",!0),$("math",Z,et,"\u2194","\\leftrightarrow",!0),$("math",Z,et,"\u27f7","\\longleftrightarrow",!0),$("math",Z,et,"\u21d4","\\Leftrightarrow",!0),$("math",Z,et,"\u27fa","\\Longleftrightarrow",!0),$("math",Z,et,"\u21a6","\\mapsto",!0),$("math",Z,et,"\u27fc","\\longmapsto",!0),$("math",Z,et,"\u2197","\\nearrow",!0),$("math",Z,et,"\u21a9","\\hookleftarrow",!0),$("math",Z,et,"\u21aa","\\hookrightarrow",!0),$("math",Z,et,"\u2198","\\searrow",!0),$("math",Z,et,"\u21bc","\\leftharpoonup",!0),$("math",Z,et,"\u21c0","\\rightharpoonup",!0),$("math",Z,et,"\u2199","\\swarrow",!0),$("math",Z,et,"\u21bd","\\leftharpoondown",!0),$("math",Z,et,"\u21c1","\\rightharpoondown",!0),$("math",Z,et,"\u2196","\\nwarrow",!0),$("math",Z,et,"\u21cc","\\rightleftharpoons",!0),$("math",K,et,"\u226e","\\nless",!0),$("math",K,et,"\ue010","\\@nleqslant"),$("math",K,et,"\ue011","\\@nleqq"),$("math",K,et,"\u2a87","\\lneq",!0),$("math",K,et,"\u2268","\\lneqq",!0),$("math",K,et,"\ue00c","\\@lvertneqq"),$("math",K,et,"\u22e6","\\lnsim",!0),$("math",K,et,"\u2a89","\\lnapprox",!0),$("math",K,et,"\u2280","\\nprec",!0),$("math",K,et,"\u22e0","\\npreceq",!0),$("math",K,et,"\u22e8","\\precnsim",!0),$("math",K,et,"\u2ab9","\\precnapprox",!0),$("math",K,et,"\u2241","\\nsim",!0),$("math",K,et,"\ue006","\\@nshortmid"),$("math",K,et,"\u2224","\\nmid",!0),$("math",K,et,"\u22ac","\\nvdash",!0),$("math",K,et,"\u22ad","\\nvDash",!0),$("math",K,et,"\u22ea","\\ntriangleleft"),$("math",K,et,"\u22ec","\\ntrianglelefteq",!0),$("math",K,et,"\u228a","\\subsetneq",!0),$("math",K,et,"\ue01a","\\@varsubsetneq"),$("math",K,et,"\u2acb","\\subsetneqq",!0),$("math",K,et,"\ue017","\\@varsubsetneqq"),$("math",K,et,"\u226f","\\ngtr",!0),$("math",K,et,"\ue00f","\\@ngeqslant"),$("math",K,et,"\ue00e","\\@ngeqq"),$("math",K,et,"\u2a88","\\gneq",!0),$("math",K,et,"\u2269","\\gneqq",!0),$("math",K,et,"\ue00d","\\@gvertneqq"),$("math",K,et,"\u22e7","\\gnsim",!0),$("math",K,et,"\u2a8a","\\gnapprox",!0),$("math",K,et,"\u2281","\\nsucc",!0),$("math",K,et,"\u22e1","\\nsucceq",!0),$("math",K,et,"\u22e9","\\succnsim",!0),$("math",K,et,"\u2aba","\\succnapprox",!0),$("math",K,et,"\u2246","\\ncong",!0),$("math",K,et,"\ue007","\\@nshortparallel"),$("math",K,et,"\u2226","\\nparallel",!0),$("math",K,et,"\u22af","\\nVDash",!0),$("math",K,et,"\u22eb","\\ntriangleright"),$("math",K,et,"\u22ed","\\ntrianglerighteq",!0),$("math",K,et,"\ue018","\\@nsupseteqq"),$("math",K,et,"\u228b","\\supsetneq",!0),$("math",K,et,"\ue01b","\\@varsupsetneq"),$("math",K,et,"\u2acc","\\supsetneqq",!0),$("math",K,et,"\ue019","\\@varsupsetneqq"),$("math",K,et,"\u22ae","\\nVdash",!0),$("math",K,et,"\u2ab5","\\precneqq",!0),$("math",K,et,"\u2ab6","\\succneqq",!0),$("math",K,et,"\ue016","\\@nsubseteqq"),$("math",K,J,"\u22b4","\\unlhd"),$("math",K,J,"\u22b5","\\unrhd"),$("math",K,et,"\u219a","\\nleftarrow",!0),$("math",K,et,"\u219b","\\nrightarrow",!0),$("math",K,et,"\u21cd","\\nLeftarrow",!0),$("math",K,et,"\u21cf","\\nRightarrow",!0),$("math",K,et,"\u21ae","\\nleftrightarrow",!0),$("math",K,et,"\u21ce","\\nLeftrightarrow",!0),$("math",K,et,"\u25b3","\\vartriangle"),$("math",K,"textord","\u210f","\\hslash"),$("math",K,"textord","\u25bd","\\triangledown"),$("math",K,"textord","\u25ca","\\lozenge"),$("math",K,"textord","\u24c8","\\circledS"),$("math",K,"textord","\xae","\\circledR"),$("text",K,"textord","\xae","\\circledR"),$("math",K,"textord","\u2221","\\measuredangle",!0),$("math",K,"textord","\u2204","\\nexists"),$("math",K,"textord","\u2127","\\mho"),$("math",K,"textord","\u2132","\\Finv",!0),$("math",K,"textord","\u2141","\\Game",!0),$("math",K,"textord","\u2035","\\backprime"),$("math",K,"textord","\u25b2","\\blacktriangle"),$("math",K,"textord","\u25bc","\\blacktriangledown"),$("math",K,"textord","\u25a0","\\blacksquare"),$("math",K,"textord","\u29eb","\\blacklozenge"),$("math",K,"textord","\u2605","\\bigstar"),$("math",K,"textord","\u2222","\\sphericalangle",!0),$("math",K,"textord","\u2201","\\complement",!0),$("math",K,"textord","\xf0","\\eth",!0),$("math",K,"textord","\u2571","\\diagup"),$("math",K,"textord","\u2572","\\diagdown"),$("math",K,"textord","\u25a1","\\square"),$("math",K,"textord","\u25a1","\\Box"),$("math",K,"textord","\u25ca","\\Diamond"),$("math",K,"textord","\xa5","\\yen",!0),$("text",K,"textord","\xa5","\\yen",!0),$("math",K,"textord","\u2713","\\checkmark",!0),$("text",K,"textord","\u2713","\\checkmark"),$("math",K,"textord","\u2136","\\beth",!0),$("math",K,"textord","\u2138","\\daleth",!0),$("math",K,"textord","\u2137","\\gimel",!0),$("math",K,"textord","\u03dd","\\digamma",!0),$("math",K,"textord","\u03f0","\\varkappa"),$("math",K,"open","\u250c","\\ulcorner",!0),$("math",K,"close","\u2510","\\urcorner",!0),$("math",K,"open","\u2514","\\llcorner",!0),$("math",K,"close","\u2518","\\lrcorner",!0),$("math",K,et,"\u2266","\\leqq",!0),$("math",K,et,"\u2a7d","\\leqslant",!0),$("math",K,et,"\u2a95","\\eqslantless",!0),$("math",K,et,"\u2272","\\lesssim",!0),$("math",K,et,"\u2a85","\\lessapprox",!0),$("math",K,et,"\u224a","\\approxeq",!0),$("math",K,J,"\u22d6","\\lessdot"),$("math",K,et,"\u22d8","\\lll",!0),$("math",K,et,"\u2276","\\lessgtr",!0),$("math",K,et,"\u22da","\\lesseqgtr",!0),$("math",K,et,"\u2a8b","\\lesseqqgtr",!0),$("math",K,et,"\u2251","\\doteqdot"),$("math",K,et,"\u2253","\\risingdotseq",!0),$("math",K,et,"\u2252","\\fallingdotseq",!0),$("math",K,et,"\u223d","\\backsim",!0),$("math",K,et,"\u22cd","\\backsimeq",!0),$("math",K,et,"\u2ac5","\\subseteqq",!0),$("math",K,et,"\u22d0","\\Subset",!0),$("math",K,et,"\u228f","\\sqsubset",!0),$("math",K,et,"\u227c","\\preccurlyeq",!0),$("math",K,et,"\u22de","\\curlyeqprec",!0),$("math",K,et,"\u227e","\\precsim",!0),$("math",K,et,"\u2ab7","\\precapprox",!0),$("math",K,et,"\u22b2","\\vartriangleleft"),$("math",K,et,"\u22b4","\\trianglelefteq"),$("math",K,et,"\u22a8","\\vDash",!0),$("math",K,et,"\u22aa","\\Vvdash",!0),$("math",K,et,"\u2323","\\smallsmile"),$("math",K,et,"\u2322","\\smallfrown"),$("math",K,et,"\u224f","\\bumpeq",!0),$("math",K,et,"\u224e","\\Bumpeq",!0),$("math",K,et,"\u2267","\\geqq",!0),$("math",K,et,"\u2a7e","\\geqslant",!0),$("math",K,et,"\u2a96","\\eqslantgtr",!0),$("math",K,et,"\u2273","\\gtrsim",!0),$("math",K,et,"\u2a86","\\gtrapprox",!0),$("math",K,J,"\u22d7","\\gtrdot"),$("math",K,et,"\u22d9","\\ggg",!0),$("math",K,et,"\u2277","\\gtrless",!0),$("math",K,et,"\u22db","\\gtreqless",!0),$("math",K,et,"\u2a8c","\\gtreqqless",!0),$("math",K,et,"\u2256","\\eqcirc",!0),$("math",K,et,"\u2257","\\circeq",!0),$("math",K,et,"\u225c","\\triangleq",!0),$("math",K,et,"\u223c","\\thicksim"),$("math",K,et,"\u2248","\\thickapprox"),$("math",K,et,"\u2ac6","\\supseteqq",!0),$("math",K,et,"\u22d1","\\Supset",!0),$("math",K,et,"\u2290","\\sqsupset",!0),$("math",K,et,"\u227d","\\succcurlyeq",!0),$("math",K,et,"\u22df","\\curlyeqsucc",!0),$("math",K,et,"\u227f","\\succsim",!0),$("math",K,et,"\u2ab8","\\succapprox",!0),$("math",K,et,"\u22b3","\\vartriangleright"),$("math",K,et,"\u22b5","\\trianglerighteq"),$("math",K,et,"\u22a9","\\Vdash",!0),$("math",K,et,"\u2223","\\shortmid"),$("math",K,et,"\u2225","\\shortparallel"),$("math",K,et,"\u226c","\\between",!0),$("math",K,et,"\u22d4","\\pitchfork",!0),$("math",K,et,"\u221d","\\varpropto"),$("math",K,et,"\u25c0","\\blacktriangleleft"),$("math",K,et,"\u2234","\\therefore",!0),$("math",K,et,"\u220d","\\backepsilon"),$("math",K,et,"\u25b6","\\blacktriangleright"),$("math",K,et,"\u2235","\\because",!0),$("math",K,et,"\u22d8","\\llless"),$("math",K,et,"\u22d9","\\gggtr"),$("math",K,J,"\u22b2","\\lhd"),$("math",K,J,"\u22b3","\\rhd"),$("math",K,et,"\u2242","\\eqsim",!0),$("math",Z,et,"\u22c8","\\Join"),$("math",K,et,"\u2251","\\Doteq",!0),$("math",K,J,"\u2214","\\dotplus",!0),$("math",K,J,"\u2216","\\smallsetminus"),$("math",K,J,"\u22d2","\\Cap",!0),$("math",K,J,"\u22d3","\\Cup",!0),$("math",K,J,"\u2a5e","\\doublebarwedge",!0),$("math",K,J,"\u229f","\\boxminus",!0),$("math",K,J,"\u229e","\\boxplus",!0),$("math",K,J,"\u22c7","\\divideontimes",!0),$("math",K,J,"\u22c9","\\ltimes",!0),$("math",K,J,"\u22ca","\\rtimes",!0),$("math",K,J,"\u22cb","\\leftthreetimes",!0),$("math",K,J,"\u22cc","\\rightthreetimes",!0),$("math",K,J,"\u22cf","\\curlywedge",!0),$("math",K,J,"\u22ce","\\curlyvee",!0),$("math",K,J,"\u229d","\\circleddash",!0),$("math",K,J,"\u229b","\\circledast",!0),$("math",K,J,"\u22c5","\\centerdot"),$("math",K,J,"\u22ba","\\intercal",!0),$("math",K,J,"\u22d2","\\doublecap"),$("math",K,J,"\u22d3","\\doublecup"),$("math",K,J,"\u22a0","\\boxtimes",!0),$("math",K,et,"\u21e2","\\dashrightarrow",!0),$("math",K,et,"\u21e0","\\dashleftarrow",!0),$("math",K,et,"\u21c7","\\leftleftarrows",!0),$("math",K,et,"\u21c6","\\leftrightarrows",!0),$("math",K,et,"\u21da","\\Lleftarrow",!0),$("math",K,et,"\u219e","\\twoheadleftarrow",!0),$("math",K,et,"\u21a2","\\leftarrowtail",!0),$("math",K,et,"\u21ab","\\looparrowleft",!0),$("math",K,et,"\u21cb","\\leftrightharpoons",!0),$("math",K,et,"\u21b6","\\curvearrowleft",!0),$("math",K,et,"\u21ba","\\circlearrowleft",!0),$("math",K,et,"\u21b0","\\Lsh",!0),$("math",K,et,"\u21c8","\\upuparrows",!0),$("math",K,et,"\u21bf","\\upharpoonleft",!0),$("math",K,et,"\u21c3","\\downharpoonleft",!0),$("math",K,et,"\u22b8","\\multimap",!0),$("math",K,et,"\u21ad","\\leftrightsquigarrow",!0),$("math",K,et,"\u21c9","\\rightrightarrows",!0),$("math",K,et,"\u21c4","\\rightleftarrows",!0),$("math",K,et,"\u21a0","\\twoheadrightarrow",!0),$("math",K,et,"\u21a3","\\rightarrowtail",!0),$("math",K,et,"\u21ac","\\looparrowright",!0),$("math",K,et,"\u21b7","\\curvearrowright",!0),$("math",K,et,"\u21bb","\\circlearrowright",!0),$("math",K,et,"\u21b1","\\Rsh",!0),$("math",K,et,"\u21ca","\\downdownarrows",!0),$("math",K,et,"\u21be","\\upharpoonright",!0),$("math",K,et,"\u21c2","\\downharpoonright",!0),$("math",K,et,"\u21dd","\\rightsquigarrow",!0),$("math",K,et,"\u21dd","\\leadsto"),$("math",K,et,"\u21db","\\Rrightarrow",!0),$("math",K,et,"\u21be","\\restriction"),$("math",Z,"textord","\u2018","`"),$("math",Z,"textord","$","\\$"),$("text",Z,"textord","$","\\$"),$("text",Z,"textord","$","\\textdollar"),$("math",Z,"textord","%","\\%"),$("text",Z,"textord","%","\\%"),$("math",Z,"textord","_","\\_"),$("text",Z,"textord","_","\\_"),$("text",Z,"textord","_","\\textunderscore"),$("math",Z,"textord","\u2220","\\angle",!0),$("math",Z,"textord","\u221e","\\infty",!0),$("math",Z,"textord","\u2032","\\prime"),$("math",Z,"textord","\u25b3","\\triangle"),$("math",Z,"textord","\u0393","\\Gamma",!0),$("math",Z,"textord","\u0394","\\Delta",!0),$("math",Z,"textord","\u0398","\\Theta",!0),$("math",Z,"textord","\u039b","\\Lambda",!0),$("math",Z,"textord","\u039e","\\Xi",!0),$("math",Z,"textord","\u03a0","\\Pi",!0),$("math",Z,"textord","\u03a3","\\Sigma",!0),$("math",Z,"textord","\u03a5","\\Upsilon",!0),$("math",Z,"textord","\u03a6","\\Phi",!0),$("math",Z,"textord","\u03a8","\\Psi",!0),$("math",Z,"textord","\u03a9","\\Omega",!0),$("math",Z,"textord","A","\u0391"),$("math",Z,"textord","B","\u0392"),$("math",Z,"textord","E","\u0395"),$("math",Z,"textord","Z","\u0396"),$("math",Z,"textord","H","\u0397"),$("math",Z,"textord","I","\u0399"),$("math",Z,"textord","K","\u039a"),$("math",Z,"textord","M","\u039c"),$("math",Z,"textord","N","\u039d"),$("math",Z,"textord","O","\u039f"),$("math",Z,"textord","P","\u03a1"),$("math",Z,"textord","T","\u03a4"),$("math",Z,"textord","X","\u03a7"),$("math",Z,"textord","\xac","\\neg",!0),$("math",Z,"textord","\xac","\\lnot"),$("math",Z,"textord","\u22a4","\\top"),$("math",Z,"textord","\u22a5","\\bot"),$("math",Z,"textord","\u2205","\\emptyset"),$("math",K,"textord","\u2205","\\varnothing"),$("math",Z,Q,"\u03b1","\\alpha",!0),$("math",Z,Q,"\u03b2","\\beta",!0),$("math",Z,Q,"\u03b3","\\gamma",!0),$("math",Z,Q,"\u03b4","\\delta",!0),$("math",Z,Q,"\u03f5","\\epsilon",!0),$("math",Z,Q,"\u03b6","\\zeta",!0),$("math",Z,Q,"\u03b7","\\eta",!0),$("math",Z,Q,"\u03b8","\\theta",!0),$("math",Z,Q,"\u03b9","\\iota",!0),$("math",Z,Q,"\u03ba","\\kappa",!0),$("math",Z,Q,"\u03bb","\\lambda",!0),$("math",Z,Q,"\u03bc","\\mu",!0),$("math",Z,Q,"\u03bd","\\nu",!0),$("math",Z,Q,"\u03be","\\xi",!0),$("math",Z,Q,"\u03bf","\\omicron",!0),$("math",Z,Q,"\u03c0","\\pi",!0),$("math",Z,Q,"\u03c1","\\rho",!0),$("math",Z,Q,"\u03c3","\\sigma",!0),$("math",Z,Q,"\u03c4","\\tau",!0),$("math",Z,Q,"\u03c5","\\upsilon",!0),$("math",Z,Q,"\u03d5","\\phi",!0),$("math",Z,Q,"\u03c7","\\chi",!0),$("math",Z,Q,"\u03c8","\\psi",!0),$("math",Z,Q,"\u03c9","\\omega",!0),$("math",Z,Q,"\u03b5","\\varepsilon",!0),$("math",Z,Q,"\u03d1","\\vartheta",!0),$("math",Z,Q,"\u03d6","\\varpi",!0),$("math",Z,Q,"\u03f1","\\varrho",!0),$("math",Z,Q,"\u03c2","\\varsigma",!0),$("math",Z,Q,"\u03c6","\\varphi",!0),$("math",Z,J,"\u2217","*"),$("math",Z,J,"+","+"),$("math",Z,J,"\u2212","-"),$("math",Z,J,"\u22c5","\\cdot",!0),$("math",Z,J,"\u2218","\\circ"),$("math",Z,J,"\xf7","\\div",!0),$("math",Z,J,"\xb1","\\pm",!0),$("math",Z,J,"\xd7","\\times",!0),$("math",Z,J,"\u2229","\\cap",!0),$("math",Z,J,"\u222a","\\cup",!0),$("math",Z,J,"\u2216","\\setminus"),$("math",Z,J,"\u2227","\\land"),$("math",Z,J,"\u2228","\\lor"),$("math",Z,J,"\u2227","\\wedge",!0),$("math",Z,J,"\u2228","\\vee",!0),$("math",Z,"textord","\u221a","\\surd"),$("math",Z,"open","(","("),$("math",Z,"open","[","["),$("math",Z,"open","\u27e8","\\langle",!0),$("math",Z,"open","\u2223","\\lvert"),$("math",Z,"open","\u2225","\\lVert"),$("math",Z,"close",")",")"),$("math",Z,"close","]","]"),$("math",Z,"close","?","?"),$("math",Z,"close","!","!"),$("math",Z,"close","\u27e9","\\rangle",!0),$("math",Z,"close","\u2223","\\rvert"),$("math",Z,"close","\u2225","\\rVert"),$("math",Z,et,"=","="),$("math",Z,et,"<","<"),$("math",Z,et,">",">"),$("math",Z,et,":",":"),$("math",Z,et,"\u2248","\\approx",!0),$("math",Z,et,"\u2245","\\cong",!0),$("math",Z,et,"\u2265","\\ge"),$("math",Z,et,"\u2265","\\geq",!0),$("math",Z,et,"\u2190","\\gets"),$("math",Z,et,">","\\gt"),$("math",Z,et,"\u2208","\\in",!0),$("math",Z,et,"\ue020","\\@not"),$("math",Z,et,"\u2282","\\subset",!0),$("math",Z,et,"\u2283","\\supset",!0),$("math",Z,et,"\u2286","\\subseteq",!0),$("math",Z,et,"\u2287","\\supseteq",!0),$("math",K,et,"\u2288","\\nsubseteq",!0),$("math",K,et,"\u2289","\\nsupseteq",!0),$("math",Z,et,"\u22a8","\\models"),$("math",Z,et,"\u2190","\\leftarrow",!0),$("math",Z,et,"\u2264","\\le"),$("math",Z,et,"\u2264","\\leq",!0),$("math",Z,et,"<","\\lt"),$("math",Z,et,"\u2192","\\rightarrow",!0),$("math",Z,et,"\u2192","\\to"),$("math",K,et,"\u2271","\\ngeq",!0),$("math",K,et,"\u2270","\\nleq",!0),$("math",Z,"spacing","\xa0","\\ "),$("math",Z,"spacing","\xa0","~"),$("math",Z,"spacing","\xa0","\\space"),$("math",Z,"spacing","\xa0","\\nobreakspace"),$("text",Z,"spacing","\xa0","\\ "),$("text",Z,"spacing","\xa0","~"),$("text",Z,"spacing","\xa0","\\space"),$("text",Z,"spacing","\xa0","\\nobreakspace"),$("math",Z,"spacing",null,"\\nobreak"),$("math",Z,"spacing",null,"\\allowbreak"),$("math",Z,"punct",",",","),$("math",Z,"punct",";",";"),$("math",K,J,"\u22bc","\\barwedge",!0),$("math",K,J,"\u22bb","\\veebar",!0),$("math",Z,J,"\u2299","\\odot",!0),$("math",Z,J,"\u2295","\\oplus",!0),$("math",Z,J,"\u2297","\\otimes",!0),$("math",Z,"textord","\u2202","\\partial",!0),$("math",Z,J,"\u2298","\\oslash",!0),$("math",K,J,"\u229a","\\circledcirc",!0),$("math",K,J,"\u22a1","\\boxdot",!0),$("math",Z,J,"\u25b3","\\bigtriangleup"),$("math",Z,J,"\u25bd","\\bigtriangledown"),$("math",Z,J,"\u2020","\\dagger"),$("math",Z,J,"\u22c4","\\diamond"),$("math",Z,J,"\u22c6","\\star"),$("math",Z,J,"\u25c3","\\triangleleft"),$("math",Z,J,"\u25b9","\\triangleright"),$("math",Z,"open","{","\\{"),$("text",Z,"textord","{","\\{"),$("text",Z,"textord","{","\\textbraceleft"),$("math",Z,"close","}","\\}"),$("text",Z,"textord","}","\\}"),$("text",Z,"textord","}","\\textbraceright"),$("math",Z,"open","{","\\lbrace"),$("math",Z,"close","}","\\rbrace"),$("math",Z,"open","[","\\lbrack"),$("text",Z,"textord","[","\\lbrack"),$("math",Z,"close","]","\\rbrack"),$("text",Z,"textord","]","\\rbrack"),$("math",Z,"open","(","\\lparen"),$("math",Z,"close",")","\\rparen"),$("text",Z,"textord","<","\\textless"),$("text",Z,"textord",">","\\textgreater"),$("math",Z,"open","\u230a","\\lfloor",!0),$("math",Z,"close","\u230b","\\rfloor",!0),$("math",Z,"open","\u2308","\\lceil",!0),$("math",Z,"close","\u2309","\\rceil",!0),$("math",Z,"textord","\\","\\backslash"),$("math",Z,"textord","\u2223","|"),$("math",Z,"textord","\u2223","\\vert"),$("text",Z,"textord","|","\\textbar"),$("math",Z,"textord","\u2225","\\|"),$("math",Z,"textord","\u2225","\\Vert"),$("text",Z,"textord","\u2225","\\textbardbl"),$("text",Z,"textord","~","\\textasciitilde"),$("text",Z,"textord","\\","\\textbackslash"),$("text",Z,"textord","^","\\textasciicircum"),$("math",Z,et,"\u2191","\\uparrow",!0),$("math",Z,et,"\u21d1","\\Uparrow",!0),$("math",Z,et,"\u2193","\\downarrow",!0),$("math",Z,et,"\u21d3","\\Downarrow",!0),$("math",Z,et,"\u2195","\\updownarrow",!0),$("math",Z,et,"\u21d5","\\Updownarrow",!0),$("math",Z,tt,"\u2210","\\coprod"),$("math",Z,tt,"\u22c1","\\bigvee"),$("math",Z,tt,"\u22c0","\\bigwedge"),$("math",Z,tt,"\u2a04","\\biguplus"),$("math",Z,tt,"\u22c2","\\bigcap"),$("math",Z,tt,"\u22c3","\\bigcup"),$("math",Z,tt,"\u222b","\\int"),$("math",Z,tt,"\u222b","\\intop"),$("math",Z,tt,"\u222c","\\iint"),$("math",Z,tt,"\u222d","\\iiint"),$("math",Z,tt,"\u220f","\\prod"),$("math",Z,tt,"\u2211","\\sum"),$("math",Z,tt,"\u2a02","\\bigotimes"),$("math",Z,tt,"\u2a01","\\bigoplus"),$("math",Z,tt,"\u2a00","\\bigodot"),$("math",Z,tt,"\u222e","\\oint"),$("math",Z,tt,"\u222f","\\oiint"),$("math",Z,tt,"\u2230","\\oiiint"),$("math",Z,tt,"\u2a06","\\bigsqcup"),$("math",Z,tt,"\u222b","\\smallint"),$("text",Z,"inner","\u2026","\\textellipsis"),$("math",Z,"inner","\u2026","\\mathellipsis"),$("text",Z,"inner","\u2026","\\ldots",!0),$("math",Z,"inner","\u2026","\\ldots",!0),$("math",Z,"inner","\u22ef","\\@cdots",!0),$("math",Z,"inner","\u22f1","\\ddots",!0),$("math",Z,"textord","\u22ee","\\varvdots"),$("math",Z,"accent-token","\u02ca","\\acute"),$("math",Z,"accent-token","\u02cb","\\grave"),$("math",Z,"accent-token","\xa8","\\ddot"),$("math",Z,"accent-token","~","\\tilde"),$("math",Z,"accent-token","\u02c9","\\bar"),$("math",Z,"accent-token","\u02d8","\\breve"),$("math",Z,"accent-token","\u02c7","\\check"),$("math",Z,"accent-token","^","\\hat"),$("math",Z,"accent-token","\u20d7","\\vec"),$("math",Z,"accent-token","\u02d9","\\dot"),$("math",Z,"accent-token","\u02da","\\mathring"),$("math",Z,Q,"\u0131","\\imath",!0),$("math",Z,Q,"\u0237","\\jmath",!0),$("text",Z,"textord","\u0131","\\i",!0),$("text",Z,"textord","\u0237","\\j",!0),$("text",Z,"textord","\xdf","\\ss",!0),$("text",Z,"textord","\xe6","\\ae",!0),$("text",Z,"textord","\xe6","\\ae",!0),$("text",Z,"textord","\u0153","\\oe",!0),$("text",Z,"textord","\xf8","\\o",!0),$("text",Z,"textord","\xc6","\\AE",!0),$("text",Z,"textord","\u0152","\\OE",!0),$("text",Z,"textord","\xd8","\\O",!0),$("text",Z,"accent-token","\u02ca","\\'"),$("text",Z,"accent-token","\u02cb","\\`"),$("text",Z,"accent-token","\u02c6","\\^"),$("text",Z,"accent-token","\u02dc","\\~"),$("text",Z,"accent-token","\u02c9","\\="),$("text",Z,"accent-token","\u02d8","\\u"),$("text",Z,"accent-token","\u02d9","\\."),$("text",Z,"accent-token","\u02da","\\r"),$("text",Z,"accent-token","\u02c7","\\v"),$("text",Z,"accent-token","\xa8",'\\"'),$("text",Z,"accent-token","\u02dd","\\H"),$("text",Z,"accent-token","\u25ef","\\textcircled");var rt={"--":!0,"---":!0,"``":!0,"''":!0};$("text",Z,"textord","\u2013","--"),$("text",Z,"textord","\u2013","\\textendash"),$("text",Z,"textord","\u2014","---"),$("text",Z,"textord","\u2014","\\textemdash"),$("text",Z,"textord","\u2018","`"),$("text",Z,"textord","\u2018","\\textquoteleft"),$("text",Z,"textord","\u2019","'"),$("text",Z,"textord","\u2019","\\textquoteright"),$("text",Z,"textord","\u201c","``"),$("text",Z,"textord","\u201c","\\textquotedblleft"),$("text",Z,"textord","\u201d","''"),$("text",Z,"textord","\u201d","\\textquotedblright"),$("math",Z,"textord","\xb0","\\degree",!0),$("text",Z,"textord","\xb0","\\degree"),$("text",Z,"textord","\xb0","\\textdegree",!0),$("math",Z,Q,"\xa3","\\pounds"),$("math",Z,Q,"\xa3","\\mathsterling",!0),$("text",Z,Q,"\xa3","\\pounds"),$("text",Z,Q,"\xa3","\\textsterling",!0),$("math",K,"textord","\u2720","\\maltese"),$("text",K,"textord","\u2720","\\maltese"),$("text",Z,"spacing","\xa0","\\ "),$("text",Z,"spacing","\xa0"," "),$("text",Z,"spacing","\xa0","~");for(var at=0;at<'0123456789/@."'.length;at++){var nt='0123456789/@."'.charAt(at);$("math",Z,"textord",nt,nt)}for(var it=0;it<'0123456789!@*()-=+[]<>|";:?/.,'.length;it++){var ot='0123456789!@*()-=+[]<>|";:?/.,'.charAt(it);$("text",Z,"textord",ot,ot)}for(var st="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",ht=0;ht<st.length;ht++){var lt=st.charAt(ht);$("math",Z,Q,lt,lt),$("text",Z,"textord",lt,lt)}$("math",K,"textord","C","\u2102"),$("text",K,"textord","C","\u2102"),$("math",K,"textord","H","\u210d"),$("text",K,"textord","H","\u210d"),$("math",K,"textord","N","\u2115"),$("text",K,"textord","N","\u2115"),$("math",K,"textord","P","\u2119"),$("text",K,"textord","P","\u2119"),$("math",K,"textord","Q","\u211a"),$("text",K,"textord","Q","\u211a"),$("math",K,"textord","R","\u211d"),$("text",K,"textord","R","\u211d"),$("math",K,"textord","Z","\u2124"),$("text",K,"textord","Z","\u2124"),$("math",Z,Q,"h","\u210e"),$("text",Z,Q,"h","\u210e");for(var mt="",ct=0;ct<st.length;ct++){var ut=st.charAt(ct);$("math",Z,Q,ut,mt=String.fromCharCode(55349,56320+ct)),$("text",Z,"textord",ut,mt),$("math",Z,Q,ut,mt=String.fromCharCode(55349,56372+ct)),$("text",Z,"textord",ut,mt),$("math",Z,Q,ut,mt=String.fromCharCode(55349,56424+ct)),$("text",Z,"textord",ut,mt),$("math",Z,Q,ut,mt=String.fromCharCode(55349,56580+ct)),$("text",Z,"textord",ut,mt),$("math",Z,Q,ut,mt=String.fromCharCode(55349,56736+ct)),$("text",Z,"textord",ut,mt),$("math",Z,Q,ut,mt=String.fromCharCode(55349,56788+ct)),$("text",Z,"textord",ut,mt),$("math",Z,Q,ut,mt=String.fromCharCode(55349,56840+ct)),$("text",Z,"textord",ut,mt),$("math",Z,Q,ut,mt=String.fromCharCode(55349,56944+ct)),$("text",Z,"textord",ut,mt),ct<26&&($("math",Z,Q,ut,mt=String.fromCharCode(55349,56632+ct)),$("text",Z,"textord",ut,mt),$("math",Z,Q,ut,mt=String.fromCharCode(55349,56476+ct)),$("text",Z,"textord",ut,mt))}$("math",Z,Q,"k",mt=String.fromCharCode(55349,56668)),$("text",Z,"textord","k",mt);for(var pt=0;pt<10;pt++){var dt=pt.toString();$("math",Z,Q,dt,mt=String.fromCharCode(55349,57294+pt)),$("text",Z,"textord",dt,mt),$("math",Z,Q,dt,mt=String.fromCharCode(55349,57314+pt)),$("text",Z,"textord",dt,mt),$("math",Z,Q,dt,mt=String.fromCharCode(55349,57324+pt)),$("text",Z,"textord",dt,mt),$("math",Z,Q,dt,mt=String.fromCharCode(55349,57334+pt)),$("text",Z,"textord",dt,mt)}for(var ft=0;ft<"\xc7\xd0\xde\xe7\xfe".length;ft++){var gt="\xc7\xd0\xde\xe7\xfe".charAt(ft);$("math",Z,Q,gt,gt),$("text",Z,"textord",gt,gt)}$("text",Z,"textord","\xf0","\xf0"),$("text",Z,"textord","\u2013","\u2013"),$("text",Z,"textord","\u2014","\u2014"),$("text",Z,"textord","\u2018","\u2018"),$("text",Z,"textord","\u2019","\u2019"),$("text",Z,"textord","\u201c","\u201c"),$("text",Z,"textord","\u201d","\u201d");var xt=[["mathbf","textbf","Main-Bold"],["mathbf","textbf","Main-Bold"],["mathdefault","textit","Math-Italic"],["mathdefault","textit","Math-Italic"],["boldsymbol","boldsymbol","Main-BoldItalic"],["boldsymbol","boldsymbol","Main-BoldItalic"],["mathscr","textscr","Script-Regular"],["","",""],["","",""],["","",""],["mathfrak","textfrak","Fraktur-Regular"],["mathfrak","textfrak","Fraktur-Regular"],["mathbb","textbb","AMS-Regular"],["mathbb","textbb","AMS-Regular"],["","",""],["","",""],["mathsf","textsf","SansSerif-Regular"],["mathsf","textsf","SansSerif-Regular"],["mathboldsf","textboldsf","SansSerif-Bold"],["mathboldsf","textboldsf","SansSerif-Bold"],["mathitsf","textitsf","SansSerif-Italic"],["mathitsf","textitsf","SansSerif-Italic"],["","",""],["","",""],["mathtt","texttt","Typewriter-Regular"],["mathtt","texttt","Typewriter-Regular"]],vt=[["mathbf","textbf","Main-Bold"],["","",""],["mathsf","textsf","SansSerif-Regular"],["mathboldsf","textboldsf","SansSerif-Bold"],["mathtt","texttt","Typewriter-Regular"]],bt=[[1,1,1],[2,1,1],[3,1,1],[4,2,1],[5,2,1],[6,3,1],[7,4,2],[8,6,3],[9,7,6],[10,8,7],[11,10,9]],yt=[.5,.6,.7,.8,.9,1,1.2,1.44,1.728,2.074,2.488],wt=function(t,e){return e.size<2?t:bt[t-1][e.size-1]},kt=function(){function t(e){this.style=void 0,this.color=void 0,this.size=void 0,this.textSize=void 0,this.phantom=void 0,this.font=void 0,this.fontFamily=void 0,this.fontWeight=void 0,this.fontShape=void 0,this.sizeMultiplier=void 0,this.maxSize=void 0,this.minRuleThickness=void 0,this._fontMetrics=void 0,this.style=e.style,this.color=e.color,this.size=e.size||t.BASESIZE,this.textSize=e.textSize||this.size,this.phantom=!!e.phantom,this.font=e.font||"",this.fontFamily=e.fontFamily||"",this.fontWeight=e.fontWeight||"",this.fontShape=e.fontShape||"",this.sizeMultiplier=yt[this.size-1],this.maxSize=e.maxSize,this.minRuleThickness=e.minRuleThickness,this._fontMetrics=void 0}var e=t.prototype;return e.extend=function(e){var r={style:this.style,size:this.size,textSize:this.textSize,color:this.color,phantom:this.phantom,font:this.font,fontFamily:this.fontFamily,fontWeight:this.fontWeight,fontShape:this.fontShape,maxSize:this.maxSize,minRuleThickness:this.minRuleThickness};for(var a in e)e.hasOwnProperty(a)&&(r[a]=e[a]);return new t(r)},e.havingStyle=function(t){return this.style===t?this:this.extend({style:t,size:wt(this.textSize,t)})},e.havingCrampedStyle=function(){return this.havingStyle(this.style.cramp())},e.havingSize=function(t){return this.size===t&&this.textSize===t?this:this.extend({style:this.style.text(),size:t,textSize:t,sizeMultiplier:yt[t-1]})},e.havingBaseStyle=function(e){e=e||this.style.text();var r=wt(t.BASESIZE,e);return this.size===r&&this.textSize===t.BASESIZE&&this.style===e?this:this.extend({style:e,size:r})},e.havingBaseSizing=function(){var t;switch(this.style.id){case 4:case 5:t=3;break;case 6:case 7:t=1;break;default:t=6}return this.extend({style:this.style.text(),size:t})},e.withColor=function(t){return this.extend({color:t})},e.withPhantom=function(){return this.extend({phantom:!0})},e.withFont=function(t){return this.extend({font:t})},e.withTextFontFamily=function(t){return this.extend({fontFamily:t,font:""})},e.withTextFontWeight=function(t){return this.extend({fontWeight:t,font:""})},e.withTextFontShape=function(t){return this.extend({fontShape:t,font:""})},e.sizingClasses=function(t){return t.size!==this.size?["sizing","reset-size"+t.size,"size"+this.size]:[]},e.baseSizingClasses=function(){return this.size!==t.BASESIZE?["sizing","reset-size"+this.size,"size"+t.BASESIZE]:[]},e.fontMetrics=function(){return this._fontMetrics||(this._fontMetrics=function(t){var e;if(!Y[e=t>=5?0:t>=3?1:2]){var r=Y[e]={cssEmPerMu:V.quad[e]/18};for(var a in V)V.hasOwnProperty(a)&&(r[a]=V[a][e])}return Y[e]}(this.size)),this._fontMetrics},e.getColor=function(){return this.phantom?"transparent":this.color},t}();kt.BASESIZE=6;var St=kt,Mt={pt:1,mm:7227/2540,cm:7227/254,in:72.27,bp:1.00375,pc:12,dd:1238/1157,cc:14856/1157,nd:685/642,nc:1370/107,sp:1/65536,px:1.00375},zt={ex:!0,em:!0,mu:!0},At=function(t){return"string"!=typeof t&&(t=t.unit),t in Mt||t in zt||"ex"===t},Tt=function(t,e){var r;if(t.unit in Mt)r=Mt[t.unit]/e.fontMetrics().ptPerEm/e.sizeMultiplier;else if("mu"===t.unit)r=e.fontMetrics().cssEmPerMu;else{var a;if(a=e.style.isTight()?e.havingStyle(e.style.text()):e,"ex"===t.unit)r=a.fontMetrics().xHeight;else{if("em"!==t.unit)throw new o("Invalid unit: '"+t.unit+"'");r=a.fontMetrics().quad}a!==e&&(r*=a.sizeMultiplier/e.sizeMultiplier)}return Math.min(t.number*r,e.maxSize)},Bt=["\\imath","\u0131","\\jmath","\u0237","\\pounds","\\mathsterling","\\textsterling","\xa3"],Ct=function(t,e,r){return j[r][t]&&j[r][t].replace&&(t=j[r][t].replace),{value:t,metrics:G(t,e,r)}},qt=function(t,e,r,a,n){var i,o=Ct(t,e,r),s=o.metrics;if(t=o.value,s){var h=s.italic;("text"===r||a&&"mathit"===a.font)&&(h=0),i=new E(t,s.height,s.depth,h,s.skew,s.width,n)}else"undefined"!=typeof console&&console.warn("No character metrics for '"+t+"' in style '"+e+"' and mode '"+r+"'"),i=new E(t,0,0,0,0,0,n);if(a){i.maxFontSize=a.sizeMultiplier,a.style.isTight()&&i.classes.push("mtight");var l=a.getColor();l&&(i.style.color=l)}return i},Nt=function(t,e){if(T(t.classes)!==T(e.classes)||t.skew!==e.skew||t.maxFontSize!==e.maxFontSize)return!1;for(var r in t.style)if(t.style.hasOwnProperty(r)&&t.style[r]!==e.style[r])return!1;for(var a in e.style)if(e.style.hasOwnProperty(a)&&t.style[a]!==e.style[a])return!1;return!0},It=function(t){for(var e=0,r=0,a=0,n=0;n<t.children.length;n++){var i=t.children[n];i.height>e&&(e=i.height),i.depth>r&&(r=i.depth),i.maxFontSize>a&&(a=i.maxFontSize)}t.height=e,t.depth=r,t.maxFontSize=a},Rt=function(t,e,r,a){var n=new N(t,e,r,a);return It(n),n},Ot=function(t,e,r,a){return new N(t,e,r,a)},Et=function(t){var e=new A(t);return It(e),e},Lt=function(t,e,r){var a="";switch(t){case"amsrm":a="AMS";break;case"textrm":a="Main";break;case"textsf":a="SansSerif";break;case"texttt":a="Typewriter";break;default:a=t}return a+"-"+("textbf"===e&&"textit"===r?"BoldItalic":"textbf"===e?"Bold":"textit"===e?"Italic":"Regular")},Ht={mathbf:{variant:"bold",fontName:"Main-Bold"},mathrm:{variant:"normal",fontName:"Main-Regular"},textit:{variant:"italic",fontName:"Main-Italic"},mathit:{variant:"italic",fontName:"Main-Italic"},mathbb:{variant:"double-struck",fontName:"AMS-Regular"},mathcal:{variant:"script",fontName:"Caligraphic-Regular"},mathfrak:{variant:"fraktur",fontName:"Fraktur-Regular"},mathscr:{variant:"script",fontName:"Script-Regular"},mathsf:{variant:"sans-serif",fontName:"SansSerif-Regular"},mathtt:{variant:"monospace",fontName:"Typewriter-Regular"}},Pt={vec:["vec",.471,.714],oiintSize1:["oiintSize1",.957,.499],oiintSize2:["oiintSize2",1.472,.659],oiiintSize1:["oiiintSize1",1.304,.499],oiiintSize2:["oiiintSize2",1.98,.659]},Dt={fontMap:Ht,makeSymbol:qt,mathsym:function(t,e,r,a){return void 0===a&&(a=[]),"boldsymbol"===r.font&&Ct(t,"Main-Bold",e).metrics?qt(t,"Main-Bold",e,r,a.concat(["mathbf"])):"\\"===t||"main"===j[e][t].font?qt(t,"Main-Regular",e,r,a):qt(t,"AMS-Regular",e,r,a.concat(["amsrm"]))},makeSpan:Rt,makeSvgSpan:Ot,makeLineSpan:function(t,e,r){var a=Rt([t],[],e);return a.height=Math.max(r||e.fontMetrics().defaultRuleThickness,e.minRuleThickness),a.style.borderBottomWidth=a.height+"em",a.maxFontSize=1,a},makeAnchor:function(t,e,r,a){var n=new I(t,e,r,a);return It(n),n},makeFragment:Et,wrapFragment:function(t,e){return t instanceof A?Rt([],[t],e):t},makeVList:function(t,e){for(var r=function(t){if("individualShift"===t.positionType){for(var e=t.children,r=[e[0]],a=-e[0].shift-e[0].elem.depth,n=a,i=1;i<e.length;i++){var o=-e[i].shift-n-e[i].elem.depth,s=o-(e[i-1].elem.height+e[i-1].elem.depth);n+=o,r.push({type:"kern",size:s}),r.push(e[i])}return{children:r,depth:a}}var h;if("top"===t.positionType){for(var l=t.positionData,m=0;m<t.children.length;m++){var c=t.children[m];l-="kern"===c.type?c.size:c.elem.height+c.elem.depth}h=l}else if("bottom"===t.positionType)h=-t.positionData;else{var u=t.children[0];if("elem"!==u.type)throw new Error('First child must have type "elem".');if("shift"===t.positionType)h=-u.elem.depth-t.positionData;else{if("firstBaseline"!==t.positionType)throw new Error("Invalid positionType "+t.positionType+".");h=-u.elem.depth}}return{children:t.children,depth:h}}(t),a=r.children,n=r.depth,i=0,o=0;o<a.length;o++){var s=a[o];if("elem"===s.type){var h=s.elem;i=Math.max(i,h.maxFontSize,h.height)}}i+=2;var l=Rt(["pstrut"],[]);l.style.height=i+"em";for(var m=[],c=n,u=n,p=n,d=0;d<a.length;d++){var f=a[d];if("kern"===f.type)p+=f.size;else{var g=f.elem,x=f.wrapperClasses||[],v=f.wrapperStyle||{},b=Rt(x,[l,g],void 0,v);b.style.top=-i-p-g.depth+"em",f.marginLeft&&(b.style.marginLeft=f.marginLeft),f.marginRight&&(b.style.marginRight=f.marginRight),m.push(b),p+=g.height+g.depth}c=Math.min(c,p),u=Math.max(u,p)}var y,w=Rt(["vlist"],m);if(w.style.height=u+"em",c<0){var k=Rt([],[]),S=Rt(["vlist"],[k]);S.style.height=-c+"em";var M=Rt(["vlist-s"],[new E("\u200b")]);y=[Rt(["vlist-r"],[w,M]),Rt(["vlist-r"],[S])]}else y=[Rt(["vlist-r"],[w])];var z=Rt(["vlist-t"],y);return 2===y.length&&z.classes.push("vlist-t2"),z.height=u,z.depth=-c,z},makeOrd:function(t,e,r){var a,n=t.mode,i=t.text,s=["mord"],h="math"===n||"text"===n&&e.font,l=h?e.font:e.fontFamily;if(55349===i.charCodeAt(0)){var m=function(t,e){var r=1024*(t.charCodeAt(0)-55296)+(t.charCodeAt(1)-56320)+65536,a="math"===e?0:1;if(119808<=r&&r<120484){var n=Math.floor((r-119808)/26);return[xt[n][2],xt[n][a]]}if(120782<=r&&r<=120831){var i=Math.floor((r-120782)/10);return[vt[i][2],vt[i][a]]}if(120485===r||120486===r)return[xt[0][2],xt[0][a]];if(120486<r&&r<120782)return["",""];throw new o("Unsupported character: "+t)}(i,n),u=m[0],p=m[1];return qt(i,u,n,e,s.concat(p))}if(l){var d,f;if("boldsymbol"===l||"mathnormal"===l){var g="boldsymbol"===l?function(t,e,r,a){return Ct(t,"Math-BoldItalic",e).metrics?{fontName:"Math-BoldItalic",fontClass:"boldsymbol"}:{fontName:"Main-Bold",fontClass:"mathbf"}}(i,n):(a=i,c.contains(Bt,a)?{fontName:"Main-Italic",fontClass:"mathit"}:/[0-9]/.test(a.charAt(0))?{fontName:"Caligraphic-Regular",fontClass:"mathcal"}:{fontName:"Math-Italic",fontClass:"mathdefault"});d=g.fontName,f=[g.fontClass]}else c.contains(Bt,i)?(d="Main-Italic",f=["mathit"]):h?(d=Ht[l].fontName,f=[l]):(d=Lt(l,e.fontWeight,e.fontShape),f=[l,e.fontWeight,e.fontShape]);if(Ct(i,d,n).metrics)return qt(i,d,n,e,s.concat(f));if(rt.hasOwnProperty(i)&&"Typewriter"===d.substr(0,10)){for(var x=[],v=0;v<i.length;v++)x.push(qt(i[v],d,n,e,s.concat(f)));return Et(x)}}if("mathord"===r){var b=function(t,e,r,a){return/[0-9]/.test(t.charAt(0))||c.contains(Bt,t)?{fontName:"Main-Italic",fontClass:"mathit"}:{fontName:"Math-Italic",fontClass:"mathdefault"}}(i);return qt(i,b.fontName,n,e,s.concat([b.fontClass]))}if("textord"===r){var y=j[n][i]&&j[n][i].font;if("ams"===y){var w=Lt("amsrm",e.fontWeight,e.fontShape);return qt(i,w,n,e,s.concat("amsrm",e.fontWeight,e.fontShape))}if("main"!==y&&y){var k=Lt(y,e.fontWeight,e.fontShape);return qt(i,k,n,e,s.concat(k,e.fontWeight,e.fontShape))}var S=Lt("textrm",e.fontWeight,e.fontShape);return qt(i,S,n,e,s.concat(e.fontWeight,e.fontShape))}throw new Error("unexpected type: "+r+" in makeOrd")},makeGlue:function(t,e){var r=Rt(["mspace"],[],e),a=Tt(t,e);return r.style.marginRight=a+"em",r},staticSvg:function(t,e){var r=Pt[t],a=r[0],n=r[1],i=r[2],o=new H(a),s=new L([o],{width:n+"em",height:i+"em",style:"width:"+n+"em",viewBox:"0 0 "+1e3*n+" "+1e3*i,preserveAspectRatio:"xMinYMin"}),h=Ot(["overlay"],[s],e);return h.height=i,h.style.height=i+"em",h.style.width=n+"em",h},svgData:Pt,tryCombineChars:function(t){for(var e=0;e<t.length-1;e++){var r=t[e],a=t[e+1];r instanceof E&&a instanceof E&&Nt(r,a)&&(r.text+=a.text,r.height=Math.max(r.height,a.height),r.depth=Math.max(r.depth,a.depth),r.italic=a.italic,t.splice(e+1,1),e--)}return t}};function Ft(t,e){var r=Vt(t,e);if(!r)throw new Error("Expected node of type "+e+", but got "+(t?"node of type "+t.type:String(t)));return r}function Vt(t,e){return t&&t.type===e?t:null}function Ut(t,e){var r=function(t,e){return t&&"atom"===t.type&&t.family===e?t:null}(t,e);if(!r)throw new Error('Expected node of type "atom" and family "'+e+'", but got '+(t?"atom"===t.type?"atom of family "+t.family:"node of type "+t.type:String(t)));return r}function Gt(t){var e=Yt(t);if(!e)throw new Error("Expected node of symbol group type, but got "+(t?"node of type "+t.type:String(t)));return e}function Yt(t){return t&&("atom"===t.type||X.hasOwnProperty(t.type))?t:null}var Wt={number:3,unit:"mu"},Xt={number:4,unit:"mu"},_t={number:5,unit:"mu"},jt={mord:{mop:Wt,mbin:Xt,mrel:_t,minner:Wt},mop:{mord:Wt,mop:Wt,mrel:_t,minner:Wt},mbin:{mord:Xt,mop:Xt,mopen:Xt,minner:Xt},mrel:{mord:_t,mop:_t,mopen:_t,minner:_t},mopen:{},mclose:{mop:Wt,mbin:Xt,mrel:_t,minner:Wt},mpunct:{mord:Wt,mop:Wt,mrel:_t,mopen:Wt,mclose:Wt,mpunct:Wt,minner:Wt},minner:{mord:Wt,mop:Wt,mbin:Xt,mrel:_t,mopen:Wt,mpunct:Wt,minner:Wt}},$t={mord:{mop:Wt},mop:{mord:Wt,mop:Wt},mbin:{},mrel:{},mopen:{},mclose:{mop:Wt},mpunct:{},minner:{mop:Wt}},Zt={},Kt={},Jt={};function Qt(t){for(var e=t.type,r=t.names,a=t.props,n=t.handler,i=t.htmlBuilder,o=t.mathmlBuilder,s={type:e,numArgs:a.numArgs,argTypes:a.argTypes,greediness:void 0===a.greediness?1:a.greediness,allowedInText:!!a.allowedInText,allowedInMath:void 0===a.allowedInMath||a.allowedInMath,numOptionalArgs:a.numOptionalArgs||0,infix:!!a.infix,handler:n},h=0;h<r.length;++h)Zt[r[h]]=s;e&&(i&&(Kt[e]=i),o&&(Jt[e]=o))}function te(t){Qt({type:t.type,names:[],props:{numArgs:0},handler:function(){throw new Error("Should never be called.")},htmlBuilder:t.htmlBuilder,mathmlBuilder:t.mathmlBuilder})}var ee=function(t){var e=Vt(t,"ordgroup");return e?e.body:[t]},re=Dt.makeSpan,ae=["leftmost","mbin","mopen","mrel","mop","mpunct"],ne=["rightmost","mrel","mclose","mpunct"],ie={display:w.DISPLAY,text:w.TEXT,script:w.SCRIPT,scriptscript:w.SCRIPTSCRIPT},oe={mord:"mord",mop:"mop",mbin:"mbin",mrel:"mrel",mopen:"mopen",mclose:"mclose",mpunct:"mpunct",minner:"minner"},se=function(t,e,r,a){void 0===a&&(a=[null,null]);for(var n=[],i=0;i<t.length;i++){var o=ue(t[i],e);if(o instanceof A){var s=o.children;n.push.apply(n,s)}else n.push(o)}if(!r)return n;var h=e;if(1===t.length){var l=Vt(t[0],"sizing")||Vt(t[0],"styling");l&&("sizing"===l.type?h=e.havingSize(l.size):"styling"===l.type&&(h=e.havingStyle(ie[l.style])))}var m=re([a[0]||"leftmost"],[],e),u=re([a[1]||"rightmost"],[],e);return he(n,function(t,e){var r=e.classes[0],a=t.classes[0];"mbin"===r&&c.contains(ne,a)?e.classes[0]="mord":"mbin"===a&&c.contains(ae,r)&&(t.classes[0]="mord")},{node:m},u),he(n,function(t,e){var r=me(e),a=me(t),n=r&&a?t.hasClass("mtight")?$t[r][a]:jt[r][a]:null;if(n)return Dt.makeGlue(n,h)},{node:m},u),n},he=function t(e,r,a,n){n&&e.push(n);for(var i=0;i<e.length;i++){var o=e[i],s=le(o);if(s)t(s.children,r,a);else if("mspace"!==o.classes[0]){var h=r(o,a.node);h&&(a.insertAfter?a.insertAfter(h):(e.unshift(h),i++)),a.node=o,a.insertAfter=function(t){return function(r){e.splice(t+1,0,r),i++}}(i)}}n&&e.pop()},le=function(t){return t instanceof A||t instanceof I?t:null},me=function(t,e){return t?(e&&(t=function t(e,r){var a=le(e);if(a){var n=a.children;if(n.length){if("right"===r)return t(n[n.length-1],"right");if("left"===r)return t(n[0],"left")}}return e}(t,e)),oe[t.classes[0]]||null):null},ce=function(t,e){var r=["nulldelimiter"].concat(t.baseSizingClasses());return re(e.concat(r))},ue=function(t,e,r){if(!t)return re();if(Kt[t.type]){var a=Kt[t.type](t,e);if(r&&e.size!==r.size){a=re(e.sizingClasses(r),[a],e);var n=e.sizeMultiplier/r.sizeMultiplier;a.height*=n,a.depth*=n}return a}throw new o("Got group of unknown type: '"+t.type+"'")};function pe(t,e){var r=re(["base"],t,e),a=re(["strut"]);return a.style.height=r.height+r.depth+"em",a.style.verticalAlign=-r.depth+"em",r.children.unshift(a),r}function de(t,e){var r=null;1===t.length&&"tag"===t[0].type&&(r=t[0].tag,t=t[0].body);for(var a,n=se(t,e,!0),i=[],o=[],s=0;s<n.length;s++)if(o.push(n[s]),n[s].hasClass("mbin")||n[s].hasClass("mrel")||n[s].hasClass("allowbreak")){for(var h=!1;s<n.length-1&&n[s+1].hasClass("mspace")&&!n[s+1].hasClass("newline");)s++,o.push(n[s]),n[s].hasClass("nobreak")&&(h=!0);h||(i.push(pe(o,e)),o=[])}else n[s].hasClass("newline")&&(o.pop(),o.length>0&&(i.push(pe(o,e)),o=[]),i.push(n[s]));o.length>0&&i.push(pe(o,e)),r&&((a=pe(se(r,e,!0))).classes=["tag"],i.push(a));var l=re(["katex-html"],i);if(l.setAttribute("aria-hidden","true"),a){var m=a.children[0];m.style.height=l.height+l.depth+"em",m.style.verticalAlign=-l.depth+"em"}return l}function fe(t){return new A(t)}var ge=function(){function t(t,e){this.type=void 0,this.attributes=void 0,this.children=void 0,this.type=t,this.attributes={},this.children=e||[]}var e=t.prototype;return e.setAttribute=function(t,e){this.attributes[t]=e},e.getAttribute=function(t){return this.attributes[t]},e.toNode=function(){var t=document.createElementNS("http://www.w3.org/1998/Math/MathML",this.type);for(var e in this.attributes)Object.prototype.hasOwnProperty.call(this.attributes,e)&&t.setAttribute(e,this.attributes[e]);for(var r=0;r<this.children.length;r++)t.appendChild(this.children[r].toNode());return t},e.toMarkup=function(){var t="<"+this.type;for(var e in this.attributes)Object.prototype.hasOwnProperty.call(this.attributes,e)&&(t+=" "+e+'="',t+=c.escape(this.attributes[e]),t+='"');t+=">";for(var r=0;r<this.children.length;r++)t+=this.children[r].toMarkup();return t+="</"+this.type+">"},e.toText=function(){return this.children.map(function(t){return t.toText()}).join("")},t}(),xe=function(){function t(t){this.text=void 0,this.text=t}var e=t.prototype;return e.toNode=function(){return document.createTextNode(this.text)},e.toMarkup=function(){return c.escape(this.toText())},e.toText=function(){return this.text},t}(),ve={MathNode:ge,TextNode:xe,SpaceNode:function(){function t(t){this.width=void 0,this.character=void 0,this.width=t,this.character=t>=.05555&&t<=.05556?"\u200a":t>=.1666&&t<=.1667?"\u2009":t>=.2222&&t<=.2223?"\u2005":t>=.2777&&t<=.2778?"\u2005\u200a":t>=-.05556&&t<=-.05555?"\u200a\u2063":t>=-.1667&&t<=-.1666?"\u2009\u2063":t>=-.2223&&t<=-.2222?"\u205f\u2063":t>=-.2778&&t<=-.2777?"\u2005\u2063":null}var e=t.prototype;return e.toNode=function(){if(this.character)return document.createTextNode(this.character);var t=document.createElementNS("http://www.w3.org/1998/Math/MathML","mspace");return t.setAttribute("width",this.width+"em"),t},e.toMarkup=function(){return this.character?"<mtext>"+this.character+"</mtext>":'<mspace width="'+this.width+'em"/>'},e.toText=function(){return this.character?this.character:" "},t}(),newDocumentFragment:fe},be=function(t,e,r){return!j[e][t]||!j[e][t].replace||55349===t.charCodeAt(0)||rt.hasOwnProperty(t)&&r&&(r.fontFamily&&"tt"===r.fontFamily.substr(4,2)||r.font&&"tt"===r.font.substr(4,2))||(t=j[e][t].replace),new ve.TextNode(t)},ye=function(t){return 1===t.length?t[0]:new ve.MathNode("mrow",t)},we=function(t,e){if("texttt"===e.fontFamily)return"monospace";if("textsf"===e.fontFamily)return"textit"===e.fontShape&&"textbf"===e.fontWeight?"sans-serif-bold-italic":"textit"===e.fontShape?"sans-serif-italic":"textbf"===e.fontWeight?"bold-sans-serif":"sans-serif";if("textit"===e.fontShape&&"textbf"===e.fontWeight)return"bold-italic";if("textit"===e.fontShape)return"italic";if("textbf"===e.fontWeight)return"bold";var r=e.font;if(!r||"mathnormal"===r)return null;var a=t.mode;if("mathit"===r)return"italic";if("boldsymbol"===r)return"bold-italic";if("mathbf"===r)return"bold";if("mathbb"===r)return"double-struck";if("mathfrak"===r)return"fraktur";if("mathscr"===r||"mathcal"===r)return"script";if("mathsf"===r)return"sans-serif";if("mathtt"===r)return"monospace";var n=t.text;return c.contains(["\\imath","\\jmath"],n)?null:(j[a][n]&&j[a][n].replace&&(n=j[a][n].replace),G(n,Dt.fontMap[r].fontName,a)?Dt.fontMap[r].variant:null)},ke=function(t,e,r){if(1===t.length){var a=Me(t[0],e);return r&&a instanceof ge&&"mo"===a.type&&(a.setAttribute("lspace","0em"),a.setAttribute("rspace","0em")),[a]}for(var n,i=[],o=0;o<t.length;o++){var s=Me(t[o],e);if(s instanceof ge&&n instanceof ge){if("mtext"===s.type&&"mtext"===n.type&&s.getAttribute("mathvariant")===n.getAttribute("mathvariant")){var h;(h=n.children).push.apply(h,s.children);continue}if("mn"===s.type&&"mn"===n.type){var l;(l=n.children).push.apply(l,s.children);continue}if("mi"===s.type&&1===s.children.length&&"mn"===n.type){var m=s.children[0];if(m instanceof xe&&"."===m.text){var c;(c=n.children).push.apply(c,s.children);continue}}else if("mi"===n.type&&1===n.children.length){var u=n.children[0];if(u instanceof xe&&"\u0338"===u.text&&("mo"===s.type||"mi"===s.type||"mn"===s.type)){var p=s.children[0];p instanceof xe&&p.text.length>0&&(p.text=p.text.slice(0,1)+"\u0338"+p.text.slice(1),i.pop())}}}i.push(s),n=s}return i},Se=function(t,e,r){return ye(ke(t,e,r))},Me=function(t,e){if(!t)return new ve.MathNode("mrow");if(Jt[t.type])return Jt[t.type](t,e);throw new o("Got group of unknown type: '"+t.type+"'")};function ze(t,e,r,a){var n,i=ke(t,r);n=1===i.length&&i[0]instanceof ge&&c.contains(["mrow","mtable"],i[0].type)?i[0]:new ve.MathNode("mrow",i);var o=new ve.MathNode("annotation",[new ve.TextNode(e)]);o.setAttribute("encoding","application/x-tex");var s=new ve.MathNode("semantics",[n,o]),h=new ve.MathNode("math",[s]);h.setAttribute("xmlns","http://www.w3.org/1998/Math/MathML");var l=a?"katex":"katex-mathml";return Dt.makeSpan([l],[h])}var Ae=function(t){return new St({style:t.displayMode?w.DISPLAY:w.TEXT,maxSize:t.maxSize,minRuleThickness:t.minRuleThickness})},Te=function(t,e){if(e.displayMode){var r=["katex-display"];e.leqno&&r.push("leqno"),e.fleqn&&r.push("fleqn"),t=Dt.makeSpan(r,[t])}return t},Be=function(t,e,r){var a,n=Ae(r);if("mathml"===r.output)return ze(t,e,n,!0);if("html"===r.output){var i=de(t,n);a=Dt.makeSpan(["katex"],[i])}else{var o=ze(t,e,n,!1),s=de(t,n);a=Dt.makeSpan(["katex"],[o,s])}return Te(a,r)},Ce={widehat:"^",widecheck:"\u02c7",widetilde:"~",utilde:"~",overleftarrow:"\u2190",underleftarrow:"\u2190",xleftarrow:"\u2190",overrightarrow:"\u2192",underrightarrow:"\u2192",xrightarrow:"\u2192",underbrace:"\u23df",overbrace:"\u23de",overgroup:"\u23e0",undergroup:"\u23e1",overleftrightarrow:"\u2194",underleftrightarrow:"\u2194",xleftrightarrow:"\u2194",Overrightarrow:"\u21d2",xRightarrow:"\u21d2",overleftharpoon:"\u21bc",xleftharpoonup:"\u21bc",overrightharpoon:"\u21c0",xrightharpoonup:"\u21c0",xLeftarrow:"\u21d0",xLeftrightarrow:"\u21d4",xhookleftarrow:"\u21a9",xhookrightarrow:"\u21aa",xmapsto:"\u21a6",xrightharpoondown:"\u21c1",xleftharpoondown:"\u21bd",xrightleftharpoons:"\u21cc",xleftrightharpoons:"\u21cb",xtwoheadleftarrow:"\u219e",xtwoheadrightarrow:"\u21a0",xlongequal:"=",xtofrom:"\u21c4",xrightleftarrows:"\u21c4",xrightequilibrium:"\u21cc",xleftequilibrium:"\u21cb"},qe={overrightarrow:[["rightarrow"],.888,522,"xMaxYMin"],overleftarrow:[["leftarrow"],.888,522,"xMinYMin"],underrightarrow:[["rightarrow"],.888,522,"xMaxYMin"],underleftarrow:[["leftarrow"],.888,522,"xMinYMin"],xrightarrow:[["rightarrow"],1.469,522,"xMaxYMin"],xleftarrow:[["leftarrow"],1.469,522,"xMinYMin"],Overrightarrow:[["doublerightarrow"],.888,560,"xMaxYMin"],xRightarrow:[["doublerightarrow"],1.526,560,"xMaxYMin"],xLeftarrow:[["doubleleftarrow"],1.526,560,"xMinYMin"],overleftharpoon:[["leftharpoon"],.888,522,"xMinYMin"],xleftharpoonup:[["leftharpoon"],.888,522,"xMinYMin"],xleftharpoondown:[["leftharpoondown"],.888,522,"xMinYMin"],overrightharpoon:[["rightharpoon"],.888,522,"xMaxYMin"],xrightharpoonup:[["rightharpoon"],.888,522,"xMaxYMin"],xrightharpoondown:[["rightharpoondown"],.888,522,"xMaxYMin"],xlongequal:[["longequal"],.888,334,"xMinYMin"],xtwoheadleftarrow:[["twoheadleftarrow"],.888,334,"xMinYMin"],xtwoheadrightarrow:[["twoheadrightarrow"],.888,334,"xMaxYMin"],overleftrightarrow:[["leftarrow","rightarrow"],.888,522],overbrace:[["leftbrace","midbrace","rightbrace"],1.6,548],underbrace:[["leftbraceunder","midbraceunder","rightbraceunder"],1.6,548],underleftrightarrow:[["leftarrow","rightarrow"],.888,522],xleftrightarrow:[["leftarrow","rightarrow"],1.75,522],xLeftrightarrow:[["doubleleftarrow","doublerightarrow"],1.75,560],xrightleftharpoons:[["leftharpoondownplus","rightharpoonplus"],1.75,716],xleftrightharpoons:[["leftharpoonplus","rightharpoondownplus"],1.75,716],xhookleftarrow:[["leftarrow","righthook"],1.08,522],xhookrightarrow:[["lefthook","rightarrow"],1.08,522],overlinesegment:[["leftlinesegment","rightlinesegment"],.888,522],underlinesegment:[["leftlinesegment","rightlinesegment"],.888,522],overgroup:[["leftgroup","rightgroup"],.888,342],undergroup:[["leftgroupunder","rightgroupunder"],.888,342],xmapsto:[["leftmapsto","rightarrow"],1.5,522],xtofrom:[["leftToFrom","rightToFrom"],1.75,528],xrightleftarrows:[["baraboveleftarrow","rightarrowabovebar"],1.75,901],xrightequilibrium:[["baraboveshortleftharpoon","rightharpoonaboveshortbar"],1.75,716],xleftequilibrium:[["shortbaraboveleftharpoon","shortrightharpoonabovebar"],1.75,716]},Ne=function(t){return"ordgroup"===t.type?t.body.length:1},Ie=function(t,e,r,a){var n,i=t.height+t.depth+2*r;if(/fbox|color/.test(e)){if(n=Dt.makeSpan(["stretchy",e],[],a),"fbox"===e){var o=a.color&&a.getColor();o&&(n.style.borderColor=o)}}else{var s=[];/^[bx]cancel$/.test(e)&&s.push(new P({x1:"0",y1:"0",x2:"100%",y2:"100%","stroke-width":"0.046em"})),/^x?cancel$/.test(e)&&s.push(new P({x1:"0",y1:"100%",x2:"100%",y2:"0","stroke-width":"0.046em"}));var h=new L(s,{width:"100%",height:i+"em"});n=Dt.makeSvgSpan([],[h],a)}return n.height=i,n.style.height=i+"em",n},Re=function(t){var e=new ve.MathNode("mo",[new ve.TextNode(Ce[t.substr(1)])]);return e.setAttribute("stretchy","true"),e},Oe=function(t,e){var r=function(){var r=4e5,a=t.label.substr(1);if(c.contains(["widehat","widecheck","widetilde","utilde"],a)){var n,i,o,s=Ne(t.base);if(s>5)"widehat"===a||"widecheck"===a?(n=420,r=2364,o=.42,i=a+"4"):(n=312,r=2340,o=.34,i="tilde4");else{var h=[1,1,2,2,3,3][s];"widehat"===a||"widecheck"===a?(r=[0,1062,2364,2364,2364][h],n=[0,239,300,360,420][h],o=[0,.24,.3,.3,.36,.42][h],i=a+h):(r=[0,600,1033,2339,2340][h],n=[0,260,286,306,312][h],o=[0,.26,.286,.3,.306,.34][h],i="tilde"+h)}var l=new H(i),m=new L([l],{width:"100%",height:o+"em",viewBox:"0 0 "+r+" "+n,preserveAspectRatio:"none"});return{span:Dt.makeSvgSpan([],[m],e),minWidth:0,height:o}}var u,p,d=[],f=qe[a],g=f[0],x=f[1],v=f[2],b=v/1e3,y=g.length;if(1===y)u=["hide-tail"],p=[f[3]];else if(2===y)u=["halfarrow-left","halfarrow-right"],p=["xMinYMin","xMaxYMin"];else{if(3!==y)throw new Error("Correct katexImagesData or update code here to support\n                    "+y+" children.");u=["brace-left","brace-center","brace-right"],p=["xMinYMin","xMidYMin","xMaxYMin"]}for(var w=0;w<y;w++){var k=new H(g[w]),S=new L([k],{width:"400em",height:b+"em",viewBox:"0 0 "+r+" "+v,preserveAspectRatio:p[w]+" slice"}),M=Dt.makeSvgSpan([u[w]],[S],e);if(1===y)return{span:M,minWidth:x,height:b};M.style.height=b+"em",d.push(M)}return{span:Dt.makeSpan(["stretchy"],d,e),minWidth:x,height:b}}(),a=r.span,n=r.minWidth,i=r.height;return a.height=i,a.style.height=i+"em",n>0&&(a.style.minWidth=n+"em"),a},Ee=function(t,e){var r,a,n,i=Vt(t,"supsub");i?(r=(a=Ft(i.base,"accent")).base,i.base=r,n=function(t){if(t instanceof N)return t;throw new Error("Expected span<HtmlDomNode> but got "+String(t)+".")}(ue(i,e)),i.base=a):r=(a=Ft(t,"accent")).base;var o=ue(r,e.havingCrampedStyle()),s=0;if(a.isShifty&&c.isCharacterBox(r)){var h=c.getBaseElem(r);s=D(ue(h,e.havingCrampedStyle())).skew}var l,m=Math.min(o.height,e.fontMetrics().xHeight);if(a.isStretchy)l=Oe(a,e),l=Dt.makeVList({positionType:"firstBaseline",children:[{type:"elem",elem:o},{type:"elem",elem:l,wrapperClasses:["svg-align"],wrapperStyle:s>0?{width:"calc(100% - "+2*s+"em)",marginLeft:2*s+"em"}:void 0}]},e);else{var u,p;"\\vec"===a.label?(u=Dt.staticSvg("vec",e),p=Dt.svgData.vec[1]):((u=D(u=Dt.makeOrd({mode:a.mode,text:a.label},e,"textord"))).italic=0,p=u.width),l=Dt.makeSpan(["accent-body"],[u]);var d="\\textcircled"===a.label;d&&(l.classes.push("accent-full"),m=o.height);var f=s;d||(f-=p/2),l.style.left=f+"em","\\textcircled"===a.label&&(l.style.top=".2em"),l=Dt.makeVList({positionType:"firstBaseline",children:[{type:"elem",elem:o},{type:"kern",size:-m},{type:"elem",elem:l}]},e)}var g=Dt.makeSpan(["mord","accent"],[l],e);return n?(n.children[0]=g,n.height=Math.max(g.height,n.height),n.classes[0]="mord",n):g},Le=function(t,e){var r=t.isStretchy?Re(t.label):new ve.MathNode("mo",[be(t.label,t.mode)]),a=new ve.MathNode("mover",[Me(t.base,e),r]);return a.setAttribute("accent","true"),a},He=new RegExp(["\\acute","\\grave","\\ddot","\\tilde","\\bar","\\breve","\\check","\\hat","\\vec","\\dot","\\mathring"].map(function(t){return"\\"+t}).join("|"));Qt({type:"accent",names:["\\acute","\\grave","\\ddot","\\tilde","\\bar","\\breve","\\check","\\hat","\\vec","\\dot","\\mathring","\\widecheck","\\widehat","\\widetilde","\\overrightarrow","\\overleftarrow","\\Overrightarrow","\\overleftrightarrow","\\overgroup","\\overlinesegment","\\overleftharpoon","\\overrightharpoon"],props:{numArgs:1},handler:function(t,e){var r=e[0],a=!He.test(t.funcName),n=!a||"\\widehat"===t.funcName||"\\widetilde"===t.funcName||"\\widecheck"===t.funcName;return{type:"accent",mode:t.parser.mode,label:t.funcName,isStretchy:a,isShifty:n,base:r}},htmlBuilder:Ee,mathmlBuilder:Le}),Qt({type:"accent",names:["\\'","\\`","\\^","\\~","\\=","\\u","\\.",'\\"',"\\r","\\H","\\v","\\textcircled"],props:{numArgs:1,allowedInText:!0,allowedInMath:!1},handler:function(t,e){var r=e[0];return{type:"accent",mode:t.parser.mode,label:t.funcName,isStretchy:!1,isShifty:!0,base:r}},htmlBuilder:Ee,mathmlBuilder:Le}),Qt({type:"accentUnder",names:["\\underleftarrow","\\underrightarrow","\\underleftrightarrow","\\undergroup","\\underlinesegment","\\utilde"],props:{numArgs:1},handler:function(t,e){var r=t.parser,a=t.funcName,n=e[0];return{type:"accentUnder",mode:r.mode,label:a,base:n}},htmlBuilder:function(t,e){var r=ue(t.base,e),a=Oe(t,e),n="\\utilde"===t.label?.12:0,i=Dt.makeVList({positionType:"bottom",positionData:a.height+n,children:[{type:"elem",elem:a,wrapperClasses:["svg-align"]},{type:"kern",size:n},{type:"elem",elem:r}]},e);return Dt.makeSpan(["mord","accentunder"],[i],e)},mathmlBuilder:function(t,e){var r=Re(t.label),a=new ve.MathNode("munder",[Me(t.base,e),r]);return a.setAttribute("accentunder","true"),a}});var Pe=function(t){var e=new ve.MathNode("mpadded",t?[t]:[]);return e.setAttribute("width","+0.6em"),e.setAttribute("lspace","0.3em"),e};Qt({type:"xArrow",names:["\\xleftarrow","\\xrightarrow","\\xLeftarrow","\\xRightarrow","\\xleftrightarrow","\\xLeftrightarrow","\\xhookleftarrow","\\xhookrightarrow","\\xmapsto","\\xrightharpoondown","\\xrightharpoonup","\\xleftharpoondown","\\xleftharpoonup","\\xrightleftharpoons","\\xleftrightharpoons","\\xlongequal","\\xtwoheadrightarrow","\\xtwoheadleftarrow","\\xtofrom","\\xrightleftarrows","\\xrightequilibrium","\\xleftequilibrium"],props:{numArgs:1,numOptionalArgs:1},handler:function(t,e,r){var a=t.parser,n=t.funcName;return{type:"xArrow",mode:a.mode,label:n,body:e[0],below:r[0]}},htmlBuilder:function(t,e){var r,a=e.style,n=e.havingStyle(a.sup()),i=Dt.wrapFragment(ue(t.body,n,e),e);i.classes.push("x-arrow-pad"),t.below&&(n=e.havingStyle(a.sub()),(r=Dt.wrapFragment(ue(t.below,n,e),e)).classes.push("x-arrow-pad"));var o,s=Oe(t,e),h=-e.fontMetrics().axisHeight+.5*s.height,l=-e.fontMetrics().axisHeight-.5*s.height-.111;if((i.depth>.25||"\\xleftequilibrium"===t.label)&&(l-=i.depth),r){var m=-e.fontMetrics().axisHeight+r.height+.5*s.height+.111;o=Dt.makeVList({positionType:"individualShift",children:[{type:"elem",elem:i,shift:l},{type:"elem",elem:s,shift:h},{type:"elem",elem:r,shift:m}]},e)}else o=Dt.makeVList({positionType:"individualShift",children:[{type:"elem",elem:i,shift:l},{type:"elem",elem:s,shift:h}]},e);return o.children[0].children[0].children[1].classes.push("svg-align"),Dt.makeSpan(["mrel","x-arrow"],[o],e)},mathmlBuilder:function(t,e){var r,a=Re(t.label);if(t.body){var n=Pe(Me(t.body,e));if(t.below){var i=Pe(Me(t.below,e));r=new ve.MathNode("munderover",[a,i,n])}else r=new ve.MathNode("mover",[a,n])}else if(t.below){var o=Pe(Me(t.below,e));r=new ve.MathNode("munder",[a,o])}else r=Pe(),r=new ve.MathNode("mover",[a,r]);return r}}),Qt({type:"textord",names:["\\@char"],props:{numArgs:1,allowedInText:!0},handler:function(t,e){for(var r=t.parser,a=Ft(e[0],"ordgroup").body,n="",i=0;i<a.length;i++){n+=Ft(a[i],"textord").text}var s=parseInt(n);if(isNaN(s))throw new o("\\@char has non-numeric argument "+n);return{type:"textord",mode:r.mode,text:String.fromCharCode(s)}}});var De=function(t,e){var r=se(t.body,e.withColor(t.color),!1);return Dt.makeFragment(r)},Fe=function(t,e){var r=ke(t.body,e.withColor(t.color)),a=new ve.MathNode("mstyle",r);return a.setAttribute("mathcolor",t.color),a};Qt({type:"color",names:["\\textcolor"],props:{numArgs:2,allowedInText:!0,greediness:3,argTypes:["color","original"]},handler:function(t,e){var r=t.parser,a=Ft(e[0],"color-token").color,n=e[1];return{type:"color",mode:r.mode,color:a,body:ee(n)}},htmlBuilder:De,mathmlBuilder:Fe}),Qt({type:"color",names:["\\color"],props:{numArgs:1,allowedInText:!0,greediness:3,argTypes:["color"]},handler:function(t,e){var r=t.parser,a=t.breakOnTokenText,n=Ft(e[0],"color-token").color;r.gullet.macros.set("\\current@color",n);var i=r.parseExpression(!0,a);return{type:"color",mode:r.mode,color:n,body:i}},htmlBuilder:De,mathmlBuilder:Fe}),Qt({type:"cr",names:["\\cr","\\newline"],props:{numArgs:0,numOptionalArgs:1,argTypes:["size"],allowedInText:!0},handler:function(t,e,r){var a=t.parser,n=t.funcName,i=r[0],o="\\cr"===n,s=!1;return o||(s=!a.settings.displayMode||!a.settings.useStrictBehavior("newLineInDisplayMode","In LaTeX, \\\\ or \\newline does nothing in display mode")),{type:"cr",mode:a.mode,newLine:s,newRow:o,size:i&&Ft(i,"size").value}},htmlBuilder:function(t,e){if(t.newRow)throw new o("\\cr valid only within a tabular/array environment");var r=Dt.makeSpan(["mspace"],[],e);return t.newLine&&(r.classes.push("newline"),t.size&&(r.style.marginTop=Tt(t.size,e)+"em")),r},mathmlBuilder:function(t,e){var r=new ve.MathNode("mspace");return t.newLine&&(r.setAttribute("linebreak","newline"),t.size&&r.setAttribute("height",Tt(t.size,e)+"em")),r}});var Ve=function(t,e,r){var a=G(j.math[t]&&j.math[t].replace||t,e,r);if(!a)throw new Error("Unsupported symbol "+t+" and font size "+e+".");return a},Ue=function(t,e,r,a){var n=r.havingBaseStyle(e),i=Dt.makeSpan(a.concat(n.sizingClasses(r)),[t],r),o=n.sizeMultiplier/r.sizeMultiplier;return i.height*=o,i.depth*=o,i.maxFontSize=n.sizeMultiplier,i},Ge=function(t,e,r){var a=e.havingBaseStyle(r),n=(1-e.sizeMultiplier/a.sizeMultiplier)*e.fontMetrics().axisHeight;t.classes.push("delimcenter"),t.style.top=n+"em",t.height-=n,t.depth+=n},Ye=function(t,e,r,a,n,i){var o=function(t,e,r,a){return Dt.makeSymbol(t,"Size"+e+"-Regular",r,a)}(t,e,n,a),s=Ue(Dt.makeSpan(["delimsizing","size"+e],[o],a),w.TEXT,a,i);return r&&Ge(s,a,w.TEXT),s},We=function(t,e,r){var a;return a="Size1-Regular"===e?"delim-size1":"delim-size4",{type:"elem",elem:Dt.makeSpan(["delimsizinginner",a],[Dt.makeSpan([],[Dt.makeSymbol(t,e,r)])])}},Xe={type:"kern",size:-.005},_e=function(t,e,r,a,n,i){var o,s,h,l;o=h=l=t,s=null;var m="Size1-Regular";"\\uparrow"===t?h=l="\u23d0":"\\Uparrow"===t?h=l="\u2016":"\\downarrow"===t?o=h="\u23d0":"\\Downarrow"===t?o=h="\u2016":"\\updownarrow"===t?(o="\\uparrow",h="\u23d0",l="\\downarrow"):"\\Updownarrow"===t?(o="\\Uparrow",h="\u2016",l="\\Downarrow"):"["===t||"\\lbrack"===t?(o="\u23a1",h="\u23a2",l="\u23a3",m="Size4-Regular"):"]"===t||"\\rbrack"===t?(o="\u23a4",h="\u23a5",l="\u23a6",m="Size4-Regular"):"\\lfloor"===t||"\u230a"===t?(h=o="\u23a2",l="\u23a3",m="Size4-Regular"):"\\lceil"===t||"\u2308"===t?(o="\u23a1",h=l="\u23a2",m="Size4-Regular"):"\\rfloor"===t||"\u230b"===t?(h=o="\u23a5",l="\u23a6",m="Size4-Regular"):"\\rceil"===t||"\u2309"===t?(o="\u23a4",h=l="\u23a5",m="Size4-Regular"):"("===t||"\\lparen"===t?(o="\u239b",h="\u239c",l="\u239d",m="Size4-Regular"):")"===t||"\\rparen"===t?(o="\u239e",h="\u239f",l="\u23a0",m="Size4-Regular"):"\\{"===t||"\\lbrace"===t?(o="\u23a7",s="\u23a8",l="\u23a9",h="\u23aa",m="Size4-Regular"):"\\}"===t||"\\rbrace"===t?(o="\u23ab",s="\u23ac",l="\u23ad",h="\u23aa",m="Size4-Regular"):"\\lgroup"===t||"\u27ee"===t?(o="\u23a7",l="\u23a9",h="\u23aa",m="Size4-Regular"):"\\rgroup"===t||"\u27ef"===t?(o="\u23ab",l="\u23ad",h="\u23aa",m="Size4-Regular"):"\\lmoustache"===t||"\u23b0"===t?(o="\u23a7",l="\u23ad",h="\u23aa",m="Size4-Regular"):"\\rmoustache"!==t&&"\u23b1"!==t||(o="\u23ab",l="\u23a9",h="\u23aa",m="Size4-Regular");var c=Ve(o,m,n),u=c.height+c.depth,p=Ve(h,m,n),d=p.height+p.depth,f=Ve(l,m,n),g=f.height+f.depth,x=0,v=1;if(null!==s){var b=Ve(s,m,n);x=b.height+b.depth,v=2}var y=u+g+x,k=Math.max(0,Math.ceil((e-y)/(v*d))),S=y+k*v*d,M=a.fontMetrics().axisHeight;r&&(M*=a.sizeMultiplier);var z=S/2-M,A=.005*(k+1)-d,T=[];if(T.push(We(l,m,n)),null===s)for(var B=0;B<k;B++)T.push(Xe),T.push(We(h,m,n));else{for(var C=0;C<k;C++)T.push(Xe),T.push(We(h,m,n));T.push({type:"kern",size:A}),T.push(We(h,m,n)),T.push(Xe),T.push(We(s,m,n));for(var q=0;q<k;q++)T.push(Xe),T.push(We(h,m,n))}T.push({type:"kern",size:A}),T.push(We(h,m,n)),T.push(Xe),T.push(We(o,m,n));var N=a.havingBaseStyle(w.TEXT),I=Dt.makeVList({positionType:"bottom",positionData:z,children:T},N);return Ue(Dt.makeSpan(["delimsizing","mult"],[I],N),w.TEXT,a,i)},je=function(t,e,r,a,n){var i=function(t,e,r){e*=1e3;var a="";switch(t){case"sqrtMain":a=function(t,e){return"M95,"+(622+t+e)+"\nc-2.7,0,-7.17,-2.7,-13.5,-8c-5.8,-5.3,-9.5,-10,-9.5,-14\nc0,-2,0.3,-3.3,1,-4c1.3,-2.7,23.83,-20.7,67.5,-54\nc44.2,-33.3,65.8,-50.3,66.5,-51c1.3,-1.3,3,-2,5,-2c4.7,0,8.7,3.3,12,10\ns173,378,173,378c0.7,0,35.3,-71,104,-213c68.7,-142,137.5,-285,206.5,-429\nc69,-144,104.5,-217.7,106.5,-221\nl"+t/2.075+" -"+t+"\nc5.3,-9.3,12,-14,20,-14\nH400000v"+(40+t)+"H845.2724\ns-225.272,467,-225.272,467s-235,486,-235,486c-2.7,4.7,-9,7,-19,7\nc-6,0,-10,-1,-12,-3s-194,-422,-194,-422s-65,47,-65,47z\nM"+(834+t)+" "+e+"h400000v"+(40+t)+"h-400000z"}(e,80);break;case"sqrtSize1":a=function(t,e){return"M263,"+(601+t+e)+"c0.7,0,18,39.7,52,119\nc34,79.3,68.167,158.7,102.5,238c34.3,79.3,51.8,119.3,52.5,120\nc340,-704.7,510.7,-1060.3,512,-1067\nl"+t/2.084+" -"+t+"\nc4.7,-7.3,11,-11,19,-11\nH40000v"+(40+t)+"H1012.3\ns-271.3,567,-271.3,567c-38.7,80.7,-84,175,-136,283c-52,108,-89.167,185.3,-111.5,232\nc-22.3,46.7,-33.8,70.3,-34.5,71c-4.7,4.7,-12.3,7,-23,7s-12,-1,-12,-1\ns-109,-253,-109,-253c-72.7,-168,-109.3,-252,-110,-252c-10.7,8,-22,16.7,-34,26\nc-22,17.3,-33.3,26,-34,26s-26,-26,-26,-26s76,-59,76,-59s76,-60,76,-60z\nM"+(1001+t)+" "+e+"h400000v"+(40+t)+"h-400000z"}(e,80);break;case"sqrtSize2":a=function(t,e){return"M983 "+(10+t+e)+"\nl"+t/3.13+" -"+t+"\nc4,-6.7,10,-10,18,-10 H400000v"+(40+t)+"\nH1013.1s-83.4,268,-264.1,840c-180.7,572,-277,876.3,-289,913c-4.7,4.7,-12.7,7,-24,7\ns-12,0,-12,0c-1.3,-3.3,-3.7,-11.7,-7,-25c-35.3,-125.3,-106.7,-373.3,-214,-744\nc-10,12,-21,25,-33,39s-32,39,-32,39c-6,-5.3,-15,-14,-27,-26s25,-30,25,-30\nc26.7,-32.7,52,-63,76,-91s52,-60,52,-60s208,722,208,722\nc56,-175.3,126.3,-397.3,211,-666c84.7,-268.7,153.8,-488.2,207.5,-658.5\nc53.7,-170.3,84.5,-266.8,92.5,-289.5z\nM"+(1001+t)+" "+e+"h400000v"+(40+t)+"h-400000z"}(e,80);break;case"sqrtSize3":a=function(t,e){return"M424,"+(2398+t+e)+"\nc-1.3,-0.7,-38.5,-172,-111.5,-514c-73,-342,-109.8,-513.3,-110.5,-514\nc0,-2,-10.7,14.3,-32,49c-4.7,7.3,-9.8,15.7,-15.5,25c-5.7,9.3,-9.8,16,-12.5,20\ns-5,7,-5,7c-4,-3.3,-8.3,-7.7,-13,-13s-13,-13,-13,-13s76,-122,76,-122s77,-121,77,-121\ns209,968,209,968c0,-2,84.7,-361.7,254,-1079c169.3,-717.3,254.7,-1077.7,256,-1081\nl"+t/4.223+" -"+t+"c4,-6.7,10,-10,18,-10 H400000\nv"+(40+t)+"H1014.6\ns-87.3,378.7,-272.6,1166c-185.3,787.3,-279.3,1182.3,-282,1185\nc-2,6,-10,9,-24,9\nc-8,0,-12,-0.7,-12,-2z M"+(1001+t)+" "+e+"\nh400000v"+(40+t)+"h-400000z"}(e,80);break;case"sqrtSize4":a=function(t,e){return"M473,"+(2713+t+e)+"\nc339.3,-1799.3,509.3,-2700,510,-2702 l"+t/5.298+" -"+t+"\nc3.3,-7.3,9.3,-11,18,-11 H400000v"+(40+t)+"H1017.7\ns-90.5,478,-276.2,1466c-185.7,988,-279.5,1483,-281.5,1485c-2,6,-10,9,-24,9\nc-8,0,-12,-0.7,-12,-2c0,-1.3,-5.3,-32,-16,-92c-50.7,-293.3,-119.7,-693.3,-207,-1200\nc0,-1.3,-5.3,8.7,-16,30c-10.7,21.3,-21.3,42.7,-32,64s-16,33,-16,33s-26,-26,-26,-26\ns76,-153,76,-153s77,-151,77,-151c0.7,0.7,35.7,202,105,604c67.3,400.7,102,602.7,104,\n606zM"+(1001+t)+" "+e+"h400000v"+(40+t)+"H1017.7z"}(e,80);break;case"sqrtTall":a=function(t,e,r){return"M702 "+(t+e)+"H400000"+(40+t)+"\nH742v"+(r-54-e-t)+"l-4 4-4 4c-.667.7 -2 1.5-4 2.5s-4.167 1.833-6.5 2.5-5.5 1-9.5 1\nh-12l-28-84c-16.667-52-96.667 -294.333-240-727l-212 -643 -85 170\nc-4-3.333-8.333-7.667-13 -13l-13-13l77-155 77-156c66 199.333 139 419.667\n219 661 l218 661zM702 "+e+"H400000v"+(40+t)+"H742z"}(e,80,r)}return a}(t,a,r),o=new H(t,i),s=new L([o],{width:"400em",height:e+"em",viewBox:"0 0 400000 "+r,preserveAspectRatio:"xMinYMin slice"});return Dt.makeSvgSpan(["hide-tail"],[s],n)},$e=["(","\\lparen",")","\\rparen","[","\\lbrack","]","\\rbrack","\\{","\\lbrace","\\}","\\rbrace","\\lfloor","\\rfloor","\u230a","\u230b","\\lceil","\\rceil","\u2308","\u2309","\\surd"],Ze=["\\uparrow","\\downarrow","\\updownarrow","\\Uparrow","\\Downarrow","\\Updownarrow","|","\\|","\\vert","\\Vert","\\lvert","\\rvert","\\lVert","\\rVert","\\lgroup","\\rgroup","\u27ee","\u27ef","\\lmoustache","\\rmoustache","\u23b0","\u23b1"],Ke=["<",">","\\langle","\\rangle","/","\\backslash","\\lt","\\gt"],Je=[0,1.2,1.8,2.4,3],Qe=[{type:"small",style:w.SCRIPTSCRIPT},{type:"small",style:w.SCRIPT},{type:"small",style:w.TEXT},{type:"large",size:1},{type:"large",size:2},{type:"large",size:3},{type:"large",size:4}],tr=[{type:"small",style:w.SCRIPTSCRIPT},{type:"small",style:w.SCRIPT},{type:"small",style:w.TEXT},{type:"stack"}],er=[{type:"small",style:w.SCRIPTSCRIPT},{type:"small",style:w.SCRIPT},{type:"small",style:w.TEXT},{type:"large",size:1},{type:"large",size:2},{type:"large",size:3},{type:"large",size:4},{type:"stack"}],rr=function(t){if("small"===t.type)return"Main-Regular";if("large"===t.type)return"Size"+t.size+"-Regular";if("stack"===t.type)return"Size4-Regular";throw new Error("Add support for delim type '"+t.type+"' here.")},ar=function(t,e,r,a){for(var n=Math.min(2,3-a.style.size);n<r.length&&"stack"!==r[n].type;n++){var i=Ve(t,rr(r[n]),"math"),o=i.height+i.depth;if("small"===r[n].type&&(o*=a.havingBaseStyle(r[n].style).sizeMultiplier),o>e)return r[n]}return r[r.length-1]},nr=function(t,e,r,a,n,i){var o;"<"===t||"\\lt"===t||"\u27e8"===t?t="\\langle":">"!==t&&"\\gt"!==t&&"\u27e9"!==t||(t="\\rangle"),o=c.contains(Ke,t)?Qe:c.contains($e,t)?er:tr;var s=ar(t,e,o,a);return"small"===s.type?function(t,e,r,a,n,i){var o=Dt.makeSymbol(t,"Main-Regular",n,a),s=Ue(o,e,a,i);return r&&Ge(s,a,e),s}(t,s.style,r,a,n,i):"large"===s.type?Ye(t,s.size,r,a,n,i):_e(t,e,r,a,n,i)},ir=function(t,e){var r,a,n=e.havingBaseSizing(),i=ar("\\surd",t*n.sizeMultiplier,er,n),o=n.sizeMultiplier,s=Math.max(0,e.minRuleThickness-e.fontMetrics().sqrtRuleThickness),h=0,l=0,m=0;return"small"===i.type?(t<1?o=1:t<1.4&&(o=.7),l=(1+s)/o,(r=je("sqrtMain",h=(1+s+.08)/o,m=1e3+1e3*s+80,s,e)).style.minWidth="0.853em",a=.833/o):"large"===i.type?(m=1080*Je[i.size],l=(Je[i.size]+s)/o,h=(Je[i.size]+s+.08)/o,(r=je("sqrtSize"+i.size,h,m,s,e)).style.minWidth="1.02em",a=1/o):(h=t+s+.08,l=t+s,m=Math.floor(1e3*t+s)+80,(r=je("sqrtTall",h,m,s,e)).style.minWidth="0.742em",a=1.056),r.height=l,r.style.height=h+"em",{span:r,advanceWidth:a,ruleWidth:(e.fontMetrics().sqrtRuleThickness+s)*o}},or=function(t,e,r,a,n){if("<"===t||"\\lt"===t||"\u27e8"===t?t="\\langle":">"!==t&&"\\gt"!==t&&"\u27e9"!==t||(t="\\rangle"),c.contains($e,t)||c.contains(Ke,t))return Ye(t,e,!1,r,a,n);if(c.contains(Ze,t))return _e(t,Je[e],!1,r,a,n);throw new o("Illegal delimiter: '"+t+"'")},sr=nr,hr=function(t,e,r,a,n,i){var o=a.fontMetrics().axisHeight*a.sizeMultiplier,s=5/a.fontMetrics().ptPerEm,h=Math.max(e-o,r+o),l=Math.max(h/500*901,2*h-s);return nr(t,l,!0,a,n,i)},lr={"\\bigl":{mclass:"mopen",size:1},"\\Bigl":{mclass:"mopen",size:2},"\\biggl":{mclass:"mopen",size:3},"\\Biggl":{mclass:"mopen",size:4},"\\bigr":{mclass:"mclose",size:1},"\\Bigr":{mclass:"mclose",size:2},"\\biggr":{mclass:"mclose",size:3},"\\Biggr":{mclass:"mclose",size:4},"\\bigm":{mclass:"mrel",size:1},"\\Bigm":{mclass:"mrel",size:2},"\\biggm":{mclass:"mrel",size:3},"\\Biggm":{mclass:"mrel",size:4},"\\big":{mclass:"mord",size:1},"\\Big":{mclass:"mord",size:2},"\\bigg":{mclass:"mord",size:3},"\\Bigg":{mclass:"mord",size:4}},mr=["(","\\lparen",")","\\rparen","[","\\lbrack","]","\\rbrack","\\{","\\lbrace","\\}","\\rbrace","\\lfloor","\\rfloor","\u230a","\u230b","\\lceil","\\rceil","\u2308","\u2309","<",">","\\langle","\u27e8","\\rangle","\u27e9","\\lt","\\gt","\\lvert","\\rvert","\\lVert","\\rVert","\\lgroup","\\rgroup","\u27ee","\u27ef","\\lmoustache","\\rmoustache","\u23b0","\u23b1","/","\\backslash","|","\\vert","\\|","\\Vert","\\uparrow","\\Uparrow","\\downarrow","\\Downarrow","\\updownarrow","\\Updownarrow","."];function cr(t,e){var r=Yt(t);if(r&&c.contains(mr,r.text))return r;throw new o("Invalid delimiter: '"+(r?r.text:JSON.stringify(t))+"' after '"+e.funcName+"'",t)}function ur(t){if(!t.body)throw new Error("Bug: The leftright ParseNode wasn't fully parsed.")}Qt({type:"delimsizing",names:["\\bigl","\\Bigl","\\biggl","\\Biggl","\\bigr","\\Bigr","\\biggr","\\Biggr","\\bigm","\\Bigm","\\biggm","\\Biggm","\\big","\\Big","\\bigg","\\Bigg"],props:{numArgs:1},handler:function(t,e){var r=cr(e[0],t);return{type:"delimsizing",mode:t.parser.mode,size:lr[t.funcName].size,mclass:lr[t.funcName].mclass,delim:r.text}},htmlBuilder:function(t,e){return"."===t.delim?Dt.makeSpan([t.mclass]):or(t.delim,t.size,e,t.mode,[t.mclass])},mathmlBuilder:function(t){var e=[];"."!==t.delim&&e.push(be(t.delim,t.mode));var r=new ve.MathNode("mo",e);return"mopen"===t.mclass||"mclose"===t.mclass?r.setAttribute("fence","true"):r.setAttribute("fence","false"),r}}),Qt({type:"leftright-right",names:["\\right"],props:{numArgs:1},handler:function(t,e){var r=t.parser.gullet.macros.get("\\current@color");if(r&&"string"!=typeof r)throw new o("\\current@color set to non-string in \\right");return{type:"leftright-right",mode:t.parser.mode,delim:cr(e[0],t).text,color:r}}}),Qt({type:"leftright",names:["\\left"],props:{numArgs:1},handler:function(t,e){var r=cr(e[0],t),a=t.parser;++a.leftrightDepth;var n=a.parseExpression(!1);--a.leftrightDepth,a.expect("\\right",!1);var i=Ft(a.parseFunction(),"leftright-right");return{type:"leftright",mode:a.mode,body:n,left:r.text,right:i.delim,rightColor:i.color}},htmlBuilder:function(t,e){ur(t);for(var r,a,n=se(t.body,e,!0,["mopen","mclose"]),i=0,o=0,s=!1,h=0;h<n.length;h++)n[h].isMiddle?s=!0:(i=Math.max(n[h].height,i),o=Math.max(n[h].depth,o));if(i*=e.sizeMultiplier,o*=e.sizeMultiplier,r="."===t.left?ce(e,["mopen"]):hr(t.left,i,o,e,t.mode,["mopen"]),n.unshift(r),s)for(var l=1;l<n.length;l++){var m=n[l].isMiddle;m&&(n[l]=hr(m.delim,i,o,m.options,t.mode,[]))}if("."===t.right)a=ce(e,["mclose"]);else{var c=t.rightColor?e.withColor(t.rightColor):e;a=hr(t.right,i,o,c,t.mode,["mclose"])}return n.push(a),Dt.makeSpan(["minner"],n,e)},mathmlBuilder:function(t,e){ur(t);var r=ke(t.body,e);if("."!==t.left){var a=new ve.MathNode("mo",[be(t.left,t.mode)]);a.setAttribute("fence","true"),r.unshift(a)}if("."!==t.right){var n=new ve.MathNode("mo",[be(t.right,t.mode)]);n.setAttribute("fence","true"),t.rightColor&&n.setAttribute("mathcolor",t.rightColor),r.push(n)}return ye(r)}}),Qt({type:"middle",names:["\\middle"],props:{numArgs:1},handler:function(t,e){var r=cr(e[0],t);if(!t.parser.leftrightDepth)throw new o("\\middle without preceding \\left",r);return{type:"middle",mode:t.parser.mode,delim:r.text}},htmlBuilder:function(t,e){var r;if("."===t.delim)r=ce(e,[]);else{r=or(t.delim,1,e,t.mode,[]);var a={delim:t.delim,options:e};r.isMiddle=a}return r},mathmlBuilder:function(t,e){var r="\\vert"===t.delim||"|"===t.delim?be("|","text"):be(t.delim,t.mode),a=new ve.MathNode("mo",[r]);return a.setAttribute("fence","true"),a.setAttribute("lspace","0.05em"),a.setAttribute("rspace","0.05em"),a}});var pr=function(t,e){var r,a,n=Dt.wrapFragment(ue(t.body,e),e),i=t.label.substr(1),o=e.sizeMultiplier,s=0,h=c.isCharacterBox(t.body);if("sout"===i)(r=Dt.makeSpan(["stretchy","sout"])).height=e.fontMetrics().defaultRuleThickness/o,s=-.5*e.fontMetrics().xHeight;else{/cancel/.test(i)?h||n.classes.push("cancel-pad"):n.classes.push("boxpad");var l=0,m=0;/box/.test(i)?(m=Math.max(e.fontMetrics().fboxrule,e.minRuleThickness),l=e.fontMetrics().fboxsep+("colorbox"===i?0:m)):l=h?.2:0,r=Ie(n,i,l,e),/fbox|boxed|fcolorbox/.test(i)&&(r.style.borderStyle="solid",r.style.borderWidth=m+"em"),s=n.depth+l,t.backgroundColor&&(r.style.backgroundColor=t.backgroundColor,t.borderColor&&(r.style.borderColor=t.borderColor))}return a=t.backgroundColor?Dt.makeVList({positionType:"individualShift",children:[{type:"elem",elem:r,shift:s},{type:"elem",elem:n,shift:0}]},e):Dt.makeVList({positionType:"individualShift",children:[{type:"elem",elem:n,shift:0},{type:"elem",elem:r,shift:s,wrapperClasses:/cancel/.test(i)?["svg-align"]:[]}]},e),/cancel/.test(i)&&(a.height=n.height,a.depth=n.depth),/cancel/.test(i)&&!h?Dt.makeSpan(["mord","cancel-lap"],[a],e):Dt.makeSpan(["mord"],[a],e)},dr=function(t,e){var r=0,a=new ve.MathNode(t.label.indexOf("colorbox")>-1?"mpadded":"menclose",[Me(t.body,e)]);switch(t.label){case"\\cancel":a.setAttribute("notation","updiagonalstrike");break;case"\\bcancel":a.setAttribute("notation","downdiagonalstrike");break;case"\\sout":a.setAttribute("notation","horizontalstrike");break;case"\\fbox":a.setAttribute("notation","box");break;case"\\fcolorbox":case"\\colorbox":if(r=e.fontMetrics().fboxsep*e.fontMetrics().ptPerEm,a.setAttribute("width","+"+2*r+"pt"),a.setAttribute("height","+"+2*r+"pt"),a.setAttribute("lspace",r+"pt"),a.setAttribute("voffset",r+"pt"),"\\fcolorbox"===t.label){var n=Math.max(e.fontMetrics().fboxrule,e.minRuleThickness);a.setAttribute("style","border: "+n+"em solid "+String(t.borderColor))}break;case"\\xcancel":a.setAttribute("notation","updiagonalstrike downdiagonalstrike")}return t.backgroundColor&&a.setAttribute("mathbackground",t.backgroundColor),a};Qt({type:"enclose",names:["\\colorbox"],props:{numArgs:2,allowedInText:!0,greediness:3,argTypes:["color","text"]},handler:function(t,e,r){var a=t.parser,n=t.funcName,i=Ft(e[0],"color-token").color,o=e[1];return{type:"enclose",mode:a.mode,label:n,backgroundColor:i,body:o}},htmlBuilder:pr,mathmlBuilder:dr}),Qt({type:"enclose",names:["\\fcolorbox"],props:{numArgs:3,allowedInText:!0,greediness:3,argTypes:["color","color","text"]},handler:function(t,e,r){var a=t.parser,n=t.funcName,i=Ft(e[0],"color-token").color,o=Ft(e[1],"color-token").color,s=e[2];return{type:"enclose",mode:a.mode,label:n,backgroundColor:o,borderColor:i,body:s}},htmlBuilder:pr,mathmlBuilder:dr}),Qt({type:"enclose",names:["\\fbox"],props:{numArgs:1,argTypes:["hbox"],allowedInText:!0},handler:function(t,e){return{type:"enclose",mode:t.parser.mode,label:"\\fbox",body:e[0]}}}),Qt({type:"enclose",names:["\\cancel","\\bcancel","\\xcancel","\\sout"],props:{numArgs:1},handler:function(t,e,r){var a=t.parser,n=t.funcName,i=e[0];return{type:"enclose",mode:a.mode,label:n,body:i}},htmlBuilder:pr,mathmlBuilder:dr});var fr={};function gr(t){for(var e=t.type,r=t.names,a=t.props,n=t.handler,i=t.htmlBuilder,o=t.mathmlBuilder,s={type:e,numArgs:a.numArgs||0,greediness:1,allowedInText:!1,numOptionalArgs:0,handler:n},h=0;h<r.length;++h)fr[r[h]]=s;i&&(Kt[e]=i),o&&(Jt[e]=o)}function xr(t){var e=[];t.consumeSpaces();for(var r=t.fetch().text;"\\hline"===r||"\\hdashline"===r;)t.consume(),e.push("\\hdashline"===r),t.consumeSpaces(),r=t.fetch().text;return e}function vr(t,e,r){var a=e.hskipBeforeAndAfter,n=e.addJot,i=e.cols,s=e.arraystretch,h=e.colSeparationType;if(t.gullet.beginGroup(),t.gullet.macros.set("\\\\","\\cr"),!s){var l=t.gullet.expandMacroAsText("\\arraystretch");if(null==l)s=1;else if(!(s=parseFloat(l))||s<0)throw new o("Invalid \\arraystretch: "+l)}t.gullet.beginGroup();var m=[],c=[m],u=[],p=[];for(p.push(xr(t));;){var d=t.parseExpression(!1,"\\cr");t.gullet.endGroup(),t.gullet.beginGroup(),d={type:"ordgroup",mode:t.mode,body:d},r&&(d={type:"styling",mode:t.mode,style:r,body:[d]}),m.push(d);var f=t.fetch().text;if("&"===f)t.consume();else{if("\\end"===f){1===m.length&&"styling"===d.type&&0===d.body[0].body.length&&c.pop(),p.length<c.length+1&&p.push([]);break}if("\\cr"!==f)throw new o("Expected & or \\\\ or \\cr or \\end",t.nextToken);var g=Ft(t.parseFunction(),"cr");u.push(g.size),p.push(xr(t)),m=[],c.push(m)}}return t.gullet.endGroup(),t.gullet.endGroup(),{type:"array",mode:t.mode,addJot:n,arraystretch:s,body:c,cols:i,rowGaps:u,hskipBeforeAndAfter:a,hLinesBeforeRow:p,colSeparationType:h}}function br(t){return"d"===t.substr(0,1)?"display":"text"}var yr=function(t,e){var r,a,n=t.body.length,i=t.hLinesBeforeRow,s=0,h=new Array(n),l=[],m=Math.max(e.fontMetrics().arrayRuleWidth,e.minRuleThickness),u=1/e.fontMetrics().ptPerEm,p=5*u;t.colSeparationType&&"small"===t.colSeparationType&&(p=e.havingStyle(w.SCRIPT).sizeMultiplier/e.sizeMultiplier*.2778);var d=12*u,f=3*u,g=t.arraystretch*d,x=.7*g,v=.3*g,b=0;function y(t){for(var e=0;e<t.length;++e)e>0&&(b+=.25),l.push({pos:b,isDashed:t[e]})}for(y(i[0]),r=0;r<t.body.length;++r){var k=t.body[r],S=x,M=v;s<k.length&&(s=k.length);var z=new Array(k.length);for(a=0;a<k.length;++a){var A=ue(k[a],e);M<A.depth&&(M=A.depth),S<A.height&&(S=A.height),z[a]=A}var T=t.rowGaps[r],B=0;T&&(B=Tt(T,e))>0&&(M<(B+=v)&&(M=B),B=0),t.addJot&&(M+=f),z.height=S,z.depth=M,b+=S,z.pos=b,b+=M+B,h[r]=z,y(i[r+1])}var C,q,N=b/2+e.fontMetrics().axisHeight,I=t.cols||[],R=[];for(a=0,q=0;a<s||q<I.length;++a,++q){for(var O=I[q]||{},E=!0;"separator"===O.type;){if(E||((C=Dt.makeSpan(["arraycolsep"],[])).style.width=e.fontMetrics().doubleRuleSep+"em",R.push(C)),"|"!==O.separator&&":"!==O.separator)throw new o("Invalid separator type: "+O.separator);var L="|"===O.separator?"solid":"dashed",H=Dt.makeSpan(["vertical-separator"],[],e);H.style.height=b+"em",H.style.borderRightWidth=m+"em",H.style.borderRightStyle=L,H.style.margin="0 -"+m/2+"em",H.style.verticalAlign=-(b-N)+"em",R.push(H),O=I[++q]||{},E=!1}if(!(a>=s)){var P=void 0;(a>0||t.hskipBeforeAndAfter)&&0!==(P=c.deflt(O.pregap,p))&&((C=Dt.makeSpan(["arraycolsep"],[])).style.width=P+"em",R.push(C));var D=[];for(r=0;r<n;++r){var F=h[r],V=F[a];if(V){var U=F.pos-N;V.depth=F.depth,V.height=F.height,D.push({type:"elem",elem:V,shift:U})}}D=Dt.makeVList({positionType:"individualShift",children:D},e),D=Dt.makeSpan(["col-align-"+(O.align||"c")],[D]),R.push(D),(a<s-1||t.hskipBeforeAndAfter)&&0!==(P=c.deflt(O.postgap,p))&&((C=Dt.makeSpan(["arraycolsep"],[])).style.width=P+"em",R.push(C))}}if(h=Dt.makeSpan(["mtable"],R),l.length>0){for(var G=Dt.makeLineSpan("hline",e,m),Y=Dt.makeLineSpan("hdashline",e,m),W=[{type:"elem",elem:h,shift:0}];l.length>0;){var X=l.pop(),_=X.pos-N;X.isDashed?W.push({type:"elem",elem:Y,shift:_}):W.push({type:"elem",elem:G,shift:_})}h=Dt.makeVList({positionType:"individualShift",children:W},e)}return Dt.makeSpan(["mord"],[h],e)},wr={c:"center ",l:"left ",r:"right "},kr=function(t,e){var r=new ve.MathNode("mtable",t.body.map(function(t){return new ve.MathNode("mtr",t.map(function(t){return new ve.MathNode("mtd",[Me(t,e)])}))})),a=.5===t.arraystretch?.1:.16+t.arraystretch-1+(t.addJot?.09:0);r.setAttribute("rowspacing",a+"em");var n="",i="";if(t.cols){var o=t.cols,s="",h=!1,l=0,m=o.length;"separator"===o[0].type&&(n+="top ",l=1),"separator"===o[o.length-1].type&&(n+="bottom ",m-=1);for(var c=l;c<m;c++)"align"===o[c].type?(i+=wr[o[c].align],h&&(s+="none "),h=!0):"separator"===o[c].type&&h&&(s+="|"===o[c].separator?"solid ":"dashed ",h=!1);r.setAttribute("columnalign",i.trim()),/[sd]/.test(s)&&r.setAttribute("columnlines",s.trim())}if("align"===t.colSeparationType){for(var u=t.cols||[],p="",d=1;d<u.length;d++)p+=d%2?"0em ":"1em ";r.setAttribute("columnspacing",p.trim())}else"alignat"===t.colSeparationType?r.setAttribute("columnspacing","0em"):"small"===t.colSeparationType?r.setAttribute("columnspacing","0.2778em"):r.setAttribute("columnspacing","1em");var f="",g=t.hLinesBeforeRow;n+=g[0].length>0?"left ":"",n+=g[g.length-1].length>0?"right ":"";for(var x=1;x<g.length-1;x++)f+=0===g[x].length?"none ":g[x][0]?"dashed ":"solid ";return/[sd]/.test(f)&&r.setAttribute("rowlines",f.trim()),""!==n&&(r=new ve.MathNode("menclose",[r])).setAttribute("notation",n.trim()),t.arraystretch&&t.arraystretch<1&&(r=new ve.MathNode("mstyle",[r])).setAttribute("scriptlevel","1"),r},Sr=function(t,e){var r,a=[],n=vr(t.parser,{cols:a,addJot:!0},"display"),i=0,s={type:"ordgroup",mode:t.mode,body:[]},h=Vt(e[0],"ordgroup");if(h){for(var l="",m=0;m<h.body.length;m++){l+=Ft(h.body[m],"textord").text}r=Number(l),i=2*r}var c=!i;n.body.forEach(function(t){for(var e=1;e<t.length;e+=2){var a=Ft(t[e],"styling");Ft(a.body[0],"ordgroup").body.unshift(s)}if(c)i<t.length&&(i=t.length);else{var n=t.length/2;if(r<n)throw new o("Too many math in a row: expected "+r+", but got "+n,t[0])}});for(var u=0;u<i;++u){var p="r",d=0;u%2==1?p="l":u>0&&c&&(d=1),a[u]={type:"align",align:p,pregap:d,postgap:0}}return n.colSeparationType=c?"align":"alignat",n};gr({type:"array",names:["array","darray"],props:{numArgs:1},handler:function(t,e){var r={cols:(Yt(e[0])?[e[0]]:Ft(e[0],"ordgroup").body).map(function(t){var e=Gt(t).text;if(-1!=="lcr".indexOf(e))return{type:"align",align:e};if("|"===e)return{type:"separator",separator:"|"};if(":"===e)return{type:"separator",separator:":"};throw new o("Unknown column alignment: "+e,t)}),hskipBeforeAndAfter:!0};return vr(t.parser,r,br(t.envName))},htmlBuilder:yr,mathmlBuilder:kr}),gr({type:"array",names:["matrix","pmatrix","bmatrix","Bmatrix","vmatrix","Vmatrix"],props:{numArgs:0},handler:function(t){var e={matrix:null,pmatrix:["(",")"],bmatrix:["[","]"],Bmatrix:["\\{","\\}"],vmatrix:["|","|"],Vmatrix:["\\Vert","\\Vert"]}[t.envName],r=vr(t.parser,{hskipBeforeAndAfter:!1},br(t.envName));return e?{type:"leftright",mode:t.mode,body:[r],left:e[0],right:e[1],rightColor:void 0}:r},htmlBuilder:yr,mathmlBuilder:kr}),gr({type:"array",names:["smallmatrix"],props:{numArgs:0},handler:function(t){var e=vr(t.parser,{arraystretch:.5},"script");return e.colSeparationType="small",e},htmlBuilder:yr,mathmlBuilder:kr}),gr({type:"array",names:["subarray"],props:{numArgs:1},handler:function(t,e){var r=(Yt(e[0])?[e[0]]:Ft(e[0],"ordgroup").body).map(function(t){var e=Gt(t).text;if(-1!=="lc".indexOf(e))return{type:"align",align:e};throw new o("Unknown column alignment: "+e,t)});if(r.length>1)throw new o("{subarray} can contain only one column");var a={cols:r,hskipBeforeAndAfter:!1,arraystretch:.5};if((a=vr(t.parser,a,"script")).body[0].length>1)throw new o("{subarray} can contain only one column");return a},htmlBuilder:yr,mathmlBuilder:kr}),gr({type:"array",names:["cases","dcases"],props:{numArgs:0},handler:function(t){var e=vr(t.parser,{arraystretch:1.2,cols:[{type:"align",align:"l",pregap:0,postgap:1},{type:"align",align:"l",pregap:0,postgap:0}]},br(t.envName));return{type:"leftright",mode:t.mode,body:[e],left:"\\{",right:".",rightColor:void 0}},htmlBuilder:yr,mathmlBuilder:kr}),gr({type:"array",names:["aligned"],props:{numArgs:0},handler:Sr,htmlBuilder:yr,mathmlBuilder:kr}),gr({type:"array",names:["gathered"],props:{numArgs:0},handler:function(t){return vr(t.parser,{cols:[{type:"align",align:"c"}],addJot:!0},"display")},htmlBuilder:yr,mathmlBuilder:kr}),gr({type:"array",names:["alignedat"],props:{numArgs:1},handler:Sr,htmlBuilder:yr,mathmlBuilder:kr}),Qt({type:"text",names:["\\hline","\\hdashline"],props:{numArgs:0,allowedInText:!0,allowedInMath:!0},handler:function(t,e){throw new o(t.funcName+" valid only within array environment")}});var Mr=fr;Qt({type:"environment",names:["\\begin","\\end"],props:{numArgs:1,argTypes:["text"]},handler:function(t,e){var r=t.parser,a=t.funcName,n=e[0];if("ordgroup"!==n.type)throw new o("Invalid environment name",n);for(var i="",s=0;s<n.body.length;++s)i+=Ft(n.body[s],"textord").text;if("\\begin"===a){if(!Mr.hasOwnProperty(i))throw new o("No such environment: "+i,n);var h=Mr[i],l=r.parseArguments("\\begin{"+i+"}",h),m=l.args,c=l.optArgs,u={mode:r.mode,envName:i,parser:r},p=h.handler(u,m,c);r.expect("\\end",!1);var d=r.nextToken,f=Ft(r.parseFunction(),"environment");if(f.name!==i)throw new o("Mismatch: \\begin{"+i+"} matched by \\end{"+f.name+"}",d);return p}return{type:"environment",mode:r.mode,name:i,nameGroup:n}}});var zr=Dt.makeSpan;function Ar(t,e){var r=se(t.body,e,!0);return zr([t.mclass],r,e)}function Tr(t,e){var r,a=ke(t.body,e);return"minner"===t.mclass?ve.newDocumentFragment(a):("mord"===t.mclass?t.isCharacterBox?(r=a[0]).type="mi":r=new ve.MathNode("mi",a):(t.isCharacterBox?(r=a[0]).type="mo":r=new ve.MathNode("mo",a),"mbin"===t.mclass?(r.attributes.lspace="0.22em",r.attributes.rspace="0.22em"):"mpunct"===t.mclass?(r.attributes.lspace="0em",r.attributes.rspace="0.17em"):"mopen"!==t.mclass&&"mclose"!==t.mclass||(r.attributes.lspace="0em",r.attributes.rspace="0em")),r)}Qt({type:"mclass",names:["\\mathord","\\mathbin","\\mathrel","\\mathopen","\\mathclose","\\mathpunct","\\mathinner"],props:{numArgs:1},handler:function(t,e){var r=t.parser,a=t.funcName,n=e[0];return{type:"mclass",mode:r.mode,mclass:"m"+a.substr(5),body:ee(n),isCharacterBox:c.isCharacterBox(n)}},htmlBuilder:Ar,mathmlBuilder:Tr});var Br=function(t){var e="ordgroup"===t.type&&t.body.length?t.body[0]:t;return"atom"!==e.type||"bin"!==e.family&&"rel"!==e.family?"mord":"m"+e.family};Qt({type:"mclass",names:["\\@binrel"],props:{numArgs:2},handler:function(t,e){return{type:"mclass",mode:t.parser.mode,mclass:Br(e[0]),body:[e[1]],isCharacterBox:c.isCharacterBox(e[1])}}}),Qt({type:"mclass",names:["\\stackrel","\\overset","\\underset"],props:{numArgs:2},handler:function(t,e){var r,a=t.parser,n=t.funcName,i=e[1],o=e[0];r="\\stackrel"!==n?Br(i):"mrel";var s={type:"op",mode:i.mode,limits:!0,alwaysHandleSupSub:!0,parentIsSupSub:!1,symbol:!1,suppressBaseShift:"\\stackrel"!==n,body:ee(i)},h={type:"supsub",mode:o.mode,base:s,sup:"\\underset"===n?null:o,sub:"\\underset"===n?o:null};return{type:"mclass",mode:a.mode,mclass:r,body:[h],isCharacterBox:c.isCharacterBox(h)}},htmlBuilder:Ar,mathmlBuilder:Tr});var Cr=function(t,e){var r=t.font,a=e.withFont(r);return ue(t.body,a)},qr=function(t,e){var r=t.font,a=e.withFont(r);return Me(t.body,a)},Nr={"\\Bbb":"\\mathbb","\\bold":"\\mathbf","\\frak":"\\mathfrak","\\bm":"\\boldsymbol"};Qt({type:"font",names:["\\mathrm","\\mathit","\\mathbf","\\mathnormal","\\mathbb","\\mathcal","\\mathfrak","\\mathscr","\\mathsf","\\mathtt","\\Bbb","\\bold","\\frak"],props:{numArgs:1,greediness:2},handler:function(t,e){var r=t.parser,a=t.funcName,n=e[0],i=a;return i in Nr&&(i=Nr[i]),{type:"font",mode:r.mode,font:i.slice(1),body:n}},htmlBuilder:Cr,mathmlBuilder:qr}),Qt({type:"mclass",names:["\\boldsymbol","\\bm"],props:{numArgs:1,greediness:2},handler:function(t,e){var r=t.parser,a=e[0],n=c.isCharacterBox(a);return{type:"mclass",mode:r.mode,mclass:Br(a),body:[{type:"font",mode:r.mode,font:"boldsymbol",body:a}],isCharacterBox:n}}}),Qt({type:"font",names:["\\rm","\\sf","\\tt","\\bf","\\it"],props:{numArgs:0,allowedInText:!0},handler:function(t,e){var r=t.parser,a=t.funcName,n=t.breakOnTokenText,i=r.mode,o=r.parseExpression(!0,n);return{type:"font",mode:i,font:"math"+a.slice(1),body:{type:"ordgroup",mode:r.mode,body:o}}},htmlBuilder:Cr,mathmlBuilder:qr});var Ir=function(t,e){var r=e;return"display"===t?r=r.id>=w.SCRIPT.id?r.text():w.DISPLAY:"text"===t&&r.size===w.DISPLAY.size?r=w.TEXT:"script"===t?r=w.SCRIPT:"scriptscript"===t&&(r=w.SCRIPTSCRIPT),r},Rr=function(t,e){var r,a=Ir(t.size,e.style),n=a.fracNum(),i=a.fracDen();r=e.havingStyle(n);var o=ue(t.numer,r,e);if(t.continued){var s=8.5/e.fontMetrics().ptPerEm,h=3.5/e.fontMetrics().ptPerEm;o.height=o.height<s?s:o.height,o.depth=o.depth<h?h:o.depth}r=e.havingStyle(i);var l,m,c,u,p,d,f,g,x,v,b=ue(t.denom,r,e);if(t.hasBarLine?(t.barSize?(m=Tt(t.barSize,e),l=Dt.makeLineSpan("frac-line",e,m)):l=Dt.makeLineSpan("frac-line",e),m=l.height,c=l.height):(l=null,m=0,c=e.fontMetrics().defaultRuleThickness),a.size===w.DISPLAY.size||"display"===t.size?(u=e.fontMetrics().num1,p=m>0?3*c:7*c,d=e.fontMetrics().denom1):(m>0?(u=e.fontMetrics().num2,p=c):(u=e.fontMetrics().num3,p=3*c),d=e.fontMetrics().denom2),l){var y=e.fontMetrics().axisHeight;u-o.depth-(y+.5*m)<p&&(u+=p-(u-o.depth-(y+.5*m))),y-.5*m-(b.height-d)<p&&(d+=p-(y-.5*m-(b.height-d)));var k=-(y-.5*m);f=Dt.makeVList({positionType:"individualShift",children:[{type:"elem",elem:b,shift:d},{type:"elem",elem:l,shift:k},{type:"elem",elem:o,shift:-u}]},e)}else{var S=u-o.depth-(b.height-d);S<p&&(u+=.5*(p-S),d+=.5*(p-S)),f=Dt.makeVList({positionType:"individualShift",children:[{type:"elem",elem:b,shift:d},{type:"elem",elem:o,shift:-u}]},e)}return r=e.havingStyle(a),f.height*=r.sizeMultiplier/e.sizeMultiplier,f.depth*=r.sizeMultiplier/e.sizeMultiplier,g=a.size===w.DISPLAY.size?e.fontMetrics().delim1:e.fontMetrics().delim2,x=null==t.leftDelim?ce(e,["mopen"]):sr(t.leftDelim,g,!0,e.havingStyle(a),t.mode,["mopen"]),v=t.continued?Dt.makeSpan([]):null==t.rightDelim?ce(e,["mclose"]):sr(t.rightDelim,g,!0,e.havingStyle(a),t.mode,["mclose"]),Dt.makeSpan(["mord"].concat(r.sizingClasses(e)),[x,Dt.makeSpan(["mfrac"],[f]),v],e)},Or=function(t,e){var r=new ve.MathNode("mfrac",[Me(t.numer,e),Me(t.denom,e)]);if(t.hasBarLine){if(t.barSize){var a=Tt(t.barSize,e);r.setAttribute("linethickness",a+"em")}}else r.setAttribute("linethickness","0px");var n=Ir(t.size,e.style);if(n.size!==e.style.size){r=new ve.MathNode("mstyle",[r]);var i=n.size===w.DISPLAY.size?"true":"false";r.setAttribute("displaystyle",i),r.setAttribute("scriptlevel","0")}if(null!=t.leftDelim||null!=t.rightDelim){var o=[];if(null!=t.leftDelim){var s=new ve.MathNode("mo",[new ve.TextNode(t.leftDelim.replace("\\",""))]);s.setAttribute("fence","true"),o.push(s)}if(o.push(r),null!=t.rightDelim){var h=new ve.MathNode("mo",[new ve.TextNode(t.rightDelim.replace("\\",""))]);h.setAttribute("fence","true"),o.push(h)}return ye(o)}return r};Qt({type:"genfrac",names:["\\cfrac","\\dfrac","\\frac","\\tfrac","\\dbinom","\\binom","\\tbinom","\\\\atopfrac","\\\\bracefrac","\\\\brackfrac"],props:{numArgs:2,greediness:2},handler:function(t,e){var r,a=t.parser,n=t.funcName,i=e[0],o=e[1],s=null,h=null,l="auto";switch(n){case"\\cfrac":case"\\dfrac":case"\\frac":case"\\tfrac":r=!0;break;case"\\\\atopfrac":r=!1;break;case"\\dbinom":case"\\binom":case"\\tbinom":r=!1,s="(",h=")";break;case"\\\\bracefrac":r=!1,s="\\{",h="\\}";break;case"\\\\brackfrac":r=!1,s="[",h="]";break;default:throw new Error("Unrecognized genfrac command")}switch(n){case"\\cfrac":case"\\dfrac":case"\\dbinom":l="display";break;case"\\tfrac":case"\\tbinom":l="text"}return{type:"genfrac",mode:a.mode,continued:"\\cfrac"===n,numer:i,denom:o,hasBarLine:r,leftDelim:s,rightDelim:h,size:l,barSize:null}},htmlBuilder:Rr,mathmlBuilder:Or}),Qt({type:"infix",names:["\\over","\\choose","\\atop","\\brace","\\brack"],props:{numArgs:0,infix:!0},handler:function(t){var e,r=t.parser,a=t.funcName,n=t.token;switch(a){case"\\over":e="\\frac";break;case"\\choose":e="\\binom";break;case"\\atop":e="\\\\atopfrac";break;case"\\brace":e="\\\\bracefrac";break;case"\\brack":e="\\\\brackfrac";break;default:throw new Error("Unrecognized infix genfrac command")}return{type:"infix",mode:r.mode,replaceWith:e,token:n}}});var Er=["display","text","script","scriptscript"],Lr=function(t){var e=null;return t.length>0&&(e="."===(e=t)?null:e),e};Qt({type:"genfrac",names:["\\genfrac"],props:{numArgs:6,greediness:6,argTypes:["math","math","size","text","math","math"]},handler:function(t,e){var r=t.parser,a=e[4],n=e[5],i=Vt(e[0],"atom");i&&(i=Ut(e[0],"open"));var o=i?Lr(i.text):null,s=Vt(e[1],"atom");s&&(s=Ut(e[1],"close"));var h,l=s?Lr(s.text):null,m=Ft(e[2],"size"),c=null;h=!!m.isBlank||(c=m.value).number>0;var u="auto",p=Vt(e[3],"ordgroup");if(p){if(p.body.length>0){var d=Ft(p.body[0],"textord");u=Er[Number(d.text)]}}else p=Ft(e[3],"textord"),u=Er[Number(p.text)];return{type:"genfrac",mode:r.mode,numer:a,denom:n,continued:!1,hasBarLine:h,barSize:c,leftDelim:o,rightDelim:l,size:u}},htmlBuilder:Rr,mathmlBuilder:Or}),Qt({type:"infix",names:["\\above"],props:{numArgs:1,argTypes:["size"],infix:!0},handler:function(t,e){var r=t.parser,a=(t.funcName,t.token);return{type:"infix",mode:r.mode,replaceWith:"\\\\abovefrac",size:Ft(e[0],"size").value,token:a}}}),Qt({type:"genfrac",names:["\\\\abovefrac"],props:{numArgs:3,argTypes:["math","size","math"]},handler:function(t,e){var r=t.parser,a=(t.funcName,e[0]),n=function(t){if(!t)throw new Error("Expected non-null, but got "+String(t));return t}(Ft(e[1],"infix").size),i=e[2],o=n.number>0;return{type:"genfrac",mode:r.mode,numer:a,denom:i,continued:!1,hasBarLine:o,barSize:n,leftDelim:null,rightDelim:null,size:"auto"}},htmlBuilder:Rr,mathmlBuilder:Or});var Hr=function(t,e){var r,a,n=e.style,i=Vt(t,"supsub");i?(r=i.sup?ue(i.sup,e.havingStyle(n.sup()),e):ue(i.sub,e.havingStyle(n.sub()),e),a=Ft(i.base,"horizBrace")):a=Ft(t,"horizBrace");var o,s=ue(a.base,e.havingBaseStyle(w.DISPLAY)),h=Oe(a,e);if(a.isOver?(o=Dt.makeVList({positionType:"firstBaseline",children:[{type:"elem",elem:s},{type:"kern",size:.1},{type:"elem",elem:h}]},e)).children[0].children[0].children[1].classes.push("svg-align"):(o=Dt.makeVList({positionType:"bottom",positionData:s.depth+.1+h.height,children:[{type:"elem",elem:h},{type:"kern",size:.1},{type:"elem",elem:s}]},e)).children[0].children[0].children[0].classes.push("svg-align"),r){var l=Dt.makeSpan(["mord",a.isOver?"mover":"munder"],[o],e);o=a.isOver?Dt.makeVList({positionType:"firstBaseline",children:[{type:"elem",elem:l},{type:"kern",size:.2},{type:"elem",elem:r}]},e):Dt.makeVList({positionType:"bottom",positionData:l.depth+.2+r.height+r.depth,children:[{type:"elem",elem:r},{type:"kern",size:.2},{type:"elem",elem:l}]},e)}return Dt.makeSpan(["mord",a.isOver?"mover":"munder"],[o],e)};Qt({type:"horizBrace",names:["\\overbrace","\\underbrace"],props:{numArgs:1},handler:function(t,e){var r=t.parser,a=t.funcName;return{type:"horizBrace",mode:r.mode,label:a,isOver:/^\\over/.test(a),base:e[0]}},htmlBuilder:Hr,mathmlBuilder:function(t,e){var r=Re(t.label);return new ve.MathNode(t.isOver?"mover":"munder",[Me(t.base,e),r])}}),Qt({type:"href",names:["\\href"],props:{numArgs:2,argTypes:["url","original"],allowedInText:!0},handler:function(t,e){var r=t.parser,a=e[1],n=Ft(e[0],"url").url;return r.settings.isTrusted({command:"\\href",url:n})?{type:"href",mode:r.mode,href:n,body:ee(a)}:r.formatUnsupportedCmd("\\href")},htmlBuilder:function(t,e){var r=se(t.body,e,!1);return Dt.makeAnchor(t.href,[],r,e)},mathmlBuilder:function(t,e){var r=Se(t.body,e);return r instanceof ge||(r=new ge("mrow",[r])),r.setAttribute("href",t.href),r}}),Qt({type:"href",names:["\\url"],props:{numArgs:1,argTypes:["url"],allowedInText:!0},handler:function(t,e){var r=t.parser,a=Ft(e[0],"url").url;if(!r.settings.isTrusted({command:"\\url",url:a}))return r.formatUnsupportedCmd("\\url");for(var n=[],i=0;i<a.length;i++){var o=a[i];"~"===o&&(o="\\textasciitilde"),n.push({type:"textord",mode:"text",text:o})}var s={type:"text",mode:r.mode,font:"\\texttt",body:n};return{type:"href",mode:r.mode,href:a,body:ee(s)}}}),Qt({type:"htmlmathml",names:["\\html@mathml"],props:{numArgs:2,allowedInText:!0},handler:function(t,e){return{type:"htmlmathml",mode:t.parser.mode,html:ee(e[0]),mathml:ee(e[1])}},htmlBuilder:function(t,e){var r=se(t.html,e,!1);return Dt.makeFragment(r)},mathmlBuilder:function(t,e){return Se(t.mathml,e)}});var Pr=function(t){if(/^[-+]? *(\d+(\.\d*)?|\.\d+)$/.test(t))return{number:+t,unit:"bp"};var e=/([-+]?) *(\d+(?:\.\d*)?|\.\d+) *([a-z]{2})/.exec(t);if(!e)throw new o("Invalid size: '"+t+"' in \\includegraphics");var r={number:+(e[1]+e[2]),unit:e[3]};if(!At(r))throw new o("Invalid unit: '"+r.unit+"' in \\includegraphics.");return r};Qt({type:"includegraphics",names:["\\includegraphics"],props:{numArgs:1,numOptionalArgs:1,argTypes:["raw","url"],allowedInText:!1},handler:function(t,e,r){var a=t.parser,n={number:0,unit:"em"},i={number:.9,unit:"em"},s={number:0,unit:"em"},h="";if(r[0])for(var l=Ft(r[0],"raw").string.split(","),m=0;m<l.length;m++){var c=l[m].split("=");if(2===c.length){var u=c[1].trim();switch(c[0].trim()){case"alt":h=u;break;case"width":n=Pr(u);break;case"height":i=Pr(u);break;case"totalheight":s=Pr(u);break;default:throw new o("Invalid key: '"+c[0]+"' in \\includegraphics.")}}}var p=Ft(e[0],"url").url;return""===h&&(h=(h=(h=p).replace(/^.*[\\\/]/,"")).substring(0,h.lastIndexOf("."))),a.settings.isTrusted({command:"\\includegraphics",url:p})?{type:"includegraphics",mode:a.mode,alt:h,width:n,height:i,totalheight:s,src:p}:a.formatUnsupportedCmd("\\includegraphics")},htmlBuilder:function(t,e){var r=Tt(t.height,e),a=0;t.totalheight.number>0&&(a=Tt(t.totalheight,e)-r,a=Number(a.toFixed(2)));var n=0;t.width.number>0&&(n=Tt(t.width,e));var i={height:r+a+"em"};n>0&&(i.width=n+"em"),a>0&&(i.verticalAlign=-a+"em");var o=new R(t.src,t.alt,i);return o.height=r,o.depth=a,o},mathmlBuilder:function(t,e){var r=new ve.MathNode("mglyph",[]);r.setAttribute("alt",t.alt);var a=Tt(t.height,e),n=0;if(t.totalheight.number>0&&(n=(n=Tt(t.totalheight,e)-a).toFixed(2),r.setAttribute("valign","-"+n+"em")),r.setAttribute("height",a+n+"em"),t.width.number>0){var i=Tt(t.width,e);r.setAttribute("width",i+"em")}return r.setAttribute("src",t.src),r}}),Qt({type:"kern",names:["\\kern","\\mkern","\\hskip","\\mskip"],props:{numArgs:1,argTypes:["size"],allowedInText:!0},handler:function(t,e){var r=t.parser,a=t.funcName,n=Ft(e[0],"size");if(r.settings.strict){var i="m"===a[1],o="mu"===n.value.unit;i?(o||r.settings.reportNonstrict("mathVsTextUnits","LaTeX's "+a+" supports only mu units, not "+n.value.unit+" units"),"math"!==r.mode&&r.settings.reportNonstrict("mathVsTextUnits","LaTeX's "+a+" works only in math mode")):o&&r.settings.reportNonstrict("mathVsTextUnits","LaTeX's "+a+" doesn't support mu units")}return{type:"kern",mode:r.mode,dimension:n.value}},htmlBuilder:function(t,e){return Dt.makeGlue(t.dimension,e)},mathmlBuilder:function(t,e){var r=Tt(t.dimension,e);return new ve.SpaceNode(r)}}),Qt({type:"lap",names:["\\mathllap","\\mathrlap","\\mathclap"],props:{numArgs:1,allowedInText:!0},handler:function(t,e){var r=t.parser,a=t.funcName,n=e[0];return{type:"lap",mode:r.mode,alignment:a.slice(5),body:n}},htmlBuilder:function(t,e){var r;"clap"===t.alignment?(r=Dt.makeSpan([],[ue(t.body,e)]),r=Dt.makeSpan(["inner"],[r],e)):r=Dt.makeSpan(["inner"],[ue(t.body,e)]);var a=Dt.makeSpan(["fix"],[]),n=Dt.makeSpan([t.alignment],[r,a],e),i=Dt.makeSpan(["strut"]);return i.style.height=n.height+n.depth+"em",i.style.verticalAlign=-n.depth+"em",n.children.unshift(i),n=Dt.makeVList({positionType:"firstBaseline",children:[{type:"elem",elem:n}]},e),Dt.makeSpan(["mord"],[n],e)},mathmlBuilder:function(t,e){var r=new ve.MathNode("mpadded",[Me(t.body,e)]);if("rlap"!==t.alignment){var a="llap"===t.alignment?"-1":"-0.5";r.setAttribute("lspace",a+"width")}return r.setAttribute("width","0px"),r}}),Qt({type:"styling",names:["\\(","$"],props:{numArgs:0,allowedInText:!0,allowedInMath:!1},handler:function(t,e){var r=t.funcName,a=t.parser,n=a.mode;a.switchMode("math");var i="\\("===r?"\\)":"$",o=a.parseExpression(!1,i);return a.expect(i),a.switchMode(n),{type:"styling",mode:a.mode,style:"text",body:o}}}),Qt({type:"text",names:["\\)","\\]"],props:{numArgs:0,allowedInText:!0,allowedInMath:!1},handler:function(t,e){throw new o("Mismatched "+t.funcName)}});var Dr=function(t,e){switch(e.style.size){case w.DISPLAY.size:return t.display;case w.TEXT.size:return t.text;case w.SCRIPT.size:return t.script;case w.SCRIPTSCRIPT.size:return t.scriptscript;default:return t.text}};Qt({type:"mathchoice",names:["\\mathchoice"],props:{numArgs:4},handler:function(t,e){return{type:"mathchoice",mode:t.parser.mode,display:ee(e[0]),text:ee(e[1]),script:ee(e[2]),scriptscript:ee(e[3])}},htmlBuilder:function(t,e){var r=Dr(t,e),a=se(r,e,!1);return Dt.makeFragment(a)},mathmlBuilder:function(t,e){var r=Dr(t,e);return Se(r,e)}});var Fr=function(t,e,r,a,n,i,o){var s,h,l;if(t=Dt.makeSpan([],[t]),e){var m=ue(e,a.havingStyle(n.sup()),a);h={elem:m,kern:Math.max(a.fontMetrics().bigOpSpacing1,a.fontMetrics().bigOpSpacing3-m.depth)}}if(r){var c=ue(r,a.havingStyle(n.sub()),a);s={elem:c,kern:Math.max(a.fontMetrics().bigOpSpacing2,a.fontMetrics().bigOpSpacing4-c.height)}}if(h&&s){var u=a.fontMetrics().bigOpSpacing5+s.elem.height+s.elem.depth+s.kern+t.depth+o;l=Dt.makeVList({positionType:"bottom",positionData:u,children:[{type:"kern",size:a.fontMetrics().bigOpSpacing5},{type:"elem",elem:s.elem,marginLeft:-i+"em"},{type:"kern",size:s.kern},{type:"elem",elem:t},{type:"kern",size:h.kern},{type:"elem",elem:h.elem,marginLeft:i+"em"},{type:"kern",size:a.fontMetrics().bigOpSpacing5}]},a)}else if(s){var p=t.height-o;l=Dt.makeVList({positionType:"top",positionData:p,children:[{type:"kern",size:a.fontMetrics().bigOpSpacing5},{type:"elem",elem:s.elem,marginLeft:-i+"em"},{type:"kern",size:s.kern},{type:"elem",elem:t}]},a)}else{if(!h)return t;var d=t.depth+o;l=Dt.makeVList({positionType:"bottom",positionData:d,children:[{type:"elem",elem:t},{type:"kern",size:h.kern},{type:"elem",elem:h.elem,marginLeft:i+"em"},{type:"kern",size:a.fontMetrics().bigOpSpacing5}]},a)}return Dt.makeSpan(["mop","op-limits"],[l],a)},Vr=["\\smallint"],Ur=function(t,e){var r,a,n,i=!1,o=Vt(t,"supsub");o?(r=o.sup,a=o.sub,n=Ft(o.base,"op"),i=!0):n=Ft(t,"op");var s,h=e.style,l=!1;if(h.size===w.DISPLAY.size&&n.symbol&&!c.contains(Vr,n.name)&&(l=!0),n.symbol){var m=l?"Size2-Regular":"Size1-Regular",u="";if("\\oiint"!==n.name&&"\\oiiint"!==n.name||(u=n.name.substr(1),n.name="oiint"===u?"\\iint":"\\iiint"),s=Dt.makeSymbol(n.name,m,"math",e,["mop","op-symbol",l?"large-op":"small-op"]),u.length>0){var p=s.italic,d=Dt.staticSvg(u+"Size"+(l?"2":"1"),e);s=Dt.makeVList({positionType:"individualShift",children:[{type:"elem",elem:s,shift:0},{type:"elem",elem:d,shift:l?.08:0}]},e),n.name="\\"+u,s.classes.unshift("mop"),s.italic=p}}else if(n.body){var f=se(n.body,e,!0);1===f.length&&f[0]instanceof E?(s=f[0]).classes[0]="mop":s=Dt.makeSpan(["mop"],Dt.tryCombineChars(f),e)}else{for(var g=[],x=1;x<n.name.length;x++)g.push(Dt.mathsym(n.name[x],n.mode,e));s=Dt.makeSpan(["mop"],g,e)}var v=0,b=0;return(s instanceof E||"\\oiint"===n.name||"\\oiiint"===n.name)&&!n.suppressBaseShift&&(v=(s.height-s.depth)/2-e.fontMetrics().axisHeight,b=s.italic),i?Fr(s,r,a,e,h,b,v):(v&&(s.style.position="relative",s.style.top=v+"em"),s)},Gr=function(t,e){var r;if(t.symbol)r=new ge("mo",[be(t.name,t.mode)]),c.contains(Vr,t.name)&&r.setAttribute("largeop","false");else if(t.body)r=new ge("mo",ke(t.body,e));else{r=new ge("mi",[new xe(t.name.slice(1))]);var a=new ge("mo",[be("\u2061","text")]);r=t.parentIsSupSub?new ge("mo",[r,a]):fe([r,a])}return r},Yr={"\u220f":"\\prod","\u2210":"\\coprod","\u2211":"\\sum","\u22c0":"\\bigwedge","\u22c1":"\\bigvee","\u22c2":"\\bigcap","\u22c3":"\\bigcup","\u2a00":"\\bigodot","\u2a01":"\\bigoplus","\u2a02":"\\bigotimes","\u2a04":"\\biguplus","\u2a06":"\\bigsqcup"};Qt({type:"op",names:["\\coprod","\\bigvee","\\bigwedge","\\biguplus","\\bigcap","\\bigcup","\\intop","\\prod","\\sum","\\bigotimes","\\bigoplus","\\bigodot","\\bigsqcup","\\smallint","\u220f","\u2210","\u2211","\u22c0","\u22c1","\u22c2","\u22c3","\u2a00","\u2a01","\u2a02","\u2a04","\u2a06"],props:{numArgs:0},handler:function(t,e){var r=t.parser,a=t.funcName;return 1===a.length&&(a=Yr[a]),{type:"op",mode:r.mode,limits:!0,parentIsSupSub:!1,symbol:!0,name:a}},htmlBuilder:Ur,mathmlBuilder:Gr}),Qt({type:"op",names:["\\mathop"],props:{numArgs:1},handler:function(t,e){var r=t.parser,a=e[0];return{type:"op",mode:r.mode,limits:!1,parentIsSupSub:!1,symbol:!1,body:ee(a)}},htmlBuilder:Ur,mathmlBuilder:Gr});var Wr={"\u222b":"\\int","\u222c":"\\iint","\u222d":"\\iiint","\u222e":"\\oint","\u222f":"\\oiint","\u2230":"\\oiiint"};Qt({type:"op",names:["\\arcsin","\\arccos","\\arctan","\\arctg","\\arcctg","\\arg","\\ch","\\cos","\\cosec","\\cosh","\\cot","\\cotg","\\coth","\\csc","\\ctg","\\cth","\\deg","\\dim","\\exp","\\hom","\\ker","\\lg","\\ln","\\log","\\sec","\\sin","\\sinh","\\sh","\\tan","\\tanh","\\tg","\\th"],props:{numArgs:0},handler:function(t){var e=t.parser,r=t.funcName;return{type:"op",mode:e.mode,limits:!1,parentIsSupSub:!1,symbol:!1,name:r}},htmlBuilder:Ur,mathmlBuilder:Gr}),Qt({type:"op",names:["\\det","\\gcd","\\inf","\\lim","\\max","\\min","\\Pr","\\sup"],props:{numArgs:0},handler:function(t){var e=t.parser,r=t.funcName;return{type:"op",mode:e.mode,limits:!0,parentIsSupSub:!1,symbol:!1,name:r}},htmlBuilder:Ur,mathmlBuilder:Gr}),Qt({type:"op",names:["\\int","\\iint","\\iiint","\\oint","\\oiint","\\oiiint","\u222b","\u222c","\u222d","\u222e","\u222f","\u2230"],props:{numArgs:0},handler:function(t){var e=t.parser,r=t.funcName;return 1===r.length&&(r=Wr[r]),{type:"op",mode:e.mode,limits:!1,parentIsSupSub:!1,symbol:!0,name:r}},htmlBuilder:Ur,mathmlBuilder:Gr});var Xr=function(t,e){var r,a,n,i,o=!1,s=Vt(t,"supsub");if(s?(r=s.sup,a=s.sub,n=Ft(s.base,"operatorname"),o=!0):n=Ft(t,"operatorname"),n.body.length>0){for(var h=n.body.map(function(t){var e=t.text;return"string"==typeof e?{type:"textord",mode:t.mode,text:e}:t}),l=se(h,e.withFont("mathrm"),!0),m=0;m<l.length;m++){var c=l[m];c instanceof E&&(c.text=c.text.replace(/\u2212/,"-").replace(/\u2217/,"*"))}i=Dt.makeSpan(["mop"],l,e)}else i=Dt.makeSpan(["mop"],[],e);return o?Fr(i,r,a,e,e.style,0,0):i};function _r(t,e,r){for(var a=se(t,e,!1),n=e.sizeMultiplier/r.sizeMultiplier,i=0;i<a.length;i++){var o=a[i].classes.indexOf("sizing");o<0?Array.prototype.push.apply(a[i].classes,e.sizingClasses(r)):a[i].classes[o+1]==="reset-size"+e.size&&(a[i].classes[o+1]="reset-size"+r.size),a[i].height*=n,a[i].depth*=n}return Dt.makeFragment(a)}Qt({type:"operatorname",names:["\\operatorname","\\operatorname*"],props:{numArgs:1},handler:function(t,e){var r=t.parser,a=t.funcName,n=e[0];return{type:"operatorname",mode:r.mode,body:ee(n),alwaysHandleSupSub:"\\operatorname*"===a,limits:!1,parentIsSupSub:!1}},htmlBuilder:Xr,mathmlBuilder:function(t,e){for(var r=ke(t.body,e.withFont("mathrm")),a=!0,n=0;n<r.length;n++){var i=r[n];if(i instanceof ve.SpaceNode);else if(i instanceof ve.MathNode)switch(i.type){case"mi":case"mn":case"ms":case"mspace":case"mtext":break;case"mo":var o=i.children[0];1===i.children.length&&o instanceof ve.TextNode?o.text=o.text.replace(/\u2212/,"-").replace(/\u2217/,"*"):a=!1;break;default:a=!1}else a=!1}if(a){var s=r.map(function(t){return t.toText()}).join("");r=[new ve.TextNode(s)]}var h=new ve.MathNode("mi",r);h.setAttribute("mathvariant","normal");var l=new ve.MathNode("mo",[be("\u2061","text")]);return t.parentIsSupSub?new ve.MathNode("mo",[h,l]):ve.newDocumentFragment([h,l])}}),te({type:"ordgroup",htmlBuilder:function(t,e){return t.semisimple?Dt.makeFragment(se(t.body,e,!1)):Dt.makeSpan(["mord"],se(t.body,e,!0),e)},mathmlBuilder:function(t,e){return Se(t.body,e,!0)}}),Qt({type:"overline",names:["\\overline"],props:{numArgs:1},handler:function(t,e){var r=t.parser,a=e[0];return{type:"overline",mode:r.mode,body:a}},htmlBuilder:function(t,e){var r=ue(t.body,e.havingCrampedStyle()),a=Dt.makeLineSpan("overline-line",e),n=e.fontMetrics().defaultRuleThickness,i=Dt.makeVList({positionType:"firstBaseline",children:[{type:"elem",elem:r},{type:"kern",size:3*n},{type:"elem",elem:a},{type:"kern",size:n}]},e);return Dt.makeSpan(["mord","overline"],[i],e)},mathmlBuilder:function(t,e){var r=new ve.MathNode("mo",[new ve.TextNode("\u203e")]);r.setAttribute("stretchy","true");var a=new ve.MathNode("mover",[Me(t.body,e),r]);return a.setAttribute("accent","true"),a}}),Qt({type:"phantom",names:["\\phantom"],props:{numArgs:1,allowedInText:!0},handler:function(t,e){var r=t.parser,a=e[0];return{type:"phantom",mode:r.mode,body:ee(a)}},htmlBuilder:function(t,e){var r=se(t.body,e.withPhantom(),!1);return Dt.makeFragment(r)},mathmlBuilder:function(t,e){var r=ke(t.body,e);return new ve.MathNode("mphantom",r)}}),Qt({type:"hphantom",names:["\\hphantom"],props:{numArgs:1,allowedInText:!0},handler:function(t,e){var r=t.parser,a=e[0];return{type:"hphantom",mode:r.mode,body:a}},htmlBuilder:function(t,e){var r=Dt.makeSpan([],[ue(t.body,e.withPhantom())]);if(r.height=0,r.depth=0,r.children)for(var a=0;a<r.children.length;a++)r.children[a].height=0,r.children[a].depth=0;return r=Dt.makeVList({positionType:"firstBaseline",children:[{type:"elem",elem:r}]},e),Dt.makeSpan(["mord"],[r],e)},mathmlBuilder:function(t,e){var r=ke(ee(t.body),e),a=new ve.MathNode("mphantom",r),n=new ve.MathNode("mpadded",[a]);return n.setAttribute("height","0px"),n.setAttribute("depth","0px"),n}}),Qt({type:"vphantom",names:["\\vphantom"],props:{numArgs:1,allowedInText:!0},handler:function(t,e){var r=t.parser,a=e[0];return{type:"vphantom",mode:r.mode,body:a}},htmlBuilder:function(t,e){var r=Dt.makeSpan(["inner"],[ue(t.body,e.withPhantom())]),a=Dt.makeSpan(["fix"],[]);return Dt.makeSpan(["mord","rlap"],[r,a],e)},mathmlBuilder:function(t,e){var r=ke(ee(t.body),e),a=new ve.MathNode("mphantom",r),n=new ve.MathNode("mpadded",[a]);return n.setAttribute("width","0px"),n}}),Qt({type:"raisebox",names:["\\raisebox"],props:{numArgs:2,argTypes:["size","hbox"],allowedInText:!0},handler:function(t,e){var r=t.parser,a=Ft(e[0],"size").value,n=e[1];return{type:"raisebox",mode:r.mode,dy:a,body:n}},htmlBuilder:function(t,e){var r=ue(t.body,e),a=Tt(t.dy,e);return Dt.makeVList({positionType:"shift",positionData:-a,children:[{type:"elem",elem:r}]},e)},mathmlBuilder:function(t,e){var r=new ve.MathNode("mpadded",[Me(t.body,e)]),a=t.dy.number+t.dy.unit;return r.setAttribute("voffset",a),r}}),Qt({type:"rule",names:["\\rule"],props:{numArgs:2,numOptionalArgs:1,argTypes:["size","size","size"]},handler:function(t,e,r){var a=t.parser,n=r[0],i=Ft(e[0],"size"),o=Ft(e[1],"size");return{type:"rule",mode:a.mode,shift:n&&Ft(n,"size").value,width:i.value,height:o.value}},htmlBuilder:function(t,e){var r=Dt.makeSpan(["mord","rule"],[],e),a=Tt(t.width,e),n=Tt(t.height,e),i=t.shift?Tt(t.shift,e):0;return r.style.borderRightWidth=a+"em",r.style.borderTopWidth=n+"em",r.style.bottom=i+"em",r.width=a,r.height=n+i,r.depth=-i,r.maxFontSize=1.125*n*e.sizeMultiplier,r},mathmlBuilder:function(t,e){var r=Tt(t.width,e),a=Tt(t.height,e),n=t.shift?Tt(t.shift,e):0,i=e.color&&e.getColor()||"black",o=new ve.MathNode("mspace");o.setAttribute("mathbackground",i),o.setAttribute("width",r+"em"),o.setAttribute("height",a+"em");var s=new ve.MathNode("mpadded",[o]);return n>=0?s.setAttribute("height","+"+n+"em"):(s.setAttribute("height",n+"em"),s.setAttribute("depth","+"+-n+"em")),s.setAttribute("voffset",n+"em"),s}});var jr=["\\tiny","\\sixptsize","\\scriptsize","\\footnotesize","\\small","\\normalsize","\\large","\\Large","\\LARGE","\\huge","\\Huge"];Qt({type:"sizing",names:jr,props:{numArgs:0,allowedInText:!0},handler:function(t,e){var r=t.breakOnTokenText,a=t.funcName,n=t.parser,i=n.parseExpression(!1,r);return{type:"sizing",mode:n.mode,size:jr.indexOf(a)+1,body:i}},htmlBuilder:function(t,e){var r=e.havingSize(t.size);return _r(t.body,r,e)},mathmlBuilder:function(t,e){var r=e.havingSize(t.size),a=ke(t.body,r),n=new ve.MathNode("mstyle",a);return n.setAttribute("mathsize",r.sizeMultiplier+"em"),n}}),Qt({type:"smash",names:["\\smash"],props:{numArgs:1,numOptionalArgs:1,allowedInText:!0},handler:function(t,e,r){var a=t.parser,n=!1,i=!1,o=r[0]&&Ft(r[0],"ordgroup");if(o)for(var s="",h=0;h<o.body.length;++h){if("t"===(s=o.body[h].text))n=!0;else{if("b"!==s){n=!1,i=!1;break}i=!0}}else n=!0,i=!0;var l=e[0];return{type:"smash",mode:a.mode,body:l,smashHeight:n,smashDepth:i}},htmlBuilder:function(t,e){var r=Dt.makeSpan([],[ue(t.body,e)]);if(!t.smashHeight&&!t.smashDepth)return r;if(t.smashHeight&&(r.height=0,r.children))for(var a=0;a<r.children.length;a++)r.children[a].height=0;if(t.smashDepth&&(r.depth=0,r.children))for(var n=0;n<r.children.length;n++)r.children[n].depth=0;var i=Dt.makeVList({positionType:"firstBaseline",children:[{type:"elem",elem:r}]},e);return Dt.makeSpan(["mord"],[i],e)},mathmlBuilder:function(t,e){var r=new ve.MathNode("mpadded",[Me(t.body,e)]);return t.smashHeight&&r.setAttribute("height","0px"),t.smashDepth&&r.setAttribute("depth","0px"),r}}),Qt({type:"sqrt",names:["\\sqrt"],props:{numArgs:1,numOptionalArgs:1},handler:function(t,e,r){var a=t.parser,n=r[0],i=e[0];return{type:"sqrt",mode:a.mode,body:i,index:n}},htmlBuilder:function(t,e){var r=ue(t.body,e.havingCrampedStyle());0===r.height&&(r.height=e.fontMetrics().xHeight),r=Dt.wrapFragment(r,e);var a=e.fontMetrics().defaultRuleThickness,n=a;e.style.id<w.TEXT.id&&(n=e.fontMetrics().xHeight);var i=a+n/4,o=r.height+r.depth+i+a,s=ir(o,e),h=s.span,l=s.ruleWidth,m=s.advanceWidth,c=h.height-l;c>r.height+r.depth+i&&(i=(i+c-r.height-r.depth)/2);var u=h.height-r.height-i-l;r.style.paddingLeft=m+"em";var p=Dt.makeVList({positionType:"firstBaseline",children:[{type:"elem",elem:r,wrapperClasses:["svg-align"]},{type:"kern",size:-(r.height+u)},{type:"elem",elem:h},{type:"kern",size:l}]},e);if(t.index){var d=e.havingStyle(w.SCRIPTSCRIPT),f=ue(t.index,d,e),g=.6*(p.height-p.depth),x=Dt.makeVList({positionType:"shift",positionData:-g,children:[{type:"elem",elem:f}]},e),v=Dt.makeSpan(["root"],[x]);return Dt.makeSpan(["mord","sqrt"],[v,p],e)}return Dt.makeSpan(["mord","sqrt"],[p],e)},mathmlBuilder:function(t,e){var r=t.body,a=t.index;return a?new ve.MathNode("mroot",[Me(r,e),Me(a,e)]):new ve.MathNode("msqrt",[Me(r,e)])}});var $r={display:w.DISPLAY,text:w.TEXT,script:w.SCRIPT,scriptscript:w.SCRIPTSCRIPT};Qt({type:"styling",names:["\\displaystyle","\\textstyle","\\scriptstyle","\\scriptscriptstyle"],props:{numArgs:0,allowedInText:!0},handler:function(t,e){var r=t.breakOnTokenText,a=t.funcName,n=t.parser,i=n.parseExpression(!0,r),o=a.slice(1,a.length-5);return{type:"styling",mode:n.mode,style:o,body:i}},htmlBuilder:function(t,e){var r=$r[t.style],a=e.havingStyle(r).withFont("");return _r(t.body,a,e)},mathmlBuilder:function(t,e){var r=$r[t.style],a=e.havingStyle(r),n=ke(t.body,a),i=new ve.MathNode("mstyle",n),o={display:["0","true"],text:["0","false"],script:["1","false"],scriptscript:["2","false"]}[t.style];return i.setAttribute("scriptlevel",o[0]),i.setAttribute("displaystyle",o[1]),i}});te({type:"supsub",htmlBuilder:function(t,e){var r=function(t,e){var r=t.base;return r?"op"===r.type?r.limits&&(e.style.size===w.DISPLAY.size||r.alwaysHandleSupSub)?Ur:null:"operatorname"===r.type?r.alwaysHandleSupSub&&(e.style.size===w.DISPLAY.size||r.limits)?Xr:null:"accent"===r.type?c.isCharacterBox(r.base)?Ee:null:"horizBrace"===r.type&&!t.sub===r.isOver?Hr:null:null}(t,e);if(r)return r(t,e);var a,n,i,o=t.base,s=t.sup,h=t.sub,l=ue(o,e),m=e.fontMetrics(),u=0,p=0,d=o&&c.isCharacterBox(o);if(s){var f=e.havingStyle(e.style.sup());a=ue(s,f,e),d||(u=l.height-f.fontMetrics().supDrop*f.sizeMultiplier/e.sizeMultiplier)}if(h){var g=e.havingStyle(e.style.sub());n=ue(h,g,e),d||(p=l.depth+g.fontMetrics().subDrop*g.sizeMultiplier/e.sizeMultiplier)}i=e.style===w.DISPLAY?m.sup1:e.style.cramped?m.sup3:m.sup2;var x,v=e.sizeMultiplier,b=.5/m.ptPerEm/v+"em",y=null;if(n){var k=t.base&&"op"===t.base.type&&t.base.name&&("\\oiint"===t.base.name||"\\oiiint"===t.base.name);(l instanceof E||k)&&(y=-l.italic+"em")}if(a&&n){u=Math.max(u,i,a.depth+.25*m.xHeight),p=Math.max(p,m.sub2);var S=4*m.defaultRuleThickness;if(u-a.depth-(n.height-p)<S){p=S-(u-a.depth)+n.height;var M=.8*m.xHeight-(u-a.depth);M>0&&(u+=M,p-=M)}var z=[{type:"elem",elem:n,shift:p,marginRight:b,marginLeft:y},{type:"elem",elem:a,shift:-u,marginRight:b}];x=Dt.makeVList({positionType:"individualShift",children:z},e)}else if(n){p=Math.max(p,m.sub1,n.height-.8*m.xHeight);var A=[{type:"elem",elem:n,marginLeft:y,marginRight:b}];x=Dt.makeVList({positionType:"shift",positionData:p,children:A},e)}else{if(!a)throw new Error("supsub must have either sup or sub.");u=Math.max(u,i,a.depth+.25*m.xHeight),x=Dt.makeVList({positionType:"shift",positionData:-u,children:[{type:"elem",elem:a,marginRight:b}]},e)}var T=me(l,"right")||"mord";return Dt.makeSpan([T],[l,Dt.makeSpan(["msupsub"],[x])],e)},mathmlBuilder:function(t,e){var r,a=!1,n=Vt(t.base,"horizBrace");n&&!!t.sup===n.isOver&&(a=!0,r=n.isOver),!t.base||"op"!==t.base.type&&"operatorname"!==t.base.type||(t.base.parentIsSupSub=!0);var i,o=[Me(t.base,e)];if(t.sub&&o.push(Me(t.sub,e)),t.sup&&o.push(Me(t.sup,e)),a)i=r?"mover":"munder";else if(t.sub)if(t.sup){var s=t.base;i=s&&"op"===s.type&&s.limits&&e.style===w.DISPLAY?"munderover":s&&"operatorname"===s.type&&s.alwaysHandleSupSub&&(e.style===w.DISPLAY||s.limits)?"munderover":"msubsup"}else{var h=t.base;i=h&&"op"===h.type&&h.limits&&(e.style===w.DISPLAY||h.alwaysHandleSupSub)?"munder":h&&"operatorname"===h.type&&h.alwaysHandleSupSub&&(h.limits||e.style===w.DISPLAY)?"munder":"msub"}else{var l=t.base;i=l&&"op"===l.type&&l.limits&&(e.style===w.DISPLAY||l.alwaysHandleSupSub)?"mover":l&&"operatorname"===l.type&&l.alwaysHandleSupSub&&(l.limits||e.style===w.DISPLAY)?"mover":"msup"}return new ve.MathNode(i,o)}}),te({type:"atom",htmlBuilder:function(t,e){return Dt.mathsym(t.text,t.mode,e,["m"+t.family])},mathmlBuilder:function(t,e){var r=new ve.MathNode("mo",[be(t.text,t.mode)]);if("bin"===t.family){var a=we(t,e);"bold-italic"===a&&r.setAttribute("mathvariant",a)}else"punct"===t.family?r.setAttribute("separator","true"):"open"!==t.family&&"close"!==t.family||r.setAttribute("stretchy","false");return r}});var Zr={mi:"italic",mn:"normal",mtext:"normal"};te({type:"mathord",htmlBuilder:function(t,e){return Dt.makeOrd(t,e,"mathord")},mathmlBuilder:function(t,e){var r=new ve.MathNode("mi",[be(t.text,t.mode,e)]),a=we(t,e)||"italic";return a!==Zr[r.type]&&r.setAttribute("mathvariant",a),r}}),te({type:"textord",htmlBuilder:function(t,e){return Dt.makeOrd(t,e,"textord")},mathmlBuilder:function(t,e){var r,a=be(t.text,t.mode,e),n=we(t,e)||"normal";return r="text"===t.mode?new ve.MathNode("mtext",[a]):/[0-9]/.test(t.text)?new ve.MathNode("mn",[a]):"\\prime"===t.text?new ve.MathNode("mo",[a]):new ve.MathNode("mi",[a]),n!==Zr[r.type]&&r.setAttribute("mathvariant",n),r}});var Kr={"\\nobreak":"nobreak","\\allowbreak":"allowbreak"},Jr={" ":{},"\\ ":{},"~":{className:"nobreak"},"\\space":{},"\\nobreakspace":{className:"nobreak"}};te({type:"spacing",htmlBuilder:function(t,e){if(Jr.hasOwnProperty(t.text)){var r=Jr[t.text].className||"";if("text"===t.mode){var a=Dt.makeOrd(t,e,"textord");return a.classes.push(r),a}return Dt.makeSpan(["mspace",r],[Dt.mathsym(t.text,t.mode,e)],e)}if(Kr.hasOwnProperty(t.text))return Dt.makeSpan(["mspace",Kr[t.text]],[],e);throw new o('Unknown type of space "'+t.text+'"')},mathmlBuilder:function(t,e){if(!Jr.hasOwnProperty(t.text)){if(Kr.hasOwnProperty(t.text))return new ve.MathNode("mspace");throw new o('Unknown type of space "'+t.text+'"')}return new ve.MathNode("mtext",[new ve.TextNode("\xa0")])}});var Qr=function(){var t=new ve.MathNode("mtd",[]);return t.setAttribute("width","50%"),t};te({type:"tag",mathmlBuilder:function(t,e){var r=new ve.MathNode("mtable",[new ve.MathNode("mtr",[Qr(),new ve.MathNode("mtd",[Se(t.body,e)]),Qr(),new ve.MathNode("mtd",[Se(t.tag,e)])])]);return r.setAttribute("width","100%"),r}});var ta={"\\text":void 0,"\\textrm":"textrm","\\textsf":"textsf","\\texttt":"texttt","\\textnormal":"textrm"},ea={"\\textbf":"textbf","\\textmd":"textmd"},ra={"\\textit":"textit","\\textup":"textup"},aa=function(t,e){var r=t.font;return r?ta[r]?e.withTextFontFamily(ta[r]):ea[r]?e.withTextFontWeight(ea[r]):e.withTextFontShape(ra[r]):e};Qt({type:"text",names:["\\text","\\textrm","\\textsf","\\texttt","\\textnormal","\\textbf","\\textmd","\\textit","\\textup"],props:{numArgs:1,argTypes:["text"],greediness:2,allowedInText:!0},handler:function(t,e){var r=t.parser,a=t.funcName,n=e[0];return{type:"text",mode:r.mode,body:ee(n),font:a}},htmlBuilder:function(t,e){var r=aa(t,e),a=se(t.body,r,!0);return Dt.makeSpan(["mord","text"],Dt.tryCombineChars(a),r)},mathmlBuilder:function(t,e){var r=aa(t,e);return Se(t.body,r)}}),Qt({type:"underline",names:["\\underline"],props:{numArgs:1,allowedInText:!0},handler:function(t,e){return{type:"underline",mode:t.parser.mode,body:e[0]}},htmlBuilder:function(t,e){var r=ue(t.body,e),a=Dt.makeLineSpan("underline-line",e),n=e.fontMetrics().defaultRuleThickness,i=Dt.makeVList({positionType:"top",positionData:r.height,children:[{type:"kern",size:n},{type:"elem",elem:a},{type:"kern",size:3*n},{type:"elem",elem:r}]},e);return Dt.makeSpan(["mord","underline"],[i],e)},mathmlBuilder:function(t,e){var r=new ve.MathNode("mo",[new ve.TextNode("\u203e")]);r.setAttribute("stretchy","true");var a=new ve.MathNode("munder",[Me(t.body,e),r]);return a.setAttribute("accentunder","true"),a}}),Qt({type:"verb",names:["\\verb"],props:{numArgs:0,allowedInText:!0},handler:function(t,e,r){throw new o("\\verb ended by end of line instead of matching delimiter")},htmlBuilder:function(t,e){for(var r=na(t),a=[],n=e.havingStyle(e.style.text()),i=0;i<r.length;i++){var o=r[i];"~"===o&&(o="\\textasciitilde"),a.push(Dt.makeSymbol(o,"Typewriter-Regular",t.mode,n,["mord","texttt"]))}return Dt.makeSpan(["mord","text"].concat(n.sizingClasses(e)),Dt.tryCombineChars(a),n)},mathmlBuilder:function(t,e){var r=new ve.TextNode(na(t)),a=new ve.MathNode("mtext",[r]);return a.setAttribute("mathvariant","monospace"),a}});var na=function(t){return t.body.replace(/ /g,t.star?"\u2423":"\xa0")},ia=Zt,oa=new RegExp("^(\\\\[a-zA-Z@]+)[ \r\n\t]*$"),sa=new RegExp("[\u0300-\u036f]+$"),ha="([ \r\n\t]+)|([!-\\[\\]-\u2027\u202a-\ud7ff\uf900-\uffff][\u0300-\u036f]*|[\ud800-\udbff][\udc00-\udfff][\u0300-\u036f]*|\\\\verb\\*([^]).*?\\3|\\\\verb([^*a-zA-Z]).*?\\4|\\\\operatorname\\*|\\\\[a-zA-Z@]+[ \r\n\t]*|\\\\[^\ud800-\udfff])",la=function(){function t(t,e){this.input=void 0,this.settings=void 0,this.tokenRegex=void 0,this.catcodes=void 0,this.input=t,this.settings=e,this.tokenRegex=new RegExp(ha,"g"),this.catcodes={"%":14}}var e=t.prototype;return e.setCatcode=function(t,e){this.catcodes[t]=e},e.lex=function(){var t=this.input,e=this.tokenRegex.lastIndex;if(e===t.length)return new n("EOF",new a(this,e,e));var r=this.tokenRegex.exec(t);if(null===r||r.index!==e)throw new o("Unexpected character: '"+t[e]+"'",new n(t[e],new a(this,e,e+1)));var i=r[2]||" ";if(14===this.catcodes[i]){var s=t.indexOf("\n",this.tokenRegex.lastIndex);return-1===s?(this.tokenRegex.lastIndex=t.length,this.settings.reportNonstrict("commentAtEnd","% comment has no terminating newline; LaTeX would fail because of commenting the end of math mode (e.g. $)")):this.tokenRegex.lastIndex=s+1,this.lex()}var h=i.match(oa);return h&&(i=h[1]),new n(i,new a(this,e,this.tokenRegex.lastIndex))},t}(),ma=function(){function t(t,e){void 0===t&&(t={}),void 0===e&&(e={}),this.current=void 0,this.builtins=void 0,this.undefStack=void 0,this.current=e,this.builtins=t,this.undefStack=[]}var e=t.prototype;return e.beginGroup=function(){this.undefStack.push({})},e.endGroup=function(){if(0===this.undefStack.length)throw new o("Unbalanced namespace destruction: attempt to pop global namespace; please report this as a bug");var t=this.undefStack.pop();for(var e in t)t.hasOwnProperty(e)&&(void 0===t[e]?delete this.current[e]:this.current[e]=t[e])},e.has=function(t){return this.current.hasOwnProperty(t)||this.builtins.hasOwnProperty(t)},e.get=function(t){return this.current.hasOwnProperty(t)?this.current[t]:this.builtins[t]},e.set=function(t,e,r){if(void 0===r&&(r=!1),r){for(var a=0;a<this.undefStack.length;a++)delete this.undefStack[a][t];this.undefStack.length>0&&(this.undefStack[this.undefStack.length-1][t]=e)}else{var n=this.undefStack[this.undefStack.length-1];n&&!n.hasOwnProperty(t)&&(n[t]=this.current[t])}this.current[t]=e},t}(),ca={},ua=ca;function pa(t,e){ca[t]=e}pa("\\@firstoftwo",function(t){return{tokens:t.consumeArgs(2)[0],numArgs:0}}),pa("\\@secondoftwo",function(t){return{tokens:t.consumeArgs(2)[1],numArgs:0}}),pa("\\@ifnextchar",function(t){var e=t.consumeArgs(3),r=t.future();return 1===e[0].length&&e[0][0].text===r.text?{tokens:e[1],numArgs:0}:{tokens:e[2],numArgs:0}}),pa("\\@ifstar","\\@ifnextchar *{\\@firstoftwo{#1}}"),pa("\\TextOrMath",function(t){var e=t.consumeArgs(2);return"text"===t.mode?{tokens:e[0],numArgs:0}:{tokens:e[1],numArgs:0}});var da={0:0,1:1,2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:9,a:10,A:10,b:11,B:11,c:12,C:12,d:13,D:13,e:14,E:14,f:15,F:15};pa("\\char",function(t){var e,r=t.popToken(),a="";if("'"===r.text)e=8,r=t.popToken();else if('"'===r.text)e=16,r=t.popToken();else if("`"===r.text)if("\\"===(r=t.popToken()).text[0])a=r.text.charCodeAt(1);else{if("EOF"===r.text)throw new o("\\char` missing argument");a=r.text.charCodeAt(0)}else e=10;if(e){if(null==(a=da[r.text])||a>=e)throw new o("Invalid base-"+e+" digit "+r.text);for(var n;null!=(n=da[t.future().text])&&n<e;)a*=e,a+=n,t.popToken()}return"\\@char{"+a+"}"});var fa=function(t,e){var r=t.consumeArgs(1)[0];if(1!==r.length)throw new o("\\gdef's first argument must be a macro name");var a=r[0].text,n=0;for(r=t.consumeArgs(1)[0];1===r.length&&"#"===r[0].text;){if(1!==(r=t.consumeArgs(1)[0]).length)throw new o('Invalid argument number length "'+r.length+'"');if(!/^[1-9]$/.test(r[0].text))throw new o('Invalid argument number "'+r[0].text+'"');if(n++,parseInt(r[0].text)!==n)throw new o('Argument number "'+r[0].text+'" out of order');r=t.consumeArgs(1)[0]}return t.macros.set(a,{tokens:r,numArgs:n},e),""};pa("\\gdef",function(t){return fa(t,!0)}),pa("\\def",function(t){return fa(t,!1)}),pa("\\global",function(t){var e=t.consumeArgs(1)[0];if(1!==e.length)throw new o("Invalid command after \\global");var r=e[0].text;if("\\def"===r)return fa(t,!0);throw new o("Invalid command '"+r+"' after \\global")});var ga=function(t,e,r){var a=t.consumeArgs(1)[0];if(1!==a.length)throw new o("\\newcommand's first argument must be a macro name");var n=a[0].text,i=t.isDefined(n);if(i&&!e)throw new o("\\newcommand{"+n+"} attempting to redefine "+n+"; use \\renewcommand");if(!i&&!r)throw new o("\\renewcommand{"+n+"} when command "+n+" does not yet exist; use \\newcommand");var s=0;if(1===(a=t.consumeArgs(1)[0]).length&&"["===a[0].text){for(var h="",l=t.expandNextToken();"]"!==l.text&&"EOF"!==l.text;)h+=l.text,l=t.expandNextToken();if(!h.match(/^\s*[0-9]+\s*$/))throw new o("Invalid number of arguments: "+h);s=parseInt(h),a=t.consumeArgs(1)[0]}return t.macros.set(n,{tokens:a,numArgs:s}),""};pa("\\newcommand",function(t){return ga(t,!1,!0)}),pa("\\renewcommand",function(t){return ga(t,!0,!1)}),pa("\\providecommand",function(t){return ga(t,!0,!0)}),pa("\\bgroup","{"),pa("\\egroup","}"),pa("\\lq","`"),pa("\\rq","'"),pa("\\aa","\\r a"),pa("\\AA","\\r A"),pa("\\textcopyright","\\html@mathml{\\textcircled{c}}{\\char`\xa9}"),pa("\\copyright","\\TextOrMath{\\textcopyright}{\\text{\\textcopyright}}"),pa("\\textregistered","\\html@mathml{\\textcircled{\\scriptsize R}}{\\char`\xae}"),pa("\u212c","\\mathscr{B}"),pa("\u2130","\\mathscr{E}"),pa("\u2131","\\mathscr{F}"),pa("\u210b","\\mathscr{H}"),pa("\u2110","\\mathscr{I}"),pa("\u2112","\\mathscr{L}"),pa("\u2133","\\mathscr{M}"),pa("\u211b","\\mathscr{R}"),pa("\u212d","\\mathfrak{C}"),pa("\u210c","\\mathfrak{H}"),pa("\u2128","\\mathfrak{Z}"),pa("\\Bbbk","\\Bbb{k}"),pa("\xb7","\\cdotp"),pa("\\llap","\\mathllap{\\textrm{#1}}"),pa("\\rlap","\\mathrlap{\\textrm{#1}}"),pa("\\clap","\\mathclap{\\textrm{#1}}"),pa("\\not",'\\html@mathml{\\mathrel{\\mathrlap\\@not}}{\\char"338}'),pa("\\neq","\\html@mathml{\\mathrel{\\not=}}{\\mathrel{\\char`\u2260}}"),pa("\\ne","\\neq"),pa("\u2260","\\neq"),pa("\\notin","\\html@mathml{\\mathrel{{\\in}\\mathllap{/\\mskip1mu}}}{\\mathrel{\\char`\u2209}}"),pa("\u2209","\\notin"),pa("\u2258","\\html@mathml{\\mathrel{=\\kern{-1em}\\raisebox{0.4em}{$\\scriptsize\\frown$}}}{\\mathrel{\\char`\u2258}}"),pa("\u2259","\\html@mathml{\\stackrel{\\tiny\\wedge}{=}}{\\mathrel{\\char`\u2258}}"),pa("\u225a","\\html@mathml{\\stackrel{\\tiny\\vee}{=}}{\\mathrel{\\char`\u225a}}"),pa("\u225b","\\html@mathml{\\stackrel{\\scriptsize\\star}{=}}{\\mathrel{\\char`\u225b}}"),pa("\u225d","\\html@mathml{\\stackrel{\\tiny\\mathrm{def}}{=}}{\\mathrel{\\char`\u225d}}"),pa("\u225e","\\html@mathml{\\stackrel{\\tiny\\mathrm{m}}{=}}{\\mathrel{\\char`\u225e}}"),pa("\u225f","\\html@mathml{\\stackrel{\\tiny?}{=}}{\\mathrel{\\char`\u225f}}"),pa("\u27c2","\\perp"),pa("\u203c","\\mathclose{!\\mkern-0.8mu!}"),pa("\u220c","\\notni"),pa("\u231c","\\ulcorner"),pa("\u231d","\\urcorner"),pa("\u231e","\\llcorner"),pa("\u231f","\\lrcorner"),pa("\xa9","\\copyright"),pa("\xae","\\textregistered"),pa("\ufe0f","\\textregistered"),pa("\\vdots","\\mathord{\\varvdots\\rule{0pt}{15pt}}"),pa("\u22ee","\\vdots"),pa("\\varGamma","\\mathit{\\Gamma}"),pa("\\varDelta","\\mathit{\\Delta}"),pa("\\varTheta","\\mathit{\\Theta}"),pa("\\varLambda","\\mathit{\\Lambda}"),pa("\\varXi","\\mathit{\\Xi}"),pa("\\varPi","\\mathit{\\Pi}"),pa("\\varSigma","\\mathit{\\Sigma}"),pa("\\varUpsilon","\\mathit{\\Upsilon}"),pa("\\varPhi","\\mathit{\\Phi}"),pa("\\varPsi","\\mathit{\\Psi}"),pa("\\varOmega","\\mathit{\\Omega}"),pa("\\substack","\\begin{subarray}{c}#1\\end{subarray}"),pa("\\colon","\\nobreak\\mskip2mu\\mathpunct{}\\mathchoice{\\mkern-3mu}{\\mkern-3mu}{}{}{:}\\mskip6mu"),pa("\\boxed","\\fbox{$\\displaystyle{#1}$}"),pa("\\iff","\\DOTSB\\;\\Longleftrightarrow\\;"),pa("\\implies","\\DOTSB\\;\\Longrightarrow\\;"),pa("\\impliedby","\\DOTSB\\;\\Longleftarrow\\;");var xa={",":"\\dotsc","\\not":"\\dotsb","+":"\\dotsb","=":"\\dotsb","<":"\\dotsb",">":"\\dotsb","-":"\\dotsb","*":"\\dotsb",":":"\\dotsb","\\DOTSB":"\\dotsb","\\coprod":"\\dotsb","\\bigvee":"\\dotsb","\\bigwedge":"\\dotsb","\\biguplus":"\\dotsb","\\bigcap":"\\dotsb","\\bigcup":"\\dotsb","\\prod":"\\dotsb","\\sum":"\\dotsb","\\bigotimes":"\\dotsb","\\bigoplus":"\\dotsb","\\bigodot":"\\dotsb","\\bigsqcup":"\\dotsb","\\And":"\\dotsb","\\longrightarrow":"\\dotsb","\\Longrightarrow":"\\dotsb","\\longleftarrow":"\\dotsb","\\Longleftarrow":"\\dotsb","\\longleftrightarrow":"\\dotsb","\\Longleftrightarrow":"\\dotsb","\\mapsto":"\\dotsb","\\longmapsto":"\\dotsb","\\hookrightarrow":"\\dotsb","\\doteq":"\\dotsb","\\mathbin":"\\dotsb","\\mathrel":"\\dotsb","\\relbar":"\\dotsb","\\Relbar":"\\dotsb","\\xrightarrow":"\\dotsb","\\xleftarrow":"\\dotsb","\\DOTSI":"\\dotsi","\\int":"\\dotsi","\\oint":"\\dotsi","\\iint":"\\dotsi","\\iiint":"\\dotsi","\\iiiint":"\\dotsi","\\idotsint":"\\dotsi","\\DOTSX":"\\dotsx"};pa("\\dots",function(t){var e="\\dotso",r=t.expandAfterFuture().text;return r in xa?e=xa[r]:"\\not"===r.substr(0,4)?e="\\dotsb":r in j.math&&c.contains(["bin","rel"],j.math[r].group)&&(e="\\dotsb"),e});var va={")":!0,"]":!0,"\\rbrack":!0,"\\}":!0,"\\rbrace":!0,"\\rangle":!0,"\\rceil":!0,"\\rfloor":!0,"\\rgroup":!0,"\\rmoustache":!0,"\\right":!0,"\\bigr":!0,"\\biggr":!0,"\\Bigr":!0,"\\Biggr":!0,$:!0,";":!0,".":!0,",":!0};pa("\\dotso",function(t){return t.future().text in va?"\\ldots\\,":"\\ldots"}),pa("\\dotsc",function(t){var e=t.future().text;return e in va&&","!==e?"\\ldots\\,":"\\ldots"}),pa("\\cdots",function(t){return t.future().text in va?"\\@cdots\\,":"\\@cdots"}),pa("\\dotsb","\\cdots"),pa("\\dotsm","\\cdots"),pa("\\dotsi","\\!\\cdots"),pa("\\dotsx","\\ldots\\,"),pa("\\DOTSI","\\relax"),pa("\\DOTSB","\\relax"),pa("\\DOTSX","\\relax"),pa("\\tmspace","\\TextOrMath{\\kern#1#3}{\\mskip#1#2}\\relax"),pa("\\,","\\tmspace+{3mu}{.1667em}"),pa("\\thinspace","\\,"),pa("\\>","\\mskip{4mu}"),pa("\\:","\\tmspace+{4mu}{.2222em}"),pa("\\medspace","\\:"),pa("\\;","\\tmspace+{5mu}{.2777em}"),pa("\\thickspace","\\;"),pa("\\!","\\tmspace-{3mu}{.1667em}"),pa("\\negthinspace","\\!"),pa("\\negmedspace","\\tmspace-{4mu}{.2222em}"),pa("\\negthickspace","\\tmspace-{5mu}{.277em}"),pa("\\enspace","\\kern.5em "),pa("\\enskip","\\hskip.5em\\relax"),pa("\\quad","\\hskip1em\\relax"),pa("\\qquad","\\hskip2em\\relax"),pa("\\tag","\\@ifstar\\tag@literal\\tag@paren"),pa("\\tag@paren","\\tag@literal{({#1})}"),pa("\\tag@literal",function(t){if(t.macros.get("\\df@tag"))throw new o("Multiple \\tag");return"\\gdef\\df@tag{\\text{#1}}"}),pa("\\bmod","\\mathchoice{\\mskip1mu}{\\mskip1mu}{\\mskip5mu}{\\mskip5mu}\\mathbin{\\rm mod}\\mathchoice{\\mskip1mu}{\\mskip1mu}{\\mskip5mu}{\\mskip5mu}"),pa("\\pod","\\allowbreak\\mathchoice{\\mkern18mu}{\\mkern8mu}{\\mkern8mu}{\\mkern8mu}(#1)"),pa("\\pmod","\\pod{{\\rm mod}\\mkern6mu#1}"),pa("\\mod","\\allowbreak\\mathchoice{\\mkern18mu}{\\mkern12mu}{\\mkern12mu}{\\mkern12mu}{\\rm mod}\\,\\,#1"),pa("\\pmb","\\html@mathml{\\@binrel{#1}{\\mathrlap{#1}\\kern0.5px#1}}{\\mathbf{#1}}"),pa("\\\\","\\newline"),pa("\\TeX","\\textrm{\\html@mathml{T\\kern-.1667em\\raisebox{-.5ex}{E}\\kern-.125emX}{TeX}}");var ba=F["Main-Regular"]["T".charCodeAt(0)][1]-.7*F["Main-Regular"]["A".charCodeAt(0)][1]+"em";pa("\\LaTeX","\\textrm{\\html@mathml{L\\kern-.36em\\raisebox{"+ba+"}{\\scriptstyle A}\\kern-.15em\\TeX}{LaTeX}}"),pa("\\KaTeX","\\textrm{\\html@mathml{K\\kern-.17em\\raisebox{"+ba+"}{\\scriptstyle A}\\kern-.15em\\TeX}{KaTeX}}"),pa("\\hspace","\\@ifstar\\@hspacer\\@hspace"),pa("\\@hspace","\\hskip #1\\relax"),pa("\\@hspacer","\\rule{0pt}{0pt}\\hskip #1\\relax"),pa("\\ordinarycolon",":"),pa("\\vcentcolon","\\mathrel{\\mathop\\ordinarycolon}"),pa("\\dblcolon",'\\html@mathml{\\mathrel{\\vcentcolon\\mathrel{\\mkern-.9mu}\\vcentcolon}}{\\mathop{\\char"2237}}'),pa("\\coloneqq",'\\html@mathml{\\mathrel{\\vcentcolon\\mathrel{\\mkern-1.2mu}=}}{\\mathop{\\char"2254}}'),pa("\\Coloneqq",'\\html@mathml{\\mathrel{\\dblcolon\\mathrel{\\mkern-1.2mu}=}}{\\mathop{\\char"2237\\char"3d}}'),pa("\\coloneq",'\\html@mathml{\\mathrel{\\vcentcolon\\mathrel{\\mkern-1.2mu}\\mathrel{-}}}{\\mathop{\\char"3a\\char"2212}}'),pa("\\Coloneq",'\\html@mathml{\\mathrel{\\dblcolon\\mathrel{\\mkern-1.2mu}\\mathrel{-}}}{\\mathop{\\char"2237\\char"2212}}'),pa("\\eqqcolon",'\\html@mathml{\\mathrel{=\\mathrel{\\mkern-1.2mu}\\vcentcolon}}{\\mathop{\\char"2255}}'),pa("\\Eqqcolon",'\\html@mathml{\\mathrel{=\\mathrel{\\mkern-1.2mu}\\dblcolon}}{\\mathop{\\char"3d\\char"2237}}'),pa("\\eqcolon",'\\html@mathml{\\mathrel{\\mathrel{-}\\mathrel{\\mkern-1.2mu}\\vcentcolon}}{\\mathop{\\char"2239}}'),pa("\\Eqcolon",'\\html@mathml{\\mathrel{\\mathrel{-}\\mathrel{\\mkern-1.2mu}\\dblcolon}}{\\mathop{\\char"2212\\char"2237}}'),pa("\\colonapprox",'\\html@mathml{\\mathrel{\\vcentcolon\\mathrel{\\mkern-1.2mu}\\approx}}{\\mathop{\\char"3a\\char"2248}}'),pa("\\Colonapprox",'\\html@mathml{\\mathrel{\\dblcolon\\mathrel{\\mkern-1.2mu}\\approx}}{\\mathop{\\char"2237\\char"2248}}'),pa("\\colonsim",'\\html@mathml{\\mathrel{\\vcentcolon\\mathrel{\\mkern-1.2mu}\\sim}}{\\mathop{\\char"3a\\char"223c}}'),pa("\\Colonsim",'\\html@mathml{\\mathrel{\\dblcolon\\mathrel{\\mkern-1.2mu}\\sim}}{\\mathop{\\char"2237\\char"223c}}'),pa("\u2237","\\dblcolon"),pa("\u2239","\\eqcolon"),pa("\u2254","\\coloneqq"),pa("\u2255","\\eqqcolon"),pa("\u2a74","\\Coloneqq"),pa("\\ratio","\\vcentcolon"),pa("\\coloncolon","\\dblcolon"),pa("\\colonequals","\\coloneqq"),pa("\\coloncolonequals","\\Coloneqq"),pa("\\equalscolon","\\eqqcolon"),pa("\\equalscoloncolon","\\Eqqcolon"),pa("\\colonminus","\\coloneq"),pa("\\coloncolonminus","\\Coloneq"),pa("\\minuscolon","\\eqcolon"),pa("\\minuscoloncolon","\\Eqcolon"),pa("\\coloncolonapprox","\\Colonapprox"),pa("\\coloncolonsim","\\Colonsim"),pa("\\simcolon","\\mathrel{\\sim\\mathrel{\\mkern-1.2mu}\\vcentcolon}"),pa("\\simcoloncolon","\\mathrel{\\sim\\mathrel{\\mkern-1.2mu}\\dblcolon}"),pa("\\approxcolon","\\mathrel{\\approx\\mathrel{\\mkern-1.2mu}\\vcentcolon}"),pa("\\approxcoloncolon","\\mathrel{\\approx\\mathrel{\\mkern-1.2mu}\\dblcolon}"),pa("\\notni","\\html@mathml{\\not\\ni}{\\mathrel{\\char`\u220c}}"),pa("\\limsup","\\DOTSB\\operatorname*{lim\\,sup}"),pa("\\liminf","\\DOTSB\\operatorname*{lim\\,inf}"),pa("\\gvertneqq","\\html@mathml{\\@gvertneqq}{\u2269}"),pa("\\lvertneqq","\\html@mathml{\\@lvertneqq}{\u2268}"),pa("\\ngeqq","\\html@mathml{\\@ngeqq}{\u2271}"),pa("\\ngeqslant","\\html@mathml{\\@ngeqslant}{\u2271}"),pa("\\nleqq","\\html@mathml{\\@nleqq}{\u2270}"),pa("\\nleqslant","\\html@mathml{\\@nleqslant}{\u2270}"),pa("\\nshortmid","\\html@mathml{\\@nshortmid}{\u2224}"),pa("\\nshortparallel","\\html@mathml{\\@nshortparallel}{\u2226}"),pa("\\nsubseteqq","\\html@mathml{\\@nsubseteqq}{\u2288}"),pa("\\nsupseteqq","\\html@mathml{\\@nsupseteqq}{\u2289}"),pa("\\varsubsetneq","\\html@mathml{\\@varsubsetneq}{\u228a}"),pa("\\varsubsetneqq","\\html@mathml{\\@varsubsetneqq}{\u2acb}"),pa("\\varsupsetneq","\\html@mathml{\\@varsupsetneq}{\u228b}"),pa("\\varsupsetneqq","\\html@mathml{\\@varsupsetneqq}{\u2acc}"),pa("\\llbracket","\\html@mathml{\\mathopen{[\\mkern-3.2mu[}}{\\mathopen{\\char`\u27e6}}"),pa("\\rrbracket","\\html@mathml{\\mathclose{]\\mkern-3.2mu]}}{\\mathclose{\\char`\u27e7}}"),pa("\u27e6","\\llbracket"),pa("\u27e7","\\rrbracket"),pa("\\lBrace","\\html@mathml{\\mathopen{\\{\\mkern-3.2mu[}}{\\mathopen{\\char`\u2983}}"),pa("\\rBrace","\\html@mathml{\\mathclose{]\\mkern-3.2mu\\}}}{\\mathclose{\\char`\u2984}}"),pa("\u2983","\\lBrace"),pa("\u2984","\\rBrace"),pa("\\darr","\\downarrow"),pa("\\dArr","\\Downarrow"),pa("\\Darr","\\Downarrow"),pa("\\lang","\\langle"),pa("\\rang","\\rangle"),pa("\\uarr","\\uparrow"),pa("\\uArr","\\Uparrow"),pa("\\Uarr","\\Uparrow"),pa("\\N","\\mathbb{N}"),pa("\\R","\\mathbb{R}"),pa("\\Z","\\mathbb{Z}"),pa("\\alef","\\aleph"),pa("\\alefsym","\\aleph"),pa("\\Alpha","\\mathrm{A}"),pa("\\Beta","\\mathrm{B}"),pa("\\bull","\\bullet"),pa("\\Chi","\\mathrm{X}"),pa("\\clubs","\\clubsuit"),pa("\\cnums","\\mathbb{C}"),pa("\\Complex","\\mathbb{C}"),pa("\\Dagger","\\ddagger"),pa("\\diamonds","\\diamondsuit"),pa("\\empty","\\emptyset"),pa("\\Epsilon","\\mathrm{E}"),pa("\\Eta","\\mathrm{H}"),pa("\\exist","\\exists"),pa("\\harr","\\leftrightarrow"),pa("\\hArr","\\Leftrightarrow"),pa("\\Harr","\\Leftrightarrow"),pa("\\hearts","\\heartsuit"),pa("\\image","\\Im"),pa("\\infin","\\infty"),pa("\\Iota","\\mathrm{I}"),pa("\\isin","\\in"),pa("\\Kappa","\\mathrm{K}"),pa("\\larr","\\leftarrow"),pa("\\lArr","\\Leftarrow"),pa("\\Larr","\\Leftarrow"),pa("\\lrarr","\\leftrightarrow"),pa("\\lrArr","\\Leftrightarrow"),pa("\\Lrarr","\\Leftrightarrow"),pa("\\Mu","\\mathrm{M}"),pa("\\natnums","\\mathbb{N}"),pa("\\Nu","\\mathrm{N}"),pa("\\Omicron","\\mathrm{O}"),pa("\\plusmn","\\pm"),pa("\\rarr","\\rightarrow"),pa("\\rArr","\\Rightarrow"),pa("\\Rarr","\\Rightarrow"),pa("\\real","\\Re"),pa("\\reals","\\mathbb{R}"),pa("\\Reals","\\mathbb{R}"),pa("\\Rho","\\mathrm{P}"),pa("\\sdot","\\cdot"),pa("\\sect","\\S"),pa("\\spades","\\spadesuit"),pa("\\sub","\\subset"),pa("\\sube","\\subseteq"),pa("\\supe","\\supseteq"),pa("\\Tau","\\mathrm{T}"),pa("\\thetasym","\\vartheta"),pa("\\weierp","\\wp"),pa("\\Zeta","\\mathrm{Z}"),pa("\\argmin","\\DOTSB\\operatorname*{arg\\,min}"),pa("\\argmax","\\DOTSB\\operatorname*{arg\\,max}"),pa("\\plim","\\DOTSB\\mathop{\\operatorname{plim}}\\limits"),pa("\\blue","\\textcolor{##6495ed}{#1}"),pa("\\orange","\\textcolor{##ffa500}{#1}"),pa("\\pink","\\textcolor{##ff00af}{#1}"),pa("\\red","\\textcolor{##df0030}{#1}"),pa("\\green","\\textcolor{##28ae7b}{#1}"),pa("\\gray","\\textcolor{gray}{#1}"),pa("\\purple","\\textcolor{##9d38bd}{#1}"),pa("\\blueA","\\textcolor{##ccfaff}{#1}"),pa("\\blueB","\\textcolor{##80f6ff}{#1}"),pa("\\blueC","\\textcolor{##63d9ea}{#1}"),pa("\\blueD","\\textcolor{##11accd}{#1}"),pa("\\blueE","\\textcolor{##0c7f99}{#1}"),pa("\\tealA","\\textcolor{##94fff5}{#1}"),pa("\\tealB","\\textcolor{##26edd5}{#1}"),pa("\\tealC","\\textcolor{##01d1c1}{#1}"),pa("\\tealD","\\textcolor{##01a995}{#1}"),pa("\\tealE","\\textcolor{##208170}{#1}"),pa("\\greenA","\\textcolor{##b6ffb0}{#1}"),pa("\\greenB","\\textcolor{##8af281}{#1}"),pa("\\greenC","\\textcolor{##74cf70}{#1}"),pa("\\greenD","\\textcolor{##1fab54}{#1}"),pa("\\greenE","\\textcolor{##0d923f}{#1}"),pa("\\goldA","\\textcolor{##ffd0a9}{#1}"),pa("\\goldB","\\textcolor{##ffbb71}{#1}"),pa("\\goldC","\\textcolor{##ff9c39}{#1}"),pa("\\goldD","\\textcolor{##e07d10}{#1}"),pa("\\goldE","\\textcolor{##a75a05}{#1}"),pa("\\redA","\\textcolor{##fca9a9}{#1}"),pa("\\redB","\\textcolor{##ff8482}{#1}"),pa("\\redC","\\textcolor{##f9685d}{#1}"),pa("\\redD","\\textcolor{##e84d39}{#1}"),pa("\\redE","\\textcolor{##bc2612}{#1}"),pa("\\maroonA","\\textcolor{##ffbde0}{#1}"),pa("\\maroonB","\\textcolor{##ff92c6}{#1}"),pa("\\maroonC","\\textcolor{##ed5fa6}{#1}"),pa("\\maroonD","\\textcolor{##ca337c}{#1}"),pa("\\maroonE","\\textcolor{##9e034e}{#1}"),pa("\\purpleA","\\textcolor{##ddd7ff}{#1}"),pa("\\purpleB","\\textcolor{##c6b9fc}{#1}"),pa("\\purpleC","\\textcolor{##aa87ff}{#1}"),pa("\\purpleD","\\textcolor{##7854ab}{#1}"),pa("\\purpleE","\\textcolor{##543b78}{#1}"),pa("\\mintA","\\textcolor{##f5f9e8}{#1}"),pa("\\mintB","\\textcolor{##edf2df}{#1}"),pa("\\mintC","\\textcolor{##e0e5cc}{#1}"),pa("\\grayA","\\textcolor{##f6f7f7}{#1}"),pa("\\grayB","\\textcolor{##f0f1f2}{#1}"),pa("\\grayC","\\textcolor{##e3e5e6}{#1}"),pa("\\grayD","\\textcolor{##d6d8da}{#1}"),pa("\\grayE","\\textcolor{##babec2}{#1}"),pa("\\grayF","\\textcolor{##888d93}{#1}"),pa("\\grayG","\\textcolor{##626569}{#1}"),pa("\\grayH","\\textcolor{##3b3e40}{#1}"),pa("\\grayI","\\textcolor{##21242c}{#1}"),pa("\\kaBlue","\\textcolor{##314453}{#1}"),pa("\\kaGreen","\\textcolor{##71B307}{#1}");var ya={"\\relax":!0,"^":!0,_:!0,"\\limits":!0,"\\nolimits":!0},wa=function(){function t(t,e,r){this.settings=void 0,this.expansionCount=void 0,this.lexer=void 0,this.macros=void 0,this.stack=void 0,this.mode=void 0,this.settings=e,this.expansionCount=0,this.feed(t),this.macros=new ma(ua,e.macros),this.mode=r,this.stack=[]}var e=t.prototype;return e.feed=function(t){this.lexer=new la(t,this.settings)},e.switchMode=function(t){this.mode=t},e.beginGroup=function(){this.macros.beginGroup()},e.endGroup=function(){this.macros.endGroup()},e.future=function(){return 0===this.stack.length&&this.pushToken(this.lexer.lex()),this.stack[this.stack.length-1]},e.popToken=function(){return this.future(),this.stack.pop()},e.pushToken=function(t){this.stack.push(t)},e.pushTokens=function(t){var e;(e=this.stack).push.apply(e,t)},e.consumeSpaces=function(){for(;;){if(" "!==this.future().text)break;this.stack.pop()}},e.consumeArgs=function(t){for(var e=[],r=0;r<t;++r){this.consumeSpaces();var a=this.popToken();if("{"===a.text){for(var n=[],i=1;0!==i;){var s=this.popToken();if(n.push(s),"{"===s.text)++i;else if("}"===s.text)--i;else if("EOF"===s.text)throw new o("End of input in macro argument",a)}n.pop(),n.reverse(),e[r]=n}else{if("EOF"===a.text)throw new o("End of input expecting macro argument");e[r]=[a]}}return e},e.expandOnce=function(){var t=this.popToken(),e=t.text,r=this._getExpansion(e);if(null==r)return this.pushToken(t),t;if(this.expansionCount++,this.expansionCount>this.settings.maxExpand)throw new o("Too many expansions: infinite loop or need to increase maxExpand setting");var a=r.tokens;if(r.numArgs)for(var n=this.consumeArgs(r.numArgs),i=(a=a.slice()).length-1;i>=0;--i){var s=a[i];if("#"===s.text){if(0===i)throw new o("Incomplete placeholder at end of macro body",s);if("#"===(s=a[--i]).text)a.splice(i+1,1);else{if(!/^[1-9]$/.test(s.text))throw new o("Not a valid argument number",s);var h;(h=a).splice.apply(h,[i,2].concat(n[+s.text-1]))}}}return this.pushTokens(a),a},e.expandAfterFuture=function(){return this.expandOnce(),this.future()},e.expandNextToken=function(){for(;;){var t=this.expandOnce();if(t instanceof n){if("\\relax"!==t.text)return this.stack.pop();this.stack.pop()}}throw new Error},e.expandMacro=function(t){if(this.macros.get(t)){var e=[],r=this.stack.length;for(this.pushToken(new n(t));this.stack.length>r;){this.expandOnce()instanceof n&&e.push(this.stack.pop())}return e}},e.expandMacroAsText=function(t){var e=this.expandMacro(t);return e?e.map(function(t){return t.text}).join(""):e},e._getExpansion=function(t){var e=this.macros.get(t);if(null==e)return e;var r="function"==typeof e?e(this):e;if("string"==typeof r){var a=0;if(-1!==r.indexOf("#"))for(var n=r.replace(/##/g,"");-1!==n.indexOf("#"+(a+1));)++a;for(var i=new la(r,this.settings),o=[],s=i.lex();"EOF"!==s.text;)o.push(s),s=i.lex();return o.reverse(),{tokens:o,numArgs:a}}return r},e.isDefined=function(t){return this.macros.has(t)||ia.hasOwnProperty(t)||j.math.hasOwnProperty(t)||j.text.hasOwnProperty(t)||ya.hasOwnProperty(t)},t}(),ka={"\u0301":{text:"\\'",math:"\\acute"},"\u0300":{text:"\\`",math:"\\grave"},"\u0308":{text:'\\"',math:"\\ddot"},"\u0303":{text:"\\~",math:"\\tilde"},"\u0304":{text:"\\=",math:"\\bar"},"\u0306":{text:"\\u",math:"\\breve"},"\u030c":{text:"\\v",math:"\\check"},"\u0302":{text:"\\^",math:"\\hat"},"\u0307":{text:"\\.",math:"\\dot"},"\u030a":{text:"\\r",math:"\\mathring"},"\u030b":{text:"\\H"}},Sa={"\xe1":"a\u0301","\xe0":"a\u0300","\xe4":"a\u0308","\u01df":"a\u0308\u0304","\xe3":"a\u0303","\u0101":"a\u0304","\u0103":"a\u0306","\u1eaf":"a\u0306\u0301","\u1eb1":"a\u0306\u0300","\u1eb5":"a\u0306\u0303","\u01ce":"a\u030c","\xe2":"a\u0302","\u1ea5":"a\u0302\u0301","\u1ea7":"a\u0302\u0300","\u1eab":"a\u0302\u0303","\u0227":"a\u0307","\u01e1":"a\u0307\u0304","\xe5":"a\u030a","\u01fb":"a\u030a\u0301","\u1e03":"b\u0307","\u0107":"c\u0301","\u010d":"c\u030c","\u0109":"c\u0302","\u010b":"c\u0307","\u010f":"d\u030c","\u1e0b":"d\u0307","\xe9":"e\u0301","\xe8":"e\u0300","\xeb":"e\u0308","\u1ebd":"e\u0303","\u0113":"e\u0304","\u1e17":"e\u0304\u0301","\u1e15":"e\u0304\u0300","\u0115":"e\u0306","\u011b":"e\u030c","\xea":"e\u0302","\u1ebf":"e\u0302\u0301","\u1ec1":"e\u0302\u0300","\u1ec5":"e\u0302\u0303","\u0117":"e\u0307","\u1e1f":"f\u0307","\u01f5":"g\u0301","\u1e21":"g\u0304","\u011f":"g\u0306","\u01e7":"g\u030c","\u011d":"g\u0302","\u0121":"g\u0307","\u1e27":"h\u0308","\u021f":"h\u030c","\u0125":"h\u0302","\u1e23":"h\u0307","\xed":"i\u0301","\xec":"i\u0300","\xef":"i\u0308","\u1e2f":"i\u0308\u0301","\u0129":"i\u0303","\u012b":"i\u0304","\u012d":"i\u0306","\u01d0":"i\u030c","\xee":"i\u0302","\u01f0":"j\u030c","\u0135":"j\u0302","\u1e31":"k\u0301","\u01e9":"k\u030c","\u013a":"l\u0301","\u013e":"l\u030c","\u1e3f":"m\u0301","\u1e41":"m\u0307","\u0144":"n\u0301","\u01f9":"n\u0300","\xf1":"n\u0303","\u0148":"n\u030c","\u1e45":"n\u0307","\xf3":"o\u0301","\xf2":"o\u0300","\xf6":"o\u0308","\u022b":"o\u0308\u0304","\xf5":"o\u0303","\u1e4d":"o\u0303\u0301","\u1e4f":"o\u0303\u0308","\u022d":"o\u0303\u0304","\u014d":"o\u0304","\u1e53":"o\u0304\u0301","\u1e51":"o\u0304\u0300","\u014f":"o\u0306","\u01d2":"o\u030c","\xf4":"o\u0302","\u1ed1":"o\u0302\u0301","\u1ed3":"o\u0302\u0300","\u1ed7":"o\u0302\u0303","\u022f":"o\u0307","\u0231":"o\u0307\u0304","\u0151":"o\u030b","\u1e55":"p\u0301","\u1e57":"p\u0307","\u0155":"r\u0301","\u0159":"r\u030c","\u1e59":"r\u0307","\u015b":"s\u0301","\u1e65":"s\u0301\u0307","\u0161":"s\u030c","\u1e67":"s\u030c\u0307","\u015d":"s\u0302","\u1e61":"s\u0307","\u1e97":"t\u0308","\u0165":"t\u030c","\u1e6b":"t\u0307","\xfa":"u\u0301","\xf9":"u\u0300","\xfc":"u\u0308","\u01d8":"u\u0308\u0301","\u01dc":"u\u0308\u0300","\u01d6":"u\u0308\u0304","\u01da":"u\u0308\u030c","\u0169":"u\u0303","\u1e79":"u\u0303\u0301","\u016b":"u\u0304","\u1e7b":"u\u0304\u0308","\u016d":"u\u0306","\u01d4":"u\u030c","\xfb":"u\u0302","\u016f":"u\u030a","\u0171":"u\u030b","\u1e7d":"v\u0303","\u1e83":"w\u0301","\u1e81":"w\u0300","\u1e85":"w\u0308","\u0175":"w\u0302","\u1e87":"w\u0307","\u1e98":"w\u030a","\u1e8d":"x\u0308","\u1e8b":"x\u0307","\xfd":"y\u0301","\u1ef3":"y\u0300","\xff":"y\u0308","\u1ef9":"y\u0303","\u0233":"y\u0304","\u0177":"y\u0302","\u1e8f":"y\u0307","\u1e99":"y\u030a","\u017a":"z\u0301","\u017e":"z\u030c","\u1e91":"z\u0302","\u017c":"z\u0307","\xc1":"A\u0301","\xc0":"A\u0300","\xc4":"A\u0308","\u01de":"A\u0308\u0304","\xc3":"A\u0303","\u0100":"A\u0304","\u0102":"A\u0306","\u1eae":"A\u0306\u0301","\u1eb0":"A\u0306\u0300","\u1eb4":"A\u0306\u0303","\u01cd":"A\u030c","\xc2":"A\u0302","\u1ea4":"A\u0302\u0301","\u1ea6":"A\u0302\u0300","\u1eaa":"A\u0302\u0303","\u0226":"A\u0307","\u01e0":"A\u0307\u0304","\xc5":"A\u030a","\u01fa":"A\u030a\u0301","\u1e02":"B\u0307","\u0106":"C\u0301","\u010c":"C\u030c","\u0108":"C\u0302","\u010a":"C\u0307","\u010e":"D\u030c","\u1e0a":"D\u0307","\xc9":"E\u0301","\xc8":"E\u0300","\xcb":"E\u0308","\u1ebc":"E\u0303","\u0112":"E\u0304","\u1e16":"E\u0304\u0301","\u1e14":"E\u0304\u0300","\u0114":"E\u0306","\u011a":"E\u030c","\xca":"E\u0302","\u1ebe":"E\u0302\u0301","\u1ec0":"E\u0302\u0300","\u1ec4":"E\u0302\u0303","\u0116":"E\u0307","\u1e1e":"F\u0307","\u01f4":"G\u0301","\u1e20":"G\u0304","\u011e":"G\u0306","\u01e6":"G\u030c","\u011c":"G\u0302","\u0120":"G\u0307","\u1e26":"H\u0308","\u021e":"H\u030c","\u0124":"H\u0302","\u1e22":"H\u0307","\xcd":"I\u0301","\xcc":"I\u0300","\xcf":"I\u0308","\u1e2e":"I\u0308\u0301","\u0128":"I\u0303","\u012a":"I\u0304","\u012c":"I\u0306","\u01cf":"I\u030c","\xce":"I\u0302","\u0130":"I\u0307","\u0134":"J\u0302","\u1e30":"K\u0301","\u01e8":"K\u030c","\u0139":"L\u0301","\u013d":"L\u030c","\u1e3e":"M\u0301","\u1e40":"M\u0307","\u0143":"N\u0301","\u01f8":"N\u0300","\xd1":"N\u0303","\u0147":"N\u030c","\u1e44":"N\u0307","\xd3":"O\u0301","\xd2":"O\u0300","\xd6":"O\u0308","\u022a":"O\u0308\u0304","\xd5":"O\u0303","\u1e4c":"O\u0303\u0301","\u1e4e":"O\u0303\u0308","\u022c":"O\u0303\u0304","\u014c":"O\u0304","\u1e52":"O\u0304\u0301","\u1e50":"O\u0304\u0300","\u014e":"O\u0306","\u01d1":"O\u030c","\xd4":"O\u0302","\u1ed0":"O\u0302\u0301","\u1ed2":"O\u0302\u0300","\u1ed6":"O\u0302\u0303","\u022e":"O\u0307","\u0230":"O\u0307\u0304","\u0150":"O\u030b","\u1e54":"P\u0301","\u1e56":"P\u0307","\u0154":"R\u0301","\u0158":"R\u030c","\u1e58":"R\u0307","\u015a":"S\u0301","\u1e64":"S\u0301\u0307","\u0160":"S\u030c","\u1e66":"S\u030c\u0307","\u015c":"S\u0302","\u1e60":"S\u0307","\u0164":"T\u030c","\u1e6a":"T\u0307","\xda":"U\u0301","\xd9":"U\u0300","\xdc":"U\u0308","\u01d7":"U\u0308\u0301","\u01db":"U\u0308\u0300","\u01d5":"U\u0308\u0304","\u01d9":"U\u0308\u030c","\u0168":"U\u0303","\u1e78":"U\u0303\u0301","\u016a":"U\u0304","\u1e7a":"U\u0304\u0308","\u016c":"U\u0306","\u01d3":"U\u030c","\xdb":"U\u0302","\u016e":"U\u030a","\u0170":"U\u030b","\u1e7c":"V\u0303","\u1e82":"W\u0301","\u1e80":"W\u0300","\u1e84":"W\u0308","\u0174":"W\u0302","\u1e86":"W\u0307","\u1e8c":"X\u0308","\u1e8a":"X\u0307","\xdd":"Y\u0301","\u1ef2":"Y\u0300","\u0178":"Y\u0308","\u1ef8":"Y\u0303","\u0232":"Y\u0304","\u0176":"Y\u0302","\u1e8e":"Y\u0307","\u0179":"Z\u0301","\u017d":"Z\u030c","\u1e90":"Z\u0302","\u017b":"Z\u0307","\u03ac":"\u03b1\u0301","\u1f70":"\u03b1\u0300","\u1fb1":"\u03b1\u0304","\u1fb0":"\u03b1\u0306","\u03ad":"\u03b5\u0301","\u1f72":"\u03b5\u0300","\u03ae":"\u03b7\u0301","\u1f74":"\u03b7\u0300","\u03af":"\u03b9\u0301","\u1f76":"\u03b9\u0300","\u03ca":"\u03b9\u0308","\u0390":"\u03b9\u0308\u0301","\u1fd2":"\u03b9\u0308\u0300","\u1fd1":"\u03b9\u0304","\u1fd0":"\u03b9\u0306","\u03cc":"\u03bf\u0301","\u1f78":"\u03bf\u0300","\u03cd":"\u03c5\u0301","\u1f7a":"\u03c5\u0300","\u03cb":"\u03c5\u0308","\u03b0":"\u03c5\u0308\u0301","\u1fe2":"\u03c5\u0308\u0300","\u1fe1":"\u03c5\u0304","\u1fe0":"\u03c5\u0306","\u03ce":"\u03c9\u0301","\u1f7c":"\u03c9\u0300","\u038e":"\u03a5\u0301","\u1fea":"\u03a5\u0300","\u03ab":"\u03a5\u0308","\u1fe9":"\u03a5\u0304","\u1fe8":"\u03a5\u0306","\u038f":"\u03a9\u0301","\u1ffa":"\u03a9\u0300"},Ma=function(){function t(t,e){this.mode=void 0,this.gullet=void 0,this.settings=void 0,this.leftrightDepth=void 0,this.nextToken=void 0,this.mode="math",this.gullet=new wa(t,e,this.mode),this.settings=e,this.leftrightDepth=0}var e=t.prototype;return e.expect=function(t,e){if(void 0===e&&(e=!0),this.fetch().text!==t)throw new o("Expected '"+t+"', got '"+this.fetch().text+"'",this.fetch());e&&this.consume()},e.consume=function(){this.nextToken=null},e.fetch=function(){return null==this.nextToken&&(this.nextToken=this.gullet.expandNextToken()),this.nextToken},e.switchMode=function(t){this.mode=t,this.gullet.switchMode(t)},e.parse=function(){this.gullet.beginGroup(),this.settings.colorIsTextColor&&this.gullet.macros.set("\\color","\\textcolor");var t=this.parseExpression(!1);return this.expect("EOF"),this.gullet.endGroup(),t},e.parseExpression=function(e,r){for(var a=[];;){"math"===this.mode&&this.consumeSpaces();var n=this.fetch();if(-1!==t.endOfExpression.indexOf(n.text))break;if(r&&n.text===r)break;if(e&&ia[n.text]&&ia[n.text].infix)break;var i=this.parseAtom(r);if(!i)break;a.push(i)}return"text"===this.mode&&this.formLigatures(a),this.handleInfixNodes(a)},e.handleInfixNodes=function(t){for(var e,r=-1,a=0;a<t.length;a++){var n=Vt(t[a],"infix");if(n){if(-1!==r)throw new o("only one infix operator per group",n.token);r=a,e=n.replaceWith}}if(-1!==r&&e){var i,s,h=t.slice(0,r),l=t.slice(r+1);return i=1===h.length&&"ordgroup"===h[0].type?h[0]:{type:"ordgroup",mode:this.mode,body:h},s=1===l.length&&"ordgroup"===l[0].type?l[0]:{type:"ordgroup",mode:this.mode,body:l},["\\\\abovefrac"===e?this.callFunction(e,[i,t[r],s],[]):this.callFunction(e,[i,s],[])]}return t},e.handleSupSubscript=function(e){var r=this.fetch(),a=r.text;this.consume();var n=this.parseGroup(e,!1,t.SUPSUB_GREEDINESS,void 0,void 0,!0);if(!n)throw new o("Expected group after '"+a+"'",r);return n},e.formatUnsupportedCmd=function(t){for(var e=[],r=0;r<t.length;r++)e.push({type:"textord",mode:"text",text:t[r]});var a={type:"text",mode:this.mode,body:e};return{type:"color",mode:this.mode,color:this.settings.errorColor,body:[a]}},e.parseAtom=function(t){var e,r,a=this.parseGroup("atom",!1,null,t);if("text"===this.mode)return a;for(;;){this.consumeSpaces();var n=this.fetch();if("\\limits"===n.text||"\\nolimits"===n.text){var i=Vt(a,"op");if(i){var s="\\limits"===n.text;i.limits=s,i.alwaysHandleSupSub=!0}else{if(!(i=Vt(a,"operatorname"))||!i.alwaysHandleSupSub)throw new o("Limit controls must follow a math operator",n);var h="\\limits"===n.text;i.limits=h}this.consume()}else if("^"===n.text){if(e)throw new o("Double superscript",n);e=this.handleSupSubscript("superscript")}else if("_"===n.text){if(r)throw new o("Double subscript",n);r=this.handleSupSubscript("subscript")}else{if("'"!==n.text)break;if(e)throw new o("Double superscript",n);var l={type:"textord",mode:this.mode,text:"\\prime"},m=[l];for(this.consume();"'"===this.fetch().text;)m.push(l),this.consume();"^"===this.fetch().text&&m.push(this.handleSupSubscript("superscript")),e={type:"ordgroup",mode:this.mode,body:m}}}return e||r?{type:"supsub",mode:this.mode,base:a,sup:e,sub:r}:a},e.parseFunction=function(t,e,r){var a=this.fetch(),n=a.text,i=ia[n];if(!i)return null;if(this.consume(),null!=r&&i.greediness<=r)throw new o("Got function '"+n+"' with no arguments"+(e?" as "+e:""),a);if("text"===this.mode&&!i.allowedInText)throw new o("Can't use function '"+n+"' in text mode",a);if("math"===this.mode&&!1===i.allowedInMath)throw new o("Can't use function '"+n+"' in math mode",a);var s=this.parseArguments(n,i),h=s.args,l=s.optArgs;return this.callFunction(n,h,l,a,t)},e.callFunction=function(t,e,r,a,n){var i={funcName:t,parser:this,token:a,breakOnTokenText:n},s=ia[t];if(s&&s.handler)return s.handler(i,e,r);throw new o("No function handler for "+t)},e.parseArguments=function(t,e){var r=e.numArgs+e.numOptionalArgs;if(0===r)return{args:[],optArgs:[]};for(var a=e.greediness,n=[],i=[],s=0;s<r;s++){var h=e.argTypes&&e.argTypes[s],l=s<e.numOptionalArgs,m=s>0&&!l||0===s&&!l&&"math"===this.mode,c=this.parseGroupOfType("argument to '"+t+"'",h,l,a,m);if(!c){if(l){i.push(null);continue}throw new o("Expected group after '"+t+"'",this.fetch())}(l?i:n).push(c)}return{args:n,optArgs:i}},e.parseGroupOfType=function(t,e,r,a,n){switch(e){case"color":return n&&this.consumeSpaces(),this.parseColorGroup(r);case"size":return n&&this.consumeSpaces(),this.parseSizeGroup(r);case"url":return this.parseUrlGroup(r,n);case"math":case"text":return this.parseGroup(t,r,a,void 0,e,n);case"hbox":var i=this.parseGroup(t,r,a,void 0,"text",n);return i?{type:"styling",mode:i.mode,body:[i],style:"text"}:i;case"raw":if(n&&this.consumeSpaces(),r&&"{"===this.fetch().text)return null;var s=this.parseStringGroup("raw",r,!0);if(s)return{type:"raw",mode:"text",string:s.text};throw new o("Expected raw group",this.fetch());case"original":case null:case void 0:return this.parseGroup(t,r,a,void 0,void 0,n);default:throw new o("Unknown group type as "+t,this.fetch())}},e.consumeSpaces=function(){for(;" "===this.fetch().text;)this.consume()},e.parseStringGroup=function(t,e,r){var a=e?"[":"{",n=e?"]":"}",i=this.fetch();if(i.text!==a){if(e)return null;if(r&&"EOF"!==i.text&&/[^{}[\]]/.test(i.text))return this.consume(),i}var s=this.mode;this.mode="text",this.expect(a);for(var h,l="",m=this.fetch(),c=0,u=m;(h=this.fetch()).text!==n||r&&c>0;){switch(h.text){case"EOF":throw new o("Unexpected end of input in "+t,m.range(u,l));case a:c++;break;case n:c--}l+=(u=h).text,this.consume()}return this.expect(n),this.mode=s,m.range(u,l)},e.parseRegexGroup=function(t,e){var r=this.mode;this.mode="text";for(var a,n=this.fetch(),i=n,s="";"EOF"!==(a=this.fetch()).text&&t.test(s+a.text);)s+=(i=a).text,this.consume();if(""===s)throw new o("Invalid "+e+": '"+n.text+"'",n);return this.mode=r,n.range(i,s)},e.parseColorGroup=function(t){var e=this.parseStringGroup("color",t);if(!e)return null;var r=/^(#[a-f0-9]{3}|#?[a-f0-9]{6}|[a-z]+)$/i.exec(e.text);if(!r)throw new o("Invalid color: '"+e.text+"'",e);var a=r[0];return/^[0-9a-f]{6}$/i.test(a)&&(a="#"+a),{type:"color-token",mode:this.mode,color:a}},e.parseSizeGroup=function(t){var e,r=!1;if(!(e=t||"{"===this.fetch().text?this.parseStringGroup("size",t):this.parseRegexGroup(/^[-+]? *(?:$|\d+|\d+\.\d*|\.\d*) *[a-z]{0,2} *$/,"size")))return null;t||0!==e.text.length||(e.text="0pt",r=!0);var a=/([-+]?) *(\d+(?:\.\d*)?|\.\d+) *([a-z]{2})/.exec(e.text);if(!a)throw new o("Invalid size: '"+e.text+"'",e);var n={number:+(a[1]+a[2]),unit:a[3]};if(!At(n))throw new o("Invalid unit: '"+n.unit+"'",e);return{type:"size",mode:this.mode,value:n,isBlank:r}},e.parseUrlGroup=function(t,e){this.gullet.lexer.setCatcode("%",13);var r=this.parseStringGroup("url",t,!0);if(this.gullet.lexer.setCatcode("%",14),!r)return null;var a=r.text.replace(/\\([#$%&~_^{}])/g,"$1");return{type:"url",mode:this.mode,url:a}},e.parseGroup=function(e,r,n,i,s,h){var l=this.mode;s&&this.switchMode(s),h&&this.consumeSpaces();var m,c=this.fetch(),u=c.text;if(r?"["===u:"{"===u||"\\begingroup"===u){this.consume();var p=t.endOfGroup[u];this.gullet.beginGroup();var d=this.parseExpression(!1,p),f=this.fetch();this.expect(p),this.gullet.endGroup(),m={type:"ordgroup",mode:this.mode,loc:a.range(c,f),body:d,semisimple:"\\begingroup"===u||void 0}}else if(r)m=null;else if(null==(m=this.parseFunction(i,e,n)||this.parseSymbol())&&"\\"===u[0]&&!ya.hasOwnProperty(u)){if(this.settings.throwOnError)throw new o("Undefined control sequence: "+u,c);m=this.formatUnsupportedCmd(u),this.consume()}return s&&this.switchMode(l),m},e.formLigatures=function(t){for(var e=t.length-1,r=0;r<e;++r){var n=t[r],i=n.text;"-"===i&&"-"===t[r+1].text&&(r+1<e&&"-"===t[r+2].text?(t.splice(r,3,{type:"textord",mode:"text",loc:a.range(n,t[r+2]),text:"---"}),e-=2):(t.splice(r,2,{type:"textord",mode:"text",loc:a.range(n,t[r+1]),text:"--"}),e-=1)),"'"!==i&&"`"!==i||t[r+1].text!==i||(t.splice(r,2,{type:"textord",mode:"text",loc:a.range(n,t[r+1]),text:i+i}),e-=1)}},e.parseSymbol=function(){var t=this.fetch(),e=t.text;if(/^\\verb[^a-zA-Z]/.test(e)){this.consume();var r=e.slice(5),n="*"===r.charAt(0);if(n&&(r=r.slice(1)),r.length<2||r.charAt(0)!==r.slice(-1))throw new o("\\verb assertion failed --\n                    please report what input caused this bug");return{type:"verb",mode:"text",body:r=r.slice(1,-1),star:n}}Sa.hasOwnProperty(e[0])&&!j[this.mode][e[0]]&&(this.settings.strict&&"math"===this.mode&&this.settings.reportNonstrict("unicodeTextInMathMode",'Accented Unicode text character "'+e[0]+'" used in math mode',t),e=Sa[e[0]]+e.substr(1));var i,s=sa.exec(e);if(s&&("i"===(e=e.substring(0,s.index))?e="\u0131":"j"===e&&(e="\u0237")),j[this.mode][e]){this.settings.strict&&"math"===this.mode&&"\xc7\xd0\xde\xe7\xfe".indexOf(e)>=0&&this.settings.reportNonstrict("unicodeTextInMathMode",'Latin-1/Unicode text character "'+e[0]+'" used in math mode',t);var h,l=j[this.mode][e].group,m=a.range(t);if(W.hasOwnProperty(l)){var c=l;h={type:"atom",mode:this.mode,family:c,loc:m,text:e}}else h={type:l,mode:this.mode,loc:m,text:e};i=h}else{if(!(e.charCodeAt(0)>=128))return null;this.settings.strict&&(M(e.charCodeAt(0))?"math"===this.mode&&this.settings.reportNonstrict("unicodeTextInMathMode",'Unicode text character "'+e[0]+'" used in math mode',t):this.settings.reportNonstrict("unknownSymbol",'Unrecognized Unicode character "'+e[0]+'" ('+e.charCodeAt(0)+")",t)),i={type:"textord",mode:"text",loc:a.range(t),text:e}}if(this.consume(),s)for(var u=0;u<s[0].length;u++){var p=s[0][u];if(!ka[p])throw new o("Unknown accent ' "+p+"'",t);var d=ka[p][this.mode];if(!d)throw new o("Accent "+p+" unsupported in "+this.mode+" mode",t);i={type:"accent",mode:this.mode,loc:a.range(t),label:d,isStretchy:!1,isShifty:!0,base:i}}return i},t}();Ma.endOfExpression=["}","\\endgroup","\\end","\\right","&"],Ma.endOfGroup={"[":"]","{":"}","\\begingroup":"\\endgroup"},Ma.SUPSUB_GREEDINESS=1;var za=function(t,e){if(!("string"==typeof t||t instanceof String))throw new TypeError("KaTeX can only parse string typed expression");var r=new Ma(t,e);delete r.gullet.macros.current["\\df@tag"];var a=r.parse();if(r.gullet.macros.get("\\df@tag")){if(!e.displayMode)throw new o("\\tag works only in display equations");r.gullet.feed("\\df@tag"),a=[{type:"tag",mode:"text",body:a,tag:r.parse()}]}return a},Aa=function(t,e,r){e.textContent="";var a=Ba(t,r).toNode();e.appendChild(a)};"undefined"!=typeof document&&"CSS1Compat"!==document.compatMode&&("undefined"!=typeof console&&console.warn("Warning: KaTeX doesn't work in quirks mode. Make sure your website has a suitable doctype."),Aa=function(){throw new o("KaTeX doesn't work in quirks mode.")});var Ta=function(t,e,r){if(r.throwOnError||!(t instanceof o))throw t;var a=Dt.makeSpan(["katex-error"],[new E(e)]);return a.setAttribute("title",t.toString()),a.setAttribute("style","color:"+r.errorColor),a},Ba=function(t,e){var r=new u(e);try{var a=za(t,r);return Be(a,t,r)}catch(e){return Ta(e,t,r)}},Ca={version:"0.11.1",render:Aa,renderToString:function(t,e){return Ba(t,e).toMarkup()},ParseError:o,__parse:function(t,e){var r=new u(e);return za(t,r)},__renderToDomTree:Ba,__renderToHTMLTree:function(t,e){var r=new u(e);try{return function(t,e,r){var a=de(t,Ae(r)),n=Dt.makeSpan(["katex"],[a]);return Te(n,r)}(za(t,r),0,r)}catch(e){return Ta(e,t,r)}},__setFontMetrics:function(t,e){F[t]=e},__defineSymbol:$,__defineMacro:pa,__domTree:{Span:N,Anchor:I,SymbolNode:E,SvgNode:L,PathNode:H,LineNode:P}};e.default=Ca}]).default});;"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var ComponentManager =
/*#__PURE__*/
function () {
  function ComponentManager(permissions, onReady) {
    _classCallCheck(this, ComponentManager);

    this.sentMessages = [];
    this.messageQueue = [];
    this.loggingEnabled = false;
    this.acceptsThemes = true;
    this.activeThemes = [];
    this.initialPermissions = permissions;
    this.onReadyCallback = onReady;
    this.coallesedSaving = true;
    this.coallesedSavingDelay = 250;
    this.registerMessageHandler();
  }

  _createClass(ComponentManager, [{
    key: "registerMessageHandler",
    value: function registerMessageHandler() {
      var _this = this;

      var messageHandler = function messageHandler(event) {
        if (_this.loggingEnabled) {
          console.log("Components API Message received:", event.data);
        } // We don't have access to window.parent.origin due to cross-domain restrictions.
        // Check referrer if available, otherwise defer to checking for first-run value.
        // Craft URL objects so that example.com === example.com/


        if (document.referrer) {
          var referrer = new URL(document.referrer).origin;
          var eventOrigin = new URL(event.origin).origin;

          if (referrer !== eventOrigin) {
            return;
          }
        } // The first message will be the most reliable one, so we won't change it after any subsequent events,
        // in case you receive an event from another window.


        if (!_this.origin) {
          _this.origin = event.origin;
        } else if (event.origin !== _this.origin) {
          // If event origin doesn't match first-run value, return.
          return;
        } // Mobile environment sends data as JSON string


        var data = event.data;
        var parsedData = typeof data === "string" ? JSON.parse(data) : data;

        _this.handleMessage(parsedData);
      };
      /*
        Mobile (React Native) uses `document`, web/desktop uses `window`.addEventListener
        for postMessage API to work properly.
         Update May 2019:
        As part of transitioning React Native webview into the community package,
        we'll now only need to use window.addEventListener.
         However, we want to maintain backward compatibility for Mobile < v3.0.5, so we'll keep document.addEventListener
         Also, even with the new version of react-native-webview, Android may still require document.addEventListener (while iOS still only requires window.addEventListener)
        https://github.com/react-native-community/react-native-webview/issues/323#issuecomment-467767933
       */


      document.addEventListener("message", function (event) {
        messageHandler(event);
      }, false);
      window.addEventListener("message", function (event) {
        messageHandler(event);
      }, false);
    }
  }, {
    key: "handleMessage",
    value: function handleMessage(payload) {
      if (payload.action === "component-registered") {
        this.sessionKey = payload.sessionKey;
        this.componentData = payload.componentData;
        this.onReady(payload.data);

        if (this.loggingEnabled) {
          console.log("Component successfully registered with payload:", payload);
        }
      } else if (payload.action === "themes") {
        if (this.acceptsThemes) {
          this.activateThemes(payload.data.themes);
        }
      } else if (payload.original) {
        // get callback from queue
        var originalMessage = this.sentMessages.filter(function (message) {
          return message.messageId === payload.original.messageId;
        })[0];

        if (!originalMessage) {
          // Connection must have been reset. Alert the user.
          alert("This extension is attempting to communicate with Standard Notes, but an error is preventing it from doing so. Please restart this extension and try again.");
        }

        if (originalMessage.callback) {
          originalMessage.callback(payload.data);
        }
      }
    }
  }, {
    key: "onReady",
    value: function onReady(data) {
      this.environment = data.environment;
      this.platform = data.platform;
      this.uuid = data.uuid;
      this.isMobile = this.environment == "mobile";

      if (this.initialPermissions && this.initialPermissions.length > 0) {
        this.requestPermissions(this.initialPermissions);
      }

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.messageQueue[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var message = _step.value;
          this.postMessage(message.action, message.data, message.callback);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      this.messageQueue = [];

      if (this.loggingEnabled) {
        console.log("onReadyData", data);
      }

      this.activateThemes(data.activeThemeUrls || []);

      if (this.onReadyCallback) {
        this.onReadyCallback();
      }
    }
  }, {
    key: "getSelfComponentUUID",
    value: function getSelfComponentUUID() {
      return this.uuid;
    }
  }, {
    key: "isRunningInDesktopApplication",
    value: function isRunningInDesktopApplication() {
      return this.environment === "desktop";
    }
  }, {
    key: "setComponentDataValueForKey",
    value: function setComponentDataValueForKey(key, value) {
      this.componentData[key] = value;
      this.postMessage("set-component-data", {
        componentData: this.componentData
      }, function (data) {});
    }
  }, {
    key: "clearComponentData",
    value: function clearComponentData() {
      this.componentData = {};
      this.postMessage("set-component-data", {
        componentData: this.componentData
      }, function (data) {});
    }
  }, {
    key: "componentDataValueForKey",
    value: function componentDataValueForKey(key) {
      return this.componentData[key];
    }
  }, {
    key: "postMessage",
    value: function postMessage(action, data, callback) {
      if (!this.sessionKey) {
        this.messageQueue.push({
          action: action,
          data: data,
          callback: callback
        });
        return;
      }

      var message = {
        action: action,
        data: data,
        messageId: this.generateUUID(),
        sessionKey: this.sessionKey,
        api: "component"
      };
      var sentMessage = JSON.parse(JSON.stringify(message));
      sentMessage.callback = callback;
      this.sentMessages.push(sentMessage); // Mobile (React Native) requires a string for the postMessage API.

      if (this.isMobile) {
        message = JSON.stringify(message);
      }

      if (this.loggingEnabled) {
        console.log("Posting message:", message);
      }

      window.parent.postMessage(message, this.origin);
    }
  }, {
    key: "setSize",
    value: function setSize(type, width, height) {
      this.postMessage("set-size", {
        type: type,
        width: width,
        height: height
      }, function (data) {});
    }
  }, {
    key: "requestPermissions",
    value: function requestPermissions(permissions, callback) {
      this.postMessage("request-permissions", {
        permissions: permissions
      }, function (data) {
        callback && callback();
      }.bind(this));
    }
  }, {
    key: "streamItems",
    value: function streamItems(contentTypes, callback) {
      if (!Array.isArray(contentTypes)) {
        contentTypes = [contentTypes];
      }

      this.postMessage("stream-items", {
        content_types: contentTypes
      }, function (data) {
        callback(data.items);
      }.bind(this));
    }
  }, {
    key: "streamContextItem",
    value: function streamContextItem(callback) {
      var _this2 = this;

      this.postMessage("stream-context-item", null, function (data) {
        var item = data.item;
        /*
          If this is a new context item than the context item the component was currently entertaining,
          we want to immediately commit any pending saves, because if you send the new context item to the
          component before it has commited its presave, it will end up first replacing the UI with new context item,
          and when the debouncer executes to read the component UI, it will be reading the new UI for the previous item.
        */

        var isNewItem = !_this2.lastStreamedItem || _this2.lastStreamedItem.uuid !== item.uuid;

        if (isNewItem && _this2.pendingSaveTimeout) {
          clearTimeout(_this2.pendingSaveTimeout);

          _this2._performSavingOfItems(_this2.pendingSaveParams);

          _this2.pendingSaveTimeout = null;
          _this2.pendingSaveParams = null;
        }

        _this2.lastStreamedItem = item;
        callback(_this2.lastStreamedItem);
      });
    }
  }, {
    key: "selectItem",
    value: function selectItem(item) {
      this.postMessage("select-item", {
        item: this.jsonObjectForItem(item)
      });
    }
  }, {
    key: "createItem",
    value: function createItem(item, callback) {
      this.postMessage("create-item", {
        item: this.jsonObjectForItem(item)
      }, function (data) {
        var item = data.item; // A previous version of the SN app had an issue where the item in the reply to create-item
        // would be nested inside "items" and not "item". So handle both cases here.

        if (!item && data.items && data.items.length > 0) {
          item = data.items[0];
        }

        this.associateItem(item);
        callback && callback(item);
      }.bind(this));
    }
  }, {
    key: "createItems",
    value: function createItems(items, callback) {
      var _this3 = this;

      var mapped = items.map(function (item) {
        return _this3.jsonObjectForItem(item);
      });
      this.postMessage("create-items", {
        items: mapped
      }, function (data) {
        callback && callback(data.items);
      }.bind(this));
    }
  }, {
    key: "associateItem",
    value: function associateItem(item) {
      this.postMessage("associate-item", {
        item: this.jsonObjectForItem(item)
      });
    }
  }, {
    key: "deassociateItem",
    value: function deassociateItem(item) {
      this.postMessage("deassociate-item", {
        item: this.jsonObjectForItem(item)
      });
    }
  }, {
    key: "clearSelection",
    value: function clearSelection() {
      this.postMessage("clear-selection", {
        content_type: "Tag"
      });
    }
  }, {
    key: "deleteItem",
    value: function deleteItem(item, callback) {
      this.deleteItems([item], callback);
    }
  }, {
    key: "deleteItems",
    value: function deleteItems(items, callback) {
      var params = {
        items: items.map(function (item) {
          return this.jsonObjectForItem(item);
        }.bind(this))
      };
      this.postMessage("delete-items", params, function (data) {
        callback && callback(data);
      });
    }
  }, {
    key: "sendCustomEvent",
    value: function sendCustomEvent(action, data, callback) {
      this.postMessage(action, data, function (data) {
        callback && callback(data);
      }.bind(this));
    }
  }, {
    key: "saveItem",
    value: function saveItem(item, callback) {
      var skipDebouncer = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      this.saveItems([item], callback, skipDebouncer);
    }
    /* Presave allows clients to perform any actions last second before the save actually occurs (like setting previews).
       Saves debounce by default, so if a client needs to compute a property on an item before saving, it's best to
       hook into the debounce cycle so that clients don't have to implement their own debouncing.
     */

  }, {
    key: "saveItemWithPresave",
    value: function saveItemWithPresave(item, presave, callback) {
      this.saveItemsWithPresave([item], presave, callback);
    }
  }, {
    key: "saveItemsWithPresave",
    value: function saveItemsWithPresave(items, presave, callback) {
      this.saveItems(items, callback, false, presave);
    }
  }, {
    key: "_performSavingOfItems",
    value: function _performSavingOfItems(_ref) {
      var items = _ref.items,
          presave = _ref.presave,
          callback = _ref.callback;
      // presave block allows client to gain the benefit of performing something in the debounce cycle.
      presave && presave();
      var mappedItems = [];
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = items[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var item = _step2.value;
          mappedItems.push(this.jsonObjectForItem(item));
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
            _iterator2["return"]();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      this.postMessage("save-items", {
        items: mappedItems
      }, function (data) {
        callback && callback();
      });
    }
    /*
    skipDebouncer allows saves to go through right away rather than waiting for timeout.
    This should be used when saving items via other means besides keystrokes.
    */

  }, {
    key: "saveItems",
    value: function saveItems(items, callback) {
      var _this4 = this;

      var skipDebouncer = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var presave = arguments.length > 3 ? arguments[3] : undefined;

      // We need to make sure that when we clear a pending save timeout,
      // we carry over those pending items into the new save.
      if (!this.pendingSaveItems) {
        this.pendingSaveItems = [];
      }

      if (this.coallesedSaving == true && !skipDebouncer) {
        if (this.pendingSaveTimeout) {
          clearTimeout(this.pendingSaveTimeout);
        }

        var incomingIds = items.map(function (item) {
          return item.uuid;
        }); // Replace any existing save items with incoming values
        // Only keep items here who are not in incomingIds

        var preexistingItems = this.pendingSaveItems.filter(function (item) {
          return !incomingIds.includes(item.uuid);
        }); // Add new items, now that we've made sure it's cleared of incoming items.

        this.pendingSaveItems = preexistingItems.concat(items); // We'll potentially need to commit early if stream-context-item message comes in

        this.pendingSaveParams = {
          items: this.pendingSaveItems,
          presave: presave,
          callback: callback
        };
        this.pendingSaveTimeout = setTimeout(function () {
          _this4._performSavingOfItems(_this4.pendingSaveParams);

          _this4.pendingSaveItems = [];
          _this4.pendingSaveTimeout = null;
          _this4.pendingSaveParams = null;
        }, this.coallesedSavingDelay);
      } else {
        this._performSavingOfItems({
          items: items,
          presave: presave,
          callback: callback
        });
      }
    }
  }, {
    key: "jsonObjectForItem",
    value: function jsonObjectForItem(item) {
      var copy = Object.assign({}, item);
      copy.children = null;
      copy.parent = null;
      return copy;
    }
  }, {
    key: "getItemAppDataValue",
    value: function getItemAppDataValue(item, key) {
      var AppDomain = "org.standardnotes.sn";
      var data = item.content.appData && item.content.appData[AppDomain];

      if (data) {
        return data[key];
      } else {
        return null;
      }
    }
    /* Themes */

  }, {
    key: "activateThemes",
    value: function activateThemes(incomingUrls) {
      if (this.loggingEnabled) {
        console.log("Incoming themes", incomingUrls);
      }

      if (this.activeThemes.sort().toString() == incomingUrls.sort().toString()) {
        // incoming are same as active, do nothing
        return;
      }

      var themesToActivate = incomingUrls || [];
      var themesToDeactivate = [];
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = this.activeThemes[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var activeUrl = _step3.value;

          if (!incomingUrls.includes(activeUrl)) {
            // active not present in incoming, deactivate it
            themesToDeactivate.push(activeUrl);
          } else {
            // already present in active themes, remove it from themesToActivate
            themesToActivate = themesToActivate.filter(function (candidate) {
              return candidate != activeUrl;
            });
          }
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
            _iterator3["return"]();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      if (this.loggingEnabled) {
        console.log("Deactivating themes:", themesToDeactivate);
        console.log("Activating themes:", themesToActivate);
      }

      for (var _i = 0, _themesToDeactivate = themesToDeactivate; _i < _themesToDeactivate.length; _i++) {
        var theme = _themesToDeactivate[_i];
        this.deactivateTheme(theme);
      }

      this.activeThemes = incomingUrls;
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = themesToActivate[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var url = _step4.value;

          if (!url) {
            continue;
          }

          var link = document.createElement("link");
          link.id = btoa(url);
          link.href = url;
          link.type = "text/css";
          link.rel = "stylesheet";
          link.media = "screen,print";
          link.className = "custom-theme";
          document.getElementsByTagName("head")[0].appendChild(link);
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {
            _iterator4["return"]();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }
    }
  }, {
    key: "themeElementForUrl",
    value: function themeElementForUrl(url) {
      var elements = Array.from(document.getElementsByClassName("custom-theme")).slice();
      return elements.find(function (element) {
        // We used to search here by `href`, but on desktop, with local file:// urls, that didn't work for some reason.
        return element.id == btoa(url);
      });
    }
  }, {
    key: "deactivateTheme",
    value: function deactivateTheme(url) {
      var element = this.themeElementForUrl(url);

      if (element) {
        element.disabled = true;
        element.parentNode.removeChild(element);
      }
    }
    /* Theme caching is currently disabled. Might be enabled in the future if neccessary. */

    /*
    activateCachedThemes() {
      let themes = this.getCachedThemeUrls();
      let writeToCache = false;
      if(this.loggingEnabled) { console.log("Activating cached themes", themes); }
      this.activateThemes(themes, writeToCache);
    }
     cacheThemeUrls(urls) {
      if(this.loggingEnabled) { console.log("Caching theme urls", urls); }
      localStorage.setItem("cachedThemeUrls", JSON.stringify(urls));
    }
     decacheThemeUrls() {
      localStorage.removeItem("cachedThemeUrls");
    }
     getCachedThemeUrls() {
      let urls = localStorage.getItem("cachedThemeUrls");
      if(urls) {
        return JSON.parse(urls);
      } else {
        return [];
      }
    }
    */

    /* Utilities */

  }, {
    key: "generateUUID",
    value: function generateUUID() {
      var crypto = window.crypto || window.msCrypto;

      if (crypto) {
        var buf = new Uint32Array(4);
        crypto.getRandomValues(buf);
        var idx = -1;
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          idx++;
          var r = buf[idx >> 3] >> idx % 8 * 4 & 15;
          var v = c == 'x' ? r : r & 0x3 | 0x8;
          return v.toString(16);
        });
      } else {
        var d = new Date().getTime();

        if (window.performance && typeof window.performance.now === "function") {
          d += performance.now(); //use high-precision timer if available
        }

        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          var r = (d + Math.random() * 16) % 16 | 0;
          d = Math.floor(d / 16);
          return (c == 'x' ? r : r & 0x3 | 0x8).toString(16);
        });
        return uuid;
      }
    }
  }]);

  return ComponentManager;
}();

if (typeof module != "undefined" && typeof module.exports != "undefined") {
  module.exports = ComponentManager;
}

if (window) {
  window.ComponentManager = ComponentManager;
}
//# sourceMappingURL=dist.js.map
;(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

document.addEventListener("DOMContentLoaded", function (event) {
  var editor = document.getElementById("editor-source");
  var workingNote;
  var permissions = [{
    name: "stream-context-item"
  }];
  var componentManager = new ComponentManager(permissions, function () {
    // on ready
    var platform = componentManager.platform;

    if (platform) {
      document.body.classList.add(platform);
    }
  }); // componentManager.loggingEnabled = true;

  componentManager.streamContextItem(function (note) {
    workingNote = note; // Only update UI on non-metadata updates.

    if (note.isMetadataUpdate) {
      return;
    }

    editor.value = note.content.text;
    window.upmath.updateText();
  });
  editor.addEventListener("input", function (event) {
    var text = editor.value || "";

    function strip(html) {
      var tmp = document.implementation.createHTMLDocument("New").body;
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || "";
    }

    function truncateString(string) {
      var limit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 90;

      if (string.length <= limit) {
        return string;
      } else {
        return string.substring(0, limit) + "...";
      }
    }

    function save() {
      componentManager.saveItem(workingNote);
    }

    if (workingNote) {
      // Be sure to capture this object as a variable, as workingNote may be reassigned in `streamContextItem`, so by the time
      // you modify it in the presave block, it may not be the same object anymore, so the presave values will not be applied to
      // the right object, and it will save incorrectly.
      var note = workingNote;
      componentManager.saveItemWithPresave(note, function () {
        window.upmath.updateText();
        var html = window.upmath.getHTML();
        var strippedHtml = truncateString(strip(html));
        note.content.preview_plain = strippedHtml;
        note.content.preview_html = null;
        note.content.text = text;
      });
    }
  }); // Tab handler

  editor.addEventListener('keydown', function (event) {
    if (!event.shiftKey && event.which == 9) {
      event.preventDefault();
      console.log(document); // Using document.execCommand gives us undo support

      if (!document.execCommand("insertText", false, "\t")) {
        // document.execCommand works great on Chrome/Safari but not Firefox
        var start = this.selectionStart;
        var end = this.selectionEnd;
        var spaces = "    "; // Insert 4 spaces

        this.value = this.value.substring(0, start) + spaces + this.value.substring(end); // Place cursor 4 spaces away from where
        // the tab key was pressed

        this.selectionStart = this.selectionEnd = start + 4;
      }
    }
  });
});
;
/**
* Markdown and LaTeX Editor
*
* (c) Roman Parpalak, 2016-2018
*/

(function (document, window) {
  'use strict';

  var defaults = {
    html: true,
    // Enable HTML tags in source
    xhtmlOut: false,
    // Use '/' to close single tags (<br />)
    breaks: false,
    // Convert '\n' in paragraphs into <br>
    langPrefix: 'language-',
    // CSS language prefix for fenced blocks
    linkify: true,
    // autoconvert URL-like texts to links
    typographer: true,
    // Enable smartypants and other sweet transforms
    quotes: '""\'\'',
    // option for tex plugin
    _habr: {
      protocol: ''
    },
    // no protocol for habrahabr markup
    // options below are for demo only
    _highlight: true,
    _strict: false
  };

  function domSetResultView(val) {
    var eNode = document.body;
    ['result-as-html', 'result-as-htmltex', 'result-as-habr', 'result-as-src', 'result-as-debug'].forEach(function (className) {
      if (eNode.classList) {
        eNode.classList.remove(className);
      } else {
        eNode.className = eNode.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
      }
    });

    if (eNode.classList) {
      eNode.classList.add('result-as-' + val);
    } else {
      eNode.className += ' ' + 'result-as-' + val;
    }
  }

  function ParserCollection(defaults, imageLoader, markdownit, setResultView, sourceGetter, sourceSetter, domSetPreviewHTML, domSetHighlightedContent, updateCallback) {
    var _mdPreview = markdownit(defaults).use(markdownitS2Tex).use(markdownitSub).use(markdownitSup);

    var _mdHtmlAndImages = markdownit(defaults).use(markdownitS2Tex).use(markdownitSub).use(markdownitSup);

    var _mdHtmlAndTex = markdownit(defaults).use(markdownitS2Tex, {
      noreplace: true
    }).use(markdownitSub).use(markdownitSup);

    var _mdHtmlHabrAndImages = markdownit(defaults).use(markdownitS2Tex, defaults._habr).use(markdownitSub).use(markdownitSup);

    var _mdMdAndImages = markdownit('zero').use(markdownitS2Tex);
    /**
     * Detects if the paragraph contains the only formula.
     * Parser gives the class 'tex-block' to such formulas.
     *
     * @param tokens
     * @param idx
     * @returns {boolean}
     */


    function hasBlockFormula(tokens, idx) {
      if (idx >= 0 && tokens[idx] && tokens[idx].children) {
        for (var i = tokens[idx].children.length; i--;) {
          if (tokens[idx].children[i].tag === 'tex-block') {
            return true;
          }
        }
      }

      return false;
    }
    /**
     * Inject line numbers for sync scroll. Notes:
     * - We track only headings and paragraphs on first level. That's enough.
     * - Footnotes content causes jumps. Level limit filter it automatically.
     *
     * @param tokens
     * @param idx
     * @param options
     * @param env
     * @param self
     */


    function injectLineNumbersAndCentering(tokens, idx, options, env, self) {
      var line;

      if (tokens[idx].map && tokens[idx].level === 0) {
        line = tokens[idx].map[0];
        tokens[idx].attrPush(['class', 'line']);
        tokens[idx].attrPush(['data-line', line + '']);
      } // Hack (maybe it is better to use block renderers?)


      if (hasBlockFormula(tokens, idx + 1)) {
        tokens[idx].attrPush(['align', 'center']);
        tokens[idx].attrPush(['style', 'text-align: center;']);
      }

      return self.renderToken(tokens, idx, options, env, self);
    } // Habrahabr does not ignore <p> tags and meanwhile uses whitespaces


    function habrHeading(tokens, idx, options, env, self) {
      var prefix = "";

      if (idx > 0 && tokens[idx - 1].type === 'paragraph_close' && !hasBlockFormula(tokens, idx - 2)) {
        prefix = "\n";
      }

      return prefix + self.renderToken(tokens, idx, options, env, self);
    }

    function habrParagraphOpen(tokens, idx, options, env, self) {
      var prefix = "";

      if (idx > 0 && tokens[idx - 1].type === 'paragraph_close' && !hasBlockFormula(tokens, idx - 2)) {
        prefix = "\n";
      }

      return prefix; //+ self.renderToken(tokens, idx, options, env, self);
    }

    function habrParagraphClose(tokens, idx, options, env, self) {
      var prefix = "\n";
      return prefix; //+ self.renderToken(tokens, idx, options, env, self);
    }

    function injectCentering(tokens, idx, options, env, self) {
      // Hack (maybe it is better to use block renderers?)
      if (hasBlockFormula(tokens, idx + 1)) {
        tokens[idx].attrPush(['align', 'center']);
        tokens[idx].attrPush(['style', 'text-align: center;']);
      }

      return self.renderToken(tokens, idx, options, env, self);
    }

    _mdPreview.renderer.rules.paragraph_open = _mdPreview.renderer.rules.heading_open = injectLineNumbersAndCentering;
    _mdHtmlAndImages.renderer.rules.paragraph_open = _mdHtmlAndImages.renderer.rules.heading_open = injectCentering;
    _mdHtmlHabrAndImages.renderer.rules.heading_open = habrHeading;
    _mdHtmlHabrAndImages.renderer.rules.paragraph_open = habrParagraphOpen;
    _mdHtmlHabrAndImages.renderer.rules.paragraph_close = habrParagraphClose; // A copy of Markdown-it original backticks parser.
    // We want to prevent from parsing dollars inside backticks as TeX delimeters (`$$`).
    // But we do not want HTML in result.

    _mdMdAndImages.inline.ruler.before('backticks', 'backticks2', function (state, silent) {
      var start,
          max,
          marker,
          matchStart,
          matchEnd,
          token,
          pos = state.pos,
          ch = state.src.charCodeAt(pos);

      if (ch !== 0x60
      /* ` */
      ) {
          return false;
        }

      start = pos;
      pos++;
      max = state.posMax;

      while (pos < max && state.src.charCodeAt(pos) === 0x60
      /* ` */
      ) {
        pos++;
      }

      marker = state.src.slice(start, pos);
      matchStart = matchEnd = pos;

      while ((matchStart = state.src.indexOf('`', matchEnd)) !== -1) {
        matchEnd = matchStart + 1;

        while (matchEnd < max && state.src.charCodeAt(matchEnd) === 0x60
        /* ` */
        ) {
          matchEnd++;
        }

        if (matchEnd - matchStart === marker.length) {
          if (!silent) {
            token = state.push('backticks2_inline', 'code', 0); // <-- The change

            token.markup = marker;
            token.content = state.src.slice(pos, matchStart);
          }

          state.pos = matchEnd;
          return true;
        }
      }

      if (!silent) {
        state.pending += marker;
      }

      state.pos += marker.length;
      return true;
    });

    _mdMdAndImages.renderer.rules.backticks2_inline = function (tokens, idx
    /*, options, env, slf*/
    ) {
      var token = tokens[idx];
      return token.markup + token.content + token.markup;
    }; // Prevents HTML escaping.


    _mdMdAndImages.renderer.rules.text = function (tokens, idx
    /*, options, env */
    ) {
      return tokens[idx].content;
    };
    /**
     * Habrahabr "source" tag
     *
     * @param tokens
     * @param idx
     * @param options
     * @param env
     * @param self
     * @returns {string}
     */


    _mdHtmlHabrAndImages.renderer.rules.fence = function (tokens, idx, options, env, self) {
      var token = tokens[idx],
          info = token.info ? _mdHtmlHabrAndImages.utils.unescapeAll(token.info).trim() : '',
          langName = '',
          highlighted;

      if (info) {
        langName = info.split(/\s+/g)[0];
        token.attrPush(['lang', langName]);
      }

      if (options.highlight) {
        highlighted = options.highlight(token.content, langName) || _mdHtmlHabrAndImages.utils.escapeHtml(token.content);
      } else {
        highlighted = _mdHtmlHabrAndImages.utils.escapeHtml(token.content);
      }

      return '\n<source' + self.renderAttrs(token) + '>' + highlighted + '</source>\n';
    };

    function getHabraMarkup(source) {
      var html = _mdHtmlHabrAndImages.render(source);

      html = html.replace('<spoiler ', '\n<spoiler ');
      return html;
    }

    this.getSource = sourceGetter;

    this.setSource = function (source) {
      sourceSetter(source);
      this.updateResult();
    };

    var _oldSource = null,
        _view = 'html'; // html / src / debug

    this.updateResult = function () {
      var source = sourceGetter();

      if (_oldSource === source) {
        return;
      }

      _oldSource = source; // Always render html because we need it to generate previews for SN

      imageLoader.reset();
      domSetPreviewHTML(_mdPreview.render(source));
      imageLoader.fixDom(); // Update only active view to avoid slowdowns
      // (debug & src view with highlighting are a bit slow)

      if (_view === 'htmltex') {
        domSetHighlightedContent('result-src-content', _mdHtmlAndTex.render(source), 'html');
      } else if (_view === 'debug') {
        domSetHighlightedContent('result-src-content', JSON.stringify(_mdHtmlAndImages.parse(source, {
          references: {}
        }), null, 2), 'json');
      } else if (_view === 'habr') {
        domSetHighlightedContent('result-src-content', getHabraMarkup(source), 'html');
      } else if (_view === 'md') {
        domSetHighlightedContent('result-src-content', _mdMdAndImages.renderInline(source), 'html');
      } else {
        /*_view === 'src'*/
        domSetHighlightedContent('result-src-content', _mdHtmlAndImages.render(source), 'html');
      }

      updateCallback(source);
    };

    this.getDisplayedResult = function () {
      var source = sourceGetter();

      if (_view === 'habr') {
        return _mdHtmlHabrAndImages.render(source);
      }

      if (_view === 'htmltex') {
        return _mdHtmlAndTex.render(source);
      }

      if (_view === 'md') {
        return _mdMdAndImages.renderInline(source);
      }

      return _mdHtmlAndImages.render(source);
    };

    this.getDisplayedResultFilename = function () {
      return _view + '.html';
    };

    setResultView(_view);

    this.switchView = function (view) {
      _view = view;
      setResultView(view);
      _oldSource = null;
      this.updateResult();
    };
  }

  function domSetHighlightedContent(className, content, lang) {
    var eNode = document.getElementsByClassName(className)[0];

    if (window.hljs) {
      eNode.innerHTML = window.hljs.highlight(lang, content).value;
    } else {
      eNode.textContent = content;
    }
  }

  function domSetPreviewHTML(html) {
    var result = document.getElementsByClassName('result-html');
    result[0].innerHTML = html;
  }
  /**
   * Searches start position for text blocks
   */


  function domFindScrollMarks() {
    var resElements = document.querySelectorAll('.result-html .line'),
        resElementHeight = [],
        line,
        mapSrc = [0],
        mapResult = [0],
        i = 0,
        len = resElements.length;

    for (; i < len; i++) {
      line = parseInt(resElements[i].getAttribute('data-line'));

      if (line) {
        resElementHeight[line] = Math.round(resElements[i].offsetTop);
      }
    }

    var srcElements = document.querySelectorAll('.ldt-pre .block-start');
    len = srcElements.length;
    line = 0;

    for (i = 0; i < len; i++) {
      var lineDelta = parseInt(srcElements[i].getAttribute('data-line'));

      if (lineDelta) {
        line += lineDelta; // We track only lines in both containers

        if (typeof resElementHeight[line] !== 'undefined') {
          mapSrc.push(srcElements[i].offsetTop);
          mapResult.push(resElementHeight[line]);
        }
      }
    }

    var srcScrollHeight = document.querySelector('.ldt-pre').scrollHeight,
        lastSrcElemPos = mapSrc[mapSrc.length - 1],
        allowedHeight = 5; // workaround for automatic textarea scrolling on entering new source lines

    mapSrc.push(srcScrollHeight - allowedHeight > lastSrcElemPos ? srcScrollHeight - allowedHeight : lastSrcElemPos);
    mapResult.push(document.querySelector('.result-html').scrollHeight);
    return [mapSrc, mapResult];
  }

  documentReady(function () {
    var eTextarea = document.getElementById('editor-source'),
        eResultHtml = document.getElementsByClassName('result-html')[0];
    var recalcHeight = debounce(function () {
      decorator.recalcHeight();
    }, 100);
    var scrollMap = new ScrollMap(domFindScrollMarks);
    var parserCollection = new ParserCollection(defaults, new ImageLoader(new ImagePreloader(), location.protocol === 'https:' ? 'https:' : 'http:'), window.markdownit, domSetResultView, function domGetSource() {
      return eTextarea.value;
    }, function domSetSource(text) {
      eTextarea.value = text;
      decorator.update();
    }, domSetPreviewHTML, domSetHighlightedContent, function (source) {
      // reset lines mapping cache on content update
      scrollMap.reset();
    });
    parserCollection.updateResult(); // start the decorator

    var decorator = new TextareaDecorator(eTextarea, mdParser); // .source has been changed after TextareaDecorator call

    var eNodeSource = document.getElementsByClassName('source')[0];
    var syncScroll = new SyncScroll(scrollMap, new Animator(function () {
      return eNodeSource.scrollTop;
    }, function (y) {
      eNodeSource.scrollTop = y;
    }), new Animator(function () {
      return eResultHtml.scrollTop;
    }, function (y) {
      eResultHtml.scrollTop = y;
    }), eNodeSource, eResultHtml, document.querySelector('[id^="container-block"]')); // Sync scroll listeners
    // var updateText = debounce(parserCollection.updateResult, 240, {maxWait: 3000});
    // We'll update text on our own

    var _updateText = parserCollection.updateResult; // eTextarea.addEventListener('keyup', updateText);
    // eTextarea.addEventListener('paste', updateText);
    // eTextarea.addEventListener('cut', updateText);
    // eTextarea.addEventListener('mouseup', updateText);

    eTextarea.addEventListener('touchstart', syncScroll.switchScrollToSrc);
    eTextarea.addEventListener('mouseover', syncScroll.switchScrollToSrc);
    eResultHtml.addEventListener('touchstart', syncScroll.switchScrollToResult);
    eResultHtml.addEventListener('mouseover', syncScroll.switchScrollToResult);
    syncScroll.switchScrollToSrc();
    Array.prototype.forEach.call(document.getElementsByClassName('control-item'), function (eNode, index) {
      eNode.addEventListener('click', function () {
        var view = this.getAttribute('data-result-as');

        if (!view) {
          return;
        }

        parserCollection.switchView(view);

        if (view !== 'preview') {
          // Selecting all block content.
          var contentBlocks = document.getElementsByClassName('result-src-content');

          if (contentBlocks.length) {
            setTimeout(function () {
              selectText(contentBlocks[0]);
            }, 0);
          }
        }
      });
    }); // Interface element listeners

    document.querySelector('._download-source').addEventListener('click', function () {
      var blob = new Blob([parserCollection.getSource()], {
        type: 'text/markdown;charset=utf-8'
      });
      saveAs(blob, 'source.md');
    });
    document.querySelector('._download-result').addEventListener('click', function () {
      var blob = new Blob([parserCollection.getDisplayedResult()], {
        type: 'text/html;charset=utf-8'
      });
      saveAs(blob, parserCollection.getDisplayedResultFilename());
    });
    document.querySelector('._upload-source').addEventListener('click', function () {
      var eNode = document.getElementById('fileElem'); // Fire click on file input

      (eNode.onclick || eNode.click || function () {}).call(eNode);
    });
    document.getElementById('fileElem').addEventListener('change', function () {
      // A file has been chosen
      if (!this.files || !FileReader) {
        return;
      }

      var reader = new FileReader(),
          fileInput = this;

      reader.onload = function () {
        parserCollection.setSource(this.result);
        fileInput.value = fileInput.defaultValue;
      };

      reader.readAsText(this.files[0]);
    });

    (function () {
      var eSlider = document.querySelector('.slider'),
          dragSlider = new Draggabilly(eSlider, {
        axis: 'x'
      }),
          sourceBlock = document.getElementById('source-block'),
          resultBLock = document.getElementById('result-block'),
          windowWidth;

      function setWidth(percent) {
        sourceBlock.style.width = 'calc(' + percent + '% - 3px)';
        resultBLock.style.width = 'calc(' + (100 - percent) + '% - 3px)';
        scrollMap.reset();
      }

      eSlider.addEventListener('dblclick', function () {
        setWidth(50);
      });
      dragSlider.on('dragStart', function (event, pointer, moveVector) {
        windowWidth = window.innerWidth;
      });
      dragSlider.on('dragMove', function (event, pointer, moveVector) {
        setWidth(100.0 * pointer.pageX / windowWidth);
      });
    })();

    window.upmath = {
      updateText: function updateText() {
        _updateText();

        decorator.recalcHeight();
        decorator.update();
      },
      getHTML: function getHTML() {
        var result = document.getElementsByClassName('result-html');
        return eResultHtml.innerHTML;
      }
    }; // Need to recalculate line positions on window resize

    window.addEventListener('resize', function () {
      scrollMap.reset();
      recalcHeight();
    });
  });
})(document, window);

;
/**
* Renders LaTeX formulae via KaTeX.
*
* Previously connects service to the markdown-it renderer.
*
* Inspired by 
*
* @copyright 2015 Roman Parpalak
*/

(function (w) {
  'use strict';

  function scanDelims(state, start) {
    var pos = state.pos,
        lastChar,
        nextChar,
        count,
        isLastWhiteSpace,
        isLastPunctChar,
        isNextWhiteSpace,
        isNextPunctChar,
        can_open = true,
        can_close = true,
        max = state.posMax,
        isWhiteSpace = state.md.utils.isWhiteSpace,
        isPunctChar = state.md.utils.isPunctChar,
        isMdAsciiPunct = state.md.utils.isMdAsciiPunct; // treat beginning of the line as a whitespace

    lastChar = start > 0 ? state.src.charCodeAt(start - 1) : 0x20;

    if (pos >= max) {
      can_open = false;
    }

    count = pos - start; // treat end of the line as a whitespace

    nextChar = pos < max ? state.src.charCodeAt(pos) : 0x20;
    isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctChar(String.fromCharCode(lastChar));
    isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctChar(String.fromCharCode(nextChar));
    isLastWhiteSpace = isWhiteSpace(lastChar);
    isNextWhiteSpace = isWhiteSpace(nextChar);

    if (isNextWhiteSpace) {
      can_open = false;
    } else if (isNextPunctChar) {
      if (!(isLastWhiteSpace || isLastPunctChar)) {
        can_open = false;
      }
    }

    if (isLastWhiteSpace) {
      can_close = false;
    } else if (isLastPunctChar) {
      if (!(isNextWhiteSpace || isNextPunctChar)) {
        can_close = false;
      }
    }

    return {
      can_open: can_open,
      can_close: can_close,
      delims: count
    };
  }

  function makeMath_inline(open, close) {
    return function math_inline(state, silent) {
      var startCount,
          found,
          res,
          token,
          closeDelim,
          max = state.posMax,
          start = state.pos,
          openDelim = state.src.slice(start, start + open.length);

      if (openDelim !== open) {
        return false;
      }

      if (silent) {
        return false;
      } // Don’t run any pairs in validation mode


      res = scanDelims(state, start + open.length);
      startCount = res.delims;

      if (!res.can_open) {
        state.pos += startCount; // Earlier we checked !silent, but this implementation does not need it

        state.pending += state.src.slice(start, state.pos);
        return true;
      }

      state.pos = start + open.length;

      while (state.pos < max) {
        closeDelim = state.src.slice(state.pos, state.pos + close.length);

        if (closeDelim === close) {
          res = scanDelims(state, state.pos + close.length);

          if (res.can_close) {
            found = true;
            break;
          }
        }

        state.md.inline.skipToken(state);
      }

      if (!found) {
        // Parser failed to find ending tag, so it is not a valid math
        state.pos = start;
        return false;
      } // Found!
      // Detecting single formula with a line number


      var m = false,
          tag = 'tex-inline';

      if (start == 0) {
        var srcEnd = state.src.substring(state.pos + close.length);
        m = srcEnd.match(/^\s*(\([ \t]*\S+[ \t]*\))\s*$/);

        if (m || srcEnd == '') {
          tag = 'tex-block';
        }
      }

      if (m) {
        token = state.push('math_number', 'tex-number', 0);
        token.content = m[1];
        token.markup = '()';
      }

      state.posMax = state.pos;
      state.pos = start + close.length; // Earlier we checked !silent, but this implementation does not need it

      token = state.push('math_inline', tag, 0);
      token.content = state.src.slice(state.pos, state.posMax);
      token.markup = open;
      state.pos = m ? max : state.posMax + close.length;
      state.posMax = max;
      return true;
    };
  }

  w.markdownitS2Tex = function math_plugin(md, options) {
    // Default options
    options = _typeof(options) === 'object' ? options : {};
    var inlineOpen = options.inlineOpen || '$$',
        inlineClose = options.inlineClose || '$$';
    var math_inline = makeMath_inline(inlineOpen, inlineClose);
    md.inline.ruler.before('escape', 'math_inline', math_inline);

    md.renderer.rules.math_inline = function () {
      return function (tokens, idx) {
        var formula = tokens[idx].content;

        if (options.noreplace) {
          var str = inlineOpen + formula + inlineClose;
          return str.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
        }

        var isInline = "tex-inline" === tokens[idx].tag;
        var rendered = katex.renderToString(formula, {
          throwOnError: false,
          displayMode: !isInline,
          trust: true
        });
        return rendered;
      };
    }();

    md.renderer.rules.math_number = function (tokens, idx) {
      return '<span style="float:right">' + tokens[idx].content + '</span>';
    };
  };
})(window);

;
/**
* Markdown parser with latex extension
*
* (c) Roman Parpalak, 2015
* Based on code by Colin Kuebler, 2012
*/

function MarkdownParser(i) {
  /* INIT */
  var api = this; // variables used internally

  i = i ? 'i' : '';
  var parseInlineRE = null,
      parseBlockRE = null,
      ruleMap = {},
      ruleBlockMap = {},
      ruleInlineMap = {},
      runInBlocks = {},
      markers = {};
  var subRules,
      subRulesMap = {},
      subRulesRE = {};

  function addBlockRule(s, rule) {
    var re = new RegExp('^(' + s + ')$', i);
    ruleMap[rule] = re;
    ruleBlockMap[rule] = re;
  }

  function addInlineRule(s, rule) {
    var re = new RegExp('^(' + s + ')$', i);
    ruleMap[rule] = re;
    ruleInlineMap[rule] = re;
  }

  function addSubruleMap(s, rule, block) {
    if (!subRulesMap[block]) {
      subRulesMap[block] = {};
    }

    subRulesMap[block][rule] = new RegExp('^(' + s + ')$', i);
  }

  api.addInlineRules = function (rules) {
    var ruleSrc = [];

    for (var rule in rules) {
      if (rules.hasOwnProperty(rule)) {
        var s = rules[rule].source;
        ruleSrc.push(s);
        addInlineRule(s, rule);
      }
    }

    parseInlineRE = new RegExp('(' + ruleSrc.join('|') + ')', i);
    return this;
  };

  api.addSubRules = function (rules) {
    subRules = rules;

    for (var block in rules) {
      if (rules.hasOwnProperty(block)) {
        var rules2 = rules[block],
            p = [];

        for (var rule in rules2) {
          if (rules2.hasOwnProperty(rule)) {
            var s = rules2[rule].source;
            addSubruleMap(s, rule, block);
            p.push(s);
          }
        }

        subRulesRE[block] = new RegExp('(' + p.join('|') + ')', i);
      }
    }

    return this;
  };

  api.addBlockRules = function (rules) {
    var ruleArray = [];

    for (var rule in rules) {
      if (rules.hasOwnProperty(rule)) {
        var s = rules[rule].source;
        ruleArray.push(s);
        addBlockRule(s, rule);
      }
    }

    parseBlockRE = new RegExp('(' + ruleArray.join('|') + ')', i);
    return this;
  };

  api.addRunIn = function (rules) {
    runInBlocks = rules;
    return this;
  };

  api.addMarkers = function (m) {
    markers = m;
    return this;
  };

  function tokenizeBlock(block, className, lineNum, result) {
    var re = parseInlineRE; // Process specific rules for the given block type className

    if (className in subRules) {
      if (subRules[className] === null) {
        result.push({
          token: block,
          block: className,
          line: lineNum
        });
        return;
      } else {
        re = subRulesRE[className];
      }
    } // Token for a block marker


    if (typeof markers[className] !== 'undefined') {
      var matches = block.match(markers[className]);

      if (matches[2]) {
        result.push({
          token: matches[1],
          block: className + '-mark',
          line: lineNum
        });
        block = matches[2];
        lineNum = 0; // Write block position only once
      }
    }

    var items = block.split(re),
        j = 0,
        token;

    for (; j < items.length; j++) {
      token = items[j];

      if (token != '') {
        result.push({
          token: token,
          block: className,
          line: lineNum
        });
        lineNum = 0; // Write block position only once
      }
    }
  }

  api.tokenize = function (input) {
    input = input.replace('\r', '');
    var result = [],
        classNames = [],
        blocks = input.split(parseBlockRE),
        blockNum = blocks.length,
        i,
        prevIndex = 0,
        prevBlockClass; // Merge blocks separated by line breaks

    for (i = 0; i < blockNum; i++) {
      if (blocks[i] === '') {
        continue;
      }

      var className = identify(blocks[i], ruleBlockMap);

      if (prevIndex > 0 && className in runInBlocks) {
        var allowedPrevBlocks = runInBlocks[className].allowedBlocks;

        if (allowedPrevBlocks && allowedPrevBlocks.indexOf(prevBlockClass) >= 0) {
          blocks[prevIndex] += blocks[i];
          blocks[i] = '';
          classNames[i] = '';
          continue;
        }
      }

      classNames[i] = className;
      prevIndex = i;
      prevBlockClass = className;
    }

    var lineBreakCnt = 0;

    for (i = 0; i < blockNum; i++) {
      var block = blocks[i];

      if (block !== '') {
        var lineNum = 0;

        if (classNames[i] != 'empty') {
          // TODO move to config
          lineNum = lineBreakCnt;
          lineBreakCnt = 0; // Storing diff between line numbers
        }

        tokenizeBlock(block, classNames[i], lineNum, result);
        lineBreakCnt += substrCount('\n', block);
      }
    }

    return result;
  };

  api.identifyInline = function (tokenObj) {
    var className = tokenObj.block,
        map = ruleInlineMap;

    if (className in subRules) {
      if (subRules[className] === null) {
        return '';
      } else {
        map = subRulesMap[className];
      }
    }

    return identify(tokenObj.token, map);
  };

  function identify(token, ruleMap) {
    for (var rule in ruleMap) {
      if (ruleMap.hasOwnProperty(rule) && ruleMap[rule].test(token)) {
        return rule;
      }
    }

    return '';
  }

  return api;
} // Markdown syntax parser


var mdParser = new MarkdownParser();
mdParser.addBlockRules({
  latexBlock: /[ \t]*\$\$\n?(?:[^\n]+\n)*(?:[^\n]*[^\\\n])?\$\$(?:[ \t]*\([ \t]*\S+[ \t]*\))?[ \t]*(?:\n|$)/,
  empty: /(?:[ \t]*\n)+/,
  fence: /```[\s\S]*?(?:$|```(?:\n|$))/,
  reference: /\[[^\]]+\]\:[^\n]*(?:\n|$)/,
  header: /#{1,6} [^\n]*(?:\n|$)/,
  header2: /[^\n]+\n[ \t]*[=-]{2,}(?:\n|$)/,
  rule: /(?:[\*]{3,}|[\-]{3,}|[\_]{3,})(?:\n|$)/,
  list: /[ ]{0,3}(?:[+\-\*]|\d+\.)[ \t]+[^\n]*(?:\n[ \t]*[^\n\t ]+[ \t]*)*(?:\n|$)/,
  quote: /[ ]{0,3}>[^\n]*(?:\n|$)/,
  paragraph: /[\s\S]*?(?:\n|$)/
}).addInlineRules({
  latex: /\$\$(?:[\s\S]*?[^\\])?\$\$/,
  link: /\[.+?\][\(\[].*?[\)\]]/,
  bold: /(?:\s|^)__[\s\S]*?\S__|\*\*[\s\S]*?\S\*\*/,
  italic: /(?:\s|^)_[\s\S]*?[^\\\s]_|\*[^\\\s]\*|\*\S[\s\S]*?[^\\\s]\*/,
  strike: /~~.+?~~/,
  sup: /\^.+?\^/,
  sub: /~.+?~/,
  code: /``.+?``|`.*?[^`\\]`(?!`)/
}).addSubRules({
  fence: null,
  rule: null,
  latexBlock: {
    comment: /%[^\n]*?(?=\$\$)|%[^\n]*/,
    reference: /[ \t]*\([ \t]*\S+[ \t]*\)[ \t\n]*$/,
    index: /(?:\^|_)(?:\\[a-zA-Zа-яА-я]+[\*]?(?:\{.*?\})|\{[a-zA-Zа-яА-я0-9]*?\}|[a-zA-Zа-яА-я0-9])/,
    bracket: /(?:(?:\\left|\\right)?[\{\}\[\]\(\)\|])/,
    keyword: /\\[a-zA-Zа-яА-я]+[\*]?/,
    keyword2: /\\[^a-zA-Zа-яА-я0-9]/,
    keyword3: /&/,
    delimeter: /\$\$/
  }
}).addRunIn({
  paragraph: {
    allowedBlocks: ['paragraph', 'quote', 'list']
  }
}).addMarkers({
  list: /^([ ]{0,3}(?:[+\-\*]|\d+\.)[ \t]+)([\s\S]*)$/,
  quote: /^([ ]{0,3}(?:>[ \t]*)+)([\s\S]*)$/
});
;
'use strict';
/**
 * DOMContentLoaded polyfill
 *
 * @param fn
 */


function documentReady(fn) {
  if (document.readyState != 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}
/**
 * Find the index of a maximum value in values array
 * which is less than maxValue.
 *
 * @param maxValue
 * @param values
 *
 * @returns {object}
 */


function findBisect(maxValue, values) {
  var a = 0,
      b = values.length - 1,
      f_a = values[a];

  if (f_a >= maxValue) {
    return {
      val: a,
      part: 0
    };
  }

  var f_b = values[b];

  if (f_b < maxValue) {
    return {
      val: b,
      part: 0
    };
  }

  while (b - a > 1) {
    var c = a + Math.round((b - a) / 2),
        f_c = values[c];

    if (f_c >= maxValue) {
      b = c;
      f_b = f_c;
    } else {
      a = c;
      f_a = f_c;
    }
  }

  return {
    val: a,
    part: (maxValue - f_a) / (f_b - f_a)
  };
}
/**
 * Count the number of occurances of a substring in a string
 *
 * @param substr
 * @param str
 * @returns {number}
 */


function substrCount(substr, str) {
  var count = -1,
      index = -2;

  while (index != -1) {
    count++;
    index = str.indexOf(substr, index + 1);
  }

  return count;
}
/**
 * Selects the content of the given DOM node.
 *
 * @param eNode
 */


function selectText(eNode) {
  if (!window.getSelection) {
    return;
  }

  var selection = window.getSelection(),
      range = document.createRange();
  range.selectNodeContents(eNode);
  selection.removeAllRanges();
  selection.addRange(range);
}
/**
 * Realistic animation module based on one-dimensional physical model.
 *
 * @param positionGetter
 * @param positionSetter
 * @constructor
 */


function Animator(positionGetter, positionSetter) {
  var x = 0,
      x1 = 0,
      x2 = 0,
      v = 0,
      animationTime = 200,
      timerId,
      startedAt = null;

  var loop = function loop(timestamp) {
    if (startedAt === null) {
      startedAt = timestamp;
    }

    var moveTime = timestamp - startedAt;

    if (moveTime < moveDuration) {
      // New position and velocity
      x = x2 + A * (Math.cos(omega * (moveTime - moveDuration)) - 1);
      v = A * omega * Math.sin(omega * (moveDuration - moveTime));
      positionSetter(x);
      timerId = requestAnimationFrame(loop);

      if (isReInit) {
        /**
         * If the position has been forced, we run the animation again.
         */
        initMotion(reInitPosition, x);
        isReInit = false;
        startedAt = timestamp;
      }
    } else {
      // Stop the animation
      startedAt = null;
      v = 0;
      positionSetter(x2);
      cancelAnimationFrame(timerId);

      if (isReInit) {
        isReInit = false;
      }
    }
  };
  /**
   * The moveDuration of animation. It can be less than animationTime in case of high speed.
   */


  var moveDuration;
  /**
   * Motion parameters. See the loop formulas.
   */

  var A, omega;
  /**
   * Flag fired when the final position has been changed during running amination.
   */

  var isReInit = false;
  /**
   * New value for final position (that has been changed during running amination).
   */

  var reInitPosition;
  /**
   * Calculate parameters A and omega for the position given by formula
   *
   * x(t) = x0 + A * (Math.cos(omega * (t - t0)) - 1);
   *
   * @param newPosition
   * @param oldPosition
   */

  function initMotion(newPosition, oldPosition) {
    var k;
    x2 = newPosition;
    x1 = oldPosition;

    if (Math.abs(v) < 0.00001) {
      // Rest
      k = Math.PI;
      moveDuration = animationTime;
    } else {
      // Motion
      var alpha = (x2 - x1) / v / animationTime; // Motion parameter

      /**
       * Instead of solving non-linear equation alpha * k = tan(k/2)
       * we use approximation 0.5/a = 1 - (k/pi)^2
       */

      if (alpha < 0 || alpha > 0.5) {
        k = Math.PI * Math.sqrt(1 - 0.5 / alpha);
      } else {
        k = 0.1;
      }
      /**
       * After approximate value of k is determined, we redefine alpha
       * since its value affects the animation. It means that the total
       * animation duration (moveDuration) differs from animationTime.
       * However, the difference does not impact the user experience.
       */


      var alpha1 = (1 - Math.cos(k)) / k / Math.sin(k);
      moveDuration = (x2 - x1) / alpha1 / v;
    }

    omega = k / moveDuration;
    A = (x2 - x1) / (1 - Math.cos(k));
  }
  /**
   * Public control method
   *
   * @param nextPos
   */


  this.setPos = function (nextPos) {
    isReInit = startedAt !== null;

    if (!isReInit) {
      x = positionGetter();
      initMotion(nextPos, x);
      timerId = requestAnimationFrame(loop);
    } else {
      reInitPosition = nextPos;
    }
  };

  this.stop = function () {
    startedAt = null;
    v = 0;
    cancelAnimationFrame(timerId);
    isReInit = false;
  };
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}
/**
 * See http://stackoverflow.com/questions/1144783/replacing-all-occurrences-of-a-string-in-javascript
 * @param search
 * @param replacement
 * @returns {string}
 */


String.prototype.replaceAll = function (search, replacement) {
  var target = this;
  return target.replace(new RegExp(escapeRegExp(search), 'g'), replacement);
};
/**
 *
 * @constructor
 */


function ImagePreloader() {
  var data = {},
      uniqueIndex = 0;

  function ajaxReady() {
    var svg;

    if (this.status >= 200 && this.status < 400) {
      svg = this.responseText;
    } else {
      // We reached our target server, but it returned an error
      svg = '<svg height="24" version="1.1" width="24" xmlns="http://www.w3.org/2000/svg">' + '<g transform="translate(0 -1028.4)">' + '<path d="m22 12c0 5.523-4.477 10-10 10-5.5228 0-10-4.477-10-10 0-5.5228 4.4772-10 10-10 5.523 0 10 4.4772 10 10z" fill="#742600" transform="translate(0 1029.4)"/>' + '<path d="m22 12c0 5.523-4.477 10-10 10-5.5228 0-10-4.477-10-10 0-5.5228 4.4772-10 10-10 5.523 0 10 4.4772 10 10z" fill="#AB562B" transform="translate(0 1028.4)"/>' + '<path d="m7.0503 1037.8 3.5357 3.6-3.5357 3.5 1.4142 1.4 3.5355-3.5 3.536 3.5 1.414-1.4-3.536-3.5 3.536-3.6-1.414-1.4-3.536 3.5-3.5355-3.5-1.4142 1.4z" fill="#742600"/>' + '<path d="m7.0503 1036.8 3.5357 3.6-3.5357 3.5 1.4142 1.4 3.5355-3.5 3.536 3.5 1.414-1.4-3.536-3.5 3.536-3.6-1.414-1.4-3.536 3.5-3.5355-3.5-1.4142 1.4z" fill="#ecf0f1"/>' + '</g>' + '</svg>';
    }

    setImage(this.responseURL || this.s2Url, svg);
  }

  function loadImage(url) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.s2Url = url;
    request.onload = ajaxReady;

    request.onerror = function () {// There was a connection error of some sort
    };

    request.send();
    return request;
  }

  this.onLoad = function (url, callback) {
    if (!data[url]) {
      data[url] = {
        svg: null,
        baseline: null,
        request: loadImage(url),
        callback: callback
      };
    } else if (data[url].svg !== null) {
      callback(url, data[url].svg, data[url].baseline);
    } // In case of duplicate pictures we skip duplicates (when data[url].svg === null)

  };
  /**
   * Make ids in svg unique across the html code by adding a prefix.
   *
   * @param svg
   * @returns {*}
   */


  function makeSvgIdsUnique(svg) {
    var m = svg.match(/id=["']([^"']*)["']/g);

    if (!m) {
      return svg;
    }

    var i = m.length,
        id,
        newId,
        curStr;

    for (; i--;) {
      curStr = m[i];
      id = curStr.match(/id=["']([^"']*)["']/)[1];
      newId = 's' + uniqueIndex + id;
      svg = svg.replaceAll(curStr, 'id="' + newId + '"').replaceAll('#' + id, '#' + newId);
    }

    uniqueIndex++;
    return svg;
  }
  /**
   * Stores sizes, source and removes the xhr object.
   * @param url
   * @param svg
   */


  var setImage = function setImage(url, svg) {
    var urlData = data[url];

    if (!urlData) {
      return;
    }

    svg = makeSvgIdsUnique(svg);
    var m = svg.match(/postMessage\((?:&quot;|")([\d\|\.\-eE]*)(?:&quot;|")/); // ["&quot;2.15299|31.42377|11.65223|&quot;", "2.15299|31.42377|11.65223|"]

    if (m) {
      var baselineShift = m && m[1] ? m[1].split('|').shift() : 0; // 2.15299
    } else {
      // svg can be empty like "<svg xmlns="http://www.w3.org/2000/svg"/>"
      // Mark as something is wrong.
      baselineShift = null;
    }

    urlData.callback(url, svg, baselineShift);
    urlData.svg = svg;
    urlData.baseline = baselineShift;
    urlData.request = null;
    urlData.callback = null;
  };
  /**
   * External API
   *
   * @param url
   * @returns {null}
   */


  this.getImageDataFromUrl = function (url) {
    var urlData = data[url];
    return urlData ? urlData : null;
  };
}
/**
 *
 * @param preloader
 * @param protocol  Needed for support the "file:" protocol.
 * @constructor
 */


function ImageLoader(preloader, protocol) {
  var curItems = [],
      // current formula content
  prevItems = [],
      // previous formula content
  map = {},
      // maps formula content to index
  n = 0,
      // current formula number
  placeholderTimer = null,
      placeholderIndex = null,
      placeholderUrl = null;
  /**
   * Find if user has edited only one formula formula.
   */

  function detectPlaceholderFormula() {
    if (n == prevItems.length) {
      var editNum = 0,
          index,
          i = n;

      for (; i--;) {
        if (curItems[i] != prevItems[i]) {
          editNum++;
          index = i;
        }
      }

      if (editNum == 1) {
        if (placeholderIndex === null) {
          // A formula has been changed.
          // Use previous one as a placeholder.
          placeholderIndex = index;
          placeholderUrl = prevItems[index];
          return;
        }

        if (placeholderIndex === index) {
          // Formula has been changed again since previous change,
          // but the previous image has not been loaded yet.
          // Keep previous placeholder.
          return;
        }
      }
    } // Many formulas has been changed. We do not display any placeholders.


    placeholderIndex = null;
    placeholderUrl = null;
  }

  function buildMap() {
    map = {};

    for (var i = n; i--;) {
      var url = curItems[i];

      if (typeof map[url] === 'undefined') {
        map[url] = [i];
      } else {
        map[url].push(i);
      }
    }
  }
  /**
   * Start parsing process.
   */


  this.reset = function () {
    curItems = [];
    n = 0;
  };
  /**
   * Insert SVG images.
   *
   * @param url
   * @param svg
   * @param baselineShift
   */


  var callback = function callback(url, svg, baselineShift) {
    var indexes = map[url],
        i;

    if (indexes && (i = indexes.length)) {
      for (; i--;) {
        var index = indexes[i];
        insertPicture(index, svg, baselineShift, index === placeholderIndex ? 'fade-in' : 'replace');

        if (index === placeholderIndex) {
          // Clear the fade out timer if the new image has just bee
          clearTimeout(placeholderTimer);
          placeholderIndex = null;
          placeholderUrl = null;
        }
      }
    }
  };
  /**
   * Mark formula as loading.
   * Use previous image but transparent.
   *
   * @param index
   * @param svg
   * @param baselineShift
   * @param mode One of 'replace', 'fade-in', 'fade-out'
   */


  function insertPicture(index, svg, baselineShift, mode) {
    var id = 's2tex_' + index,
        oldSvgNode = document.getElementById(id),
        parentNode = oldSvgNode.parentNode,
        startOpacity = '1',
        // mode == 'fade-in' ? '0.5' : '1', // sometimes images opacity can be '1' yet. How can one track it?
    finalOpacity = mode == 'fade-out' ? '0.5' : '1',
        newSvgAttrs = '<svg class="svg-preview" id="' + id + '" ';

    if (baselineShift === null) {
      // svg has been loaded but something went wrong.
      newSvgAttrs += 'width="13px" height="13px" ';
    } else {
      newSvgAttrs += 'style="vertical-align:' + -baselineShift + 'pt; opacity: ' + startOpacity + '" ';
    } // Polyfill for outerHTML


    var divNode = document.createElement('div');
    divNode.innerHTML = svg.replace('<svg ', newSvgAttrs);
    var newSvgNode = divNode.firstElementChild; // there can be comments before <svg>

    divNode.removeChild(newSvgNode);
    parentNode.insertBefore(newSvgNode, oldSvgNode);
    parentNode.removeChild(oldSvgNode);

    if (finalOpacity != startOpacity) {
      placeholderTimer = setTimeout(function () {
        document.getElementById(id).style.opacity = finalOpacity;
      }, 0);
    }
  }
  /**
   * Finish the parsing process.
   */


  this.fixDom = function () {
    detectPlaceholderFormula();
    buildMap();

    for (var i = n; i--;) {
      preloader.onLoad(curItems[i], callback);
    }

    if (placeholderIndex !== null) {
      var data = preloader.getImageDataFromUrl(placeholderUrl);

      if (data !== null && data.callback === null) {
        insertPicture(placeholderIndex, data.svg, data.baseline, 'fade-out');
      }
    }

    prevItems = curItems.slice(0);
  };
}
/**
 * Access to the map between blocks in sync scroll.
 *
 * @param mapBuilder
 * @constructor
 */


function ScrollMap(mapBuilder) {
  var map = null;

  this.reset = function () {
    map = [null, null];
  };

  this.getPosition = function (eBlockNode, fromIndex, toIndex) {
    var offsetHeight = eBlockNode.offsetHeight;
    var scrollTop = eBlockNode.scrollTop;

    if (scrollTop == 0) {
      return 0;
    }

    if (map[fromIndex] === null) {
      map = mapBuilder();
    }

    var maxMapIndex = map[fromIndex].length - 1;

    if (map[fromIndex][maxMapIndex] <= scrollTop + offsetHeight) {
      return map[toIndex][maxMapIndex] - offsetHeight;
    }

    var scrollShift = offsetHeight / 2,
        scrollLevel = scrollTop + scrollShift,
        blockIndex = findBisect(scrollLevel, map[fromIndex]),
        srcScrollLevel = parseFloat(map[toIndex][blockIndex.val] * (1 - blockIndex.part));

    if (map[toIndex][blockIndex.val + 1]) {
      srcScrollLevel += parseFloat(map[toIndex][blockIndex.val + 1] * blockIndex.part);
    }

    return srcScrollLevel - scrollShift;
  };
}
/**
 * Controls sync scroll of the source and preview blocks
 *
 * @param scrollMap
 * @param animatorSrc
 * @param animatorResult
 * @param eSrc
 * @param eResult
 * @param eContainer
 * @constructor
 */


function SyncScroll(scrollMap, animatorSrc, animatorResult, eSrc, eResult, eContainer) {
  // Synchronize scroll position from source to result
  var syncResultScroll = function syncResultScroll() {
    animatorResult.setPos(scrollMap.getPosition(eSrc, 0, 1));
  }; // Synchronize scroll position from result to source


  var syncSrcScroll = function syncSrcScroll() {
    animatorSrc.setPos(scrollMap.getPosition(eResult, 1, 0));
  };

  this.switchScrollToSrc = function () {
    eResult.removeEventListener('scroll', syncSrcScroll);
    eSrc.removeEventListener('scroll', syncResultScroll);
    eSrc.addEventListener('scroll', syncResultScroll);
    eContainer.id = 'container-block-source'; // animatorSrc.stop();
  };

  this.switchScrollToResult = function () {
    eSrc.removeEventListener('scroll', syncResultScroll);
    eResult.removeEventListener('scroll', syncSrcScroll);
    eResult.addEventListener('scroll', syncSrcScroll);
    eContainer.id = 'container-block-result'; // animatorResult.stop();
  };
}
/**
 * Functions from lodash.js
 * @see https://github.com/lodash/lodash/
 */


var now = Date.now || function () {
  return new Date().getTime();
};

function debounce(func, wait, options) {
  var args,
      maxTimeoutId,
      result,
      stamp,
      thisArg,
      timeoutId,
      trailingCall,
      lastCalled = 0,
      leading = false,
      maxWait = false,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }

  wait = wait < 0 ? 0 : +wait || 0;

  if (_typeof(options) === 'object') {
    leading = !!options.leading;
    maxWait = 'maxWait' in options && Math.max(+options.maxWait || 0, wait);
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  function cancel() {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (maxTimeoutId) {
      clearTimeout(maxTimeoutId);
    }

    lastCalled = 0;
    maxTimeoutId = timeoutId = trailingCall = undefined;
  }

  function complete(isCalled, id) {
    if (id) {
      clearTimeout(id);
    }

    maxTimeoutId = timeoutId = trailingCall = undefined;

    if (isCalled) {
      lastCalled = now();
      result = func.apply(thisArg, args);

      if (!timeoutId && !maxTimeoutId) {
        args = thisArg = undefined;
      }
    }
  }

  function delayed() {
    var remaining = wait - (now() - stamp);

    if (remaining <= 0 || remaining > wait) {
      complete(trailingCall, maxTimeoutId);
    } else {
      timeoutId = setTimeout(delayed, remaining);
    }
  }

  function maxDelayed() {
    complete(trailing, timeoutId);
  }

  function debounced() {
    args = arguments;
    stamp = now();
    thisArg = this;
    trailingCall = trailing && (timeoutId || !leading);

    if (maxWait === false) {
      var leadingCall = leading && !timeoutId;
    } else {
      if (!maxTimeoutId && !leading) {
        lastCalled = stamp;
      }

      var remaining = maxWait - (stamp - lastCalled),
          isCalled = remaining <= 0 || remaining > maxWait;

      if (isCalled) {
        if (maxTimeoutId) {
          maxTimeoutId = clearTimeout(maxTimeoutId);
        }

        lastCalled = stamp;
        result = func.apply(thisArg, args);
      } else if (!maxTimeoutId) {
        maxTimeoutId = setTimeout(maxDelayed, remaining);
      }
    }

    if (isCalled && timeoutId) {
      timeoutId = clearTimeout(timeoutId);
    } else if (!timeoutId && wait !== maxWait) {
      timeoutId = setTimeout(delayed, wait);
    }

    if (leadingCall) {
      isCalled = true;
      result = func.apply(thisArg, args);
    }

    if (isCalled && !timeoutId && !maxTimeoutId) {
      args = thisArg = undefined;
    }

    return result;
  }

  debounced.cancel = cancel;
  return debounced;
}

;
/**
* TextareaDecorator.js
* written by Colin Kuebler 2012
* Updated by Roman Parpalak, 2015.
* Part of LDT, dual licensed under GPLv3 and MIT
* Builds and maintains a styled output layer under a textarea input layer
*/

function TextareaDecorator(textarea, parser) {
  /* INIT */
  var api = this,
      output;

  if (textarea.className !== 'ldt-textarea') {
    // construct editor DOM
    var parent = document.createElement("div");
    output = document.createElement("pre");
    output.className = 'ldt-pre';
    parent.appendChild(output);
    var label = document.createElement("label");
    label.className = 'ldt-label';
    parent.appendChild(label); // replace the textarea with RTA DOM and reattach on label

    textarea.parentNode.replaceChild(parent, textarea);
    label.appendChild(textarea); // transfer the CSS styles to our editor

    parent.className = 'ldt ' + textarea.className;
    textarea.className = 'ldt-textarea';
  } else {
    output = textarea.parentNode.previousSibling;
  }
  /**
   * Composes token class.
   *
   * Tokens are grouped into blocks.
   * Also a token have its own type.
   *
   * @param blockClass  token block type
   * @param inlineClass token type
   * @returns {string}
   */


  function getClass(blockClass, inlineClass) {
    return blockClass + ' ' + inlineClass;
  }
  /**
   * Detect changes between a token and its DOM representation.
   *
   * @param newToken hash object
   * @param oldNode  DOM node converted from old hash object
   *
   * @returns {boolean}
   */


  function compareTokens(newToken, oldNode) {
    if (newToken.token !== oldNode.textContent) {
      return false;
    }

    var className = oldNode.className,
        oldBlock = className.slice(0, className.indexOf(' '));

    if (oldBlock !== newToken.block) {
      return false;
    }

    var line = oldNode.getAttribute('data-line');

    if (line && line != newToken.line) {
      return false;
    }

    return true;
  }
  /**
   * Updates a DOM node by a token
   *
   * @param node
   * @param token
   * @param inlineClass
   */


  function fillTokenNode(node, token, inlineClass) {
    node.textContent = node.innerText = token.token;
    var c = getClass(token.block, inlineClass);

    if (token.line) {
      node.className = c + ' block-start';
      node.setAttribute('data-line', token.line);
    } else {
      node.className = c;
    }
  } // coloring algorithm


  var color = function color(input, output, parser) {
    var lastChar = input !== '' && input.substring(input.length - 1) || '';

    if (lastChar == "\r" || lastChar == "\n") {
      // Hack for the case when the last line in textarea is empty
      input += ' ';
    }

    var nodes = output.childNodes,
        tokens = parser.tokenize(input),
        firstDiff,
        lastDiffNew,
        lastDiffOld; // find the first difference

    for (firstDiff = 0; firstDiff < tokens.length && firstDiff < nodes.length; firstDiff++) {
      if (!compareTokens(tokens[firstDiff], nodes[firstDiff])) {
        break;
      }
    } // trim the length of output nodes to the size of the input


    while (tokens.length < nodes.length) {
      output.removeChild(nodes[firstDiff]);
    } // find the last difference


    for (lastDiffNew = tokens.length - 1, lastDiffOld = nodes.length - 1; firstDiff < lastDiffOld; lastDiffNew--, lastDiffOld--) {
      if (!compareTokens(tokens[lastDiffNew], nodes[lastDiffOld])) {
        break;
      }
    } // update modified nodes


    for (; firstDiff <= lastDiffOld; firstDiff++) {
      var token = tokens[firstDiff];
      fillTokenNode(nodes[firstDiff], token, parser.identifyInline(token));
    } // add in modified nodes


    for (var insertionPt = nodes[firstDiff] || null; firstDiff <= lastDiffNew; firstDiff++) {
      var span = document.createElement("span");
      token = tokens[firstDiff];
      fillTokenNode(span, token, parser.identifyInline(token));
      output.insertBefore(span, insertionPt);
    }
  };

  api.input = textarea;
  api.output = output;

  api.recalcHeight = function () {
    api.input.style.height = Math.max(api.output.offsetHeight, 100) + 'px';
  };

  api.update = function () {
    var input = textarea.value;

    if (input) {
      color(input, output, parser);
    } else {
      // clear the display
      output.innerHTML = '';
    }

    api.recalcHeight();
  }; // detect all changes to the textarea,
  // including keyboard input, cut/copy/paste, drag & drop, etc


  if (textarea.addEventListener) {
    // standards browsers: oninput event
    textarea.addEventListener("input", api.update, false);
  } else {
    // MSIE: detect changes to the 'value' property
    textarea.attachEvent("onpropertychange", function (e) {
      if (e.propertyName.toLowerCase() === 'value') {
        api.update();
      }
    });
  } // initial highlighting


  api.update();
  return api;
}
/* FileSaver.js
 * A saveAs() FileSaver implementation.
 * 2015-05-07.2
 *
 * By Eli Grey, http://eligrey.com
 * License: X11/MIT
 *   See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
 */

/*global self */

/*jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */


var saveAs = saveAs || function (view) {
  "use strict"; // IE <10 is explicitly unsupported

  if (typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
    return;
  }

  var doc = view.document // only get URL when necessary in case Blob.js hasn't overridden it yet
  ,
      get_URL = function get_URL() {
    return view.URL || view.webkitURL || view;
  },
      save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a"),
      can_use_save_link = "download" in save_link,
      click = function click(node) {
    var event = doc.createEvent("MouseEvents");
    event.initMouseEvent("click", true, false, view, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    node.dispatchEvent(event);
  },
      webkit_req_fs = view.webkitRequestFileSystem,
      req_fs = view.requestFileSystem || webkit_req_fs || view.mozRequestFileSystem,
      throw_outside = function throw_outside(ex) {
    (view.setImmediate || view.setTimeout)(function () {
      throw ex;
    }, 0);
  },
      force_saveable_type = "application/octet-stream",
      fs_min_size = 0 // See https://code.google.com/p/chromium/issues/detail?id=375297#c7 and
  // https://github.com/eligrey/FileSaver.js/commit/485930a#commitcomment-8768047
  // for the reasoning behind the timeout and revocation flow
  ,
      arbitrary_revoke_timeout = 500 // in ms
  ,
      revoke = function revoke(file) {
    var revoker = function revoker() {
      if (typeof file === "string") {
        // file is an object URL
        get_URL().revokeObjectURL(file);
      } else {
        // file is a File
        file.remove();
      }
    };

    if (view.chrome) {
      revoker();
    } else {
      setTimeout(revoker, arbitrary_revoke_timeout);
    }
  },
      dispatch = function dispatch(filesaver, event_types, event) {
    event_types = [].concat(event_types);
    var i = event_types.length;

    while (i--) {
      var listener = filesaver["on" + event_types[i]];

      if (typeof listener === "function") {
        try {
          listener.call(filesaver, event || filesaver);
        } catch (ex) {
          throw_outside(ex);
        }
      }
    }
  },
      auto_bom = function auto_bom(blob) {
    // prepend BOM for UTF-8 XML and text/* types (including HTML)
    if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
      return new Blob(["\uFEFF", blob], {
        type: blob.type
      });
    }

    return blob;
  },
      FileSaver = function FileSaver(blob, name) {
    blob = auto_bom(blob); // First try a.download, then web filesystem, then object URLs

    var filesaver = this,
        type = blob.type,
        blob_changed = false,
        object_url,
        target_view,
        dispatch_all = function dispatch_all() {
      dispatch(filesaver, "writestart progress write writeend".split(" "));
    } // on any filesys errors revert to saving with object URLs
    ,
        fs_error = function fs_error() {
      // don't create more object URLs than needed
      if (blob_changed || !object_url) {
        object_url = get_URL().createObjectURL(blob);
      }

      if (target_view) {
        target_view.location.href = object_url;
      } else {
        var new_tab = view.open(object_url, "_blank");

        if (new_tab == undefined && typeof safari !== "undefined") {
          //Apple do not allow window.open, see http://bit.ly/1kZffRI
          view.location.href = object_url;
        }
      }

      filesaver.readyState = filesaver.DONE;
      dispatch_all();
      revoke(object_url);
    },
        abortable = function abortable(func) {
      return function () {
        if (filesaver.readyState !== filesaver.DONE) {
          return func.apply(this, arguments);
        }
      };
    },
        create_if_not_found = {
      create: true,
      exclusive: false
    },
        slice;

    filesaver.readyState = filesaver.INIT;

    if (!name) {
      name = "download";
    }

    if (can_use_save_link) {
      object_url = get_URL().createObjectURL(blob);
      save_link.href = object_url;
      save_link.download = name;
      click(save_link);
      filesaver.readyState = filesaver.DONE;
      dispatch_all();
      revoke(object_url);
      return;
    } // Object and web filesystem URLs have a problem saving in Google Chrome when
    // viewed in a tab, so I force save with application/octet-stream
    // http://code.google.com/p/chromium/issues/detail?id=91158
    // Update: Google errantly closed 91158, I submitted it again:
    // https://code.google.com/p/chromium/issues/detail?id=389642


    if (view.chrome && type && type !== force_saveable_type) {
      slice = blob.slice || blob.webkitSlice;
      blob = slice.call(blob, 0, blob.size, force_saveable_type);
      blob_changed = true;
    } // Since I can't be sure that the guessed media type will trigger a download
    // in WebKit, I append .download to the filename.
    // https://bugs.webkit.org/show_bug.cgi?id=65440


    if (webkit_req_fs && name !== "download") {
      name += ".download";
    }

    if (type === force_saveable_type || webkit_req_fs) {
      target_view = view;
    }

    if (!req_fs) {
      fs_error();
      return;
    }

    fs_min_size += blob.size;
    req_fs(view.TEMPORARY, fs_min_size, abortable(function (fs) {
      fs.root.getDirectory("saved", create_if_not_found, abortable(function (dir) {
        var save = function save() {
          dir.getFile(name, create_if_not_found, abortable(function (file) {
            file.createWriter(abortable(function (writer) {
              writer.onwriteend = function (event) {
                target_view.location.href = file.toURL();
                filesaver.readyState = filesaver.DONE;
                dispatch(filesaver, "writeend", event);
                revoke(file);
              };

              writer.onerror = function () {
                var error = writer.error;

                if (error.code !== error.ABORT_ERR) {
                  fs_error();
                }
              };

              "writestart progress write abort".split(" ").forEach(function (event) {
                writer["on" + event] = filesaver["on" + event];
              });
              writer.write(blob);

              filesaver.abort = function () {
                writer.abort();
                filesaver.readyState = filesaver.DONE;
              };

              filesaver.readyState = filesaver.WRITING;
            }), fs_error);
          }), fs_error);
        };

        dir.getFile(name, {
          create: false
        }, abortable(function (file) {
          // delete file if it already exists
          file.remove();
          save();
        }), abortable(function (ex) {
          if (ex.code === ex.NOT_FOUND_ERR) {
            save();
          } else {
            fs_error();
          }
        }));
      }), fs_error);
    }), fs_error);
  },
      FS_proto = FileSaver.prototype,
      saveAs = function saveAs(blob, name) {
    return new FileSaver(blob, name);
  }; // IE 10+ (native saveAs)


  if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
    return function (blob, name) {
      return navigator.msSaveOrOpenBlob(auto_bom(blob), name);
    };
  }

  FS_proto.abort = function () {
    var filesaver = this;
    filesaver.readyState = filesaver.DONE;
    dispatch(filesaver, "abort");
  };

  FS_proto.readyState = FS_proto.INIT = 0;
  FS_proto.WRITING = 1;
  FS_proto.DONE = 2;
  FS_proto.error = FS_proto.onwritestart = FS_proto.onprogress = FS_proto.onwrite = FS_proto.onabort = FS_proto.onerror = FS_proto.onwriteend = null;
  return saveAs;
}(typeof self !== "undefined" && self || typeof window !== "undefined" && window || (void 0).content); // `self` is undefined in Firefox for Android content script context
// while `this` is nsIContentFrameMessageManager
// with an attribute `content` that corresponds to the window


if (typeof module !== "undefined" && module.exports) {
  module.exports.saveAs = saveAs;
} else if (typeof define !== "undefined" && define !== null && define.amd != null) {
  define([], function () {
    return saveAs;
  });
}

},{}]},{},[1]);
