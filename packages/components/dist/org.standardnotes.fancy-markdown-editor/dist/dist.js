
(function (document, window) {
	'use strict';

	var defaults = {
		html:        true,         
		xhtmlOut:    false,        
		breaks:      false,        
		langPrefix:  'language-',  
		linkify:     true,         
		typographer: true,         
		quotes:      '""\'\'',
		_habr: {protocol: ''},    
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
		function injectLineNumbersAndCentering(tokens, idx, options, env, self) {
			var line;
			if (tokens[idx].map && tokens[idx].level === 0) {
				line = tokens[idx].map[0];
				tokens[idx].attrPush(['class', 'line']);
				tokens[idx].attrPush(['data-line', line + '']);
			}
			if (hasBlockFormula(tokens, idx + 1)) {
				tokens[idx].attrPush(['align', 'center']);
				tokens[idx].attrPush(['style', 'text-align: center;']);
			}

			return self.renderToken(tokens, idx, options, env, self);
		}
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
			return prefix; 
		}

		function habrParagraphClose(tokens, idx, options, env, self) {
			var prefix = "\n";
			return prefix; 
		}

		function injectCentering(tokens, idx, options, env, self) {
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
		_mdMdAndImages.inline.ruler.before('backticks', 'backticks2', function (state, silent) {
			var start, max, marker, matchStart, matchEnd, token,
				pos = state.pos,
				ch = state.src.charCodeAt(pos);
			if (ch !== 0x60) { return false; }

			start = pos;
			pos++;
			max = state.posMax;

			while (pos < max && state.src.charCodeAt(pos) === 0x60) { pos++; }

			marker = state.src.slice(start, pos);

			matchStart = matchEnd = pos;

			while ((matchStart = state.src.indexOf('`', matchEnd)) !== -1) {
				matchEnd = matchStart + 1;

				while (matchEnd < max && state.src.charCodeAt(matchEnd) === 0x60) { matchEnd++; }

				if (matchEnd - matchStart === marker.length) {
					if (!silent) {
						token         = state.push('backticks2_inline', 'code', 0); 
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

		_mdMdAndImages.renderer.rules.backticks2_inline = function (tokens, idx ) {
			var token = tokens[idx];
			return token.markup + token.content + token.markup;
		};
		_mdMdAndImages.renderer.rules.text = function (tokens, idx ) {
			return tokens[idx].content;
		};
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
			_view      = 'html'; 

		this.updateResult = function () {
			var source = sourceGetter();
			if (_oldSource === source) {
				return;
			}

			_oldSource = source;
			imageLoader.reset();
			domSetPreviewHTML(_mdPreview.render(source));
			imageLoader.fixDom();
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
			else { 
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
				if (typeof resElementHeight[line] !== 'undefined') {
					mapSrc.push(srcElements[i].offsetTop);
					mapResult.push(resElementHeight[line]);
				}
			}
		}

		var srcScrollHeight = document.querySelector('.ldt-pre').scrollHeight,
			lastSrcElemPos  = mapSrc[mapSrc.length - 1],
			allowedHeight   = 5; 

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
				scrollMap.reset();
			}
		);

		parserCollection.updateResult();
		var decorator = new TextareaDecorator(eTextarea, mdParser);
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
		var updateText = parserCollection.updateResult;

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
					var contentBlocks = document.getElementsByClassName('result-src-content');
					if (contentBlocks.length) {
						setTimeout(function () {
							selectText(contentBlocks[0]);
						}, 0);
					}
				}
			})
		});

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
			(eNode.onclick || eNode.click || function () {}).call(eNode);
		});

		document.getElementById('fileElem').addEventListener('change', function () {
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
		lastChar = start > 0 ? state.src.charCodeAt(start - 1) : 0x20;
		if (pos >= max) {
			can_open = false;
		}
		count = pos - start;
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
			}    

			res = scanDelims(state, start + open.length);
			startCount = res.delims;

			if (!res.can_open) {
				state.pos += startCount;
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
				state.pos = start;
				return false;
			}
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
			token = state.push('math_inline', tag, 0);
			token.content = state.src.slice(state.pos, state.posMax);
			token.markup = open;

			state.pos = m ? max : state.posMax + close.length;
			state.posMax = max;

			return true;
		};
	}

	w.markdownitS2Tex = function math_plugin(md, options) {
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
	var api = this;
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
		if (typeof markers[className] !== 'undefined') {
			var matches = block.match(markers[className]);
			if (matches[2]) {
				result.push({
					token: matches[1],
					block: className + '-mark',
					line:  lineNum
				});
				block = matches[2];
				lineNum = 0; 
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
				lineNum = 0; 
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
					lineNum = lineBreakCnt;
					lineBreakCnt = 0; 
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
function documentReady(fn) {
	if (document.readyState != 'loading') {
		fn();
	}
	else {
		document.addEventListener('DOMContentLoaded', fn);
	}
}
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
function substrCount(substr, str) {
	var count = -1,
		index = -2;

	while (index != -1) {
		count++;
		index = str.indexOf(substr, index + 1)
	}

	return count;
}
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
			x = x2 + A * (Math.cos(omega * (moveTime - moveDuration)) - 1);
			v = A * omega * (Math.sin(omega * (moveDuration - moveTime)));

			positionSetter(x);

			timerId = requestAnimationFrame(loop);

			if (isReInit) {
				initMotion(reInitPosition, x);
				isReInit = false;
				startedAt = timestamp;
			}
		}
		else {
			startedAt = null;

			v = 0;
			positionSetter(x2);
			cancelAnimationFrame(timerId);

			if (isReInit) {
				isReInit = false;
			}
		}
	};
	var moveDuration;
	var A, omega;
	var isReInit = false;
	var reInitPosition;
	function initMotion(newPosition, oldPosition) {
		var k;
		x2 = newPosition;
		x1 = oldPosition;

		if (Math.abs(v) < 0.00001) {
			k = Math.PI;
			moveDuration = animationTime;
		}
		else {

			var alpha = (x2 - x1) / v / animationTime; 
			if (alpha < 0 || alpha > 0.5) {
				k = Math.PI * Math.sqrt(1 - 0.5 / alpha);
			}
			else {
				k = 0.1;
			}
			var alpha1 = (1 - Math.cos(k)) / k / Math.sin(k);
			moveDuration = (x2 - x1) / alpha1 / v;
		}

		omega = k / moveDuration;
		A = (x2 - x1) / (1 - Math.cos(k));
	}
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
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); 
}
String.prototype.replaceAll = function (search, replacement) {
	var target = this;
	return target.replace(new RegExp(escapeRegExp(search), 'g'), replacement);
};
function ImagePreloader() {
	var data = {},
		uniqueIndex = 0;

	function ajaxReady() {
		var svg;

		if (this.status >= 200 && this.status < 400) {
			svg = this.responseText;
		}
		else {
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
	};
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
	var setImage = function (url, svg) {
		var urlData = data[url];
		if (!urlData) {
			return;
		}

		svg = makeSvgIdsUnique(svg);

		var m = svg.match(/postMessage\((?:&quot;|")([\d\|\.\-eE]*)(?:&quot;|")/); 
		if (m) {
			var baselineShift = m && m[1] ? m[1].split('|').shift() : 0; 
		}
		else {
			baselineShift = null;
		}

		urlData.callback(url, svg, baselineShift);

		urlData.svg = svg;
		urlData.baseline = baselineShift;
		urlData.request = null;
		urlData.callback = null;
	};
	this.getImageDataFromUrl = function (url) {
		var urlData = data[url];
		return urlData ? urlData : null;
	};
}
function ImageLoader(preloader, protocol) {
	var curItems = [],  
		prevItems = [], 
		map = {},       
		n = 0,          

		placeholderTimer = null,
		placeholderIndex = null,
		placeholderUrl = null;
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
					placeholderIndex = index;
					placeholderUrl = prevItems[index];
					return;
				}
				if (placeholderIndex === index) {
					return;
				}
			}
		}
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
	this.reset = function () {
		curItems = [];
		n = 0;
	};
	var callback = function (url, svg, baselineShift) {
		var indexes = map[url], i;

		if (indexes && (i = indexes.length)) {
			for (; i--;) {
				var index = indexes[i];

				insertPicture(index, svg, baselineShift, index === placeholderIndex ? 'fade-in' : 'replace');

				if (index === placeholderIndex) {
					clearTimeout(placeholderTimer);
					placeholderIndex = null;
					placeholderUrl = null;
				}
			}
		}
	};
	function insertPicture(index, svg, baselineShift, mode) {
		var id = 's2tex_' + index,
			oldSvgNode = document.getElementById(id),
			parentNode = oldSvgNode.parentNode,
			startOpacity = '1', 
			finalOpacity = mode == 'fade-out' ? '0.5' : '1',
			newSvgAttrs = '<svg class="svg-preview" id="' + id + '" ';

		if (baselineShift === null) {
			newSvgAttrs += 'width="13px" height="13px" ';
		}
		else {
			newSvgAttrs += 'style="vertical-align:' + (-baselineShift) + 'pt; opacity: ' + startOpacity + '" ';
		}
		var divNode = document.createElement('div');
		divNode.innerHTML = svg.replace('<svg ', newSvgAttrs);

		var newSvgNode = divNode.firstElementChild; 
		divNode.removeChild(newSvgNode);

		parentNode.insertBefore(newSvgNode, oldSvgNode);
		parentNode.removeChild(oldSvgNode);

		if (finalOpacity != startOpacity) {
			placeholderTimer = setTimeout(function () {
				document.getElementById(id).style.opacity = finalOpacity;
			}, 0);
		}
	}
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
function SyncScroll(scrollMap, animatorSrc, animatorResult, eSrc, eResult, eContainer) {
	var syncResultScroll = function () {
		animatorResult.setPos(scrollMap.getPosition(eSrc, 0, 1));
	};
	var syncSrcScroll = function () {
		animatorSrc.setPos(scrollMap.getPosition(eResult, 1, 0));
	};

	this.switchScrollToSrc = function () {
		eResult.removeEventListener('scroll', syncSrcScroll);
		eSrc.removeEventListener('scroll', syncResultScroll);
		eSrc.addEventListener('scroll', syncResultScroll);
		eContainer.id = 'container-block-source';
	};

	this.switchScrollToResult = function () {
		eSrc.removeEventListener('scroll', syncResultScroll);
		eResult.removeEventListener('scroll', syncSrcScroll);
		eResult.addEventListener('scroll', syncSrcScroll);
		eContainer.id = 'container-block-result';
	}
}

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
	var api = this,
		output;

	if (textarea.className !== 'ldt-textarea') {
		var parent = document.createElement("div");
		output = document.createElement("pre");
		output.className = 'ldt-pre';
		parent.appendChild(output);

		var label = document.createElement("label");
		label.className = 'ldt-label';

		parent.appendChild(label);
		textarea.parentNode.replaceChild(parent, textarea);
		label.appendChild(textarea);
		parent.className = 'ldt ' + textarea.className;
		textarea.className = 'ldt-textarea';
	} else {
		output = textarea.parentNode.previousSibling;
	}
	function getClass(blockClass, inlineClass) {
		return blockClass + ' ' + inlineClass;
	}
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
	var color = function (input, output, parser) {
		var lastChar = input !== '' && input.substring(input.length - 1) || '';
		if (lastChar == "\r" || lastChar == "\n") {
			input += ' ';
		}

		var nodes = output.childNodes,
			tokens = parser.tokenize(input),
			firstDiff, lastDiffNew, lastDiffOld;
		for (firstDiff = 0; firstDiff < tokens.length && firstDiff < nodes.length; firstDiff++) {
			if (!compareTokens(tokens[firstDiff], nodes[firstDiff])) {
				break;
			}
		}
		while (tokens.length < nodes.length) {
			output.removeChild(nodes[firstDiff]);
		}
		for (lastDiffNew = tokens.length - 1, lastDiffOld = nodes.length - 1; firstDiff < lastDiffOld; lastDiffNew--, lastDiffOld--) {
			if (!compareTokens(tokens[lastDiffNew], nodes[lastDiffOld])) {
				break;
			}
		}
		for (; firstDiff <= lastDiffOld; firstDiff++) {
			var token = tokens[firstDiff];
			fillTokenNode(nodes[firstDiff], token, parser.identifyInline(token));
		}
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
			output.innerHTML = '';
		}
		api.recalcHeight();
	};
	if (textarea.addEventListener) {
		textarea.addEventListener("input", api.update, false);
	} else {
		textarea.attachEvent("onpropertychange",
			function (e) {
				if (e.propertyName.toLowerCase() === 'value') {
					api.update();
				}
			}
		);
	}
	api.update();

	return api;
}

var saveAs = saveAs || (function(view) {
	"use strict";
	if (typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
		return;
	}
	var
		  doc = view.document
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
		, arbitrary_revoke_timeout = 500 
		, revoke = function(file) {
			var revoker = function() {
				if (typeof file === "string") { 
					get_URL().revokeObjectURL(file);
				} else { 
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
			if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
				return new Blob(["\ufeff", blob], {type: blob.type});
			}
			return blob;
		}
		, FileSaver = function(blob, name) {
			blob = auto_bom(blob);
			var
				  filesaver = this
				, type = blob.type
				, blob_changed = false
				, object_url
				, target_view
				, dispatch_all = function() {
					dispatch(filesaver, "writestart progress write writeend".split(" "));
				}
				, fs_error = function() {
					if (blob_changed || !object_url) {
						object_url = get_URL().createObjectURL(blob);
					}
					if (target_view) {
						target_view.location.href = object_url;
					} else {
						var new_tab = view.open(object_url, "_blank");
						if (new_tab == undefined && typeof safari !== "undefined") {
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
			if (view.chrome && type && type !== force_saveable_type) {
				slice = blob.slice || blob.webkitSlice;
				blob = slice.call(blob, 0, blob.size, force_saveable_type);
				blob_changed = true;
			}
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

if (typeof module !== "undefined" && module.exports) {
  module.exports.saveAs = saveAs;
} else if ((typeof define !== "undefined" && define !== null) && (define.amd != null)) {
  define([], function() {
    return saveAs;
  });
};/*!
 * Draggabilly PACKAGED v2.4.1
 * Make that shiz draggable
 * https:
 * MIT license
 */
(function(e,i){if(typeof define=="function"&&define.amd){define("jquery-bridget/jquery-bridget",["jquery"],function(t){return i(e,t)})}else if(typeof module=="object"&&module.exports){module.exports=i(e,require("jquery"))}else{e.jQueryBridget=i(e,e.jQuery)}})(window,function t(e,r){"use strict";var s=Array.prototype.slice;var i=e.console;var f=typeof i=="undefined"?function(){}:function(t){i.error(t)};function n(h,o,d){d=d||r||e.jQuery;if(!d){return}if(!o.prototype.option){o.prototype.option=function(t){if(!d.isPlainObject(t)){return}this.options=d.extend(true,this.options,t)}}d.fn[h]=function(t){if(typeof t=="string"){var e=s.call(arguments,1);return i(this,t,e)}n(this,t);return this};function i(t,r,s){var a;var u="$()."+h+'("'+r+'")';t.each(function(t,e){var i=d.data(e,h);if(!i){f(h+" not initialized. Cannot call methods, i.e. "+u);return}var n=i[r];if(!n||r.charAt(0)=="_"){f(u+" is not a valid method");return}var o=n.apply(i,s);a=a===undefined?o:a});return a!==undefined?a:t}function n(t,n){t.each(function(t,e){var i=d.data(e,h);if(i){i.option(n);i._init()}else{i=new o(e,n);d.data(e,h,i)}})}a(d)}function a(t){if(!t||t&&t.bridget){return}t.bridget=n}a(r||e.jQuery);return n});
(function(t,e){"use strict";if(typeof define=="function"&&define.amd){define("get-size/get-size",[],function(){return e()})}else if(typeof module=="object"&&module.exports){module.exports=e()}else{t.getSize=e()}})(window,function t(){"use strict";function m(t){var e=parseFloat(t);var i=t.indexOf("%")==-1&&!isNaN(e);return i&&e}function e(){}var i=typeof console=="undefined"?e:function(t){console.error(t)};var y=["paddingLeft","paddingRight","paddingTop","paddingBottom","marginLeft","marginRight","marginTop","marginBottom","borderLeftWidth","borderRightWidth","borderTopWidth","borderBottomWidth"];var b=y.length;function E(){var t={width:0,height:0,innerWidth:0,innerHeight:0,outerWidth:0,outerHeight:0};for(var e=0;e<b;e++){var i=y[e];t[i]=0}return t}function _(t){var e=getComputedStyle(t);if(!e){i("Style returned "+e+". Are you running this code in a hidden iframe on Firefox? "+"See http://bit.ly/getsizebug1")}return e}var n=false;var x;function P(){if(n){return}n=true;var t=document.createElement("div");t.style.width="200px";t.style.padding="1px 2px 3px 4px";t.style.borderStyle="solid";t.style.borderWidth="1px 2px 3px 4px";t.style.boxSizing="border-box";var e=document.body||document.documentElement;e.appendChild(t);var i=_(t);o.isBoxSizeOuter=x=m(i.width)==200;e.removeChild(t)}function o(t){P();if(typeof t=="string"){t=document.querySelector(t)}if(!t||typeof t!="object"||!t.nodeType){return}var e=_(t);if(e.display=="none"){return E()}var i={};i.width=t.offsetWidth;i.height=t.offsetHeight;var n=i.isBorderBox=e.boxSizing=="border-box";for(var o=0;o<b;o++){var r=y[o];var s=e[r];var a=parseFloat(s);i[r]=!isNaN(a)?a:0}var u=i.paddingLeft+i.paddingRight;var h=i.paddingTop+i.paddingBottom;var d=i.marginLeft+i.marginRight;var f=i.marginTop+i.marginBottom;var p=i.borderLeftWidth+i.borderRightWidth;var c=i.borderTopWidth+i.borderBottomWidth;var v=n&&x;var l=m(e.width);if(l!==false){i.width=l+(v?0:u+p)}var g=m(e.height);if(g!==false){i.height=g+(v?0:h+c)}i.innerWidth=i.width-(u+p);i.innerHeight=i.height-(h+c);i.outerWidth=i.width+d;i.outerHeight=i.height+f;return i}return o});(function(t,e){if(typeof define=="function"&&define.amd){define("ev-emitter/ev-emitter",e)}else if(typeof module=="object"&&module.exports){module.exports=e()}else{t.EvEmitter=e()}})(typeof window!="undefined"?window:this,function(){function t(){}var e=t.prototype;e.on=function(t,e){if(!t||!e){return}var i=this._events=this._events||{};var n=i[t]=i[t]||[];if(n.indexOf(e)==-1){n.push(e)}return this};e.once=function(t,e){if(!t||!e){return}this.on(t,e);var i=this._onceEvents=this._onceEvents||{};var n=i[t]=i[t]||{};n[e]=true;return this};e.off=function(t,e){var i=this._events&&this._events[t];if(!i||!i.length){return}var n=i.indexOf(e);if(n!=-1){i.splice(n,1)}return this};e.emitEvent=function(t,e){var i=this._events&&this._events[t];if(!i||!i.length){return}i=i.slice(0);e=e||[];var n=this._onceEvents&&this._onceEvents[t];for(var o=0;o<i.length;o++){var r=i[o];var s=n&&n[r];if(s){this.off(t,r);delete n[r]}r.apply(this,e)}return this};e.allOff=function(){delete this._events;delete this._onceEvents};return t});
(function(e,i){if(typeof define=="function"&&define.amd){define("unipointer/unipointer",["ev-emitter/ev-emitter"],function(t){return i(e,t)})}else if(typeof module=="object"&&module.exports){module.exports=i(e,require("ev-emitter"))}else{e.Unipointer=i(e,e.EvEmitter)}})(window,function t(o,e){function i(){}function n(){}var r=n.prototype=Object.create(e.prototype);r.bindStartEvent=function(t){this._bindStartEvent(t,true)};r.unbindStartEvent=function(t){this._bindStartEvent(t,false)};r._bindStartEvent=function(t,e){e=e===undefined?true:e;var i=e?"addEventListener":"removeEventListener";var n="mousedown";if("ontouchstart"in o){n="touchstart"}else if(o.PointerEvent){n="pointerdown"}t[i](n,this)};r.handleEvent=function(t){var e="on"+t.type;if(this[e]){this[e](t)}};r.getTouch=function(t){for(var e=0;e<t.length;e++){var i=t[e];if(i.identifier==this.pointerIdentifier){return i}}};r.onmousedown=function(t){var e=t.button;if(e&&(e!==0&&e!==1)){return}this._pointerDown(t,t)};r.ontouchstart=function(t){this._pointerDown(t,t.changedTouches[0])};r.onpointerdown=function(t){this._pointerDown(t,t)};r._pointerDown=function(t,e){if(t.button||this.isPointerDown){return}this.isPointerDown=true;this.pointerIdentifier=e.pointerId!==undefined?e.pointerId:e.identifier;this.pointerDown(t,e)};r.pointerDown=function(t,e){this._bindPostStartEvents(t);this.emitEvent("pointerDown",[t,e])};var s={mousedown:["mousemove","mouseup"],touchstart:["touchmove","touchend","touchcancel"],pointerdown:["pointermove","pointerup","pointercancel"]};r._bindPostStartEvents=function(t){if(!t){return}var e=s[t.type];e.forEach(function(t){o.addEventListener(t,this)},this);this._boundPointerEvents=e};r._unbindPostStartEvents=function(){if(!this._boundPointerEvents){return}this._boundPointerEvents.forEach(function(t){o.removeEventListener(t,this)},this);delete this._boundPointerEvents};r.onmousemove=function(t){this._pointerMove(t,t)};r.onpointermove=function(t){if(t.pointerId==this.pointerIdentifier){this._pointerMove(t,t)}};r.ontouchmove=function(t){var e=this.getTouch(t.changedTouches);if(e){this._pointerMove(t,e)}};r._pointerMove=function(t,e){this.pointerMove(t,e)};r.pointerMove=function(t,e){this.emitEvent("pointerMove",[t,e])};r.onmouseup=function(t){this._pointerUp(t,t)};r.onpointerup=function(t){if(t.pointerId==this.pointerIdentifier){this._pointerUp(t,t)}};r.ontouchend=function(t){var e=this.getTouch(t.changedTouches);if(e){this._pointerUp(t,e)}};r._pointerUp=function(t,e){this._pointerDone();this.pointerUp(t,e)};r.pointerUp=function(t,e){this.emitEvent("pointerUp",[t,e])};r._pointerDone=function(){this._pointerReset();this._unbindPostStartEvents();this.pointerDone()};r._pointerReset=function(){this.isPointerDown=false;delete this.pointerIdentifier};r.pointerDone=i;r.onpointercancel=function(t){if(t.pointerId==this.pointerIdentifier){this._pointerCancel(t,t)}};r.ontouchcancel=function(t){var e=this.getTouch(t.changedTouches);if(e){this._pointerCancel(t,e)}};r._pointerCancel=function(t,e){this._pointerDone();this.pointerCancel(t,e)};r.pointerCancel=function(t,e){this.emitEvent("pointerCancel",[t,e])};n.getPointerPoint=function(t){return{x:t.pageX,y:t.pageY}};return n});
(function(e,i){if(typeof define=="function"&&define.amd){define("unidragger/unidragger",["unipointer/unipointer"],function(t){return i(e,t)})}else if(typeof module=="object"&&module.exports){module.exports=i(e,require("unipointer"))}else{e.Unidragger=i(e,e.Unipointer)}})(window,function t(r,e){function i(){}var n=i.prototype=Object.create(e.prototype);n.bindHandles=function(){this._bindHandles(true)};n.unbindHandles=function(){this._bindHandles(false)};n._bindHandles=function(t){t=t===undefined?true:t;var e=t?"addEventListener":"removeEventListener";var i=t?this._touchActionValue:"";for(var n=0;n<this.handles.length;n++){var o=this.handles[n];this._bindStartEvent(o,t);o[e]("click",this);if(r.PointerEvent){o.style.touchAction=i}}};n._touchActionValue="none";n.pointerDown=function(t,e){var i=this.okayPointerDown(t);if(!i){return}this.pointerDownPointer={pageX:e.pageX,pageY:e.pageY};t.preventDefault();this.pointerDownBlur();this._bindPostStartEvents(t);this.emitEvent("pointerDown",[t,e])};var o={TEXTAREA:true,INPUT:true,SELECT:true,OPTION:true};var s={radio:true,checkbox:true,button:true,submit:true,image:true,file:true};n.okayPointerDown=function(t){var e=o[t.target.nodeName];var i=s[t.target.type];var n=!e||i;if(!n){this._pointerReset()}return n};n.pointerDownBlur=function(){var t=document.activeElement;var e=t&&t.blur&&t!=document.body;if(e){t.blur()}};n.pointerMove=function(t,e){var i=this._dragPointerMove(t,e);this.emitEvent("pointerMove",[t,e,i]);this._dragMove(t,e,i)};n._dragPointerMove=function(t,e){var i={x:e.pageX-this.pointerDownPointer.pageX,y:e.pageY-this.pointerDownPointer.pageY};if(!this.isDragging&&this.hasDragStarted(i)){this._dragStart(t,e)}return i};n.hasDragStarted=function(t){return Math.abs(t.x)>3||Math.abs(t.y)>3};n.pointerUp=function(t,e){this.emitEvent("pointerUp",[t,e]);this._dragPointerUp(t,e)};n._dragPointerUp=function(t,e){if(this.isDragging){this._dragEnd(t,e)}else{this._staticClick(t,e)}};n._dragStart=function(t,e){this.isDragging=true;this.isPreventingClicks=true;this.dragStart(t,e)};n.dragStart=function(t,e){this.emitEvent("dragStart",[t,e])};n._dragMove=function(t,e,i){if(!this.isDragging){return}this.dragMove(t,e,i)};n.dragMove=function(t,e,i){t.preventDefault();this.emitEvent("dragMove",[t,e,i])};n._dragEnd=function(t,e){this.isDragging=false;setTimeout(function(){delete this.isPreventingClicks}.bind(this));this.dragEnd(t,e)};n.dragEnd=function(t,e){this.emitEvent("dragEnd",[t,e])};n.onclick=function(t){if(this.isPreventingClicks){t.preventDefault()}};n._staticClick=function(t,e){if(this.isIgnoringMouseUp&&t.type=="mouseup"){return}this.staticClick(t,e);if(t.type!="mouseup"){this.isIgnoringMouseUp=true;setTimeout(function(){delete this.isIgnoringMouseUp}.bind(this),400)}};n.staticClick=function(t,e){this.emitEvent("staticClick",[t,e])};i.getPointerPoint=e.getPointerPoint;return i});
(function(i,n){if(typeof define=="function"&&define.amd){define(["get-size/get-size","unidragger/unidragger"],function(t,e){return n(i,t,e)})}else if(typeof module=="object"&&module.exports){module.exports=n(i,require("get-size"),require("unidragger"))}else{i.Draggabilly=n(i,i.getSize,i.Unidragger)}})(window,function t(r,u,e){function i(t,e){for(var i in e){t[i]=e[i]}return t}function n(){}var o=r.jQuery;function s(t,e){this.element=typeof t=="string"?document.querySelector(t):t;if(o){this.$element=o(this.element)}this.options=i({},this.constructor.defaults);this.option(e);this._create()}var a=s.prototype=Object.create(e.prototype);s.defaults={};a.option=function(t){i(this.options,t)};var h={relative:true,absolute:true,fixed:true};a._create=function(){this.position={};this._getPosition();this.startPoint={x:0,y:0};this.dragPoint={x:0,y:0};this.startPosition=i({},this.position);var t=getComputedStyle(this.element);if(!h[t.position]){this.element.style.position="relative"}this.on("pointerMove",this.onPointerMove);this.on("pointerUp",this.onPointerUp);this.enable();this.setHandles()};a.setHandles=function(){this.handles=this.options.handle?this.element.querySelectorAll(this.options.handle):[this.element];this.bindHandles()};a.dispatchEvent=function(t,e,i){var n=[e].concat(i);this.emitEvent(t,n);this.dispatchJQueryEvent(t,e,i)};a.dispatchJQueryEvent=function(t,e,i){var n=r.jQuery;if(!n||!this.$element){return}var o=n.Event(e);o.type=t;this.$element.trigger(o,i)};a._getPosition=function(){var t=getComputedStyle(this.element);var e=this._getPositionCoord(t.left,"width");var i=this._getPositionCoord(t.top,"height");this.position.x=isNaN(e)?0:e;this.position.y=isNaN(i)?0:i;this._addTransformPosition(t)};a._getPositionCoord=function(t,e){if(t.indexOf("%")!=-1){var i=u(this.element.parentNode);return!i?0:parseFloat(t)/100*i[e]}return parseInt(t,10)};a._addTransformPosition=function(t){var e=t.transform;if(e.indexOf("matrix")!==0){return}var i=e.split(",");var n=e.indexOf("matrix3d")===0?12:4;var o=parseInt(i[n],10);var r=parseInt(i[n+1],10);this.position.x+=o;this.position.y+=r};a.onPointerDown=function(t,e){this.element.classList.add("is-pointer-down");this.dispatchJQueryEvent("pointerDown",t,[e])};a.pointerDown=function(t,e){var i=this.okayPointerDown(t);if(!i||!this.isEnabled){this._pointerReset();return}this.pointerDownPointer={pageX:e.pageX,pageY:e.pageY};t.preventDefault();this.pointerDownBlur();this._bindPostStartEvents(t);this.element.classList.add("is-pointer-down");this.dispatchEvent("pointerDown",t,[e])};a.dragStart=function(t,e){if(!this.isEnabled){return}this._getPosition();this.measureContainment();this.startPosition.x=this.position.x;this.startPosition.y=this.position.y;this.setLeftTop();this.dragPoint.x=0;this.dragPoint.y=0;this.element.classList.add("is-dragging");this.dispatchEvent("dragStart",t,[e]);this.animate()};a.measureContainment=function(){var t=this.getContainer();if(!t){return}var e=u(this.element);var i=u(t);var n=this.element.getBoundingClientRect();var o=t.getBoundingClientRect();var r=i.borderLeftWidth+i.borderRightWidth;var s=i.borderTopWidth+i.borderBottomWidth;var a=this.relativeStartPosition={x:n.left-(o.left+i.borderLeftWidth),y:n.top-(o.top+i.borderTopWidth)};this.containSize={width:i.width-r-a.x-e.width,height:i.height-s-a.y-e.height}};a.getContainer=function(){var t=this.options.containment;if(!t){return}var e=t instanceof HTMLElement;if(e){return t}if(typeof t=="string"){return document.querySelector(t)}return this.element.parentNode};a.onPointerMove=function(t,e,i){this.dispatchJQueryEvent("pointerMove",t,[e,i])};a.dragMove=function(t,e,i){if(!this.isEnabled){return}var n=i.x;var o=i.y;var r=this.options.grid;var s=r&&r[0];var a=r&&r[1];n=d(n,s);o=d(o,a);n=this.containDrag("x",n,s);o=this.containDrag("y",o,a);n=this.options.axis=="y"?0:n;o=this.options.axis=="x"?0:o;this.position.x=this.startPosition.x+n;this.position.y=this.startPosition.y+o;this.dragPoint.x=n;this.dragPoint.y=o;this.dispatchEvent("dragMove",t,[e,i])};function d(t,e,i){i=i||"round";return e?Math[i](t/e)*e:t}a.containDrag=function(t,e,i){if(!this.options.containment){return e}var n=t=="x"?"width":"height";var o=this.relativeStartPosition[t];var r=d(-o,i,"ceil");var s=this.containSize[n];s=d(s,i,"floor");return Math.max(r,Math.min(s,e))};a.onPointerUp=function(t,e){this.element.classList.remove("is-pointer-down");this.dispatchJQueryEvent("pointerUp",t,[e])};a.dragEnd=function(t,e){if(!this.isEnabled){return}this.element.style.transform="";this.setLeftTop();this.element.classList.remove("is-dragging");this.dispatchEvent("dragEnd",t,[e])};a.animate=function(){if(!this.isDragging){return}this.positionDrag();var e=this;requestAnimationFrame(function t(){e.animate()})};a.setLeftTop=function(){this.element.style.left=this.position.x+"px";this.element.style.top=this.position.y+"px"};a.positionDrag=function(){this.element.style.transform="translate3d( "+this.dragPoint.x+"px, "+this.dragPoint.y+"px, 0)"};a.staticClick=function(t,e){this.dispatchEvent("staticClick",t,[e])};a.setPosition=function(t,e){this.position.x=t;this.position.y=e;this.setLeftTop()};a.enable=function(){this.isEnabled=true};a.disable=function(){this.isEnabled=false;if(this.isDragging){this.dragEnd()}};a.destroy=function(){this.disable();this.element.style.transform="";this.element.style.left="";this.element.style.top="";this.element.style.position="";this.unbindHandles();if(this.$element){this.$element.removeData("draggabilly")}};a._init=n;if(o&&o.bridget){o.bridget("draggabilly",s)}return s});;(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.markdownit = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';
module.exports = require('entities/lib/maps/entities.json');

},{"entities/lib/maps/entities.json":52}],2:[function(require,module,exports){

'use strict';


module.exports = [
  'address',
  'article',
  'aside',
  'base',
  'basefont',
  'blockquote',
  'body',
  'caption',
  'center',
  'col',
  'colgroup',
  'dd',
  'details',
  'dialog',
  'dir',
  'div',
  'dl',
  'dt',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'frame',
  'frameset',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'head',
  'header',
  'hr',
  'html',
  'iframe',
  'legend',
  'li',
  'link',
  'main',
  'menu',
  'menuitem',
  'meta',
  'nav',
  'noframes',
  'ol',
  'optgroup',
  'option',
  'p',
  'param',
  'section',
  'source',
  'summary',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'title',
  'tr',
  'track',
  'ul'
];

},{}],3:[function(require,module,exports){

'use strict';

var attr_name     = '[a-zA-Z_:][a-zA-Z0-9:._-]*';

var unquoted      = '[^"\'=<>`\\x00-\\x20]+';
var single_quoted = "'[^']*'";
var double_quoted = '"[^"]*"';

var attr_value  = '(?:' + unquoted + '|' + single_quoted + '|' + double_quoted + ')';

var attribute   = '(?:\\s+' + attr_name + '(?:\\s*=\\s*' + attr_value + ')?)';

var open_tag    = '<[A-Za-z][A-Za-z0-9\\-]*' + attribute + '*\\s*\\/?>';

var close_tag   = '<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>';
var comment     = '<!---->|<!--(?:-?[^>-])(?:-?[^-])*-->';
var processing  = '<[?].*?[?]>';
var declaration = '<![A-Z]+\\s+[^>]*>';
var cdata       = '<!\\[CDATA\\[[\\s\\S]*?\\]\\]>';

var HTML_TAG_RE = new RegExp('^(?:' + open_tag + '|' + close_tag + '|' + comment +
                        '|' + processing + '|' + declaration + '|' + cdata + ')');
var HTML_OPEN_CLOSE_TAG_RE = new RegExp('^(?:' + open_tag + '|' + close_tag + ')');

module.exports.HTML_TAG_RE = HTML_TAG_RE;
module.exports.HTML_OPEN_CLOSE_TAG_RE = HTML_OPEN_CLOSE_TAG_RE;

},{}],4:[function(require,module,exports){
'use strict';


function _class(obj) { return Object.prototype.toString.call(obj); }

function isString(obj) { return _class(obj) === '[object String]'; }

var _hasOwnProperty = Object.prototype.hasOwnProperty;

function has(object, key) {
  return _hasOwnProperty.call(object, key);
}
function assign(obj ) {
  var sources = Array.prototype.slice.call(arguments, 1);

  sources.forEach(function (source) {
    if (!source) { return; }

    if (typeof source !== 'object') {
      throw new TypeError(source + 'must be object');
    }

    Object.keys(source).forEach(function (key) {
      obj[key] = source[key];
    });
  });

  return obj;
}
function arrayReplaceAt(src, pos, newElements) {
  return [].concat(src.slice(0, pos), newElements, src.slice(pos + 1));
}

function isValidEntityCode(c) {
  if (c >= 0xD800 && c <= 0xDFFF) { return false; }
  if (c >= 0xFDD0 && c <= 0xFDEF) { return false; }
  if ((c & 0xFFFF) === 0xFFFF || (c & 0xFFFF) === 0xFFFE) { return false; }
  if (c >= 0x00 && c <= 0x08) { return false; }
  if (c === 0x0B) { return false; }
  if (c >= 0x0E && c <= 0x1F) { return false; }
  if (c >= 0x7F && c <= 0x9F) { return false; }
  if (c > 0x10FFFF) { return false; }
  return true;
}

function fromCodePoint(c) {
  if (c > 0xffff) {
    c -= 0x10000;
    var surrogate1 = 0xd800 + (c >> 10),
        surrogate2 = 0xdc00 + (c & 0x3ff);

    return String.fromCharCode(surrogate1, surrogate2);
  }
  return String.fromCharCode(c);
}


var UNESCAPE_MD_RE  = /\\([!"#$%&'()*+,\-.\/:;<=>?@[\\\]^_`{|}~])/g;
var ENTITY_RE       = /&([a-z#][a-z0-9]{1,31});/gi;
var UNESCAPE_ALL_RE = new RegExp(UNESCAPE_MD_RE.source + '|' + ENTITY_RE.source, 'gi');

var DIGITAL_ENTITY_TEST_RE = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))/i;

var entities = require('./entities');

function replaceEntityPattern(match, name) {
  var code = 0;

  if (has(entities, name)) {
    return entities[name];
  }

  if (name.charCodeAt(0) === 0x23 && DIGITAL_ENTITY_TEST_RE.test(name)) {
    code = name[1].toLowerCase() === 'x' ?
      parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);

    if (isValidEntityCode(code)) {
      return fromCodePoint(code);
    }
  }

  return match;
}

function unescapeMd(str) {
  if (str.indexOf('\\') < 0) { return str; }
  return str.replace(UNESCAPE_MD_RE, '$1');
}

function unescapeAll(str) {
  if (str.indexOf('\\') < 0 && str.indexOf('&') < 0) { return str; }

  return str.replace(UNESCAPE_ALL_RE, function (match, escaped, entity) {
    if (escaped) { return escaped; }
    return replaceEntityPattern(match, entity);
  });
}

var HTML_ESCAPE_TEST_RE = /[&<>"]/;
var HTML_ESCAPE_REPLACE_RE = /[&<>"]/g;
var HTML_REPLACEMENTS = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;'
};

function replaceUnsafeChar(ch) {
  return HTML_REPLACEMENTS[ch];
}

function escapeHtml(str) {
  if (HTML_ESCAPE_TEST_RE.test(str)) {
    return str.replace(HTML_ESCAPE_REPLACE_RE, replaceUnsafeChar);
  }
  return str;
}

var REGEXP_ESCAPE_RE = /[.?*+^$[\]\\(){}|-]/g;

function escapeRE(str) {
  return str.replace(REGEXP_ESCAPE_RE, '\\$&');
}

function isSpace(code) {
  switch (code) {
    case 0x09:
    case 0x20:
      return true;
  }
  return false;
}
function isWhiteSpace(code) {
  if (code >= 0x2000 && code <= 0x200A) { return true; }
  switch (code) {
    case 0x09: 
    case 0x0A: 
    case 0x0B: 
    case 0x0C: 
    case 0x0D: 
    case 0x20:
    case 0xA0:
    case 0x1680:
    case 0x202F:
    case 0x205F:
    case 0x3000:
      return true;
  }
  return false;
}
var UNICODE_PUNCT_RE = require('uc.micro/categories/P/regex');
function isPunctChar(ch) {
  return UNICODE_PUNCT_RE.test(ch);
}
function isMdAsciiPunct(ch) {
  switch (ch) {
    case 0x21:
    case 0x22:
    case 0x23:
    case 0x24:
    case 0x25:
    case 0x26:
    case 0x27:
    case 0x28:
    case 0x29:
    case 0x2A:
    case 0x2B:
    case 0x2C:
    case 0x2D:
    case 0x2E:
    case 0x2F:
    case 0x3A:
    case 0x3B:
    case 0x3C:
    case 0x3D:
    case 0x3E:
    case 0x3F:
    case 0x40:
    case 0x5B:
    case 0x5C:
    case 0x5D:
    case 0x5E:
    case 0x5F:
    case 0x60:
    case 0x7B:
    case 0x7C:
    case 0x7D:
    case 0x7E:
      return true;
    default:
      return false;
  }
}
function normalizeReference(str) {
  str = str.trim().replace(/\s+/g, ' ');
  if ('ẞ'.toLowerCase() === 'Ṿ') {
    str = str.replace(/ẞ/g, 'ß');
  }
  return str.toLowerCase().toUpperCase();
}
exports.lib                 = {};
exports.lib.mdurl           = require('mdurl');
exports.lib.ucmicro         = require('uc.micro');

exports.assign              = assign;
exports.isString            = isString;
exports.has                 = has;
exports.unescapeMd          = unescapeMd;
exports.unescapeAll         = unescapeAll;
exports.isValidEntityCode   = isValidEntityCode;
exports.fromCodePoint       = fromCodePoint;
exports.escapeHtml          = escapeHtml;
exports.arrayReplaceAt      = arrayReplaceAt;
exports.isSpace             = isSpace;
exports.isWhiteSpace        = isWhiteSpace;
exports.isMdAsciiPunct      = isMdAsciiPunct;
exports.isPunctChar         = isPunctChar;
exports.escapeRE            = escapeRE;
exports.normalizeReference  = normalizeReference;

},{"./entities":1,"mdurl":58,"uc.micro":65,"uc.micro/categories/P/regex":63}],5:[function(require,module,exports){
'use strict';


exports.parseLinkLabel       = require('./parse_link_label');
exports.parseLinkDestination = require('./parse_link_destination');
exports.parseLinkTitle       = require('./parse_link_title');

},{"./parse_link_destination":6,"./parse_link_label":7,"./parse_link_title":8}],6:[function(require,module,exports){
'use strict';


var unescapeAll = require('../common/utils').unescapeAll;


module.exports = function parseLinkDestination(str, pos, max) {
  var code, level,
      lines = 0,
      start = pos,
      result = {
        ok: false,
        pos: 0,
        lines: 0,
        str: ''
      };

  if (str.charCodeAt(pos) === 0x3C ) {
    pos++;
    while (pos < max) {
      code = str.charCodeAt(pos);
      if (code === 0x0A ) { return result; }
      if (code === 0x3E ) {
        result.pos = pos + 1;
        result.str = unescapeAll(str.slice(start + 1, pos));
        result.ok = true;
        return result;
      }
      if (code === 0x5C  && pos + 1 < max) {
        pos += 2;
        continue;
      }

      pos++;
    }
    return result;
  }

  level = 0;
  while (pos < max) {
    code = str.charCodeAt(pos);

    if (code === 0x20) { break; }
    if (code < 0x20 || code === 0x7F) { break; }

    if (code === 0x5C  && pos + 1 < max) {
      pos += 2;
      continue;
    }

    if (code === 0x28 ) {
      level++;
    }

    if (code === 0x29 ) {
      if (level === 0) { break; }
      level--;
    }

    pos++;
  }

  if (start === pos) { return result; }
  if (level !== 0) { return result; }

  result.str = unescapeAll(str.slice(start, pos));
  result.lines = lines;
  result.pos = pos;
  result.ok = true;
  return result;
};

},{"../common/utils":4}],7:[function(require,module,exports){
'use strict';

module.exports = function parseLinkLabel(state, start, disableNested) {
  var level, found, marker, prevPos,
      labelEnd = -1,
      max = state.posMax,
      oldPos = state.pos;

  state.pos = start + 1;
  level = 1;

  while (state.pos < max) {
    marker = state.src.charCodeAt(state.pos);
    if (marker === 0x5D ) {
      level--;
      if (level === 0) {
        found = true;
        break;
      }
    }

    prevPos = state.pos;
    state.md.inline.skipToken(state);
    if (marker === 0x5B ) {
      if (prevPos === state.pos - 1) {
        level++;
      } else if (disableNested) {
        state.pos = oldPos;
        return -1;
      }
    }
  }

  if (found) {
    labelEnd = state.pos;
  }
  state.pos = oldPos;

  return labelEnd;
};

},{}],8:[function(require,module,exports){
'use strict';


var unescapeAll = require('../common/utils').unescapeAll;


module.exports = function parseLinkTitle(str, pos, max) {
  var code,
      marker,
      lines = 0,
      start = pos,
      result = {
        ok: false,
        pos: 0,
        lines: 0,
        str: ''
      };

  if (pos >= max) { return result; }

  marker = str.charCodeAt(pos);

  if (marker !== 0x22  && marker !== 0x27  && marker !== 0x28 ) { return result; }

  pos++;
  if (marker === 0x28) { marker = 0x29; }

  while (pos < max) {
    code = str.charCodeAt(pos);
    if (code === marker) {
      result.pos = pos + 1;
      result.lines = lines;
      result.str = unescapeAll(str.slice(start + 1, pos));
      result.ok = true;
      return result;
    } else if (code === 0x0A) {
      lines++;
    } else if (code === 0x5C  && pos + 1 < max) {
      pos++;
      if (str.charCodeAt(pos) === 0x0A) {
        lines++;
      }
    }

    pos++;
  }

  return result;
};

},{"../common/utils":4}],9:[function(require,module,exports){

'use strict';


var utils        = require('./common/utils');
var helpers      = require('./helpers');
var Renderer     = require('./renderer');
var ParserCore   = require('./parser_core');
var ParserBlock  = require('./parser_block');
var ParserInline = require('./parser_inline');
var LinkifyIt    = require('linkify-it');
var mdurl        = require('mdurl');
var punycode     = require('punycode');


var config = {
  'default': require('./presets/default'),
  zero: require('./presets/zero'),
  commonmark: require('./presets/commonmark')
};

var BAD_PROTO_RE = /^(vbscript|javascript|file|data):/;
var GOOD_DATA_RE = /^data:image\/(gif|png|jpeg|webp);/;

function validateLink(url) {
  var str = url.trim().toLowerCase();

  return BAD_PROTO_RE.test(str) ? (GOOD_DATA_RE.test(str) ? true : false) : true;
}


var RECODE_HOSTNAME_FOR = [ 'http:', 'https:', 'mailto:' ];

function normalizeLink(url) {
  var parsed = mdurl.parse(url, true);

  if (parsed.hostname) {
    if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) {
      try {
        parsed.hostname = punycode.toASCII(parsed.hostname);
      } catch (er) {  }
    }
  }

  return mdurl.encode(mdurl.format(parsed));
}

function normalizeLinkText(url) {
  var parsed = mdurl.parse(url, true);

  if (parsed.hostname) {
    if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) {
      try {
        parsed.hostname = punycode.toUnicode(parsed.hostname);
      } catch (er) {  }
    }
  }

  return mdurl.decode(mdurl.format(parsed));
}
function MarkdownIt(presetName, options) {
  if (!(this instanceof MarkdownIt)) {
    return new MarkdownIt(presetName, options);
  }

  if (!options) {
    if (!utils.isString(presetName)) {
      options = presetName || {};
      presetName = 'default';
    }
  }
  this.inline = new ParserInline();
  this.block = new ParserBlock();
  this.core = new ParserCore();
  this.renderer = new Renderer();
  this.linkify = new LinkifyIt();
  this.validateLink = validateLink;
  this.normalizeLink = normalizeLink;
  this.normalizeLinkText = normalizeLinkText;
  this.utils = utils;
  this.helpers = utils.assign({}, helpers);


  this.options = {};
  this.configure(presetName);

  if (options) { this.set(options); }
}
MarkdownIt.prototype.set = function (options) {
  utils.assign(this.options, options);
  return this;
};
MarkdownIt.prototype.configure = function (presets) {
  var self = this, presetName;

  if (utils.isString(presets)) {
    presetName = presets;
    presets = config[presetName];
    if (!presets) { throw new Error('Wrong `markdown-it` preset "' + presetName + '", check name'); }
  }

  if (!presets) { throw new Error('Wrong `markdown-it` preset, can\'t be empty'); }

  if (presets.options) { self.set(presets.options); }

  if (presets.components) {
    Object.keys(presets.components).forEach(function (name) {
      if (presets.components[name].rules) {
        self[name].ruler.enableOnly(presets.components[name].rules);
      }
      if (presets.components[name].rules2) {
        self[name].ruler2.enableOnly(presets.components[name].rules2);
      }
    });
  }
  return this;
};
MarkdownIt.prototype.enable = function (list, ignoreInvalid) {
  var result = [];

  if (!Array.isArray(list)) { list = [ list ]; }

  [ 'core', 'block', 'inline' ].forEach(function (chain) {
    result = result.concat(this[chain].ruler.enable(list, true));
  }, this);

  result = result.concat(this.inline.ruler2.enable(list, true));

  var missed = list.filter(function (name) { return result.indexOf(name) < 0; });

  if (missed.length && !ignoreInvalid) {
    throw new Error('MarkdownIt. Failed to enable unknown rule(s): ' + missed);
  }

  return this;
};
MarkdownIt.prototype.disable = function (list, ignoreInvalid) {
  var result = [];

  if (!Array.isArray(list)) { list = [ list ]; }

  [ 'core', 'block', 'inline' ].forEach(function (chain) {
    result = result.concat(this[chain].ruler.disable(list, true));
  }, this);

  result = result.concat(this.inline.ruler2.disable(list, true));

  var missed = list.filter(function (name) { return result.indexOf(name) < 0; });

  if (missed.length && !ignoreInvalid) {
    throw new Error('MarkdownIt. Failed to disable unknown rule(s): ' + missed);
  }
  return this;
};
MarkdownIt.prototype.use = function (plugin ) {
  var args = [ this ].concat(Array.prototype.slice.call(arguments, 1));
  plugin.apply(plugin, args);
  return this;
};
MarkdownIt.prototype.parse = function (src, env) {
  if (typeof src !== 'string') {
    throw new Error('Input data should be a String');
  }

  var state = new this.core.State(src, this, env);

  this.core.process(state);

  return state.tokens;
};
MarkdownIt.prototype.render = function (src, env) {
  env = env || {};

  return this.renderer.render(this.parse(src, env), this.options, env);
};
MarkdownIt.prototype.parseInline = function (src, env) {
  var state = new this.core.State(src, this, env);

  state.inlineMode = true;
  this.core.process(state);

  return state.tokens;
};
MarkdownIt.prototype.renderInline = function (src, env) {
  env = env || {};

  return this.renderer.render(this.parseInline(src, env), this.options, env);
};


module.exports = MarkdownIt;

},{"./common/utils":4,"./helpers":5,"./parser_block":10,"./parser_core":11,"./parser_inline":12,"./presets/commonmark":13,"./presets/default":14,"./presets/zero":15,"./renderer":16,"linkify-it":53,"mdurl":58,"punycode":60}],10:[function(require,module,exports){
'use strict';


var Ruler           = require('./ruler');


var _rules = [
  [ 'table',      require('./rules_block/table'),      [ 'paragraph', 'reference' ] ],
  [ 'code',       require('./rules_block/code') ],
  [ 'fence',      require('./rules_block/fence'),      [ 'paragraph', 'reference', 'blockquote', 'list' ] ],
  [ 'blockquote', require('./rules_block/blockquote'), [ 'paragraph', 'reference', 'blockquote', 'list' ] ],
  [ 'hr',         require('./rules_block/hr'),         [ 'paragraph', 'reference', 'blockquote', 'list' ] ],
  [ 'list',       require('./rules_block/list'),       [ 'paragraph', 'reference', 'blockquote' ] ],
  [ 'reference',  require('./rules_block/reference') ],
  [ 'heading',    require('./rules_block/heading'),    [ 'paragraph', 'reference', 'blockquote' ] ],
  [ 'lheading',   require('./rules_block/lheading') ],
  [ 'html_block', require('./rules_block/html_block'), [ 'paragraph', 'reference', 'blockquote' ] ],
  [ 'paragraph',  require('./rules_block/paragraph') ]
];
function ParserBlock() {
  this.ruler = new Ruler();

  for (var i = 0; i < _rules.length; i++) {
    this.ruler.push(_rules[i][0], _rules[i][1], { alt: (_rules[i][2] || []).slice() });
  }
}
ParserBlock.prototype.tokenize = function (state, startLine, endLine) {
  var ok, i,
      rules = this.ruler.getRules(''),
      len = rules.length,
      line = startLine,
      hasEmptyLines = false,
      maxNesting = state.md.options.maxNesting;

  while (line < endLine) {
    state.line = line = state.skipEmptyLines(line);
    if (line >= endLine) { break; }
    if (state.sCount[line] < state.blkIndent) { break; }
    if (state.level >= maxNesting) {
      state.line = endLine;
      break;
    }

    for (i = 0; i < len; i++) {
      ok = rules[i](state, line, endLine, false);
      if (ok) { break; }
    }
    state.tight = !hasEmptyLines;
    if (state.isEmpty(state.line - 1)) {
      hasEmptyLines = true;
    }

    line = state.line;

    if (line < endLine && state.isEmpty(line)) {
      hasEmptyLines = true;
      line++;
      state.line = line;
    }
  }
};
ParserBlock.prototype.parse = function (src, md, env, outTokens) {
  var state;

  if (!src) { return; }

  state = new this.State(src, md, env, outTokens);

  this.tokenize(state, state.line, state.lineMax);
};


ParserBlock.prototype.State = require('./rules_block/state_block');


module.exports = ParserBlock;

},{"./ruler":17,"./rules_block/blockquote":18,"./rules_block/code":19,"./rules_block/fence":20,"./rules_block/heading":21,"./rules_block/hr":22,"./rules_block/html_block":23,"./rules_block/lheading":24,"./rules_block/list":25,"./rules_block/paragraph":26,"./rules_block/reference":27,"./rules_block/state_block":28,"./rules_block/table":29}],11:[function(require,module,exports){
'use strict';


var Ruler  = require('./ruler');


var _rules = [
  [ 'normalize',      require('./rules_core/normalize')      ],
  [ 'block',          require('./rules_core/block')          ],
  [ 'inline',         require('./rules_core/inline')         ],
  [ 'linkify',        require('./rules_core/linkify')        ],
  [ 'replacements',   require('./rules_core/replacements')   ],
  [ 'smartquotes',    require('./rules_core/smartquotes')    ]
];
function Core() {
  this.ruler = new Ruler();

  for (var i = 0; i < _rules.length; i++) {
    this.ruler.push(_rules[i][0], _rules[i][1]);
  }
}
Core.prototype.process = function (state) {
  var i, l, rules;

  rules = this.ruler.getRules('');

  for (i = 0, l = rules.length; i < l; i++) {
    rules[i](state);
  }
};

Core.prototype.State = require('./rules_core/state_core');


module.exports = Core;

},{"./ruler":17,"./rules_core/block":30,"./rules_core/inline":31,"./rules_core/linkify":32,"./rules_core/normalize":33,"./rules_core/replacements":34,"./rules_core/smartquotes":35,"./rules_core/state_core":36}],12:[function(require,module,exports){
'use strict';


var Ruler           = require('./ruler');

var _rules = [
  [ 'text',            require('./rules_inline/text') ],
  [ 'newline',         require('./rules_inline/newline') ],
  [ 'escape',          require('./rules_inline/escape') ],
  [ 'backticks',       require('./rules_inline/backticks') ],
  [ 'strikethrough',   require('./rules_inline/strikethrough').tokenize ],
  [ 'emphasis',        require('./rules_inline/emphasis').tokenize ],
  [ 'link',            require('./rules_inline/link') ],
  [ 'image',           require('./rules_inline/image') ],
  [ 'autolink',        require('./rules_inline/autolink') ],
  [ 'html_inline',     require('./rules_inline/html_inline') ],
  [ 'entity',          require('./rules_inline/entity') ]
];

var _rules2 = [
  [ 'balance_pairs',   require('./rules_inline/balance_pairs') ],
  [ 'strikethrough',   require('./rules_inline/strikethrough').postProcess ],
  [ 'emphasis',        require('./rules_inline/emphasis').postProcess ],
  [ 'text_collapse',   require('./rules_inline/text_collapse') ]
];
function ParserInline() {
  var i;
  this.ruler = new Ruler();

  for (i = 0; i < _rules.length; i++) {
    this.ruler.push(_rules[i][0], _rules[i][1]);
  }
  this.ruler2 = new Ruler();

  for (i = 0; i < _rules2.length; i++) {
    this.ruler2.push(_rules2[i][0], _rules2[i][1]);
  }
}
ParserInline.prototype.skipToken = function (state) {
  var ok, i, pos = state.pos,
      rules = this.ruler.getRules(''),
      len = rules.length,
      maxNesting = state.md.options.maxNesting,
      cache = state.cache;


  if (typeof cache[pos] !== 'undefined') {
    state.pos = cache[pos];
    return;
  }

  if (state.level < maxNesting) {
    for (i = 0; i < len; i++) {
      state.level++;
      ok = rules[i](state, true);
      state.level--;

      if (ok) { break; }
    }
  } else {
    state.pos = state.posMax;
  }

  if (!ok) { state.pos++; }
  cache[pos] = state.pos;
};
ParserInline.prototype.tokenize = function (state) {
  var ok, i,
      rules = this.ruler.getRules(''),
      len = rules.length,
      end = state.posMax,
      maxNesting = state.md.options.maxNesting;

  while (state.pos < end) {

    if (state.level < maxNesting) {
      for (i = 0; i < len; i++) {
        ok = rules[i](state, false);
        if (ok) { break; }
      }
    }

    if (ok) {
      if (state.pos >= end) { break; }
      continue;
    }

    state.pending += state.src[state.pos++];
  }

  if (state.pending) {
    state.pushPending();
  }
};
ParserInline.prototype.parse = function (str, md, env, outTokens) {
  var i, rules, len;
  var state = new this.State(str, md, env, outTokens);

  this.tokenize(state);

  rules = this.ruler2.getRules('');
  len = rules.length;

  for (i = 0; i < len; i++) {
    rules[i](state);
  }
};


ParserInline.prototype.State = require('./rules_inline/state_inline');


module.exports = ParserInline;

},{"./ruler":17,"./rules_inline/autolink":37,"./rules_inline/backticks":38,"./rules_inline/balance_pairs":39,"./rules_inline/emphasis":40,"./rules_inline/entity":41,"./rules_inline/escape":42,"./rules_inline/html_inline":43,"./rules_inline/image":44,"./rules_inline/link":45,"./rules_inline/newline":46,"./rules_inline/state_inline":47,"./rules_inline/strikethrough":48,"./rules_inline/text":49,"./rules_inline/text_collapse":50}],13:[function(require,module,exports){

'use strict';


module.exports = {
  options: {
    html:         true,         
    xhtmlOut:     true,         
    breaks:       false,        
    langPrefix:   'language-',  
    linkify:      false,        
    typographer:  false,
    quotes: '\u201c\u201d\u2018\u2019', 
    highlight: null,

    maxNesting:   20            
  },

  components: {

    core: {
      rules: [
        'normalize',
        'block',
        'inline'
      ]
    },

    block: {
      rules: [
        'blockquote',
        'code',
        'fence',
        'heading',
        'hr',
        'html_block',
        'lheading',
        'list',
        'reference',
        'paragraph'
      ]
    },

    inline: {
      rules: [
        'autolink',
        'backticks',
        'emphasis',
        'entity',
        'escape',
        'html_inline',
        'image',
        'link',
        'newline',
        'text'
      ],
      rules2: [
        'balance_pairs',
        'emphasis',
        'text_collapse'
      ]
    }
  }
};

},{}],14:[function(require,module,exports){

'use strict';


module.exports = {
  options: {
    html:         false,        
    xhtmlOut:     false,        
    breaks:       false,        
    langPrefix:   'language-',  
    linkify:      false,        
    typographer:  false,
    quotes: '\u201c\u201d\u2018\u2019', 
    highlight: null,

    maxNesting:   100            
  },

  components: {

    core: {},
    block: {},
    inline: {}
  }
};

},{}],15:[function(require,module,exports){

'use strict';


module.exports = {
  options: {
    html:         false,        
    xhtmlOut:     false,        
    breaks:       false,        
    langPrefix:   'language-',  
    linkify:      false,        
    typographer:  false,
    quotes: '\u201c\u201d\u2018\u2019', 
    highlight: null,

    maxNesting:   20            
  },

  components: {

    core: {
      rules: [
        'normalize',
        'block',
        'inline'
      ]
    },

    block: {
      rules: [
        'paragraph'
      ]
    },

    inline: {
      rules: [
        'text'
      ],
      rules2: [
        'balance_pairs',
        'text_collapse'
      ]
    }
  }
};

},{}],16:[function(require,module,exports){
'use strict';


var assign          = require('./common/utils').assign;
var unescapeAll     = require('./common/utils').unescapeAll;
var escapeHtml      = require('./common/utils').escapeHtml;

var default_rules = {};


default_rules.code_inline = function (tokens, idx, options, env, slf) {
  var token = tokens[idx];

  return  '<code' + slf.renderAttrs(token) + '>' +
          escapeHtml(tokens[idx].content) +
          '</code>';
};


default_rules.code_block = function (tokens, idx, options, env, slf) {
  var token = tokens[idx];

  return  '<pre' + slf.renderAttrs(token) + '><code>' +
          escapeHtml(tokens[idx].content) +
          '</code></pre>\n';
};


default_rules.fence = function (tokens, idx, options, env, slf) {
  var token = tokens[idx],
      info = token.info ? unescapeAll(token.info).trim() : '',
      langName = '',
      highlighted, i, tmpAttrs, tmpToken;

  if (info) {
    langName = info.split(/\s+/g)[0];
  }

  if (options.highlight) {
    highlighted = options.highlight(token.content, langName) || escapeHtml(token.content);
  } else {
    highlighted = escapeHtml(token.content);
  }

  if (highlighted.indexOf('<pre') === 0) {
    return highlighted + '\n';
  }
  if (info) {
    i        = token.attrIndex('class');
    tmpAttrs = token.attrs ? token.attrs.slice() : [];

    if (i < 0) {
      tmpAttrs.push([ 'class', options.langPrefix + langName ]);
    } else {
      tmpAttrs[i][1] += ' ' + options.langPrefix + langName;
    }
    tmpToken = {
      attrs: tmpAttrs
    };

    return  '<pre><code' + slf.renderAttrs(tmpToken) + '>'
          + highlighted
          + '</code></pre>\n';
  }


  return  '<pre><code' + slf.renderAttrs(token) + '>'
        + highlighted
        + '</code></pre>\n';
};


default_rules.image = function (tokens, idx, options, env, slf) {
  var token = tokens[idx];

  token.attrs[token.attrIndex('alt')][1] =
    slf.renderInlineAsText(token.children, options, env);

  return slf.renderToken(tokens, idx, options);
};


default_rules.hardbreak = function (tokens, idx, options ) {
  return options.xhtmlOut ? '<br />\n' : '<br>\n';
};
default_rules.softbreak = function (tokens, idx, options ) {
  return options.breaks ? (options.xhtmlOut ? '<br />\n' : '<br>\n') : '\n';
};


default_rules.text = function (tokens, idx ) {
  return escapeHtml(tokens[idx].content);
};


default_rules.html_block = function (tokens, idx ) {
  return tokens[idx].content;
};
default_rules.html_inline = function (tokens, idx ) {
  return tokens[idx].content;
};
function Renderer() {
  this.rules = assign({}, default_rules);
}
Renderer.prototype.renderAttrs = function renderAttrs(token) {
  var i, l, result;

  if (!token.attrs) { return ''; }

  result = '';

  for (i = 0, l = token.attrs.length; i < l; i++) {
    result += ' ' + escapeHtml(token.attrs[i][0]) + '="' + escapeHtml(token.attrs[i][1]) + '"';
  }

  return result;
};
Renderer.prototype.renderToken = function renderToken(tokens, idx, options) {
  var nextToken,
      result = '',
      needLf = false,
      token = tokens[idx];
  if (token.hidden) {
    return '';
  }
  if (token.block && token.nesting !== -1 && idx && tokens[idx - 1].hidden) {
    result += '\n';
  }
  result += (token.nesting === -1 ? '</' : '<') + token.tag;
  result += this.renderAttrs(token);
  if (token.nesting === 0 && options.xhtmlOut) {
    result += ' /';
  }
  if (token.block) {
    needLf = true;

    if (token.nesting === 1) {
      if (idx + 1 < tokens.length) {
        nextToken = tokens[idx + 1];

        if (nextToken.type === 'inline' || nextToken.hidden) {
          needLf = false;

        } else if (nextToken.nesting === -1 && nextToken.tag === token.tag) {
          needLf = false;
        }
      }
    }
  }

  result += needLf ? '>\n' : '>';

  return result;
};
Renderer.prototype.renderInline = function (tokens, options, env) {
  var type,
      result = '',
      rules = this.rules;

  for (var i = 0, len = tokens.length; i < len; i++) {
    type = tokens[i].type;

    if (typeof rules[type] !== 'undefined') {
      result += rules[type](tokens, i, options, env, this);
    } else {
      result += this.renderToken(tokens, i, options);
    }
  }

  return result;
};
Renderer.prototype.renderInlineAsText = function (tokens, options, env) {
  var result = '';

  for (var i = 0, len = tokens.length; i < len; i++) {
    if (tokens[i].type === 'text') {
      result += tokens[i].content;
    } else if (tokens[i].type === 'image') {
      result += this.renderInlineAsText(tokens[i].children, options, env);
    }
  }

  return result;
};
Renderer.prototype.render = function (tokens, options, env) {
  var i, len, type,
      result = '',
      rules = this.rules;

  for (i = 0, len = tokens.length; i < len; i++) {
    type = tokens[i].type;

    if (type === 'inline') {
      result += this.renderInline(tokens[i].children, options, env);
    } else if (typeof rules[type] !== 'undefined') {
      result += rules[tokens[i].type](tokens, i, options, env, this);
    } else {
      result += this.renderToken(tokens, i, options, env);
    }
  }

  return result;
};

module.exports = Renderer;

},{"./common/utils":4}],17:[function(require,module,exports){
'use strict';
function Ruler() {
  this.__rules__ = [];
  this.__cache__ = null;
}
Ruler.prototype.__find__ = function (name) {
  for (var i = 0; i < this.__rules__.length; i++) {
    if (this.__rules__[i].name === name) {
      return i;
    }
  }
  return -1;
};
Ruler.prototype.__compile__ = function () {
  var self = this;
  var chains = [ '' ];
  self.__rules__.forEach(function (rule) {
    if (!rule.enabled) { return; }

    rule.alt.forEach(function (altName) {
      if (chains.indexOf(altName) < 0) {
        chains.push(altName);
      }
    });
  });

  self.__cache__ = {};

  chains.forEach(function (chain) {
    self.__cache__[chain] = [];
    self.__rules__.forEach(function (rule) {
      if (!rule.enabled) { return; }

      if (chain && rule.alt.indexOf(chain) < 0) { return; }

      self.__cache__[chain].push(rule.fn);
    });
  });
};
Ruler.prototype.at = function (name, fn, options) {
  var index = this.__find__(name);
  var opt = options || {};

  if (index === -1) { throw new Error('Parser rule not found: ' + name); }

  this.__rules__[index].fn = fn;
  this.__rules__[index].alt = opt.alt || [];
  this.__cache__ = null;
};
Ruler.prototype.before = function (beforeName, ruleName, fn, options) {
  var index = this.__find__(beforeName);
  var opt = options || {};

  if (index === -1) { throw new Error('Parser rule not found: ' + beforeName); }

  this.__rules__.splice(index, 0, {
    name: ruleName,
    enabled: true,
    fn: fn,
    alt: opt.alt || []
  });

  this.__cache__ = null;
};
Ruler.prototype.after = function (afterName, ruleName, fn, options) {
  var index = this.__find__(afterName);
  var opt = options || {};

  if (index === -1) { throw new Error('Parser rule not found: ' + afterName); }

  this.__rules__.splice(index + 1, 0, {
    name: ruleName,
    enabled: true,
    fn: fn,
    alt: opt.alt || []
  });

  this.__cache__ = null;
};
Ruler.prototype.push = function (ruleName, fn, options) {
  var opt = options || {};

  this.__rules__.push({
    name: ruleName,
    enabled: true,
    fn: fn,
    alt: opt.alt || []
  });

  this.__cache__ = null;
};
Ruler.prototype.enable = function (list, ignoreInvalid) {
  if (!Array.isArray(list)) { list = [ list ]; }

  var result = [];
  list.forEach(function (name) {
    var idx = this.__find__(name);

    if (idx < 0) {
      if (ignoreInvalid) { return; }
      throw new Error('Rules manager: invalid rule name ' + name);
    }
    this.__rules__[idx].enabled = true;
    result.push(name);
  }, this);

  this.__cache__ = null;
  return result;
};
Ruler.prototype.enableOnly = function (list, ignoreInvalid) {
  if (!Array.isArray(list)) { list = [ list ]; }

  this.__rules__.forEach(function (rule) { rule.enabled = false; });

  this.enable(list, ignoreInvalid);
};
Ruler.prototype.disable = function (list, ignoreInvalid) {
  if (!Array.isArray(list)) { list = [ list ]; }

  var result = [];
  list.forEach(function (name) {
    var idx = this.__find__(name);

    if (idx < 0) {
      if (ignoreInvalid) { return; }
      throw new Error('Rules manager: invalid rule name ' + name);
    }
    this.__rules__[idx].enabled = false;
    result.push(name);
  }, this);

  this.__cache__ = null;
  return result;
};
Ruler.prototype.getRules = function (chainName) {
  if (this.__cache__ === null) {
    this.__compile__();
  }
  return this.__cache__[chainName] || [];
};

module.exports = Ruler;

},{}],18:[function(require,module,exports){

'use strict';

var isSpace = require('../common/utils').isSpace;


module.exports = function blockquote(state, startLine, endLine, silent) {
  var adjustTab,
      ch,
      i,
      initial,
      l,
      lastLineEmpty,
      lines,
      nextLine,
      offset,
      oldBMarks,
      oldBSCount,
      oldIndent,
      oldParentType,
      oldSCount,
      oldTShift,
      spaceAfterMarker,
      terminate,
      terminatorRules,
      token,
      wasOutdented,
      oldLineMax = state.lineMax,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine];
  if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }
  if (state.src.charCodeAt(pos++) !== 0x3E) { return false; }
  if (silent) { return true; }
  initial = offset = state.sCount[startLine] + pos - (state.bMarks[startLine] + state.tShift[startLine]);
  if (state.src.charCodeAt(pos) === 0x20 ) {
    pos++;
    initial++;
    offset++;
    adjustTab = false;
    spaceAfterMarker = true;
  } else if (state.src.charCodeAt(pos) === 0x09 ) {
    spaceAfterMarker = true;

    if ((state.bsCount[startLine] + offset) % 4 === 3) {
      pos++;
      initial++;
      offset++;
      adjustTab = false;
    } else {
      adjustTab = true;
    }
  } else {
    spaceAfterMarker = false;
  }

  oldBMarks = [ state.bMarks[startLine] ];
  state.bMarks[startLine] = pos;

  while (pos < max) {
    ch = state.src.charCodeAt(pos);

    if (isSpace(ch)) {
      if (ch === 0x09) {
        offset += 4 - (offset + state.bsCount[startLine] + (adjustTab ? 1 : 0)) % 4;
      } else {
        offset++;
      }
    } else {
      break;
    }

    pos++;
  }

  oldBSCount = [ state.bsCount[startLine] ];
  state.bsCount[startLine] = state.sCount[startLine] + 1 + (spaceAfterMarker ? 1 : 0);

  lastLineEmpty = pos >= max;

  oldSCount = [ state.sCount[startLine] ];
  state.sCount[startLine] = offset - initial;

  oldTShift = [ state.tShift[startLine] ];
  state.tShift[startLine] = pos - state.bMarks[startLine];

  terminatorRules = state.md.block.ruler.getRules('blockquote');

  oldParentType = state.parentType;
  state.parentType = 'blockquote';
  wasOutdented = false;
  for (nextLine = startLine + 1; nextLine < endLine; nextLine++) {
    if (state.sCount[nextLine] < state.blkIndent) wasOutdented = true;

    pos = state.bMarks[nextLine] + state.tShift[nextLine];
    max = state.eMarks[nextLine];

    if (pos >= max) {
      break;
    }

    if (state.src.charCodeAt(pos++) === 0x3E && !wasOutdented) {
      initial = offset = state.sCount[nextLine] + pos - (state.bMarks[nextLine] + state.tShift[nextLine]);
      if (state.src.charCodeAt(pos) === 0x20 ) {
        pos++;
        initial++;
        offset++;
        adjustTab = false;
        spaceAfterMarker = true;
      } else if (state.src.charCodeAt(pos) === 0x09 ) {
        spaceAfterMarker = true;

        if ((state.bsCount[nextLine] + offset) % 4 === 3) {
          pos++;
          initial++;
          offset++;
          adjustTab = false;
        } else {
          adjustTab = true;
        }
      } else {
        spaceAfterMarker = false;
      }

      oldBMarks.push(state.bMarks[nextLine]);
      state.bMarks[nextLine] = pos;

      while (pos < max) {
        ch = state.src.charCodeAt(pos);

        if (isSpace(ch)) {
          if (ch === 0x09) {
            offset += 4 - (offset + state.bsCount[nextLine] + (adjustTab ? 1 : 0)) % 4;
          } else {
            offset++;
          }
        } else {
          break;
        }

        pos++;
      }

      lastLineEmpty = pos >= max;

      oldBSCount.push(state.bsCount[nextLine]);
      state.bsCount[nextLine] = state.sCount[nextLine] + 1 + (spaceAfterMarker ? 1 : 0);

      oldSCount.push(state.sCount[nextLine]);
      state.sCount[nextLine] = offset - initial;

      oldTShift.push(state.tShift[nextLine]);
      state.tShift[nextLine] = pos - state.bMarks[nextLine];
      continue;
    }
    if (lastLineEmpty) { break; }
    terminate = false;
    for (i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true;
        break;
      }
    }

    if (terminate) {
      state.lineMax = nextLine;

      if (state.blkIndent !== 0) {
        oldBMarks.push(state.bMarks[nextLine]);
        oldBSCount.push(state.bsCount[nextLine]);
        oldTShift.push(state.tShift[nextLine]);
        oldSCount.push(state.sCount[nextLine]);
        state.sCount[nextLine] -= state.blkIndent;
      }

      break;
    }

    oldBMarks.push(state.bMarks[nextLine]);
    oldBSCount.push(state.bsCount[nextLine]);
    oldTShift.push(state.tShift[nextLine]);
    oldSCount.push(state.sCount[nextLine]);
    state.sCount[nextLine] = -1;
  }

  oldIndent = state.blkIndent;
  state.blkIndent = 0;

  token        = state.push('blockquote_open', 'blockquote', 1);
  token.markup = '>';
  token.map    = lines = [ startLine, 0 ];

  state.md.block.tokenize(state, startLine, nextLine);

  token        = state.push('blockquote_close', 'blockquote', -1);
  token.markup = '>';

  state.lineMax = oldLineMax;
  state.parentType = oldParentType;
  lines[1] = state.line;
  for (i = 0; i < oldTShift.length; i++) {
    state.bMarks[i + startLine] = oldBMarks[i];
    state.tShift[i + startLine] = oldTShift[i];
    state.sCount[i + startLine] = oldSCount[i];
    state.bsCount[i + startLine] = oldBSCount[i];
  }
  state.blkIndent = oldIndent;

  return true;
};

},{"../common/utils":4}],19:[function(require,module,exports){

'use strict';


module.exports = function code(state, startLine, endLine) {
  var nextLine, last, token;

  if (state.sCount[startLine] - state.blkIndent < 4) { return false; }

  last = nextLine = startLine + 1;

  while (nextLine < endLine) {
    if (state.isEmpty(nextLine)) {
      nextLine++;
      continue;
    }

    if (state.sCount[nextLine] - state.blkIndent >= 4) {
      nextLine++;
      last = nextLine;
      continue;
    }
    break;
  }

  state.line = last;

  token         = state.push('code_block', 'code', 0);
  token.content = state.getLines(startLine, last, 4 + state.blkIndent, true);
  token.map     = [ startLine, state.line ];

  return true;
};

},{}],20:[function(require,module,exports){

'use strict';


module.exports = function fence(state, startLine, endLine, silent) {
  var marker, len, params, nextLine, mem, token, markup,
      haveEndMarker = false,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine];
  if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

  if (pos + 3 > max) { return false; }

  marker = state.src.charCodeAt(pos);

  if (marker !== 0x7E && marker !== 0x60 ) {
    return false;
  }
  mem = pos;
  pos = state.skipChars(pos, marker);

  len = pos - mem;

  if (len < 3) { return false; }

  markup = state.src.slice(mem, pos);
  params = state.src.slice(pos, max);

  if (marker === 0x60 ) {
    if (params.indexOf(String.fromCharCode(marker)) >= 0) {
      return false;
    }
  }
  if (silent) { return true; }
  nextLine = startLine;

  for (;;) {
    nextLine++;
    if (nextLine >= endLine) {
      break;
    }

    pos = mem = state.bMarks[nextLine] + state.tShift[nextLine];
    max = state.eMarks[nextLine];

    if (pos < max && state.sCount[nextLine] < state.blkIndent) {
      break;
    }

    if (state.src.charCodeAt(pos) !== marker) { continue; }

    if (state.sCount[nextLine] - state.blkIndent >= 4) {
      continue;
    }

    pos = state.skipChars(pos, marker);
    if (pos - mem < len) { continue; }
    pos = state.skipSpaces(pos);

    if (pos < max) { continue; }

    haveEndMarker = true;
    break;
  }
  len = state.sCount[startLine];

  state.line = nextLine + (haveEndMarker ? 1 : 0);

  token         = state.push('fence', 'code', 0);
  token.info    = params;
  token.content = state.getLines(startLine + 1, nextLine, len, true);
  token.markup  = markup;
  token.map     = [ startLine, state.line ];

  return true;
};

},{}],21:[function(require,module,exports){

'use strict';

var isSpace = require('../common/utils').isSpace;


module.exports = function heading(state, startLine, endLine, silent) {
  var ch, level, tmp, token,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine];
  if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

  ch  = state.src.charCodeAt(pos);

  if (ch !== 0x23 || pos >= max) { return false; }
  level = 1;
  ch = state.src.charCodeAt(++pos);
  while (ch === 0x23 && pos < max && level <= 6) {
    level++;
    ch = state.src.charCodeAt(++pos);
  }

  if (level > 6 || (pos < max && !isSpace(ch))) { return false; }

  if (silent) { return true; }

  max = state.skipSpacesBack(max, pos);
  tmp = state.skipCharsBack(max, 0x23, pos); 
  if (tmp > pos && isSpace(state.src.charCodeAt(tmp - 1))) {
    max = tmp;
  }

  state.line = startLine + 1;

  token        = state.push('heading_open', 'h' + String(level), 1);
  token.markup = '########'.slice(0, level);
  token.map    = [ startLine, state.line ];

  token          = state.push('inline', '', 0);
  token.content  = state.src.slice(pos, max).trim();
  token.map      = [ startLine, state.line ];
  token.children = [];

  token        = state.push('heading_close', 'h' + String(level), -1);
  token.markup = '########'.slice(0, level);

  return true;
};

},{"../common/utils":4}],22:[function(require,module,exports){

'use strict';

var isSpace = require('../common/utils').isSpace;


module.exports = function hr(state, startLine, endLine, silent) {
  var marker, cnt, ch, token,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine];
  if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

  marker = state.src.charCodeAt(pos++);
  if (marker !== 0x2A &&
      marker !== 0x2D &&
      marker !== 0x5F) {
    return false;
  }

  cnt = 1;
  while (pos < max) {
    ch = state.src.charCodeAt(pos++);
    if (ch !== marker && !isSpace(ch)) { return false; }
    if (ch === marker) { cnt++; }
  }

  if (cnt < 3) { return false; }

  if (silent) { return true; }

  state.line = startLine + 1;

  token        = state.push('hr', 'hr', 0);
  token.map    = [ startLine, state.line ];
  token.markup = Array(cnt + 1).join(String.fromCharCode(marker));

  return true;
};

},{"../common/utils":4}],23:[function(require,module,exports){

'use strict';


var block_names = require('../common/html_blocks');
var HTML_OPEN_CLOSE_TAG_RE = require('../common/html_re').HTML_OPEN_CLOSE_TAG_RE;
var HTML_SEQUENCES = [
  [ /^<(script|pre|style)(?=(\s|>|$))/i, /<\/(script|pre|style)>/i, true ],
  [ /^<!--/,        /-->/,   true ],
  [ /^<\?/,         /\?>/,   true ],
  [ /^<![A-Z]/,     />/,     true ],
  [ /^<!\[CDATA\[/, /\]\]>/, true ],
  [ new RegExp('^</?(' + block_names.join('|') + ')(?=(\\s|/?>|$))', 'i'), /^$/, true ],
  [ new RegExp(HTML_OPEN_CLOSE_TAG_RE.source + '\\s*$'),  /^$/, false ]
];


module.exports = function html_block(state, startLine, endLine, silent) {
  var i, nextLine, token, lineText,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine];
  if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

  if (!state.md.options.html) { return false; }

  if (state.src.charCodeAt(pos) !== 0x3C) { return false; }

  lineText = state.src.slice(pos, max);

  for (i = 0; i < HTML_SEQUENCES.length; i++) {
    if (HTML_SEQUENCES[i][0].test(lineText)) { break; }
  }

  if (i === HTML_SEQUENCES.length) { return false; }

  if (silent) {
    return HTML_SEQUENCES[i][2];
  }

  nextLine = startLine + 1;
  if (!HTML_SEQUENCES[i][1].test(lineText)) {
    for (; nextLine < endLine; nextLine++) {
      if (state.sCount[nextLine] < state.blkIndent) { break; }

      pos = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];
      lineText = state.src.slice(pos, max);

      if (HTML_SEQUENCES[i][1].test(lineText)) {
        if (lineText.length !== 0) { nextLine++; }
        break;
      }
    }
  }

  state.line = nextLine;

  token         = state.push('html_block', '', 0);
  token.map     = [ startLine, nextLine ];
  token.content = state.getLines(startLine, nextLine, state.blkIndent, true);

  return true;
};

},{"../common/html_blocks":2,"../common/html_re":3}],24:[function(require,module,exports){

'use strict';


module.exports = function lheading(state, startLine, endLine) {
  var content, terminate, i, l, token, pos, max, level, marker,
      nextLine = startLine + 1, oldParentType,
      terminatorRules = state.md.block.ruler.getRules('paragraph');
  if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

  oldParentType = state.parentType;
  state.parentType = 'paragraph'; 
  for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
    if (state.sCount[nextLine] - state.blkIndent > 3) { continue; }
    if (state.sCount[nextLine] >= state.blkIndent) {
      pos = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];

      if (pos < max) {
        marker = state.src.charCodeAt(pos);

        if (marker === 0x2D || marker === 0x3D) {
          pos = state.skipChars(pos, marker);
          pos = state.skipSpaces(pos);

          if (pos >= max) {
            level = (marker === 0x3D ? 1 : 2);
            break;
          }
        }
      }
    }
    if (state.sCount[nextLine] < 0) { continue; }
    terminate = false;
    for (i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true;
        break;
      }
    }
    if (terminate) { break; }
  }

  if (!level) {
    return false;
  }

  content = state.getLines(startLine, nextLine, state.blkIndent, false).trim();

  state.line = nextLine + 1;

  token          = state.push('heading_open', 'h' + String(level), 1);
  token.markup   = String.fromCharCode(marker);
  token.map      = [ startLine, state.line ];

  token          = state.push('inline', '', 0);
  token.content  = content;
  token.map      = [ startLine, state.line - 1 ];
  token.children = [];

  token          = state.push('heading_close', 'h' + String(level), -1);
  token.markup   = String.fromCharCode(marker);

  state.parentType = oldParentType;

  return true;
};

},{}],25:[function(require,module,exports){

'use strict';

var isSpace = require('../common/utils').isSpace;
function skipBulletListMarker(state, startLine) {
  var marker, pos, max, ch;

  pos = state.bMarks[startLine] + state.tShift[startLine];
  max = state.eMarks[startLine];

  marker = state.src.charCodeAt(pos++);
  if (marker !== 0x2A &&
      marker !== 0x2D &&
      marker !== 0x2B) {
    return -1;
  }

  if (pos < max) {
    ch = state.src.charCodeAt(pos);

    if (!isSpace(ch)) {
      return -1;
    }
  }

  return pos;
}
function skipOrderedListMarker(state, startLine) {
  var ch,
      start = state.bMarks[startLine] + state.tShift[startLine],
      pos = start,
      max = state.eMarks[startLine];
  if (pos + 1 >= max) { return -1; }

  ch = state.src.charCodeAt(pos++);

  if (ch < 0x30 || ch > 0x39) { return -1; }

  for (;;) {
    if (pos >= max) { return -1; }

    ch = state.src.charCodeAt(pos++);

    if (ch >= 0x30 && ch <= 0x39) {
      if (pos - start >= 10) { return -1; }

      continue;
    }
    if (ch === 0x29 || ch === 0x2e) {
      break;
    }

    return -1;
  }


  if (pos < max) {
    ch = state.src.charCodeAt(pos);

    if (!isSpace(ch)) {
      return -1;
    }
  }
  return pos;
}

function markTightParagraphs(state, idx) {
  var i, l,
      level = state.level + 2;

  for (i = idx + 2, l = state.tokens.length - 2; i < l; i++) {
    if (state.tokens[i].level === level && state.tokens[i].type === 'paragraph_open') {
      state.tokens[i + 2].hidden = true;
      state.tokens[i].hidden = true;
      i += 2;
    }
  }
}


module.exports = function list(state, startLine, endLine, silent) {
  var ch,
      contentStart,
      i,
      indent,
      indentAfterMarker,
      initial,
      isOrdered,
      itemLines,
      l,
      listLines,
      listTokIdx,
      markerCharCode,
      markerValue,
      max,
      nextLine,
      offset,
      oldListIndent,
      oldParentType,
      oldSCount,
      oldTShift,
      oldTight,
      pos,
      posAfterMarker,
      prevEmptyEnd,
      start,
      terminate,
      terminatorRules,
      token,
      isTerminatingParagraph = false,
      tight = true;
  if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }
  if (state.listIndent >= 0 &&
      state.sCount[startLine] - state.listIndent >= 4 &&
      state.sCount[startLine] < state.blkIndent) {
    return false;
  }
  if (silent && state.parentType === 'paragraph') {
    if (state.tShift[startLine] >= state.blkIndent) {
      isTerminatingParagraph = true;
    }
  }
  if ((posAfterMarker = skipOrderedListMarker(state, startLine)) >= 0) {
    isOrdered = true;
    start = state.bMarks[startLine] + state.tShift[startLine];
    markerValue = Number(state.src.substr(start, posAfterMarker - start - 1));
    if (isTerminatingParagraph && markerValue !== 1) return false;

  } else if ((posAfterMarker = skipBulletListMarker(state, startLine)) >= 0) {
    isOrdered = false;

  } else {
    return false;
  }
  if (isTerminatingParagraph) {
    if (state.skipSpaces(posAfterMarker) >= state.eMarks[startLine]) return false;
  }
  markerCharCode = state.src.charCodeAt(posAfterMarker - 1);
  if (silent) { return true; }
  listTokIdx = state.tokens.length;

  if (isOrdered) {
    token       = state.push('ordered_list_open', 'ol', 1);
    if (markerValue !== 1) {
      token.attrs = [ [ 'start', markerValue ] ];
    }

  } else {
    token       = state.push('bullet_list_open', 'ul', 1);
  }

  token.map    = listLines = [ startLine, 0 ];
  token.markup = String.fromCharCode(markerCharCode);

  nextLine = startLine;
  prevEmptyEnd = false;
  terminatorRules = state.md.block.ruler.getRules('list');

  oldParentType = state.parentType;
  state.parentType = 'list';

  while (nextLine < endLine) {
    pos = posAfterMarker;
    max = state.eMarks[nextLine];

    initial = offset = state.sCount[nextLine] + posAfterMarker - (state.bMarks[startLine] + state.tShift[startLine]);

    while (pos < max) {
      ch = state.src.charCodeAt(pos);

      if (ch === 0x09) {
        offset += 4 - (offset + state.bsCount[nextLine]) % 4;
      } else if (ch === 0x20) {
        offset++;
      } else {
        break;
      }

      pos++;
    }

    contentStart = pos;

    if (contentStart >= max) {
      indentAfterMarker = 1;
    } else {
      indentAfterMarker = offset - initial;
    }
    if (indentAfterMarker > 4) { indentAfterMarker = 1; }
    indent = initial + indentAfterMarker;
    token        = state.push('list_item_open', 'li', 1);
    token.markup = String.fromCharCode(markerCharCode);
    token.map    = itemLines = [ startLine, 0 ];
    oldTight = state.tight;
    oldTShift = state.tShift[startLine];
    oldSCount = state.sCount[startLine];
    oldListIndent = state.listIndent;
    state.listIndent = state.blkIndent;
    state.blkIndent = indent;

    state.tight = true;
    state.tShift[startLine] = contentStart - state.bMarks[startLine];
    state.sCount[startLine] = offset;

    if (contentStart >= max && state.isEmpty(startLine + 1)) {
      state.line = Math.min(state.line + 2, endLine);
    } else {
      state.md.block.tokenize(state, startLine, endLine, true);
    }
    if (!state.tight || prevEmptyEnd) {
      tight = false;
    }
    prevEmptyEnd = (state.line - startLine) > 1 && state.isEmpty(state.line - 1);

    state.blkIndent = state.listIndent;
    state.listIndent = oldListIndent;
    state.tShift[startLine] = oldTShift;
    state.sCount[startLine] = oldSCount;
    state.tight = oldTight;

    token        = state.push('list_item_close', 'li', -1);
    token.markup = String.fromCharCode(markerCharCode);

    nextLine = startLine = state.line;
    itemLines[1] = nextLine;
    contentStart = state.bMarks[startLine];

    if (nextLine >= endLine) { break; }
    if (state.sCount[nextLine] < state.blkIndent) { break; }
    if (state.sCount[startLine] - state.blkIndent >= 4) { break; }
    terminate = false;
    for (i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true;
        break;
      }
    }
    if (terminate) { break; }
    if (isOrdered) {
      posAfterMarker = skipOrderedListMarker(state, nextLine);
      if (posAfterMarker < 0) { break; }
    } else {
      posAfterMarker = skipBulletListMarker(state, nextLine);
      if (posAfterMarker < 0) { break; }
    }

    if (markerCharCode !== state.src.charCodeAt(posAfterMarker - 1)) { break; }
  }
  if (isOrdered) {
    token = state.push('ordered_list_close', 'ol', -1);
  } else {
    token = state.push('bullet_list_close', 'ul', -1);
  }
  token.markup = String.fromCharCode(markerCharCode);

  listLines[1] = nextLine;
  state.line = nextLine;

  state.parentType = oldParentType;
  if (tight) {
    markTightParagraphs(state, listTokIdx);
  }

  return true;
};

},{"../common/utils":4}],26:[function(require,module,exports){

'use strict';


module.exports = function paragraph(state, startLine) {
  var content, terminate, i, l, token, oldParentType,
      nextLine = startLine + 1,
      terminatorRules = state.md.block.ruler.getRules('paragraph'),
      endLine = state.lineMax;

  oldParentType = state.parentType;
  state.parentType = 'paragraph';
  for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
    if (state.sCount[nextLine] - state.blkIndent > 3) { continue; }
    if (state.sCount[nextLine] < 0) { continue; }
    terminate = false;
    for (i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true;
        break;
      }
    }
    if (terminate) { break; }
  }

  content = state.getLines(startLine, nextLine, state.blkIndent, false).trim();

  state.line = nextLine;

  token          = state.push('paragraph_open', 'p', 1);
  token.map      = [ startLine, state.line ];

  token          = state.push('inline', '', 0);
  token.content  = content;
  token.map      = [ startLine, state.line ];
  token.children = [];

  token          = state.push('paragraph_close', 'p', -1);

  state.parentType = oldParentType;

  return true;
};

},{}],27:[function(require,module,exports){
'use strict';


var normalizeReference   = require('../common/utils').normalizeReference;
var isSpace              = require('../common/utils').isSpace;


module.exports = function reference(state, startLine, _endLine, silent) {
  var ch,
      destEndPos,
      destEndLineNo,
      endLine,
      href,
      i,
      l,
      label,
      labelEnd,
      oldParentType,
      res,
      start,
      str,
      terminate,
      terminatorRules,
      title,
      lines = 0,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine],
      nextLine = startLine + 1;
  if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

  if (state.src.charCodeAt(pos) !== 0x5B) { return false; }
  while (++pos < max) {
    if (state.src.charCodeAt(pos) === 0x5D  &&
        state.src.charCodeAt(pos - 1) !== 0x5C) {
      if (pos + 1 === max) { return false; }
      if (state.src.charCodeAt(pos + 1) !== 0x3A) { return false; }
      break;
    }
  }

  endLine = state.lineMax;
  terminatorRules = state.md.block.ruler.getRules('reference');

  oldParentType = state.parentType;
  state.parentType = 'reference';

  for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
    if (state.sCount[nextLine] - state.blkIndent > 3) { continue; }
    if (state.sCount[nextLine] < 0) { continue; }
    terminate = false;
    for (i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true;
        break;
      }
    }
    if (terminate) { break; }
  }

  str = state.getLines(startLine, nextLine, state.blkIndent, false).trim();
  max = str.length;

  for (pos = 1; pos < max; pos++) {
    ch = str.charCodeAt(pos);
    if (ch === 0x5B ) {
      return false;
    } else if (ch === 0x5D ) {
      labelEnd = pos;
      break;
    } else if (ch === 0x0A ) {
      lines++;
    } else if (ch === 0x5C ) {
      pos++;
      if (pos < max && str.charCodeAt(pos) === 0x0A) {
        lines++;
      }
    }
  }

  if (labelEnd < 0 || str.charCodeAt(labelEnd + 1) !== 0x3A) { return false; }
  for (pos = labelEnd + 2; pos < max; pos++) {
    ch = str.charCodeAt(pos);
    if (ch === 0x0A) {
      lines++;
    } else if (isSpace(ch)) {
    } else {
      break;
    }
  }
  res = state.md.helpers.parseLinkDestination(str, pos, max);
  if (!res.ok) { return false; }

  href = state.md.normalizeLink(res.str);
  if (!state.md.validateLink(href)) { return false; }

  pos = res.pos;
  lines += res.lines;
  destEndPos = pos;
  destEndLineNo = lines;
  start = pos;
  for (; pos < max; pos++) {
    ch = str.charCodeAt(pos);
    if (ch === 0x0A) {
      lines++;
    } else if (isSpace(ch)) {
    } else {
      break;
    }
  }
  res = state.md.helpers.parseLinkTitle(str, pos, max);
  if (pos < max && start !== pos && res.ok) {
    title = res.str;
    pos = res.pos;
    lines += res.lines;
  } else {
    title = '';
    pos = destEndPos;
    lines = destEndLineNo;
  }
  while (pos < max) {
    ch = str.charCodeAt(pos);
    if (!isSpace(ch)) { break; }
    pos++;
  }

  if (pos < max && str.charCodeAt(pos) !== 0x0A) {
    if (title) {
      title = '';
      pos = destEndPos;
      lines = destEndLineNo;
      while (pos < max) {
        ch = str.charCodeAt(pos);
        if (!isSpace(ch)) { break; }
        pos++;
      }
    }
  }

  if (pos < max && str.charCodeAt(pos) !== 0x0A) {
    return false;
  }

  label = normalizeReference(str.slice(1, labelEnd));
  if (!label) {
    return false;
  }
  if (silent) { return true; }

  if (typeof state.env.references === 'undefined') {
    state.env.references = {};
  }
  if (typeof state.env.references[label] === 'undefined') {
    state.env.references[label] = { title: title, href: href };
  }

  state.parentType = oldParentType;

  state.line = startLine + lines + 1;
  return true;
};

},{"../common/utils":4}],28:[function(require,module,exports){

'use strict';

var Token = require('../token');
var isSpace = require('../common/utils').isSpace;


function StateBlock(src, md, env, tokens) {
  var ch, s, start, pos, len, indent, offset, indent_found;

  this.src = src;
  this.md     = md;

  this.env = env;

  this.tokens = tokens;

  this.bMarks = [];  
  this.eMarks = [];  
  this.tShift = [];  
  this.sCount = [];  
  this.bsCount = [];
  this.blkIndent  = 0; 
  this.line       = 0; 
  this.lineMax    = 0; 
  this.tight      = false;  
  this.ddIndent   = -1; 
  this.listIndent = -1; 
  this.parentType = 'root';

  this.level = 0;
  this.result = '';
  s = this.src;
  indent_found = false;

  for (start = pos = indent = offset = 0, len = s.length; pos < len; pos++) {
    ch = s.charCodeAt(pos);

    if (!indent_found) {
      if (isSpace(ch)) {
        indent++;

        if (ch === 0x09) {
          offset += 4 - offset % 4;
        } else {
          offset++;
        }
        continue;
      } else {
        indent_found = true;
      }
    }

    if (ch === 0x0A || pos === len - 1) {
      if (ch !== 0x0A) { pos++; }
      this.bMarks.push(start);
      this.eMarks.push(pos);
      this.tShift.push(indent);
      this.sCount.push(offset);
      this.bsCount.push(0);

      indent_found = false;
      indent = 0;
      offset = 0;
      start = pos + 1;
    }
  }
  this.bMarks.push(s.length);
  this.eMarks.push(s.length);
  this.tShift.push(0);
  this.sCount.push(0);
  this.bsCount.push(0);

  this.lineMax = this.bMarks.length - 1; 
}
StateBlock.prototype.push = function (type, tag, nesting) {
  var token = new Token(type, tag, nesting);
  token.block = true;

  if (nesting < 0) this.level--; 
  token.level = this.level;
  if (nesting > 0) this.level++; 

  this.tokens.push(token);
  return token;
};

StateBlock.prototype.isEmpty = function isEmpty(line) {
  return this.bMarks[line] + this.tShift[line] >= this.eMarks[line];
};

StateBlock.prototype.skipEmptyLines = function skipEmptyLines(from) {
  for (var max = this.lineMax; from < max; from++) {
    if (this.bMarks[from] + this.tShift[from] < this.eMarks[from]) {
      break;
    }
  }
  return from;
};
StateBlock.prototype.skipSpaces = function skipSpaces(pos) {
  var ch;

  for (var max = this.src.length; pos < max; pos++) {
    ch = this.src.charCodeAt(pos);
    if (!isSpace(ch)) { break; }
  }
  return pos;
};
StateBlock.prototype.skipSpacesBack = function skipSpacesBack(pos, min) {
  if (pos <= min) { return pos; }

  while (pos > min) {
    if (!isSpace(this.src.charCodeAt(--pos))) { return pos + 1; }
  }
  return pos;
};
StateBlock.prototype.skipChars = function skipChars(pos, code) {
  for (var max = this.src.length; pos < max; pos++) {
    if (this.src.charCodeAt(pos) !== code) { break; }
  }
  return pos;
};
StateBlock.prototype.skipCharsBack = function skipCharsBack(pos, code, min) {
  if (pos <= min) { return pos; }

  while (pos > min) {
    if (code !== this.src.charCodeAt(--pos)) { return pos + 1; }
  }
  return pos;
};
StateBlock.prototype.getLines = function getLines(begin, end, indent, keepLastLF) {
  var i, lineIndent, ch, first, last, queue, lineStart,
      line = begin;

  if (begin >= end) {
    return '';
  }

  queue = new Array(end - begin);

  for (i = 0; line < end; line++, i++) {
    lineIndent = 0;
    lineStart = first = this.bMarks[line];

    if (line + 1 < end || keepLastLF) {
      last = this.eMarks[line] + 1;
    } else {
      last = this.eMarks[line];
    }

    while (first < last && lineIndent < indent) {
      ch = this.src.charCodeAt(first);

      if (isSpace(ch)) {
        if (ch === 0x09) {
          lineIndent += 4 - (lineIndent + this.bsCount[line]) % 4;
        } else {
          lineIndent++;
        }
      } else if (first - lineStart < this.tShift[line]) {
        lineIndent++;
      } else {
        break;
      }

      first++;
    }

    if (lineIndent > indent) {
      queue[i] = new Array(lineIndent - indent + 1).join(' ') + this.src.slice(first, last);
    } else {
      queue[i] = this.src.slice(first, last);
    }
  }

  return queue.join('');
};
StateBlock.prototype.Token = Token;


module.exports = StateBlock;

},{"../common/utils":4,"../token":51}],29:[function(require,module,exports){

'use strict';

var isSpace = require('../common/utils').isSpace;


function getLine(state, line) {
  var pos = state.bMarks[line] + state.blkIndent,
      max = state.eMarks[line];

  return state.src.substr(pos, max - pos);
}

function escapedSplit(str) {
  var result = [],
      pos = 0,
      max = str.length,
      ch,
      escapes = 0,
      lastPos = 0,
      backTicked = false,
      lastBackTick = 0;

  ch  = str.charCodeAt(pos);

  while (pos < max) {
    if (ch === 0x60) {
      if (backTicked) {
        backTicked = false;
        lastBackTick = pos;
      } else if (escapes % 2 === 0) {
        backTicked = true;
        lastBackTick = pos;
      }
    } else if (ch === 0x7c && (escapes % 2 === 0) && !backTicked) {
      result.push(str.substring(lastPos, pos));
      lastPos = pos + 1;
    }

    if (ch === 0x5c) {
      escapes++;
    } else {
      escapes = 0;
    }

    pos++;
    if (pos === max && backTicked) {
      backTicked = false;
      pos = lastBackTick + 1;
    }

    ch = str.charCodeAt(pos);
  }

  result.push(str.substring(lastPos));

  return result;
}


module.exports = function table(state, startLine, endLine, silent) {
  var ch, lineText, pos, i, nextLine, columns, columnCount, token,
      aligns, t, tableLines, tbodyLines;
  if (startLine + 2 > endLine) { return false; }

  nextLine = startLine + 1;

  if (state.sCount[nextLine] < state.blkIndent) { return false; }
  if (state.sCount[nextLine] - state.blkIndent >= 4) { return false; }

  pos = state.bMarks[nextLine] + state.tShift[nextLine];
  if (pos >= state.eMarks[nextLine]) { return false; }

  ch = state.src.charCodeAt(pos++);
  if (ch !== 0x7C && ch !== 0x2D && ch !== 0x3A) { return false; }

  while (pos < state.eMarks[nextLine]) {
    ch = state.src.charCodeAt(pos);

    if (ch !== 0x7C && ch !== 0x2D && ch !== 0x3A && !isSpace(ch)) { return false; }

    pos++;
  }

  lineText = getLine(state, startLine + 1);

  columns = lineText.split('|');
  aligns = [];
  for (i = 0; i < columns.length; i++) {
    t = columns[i].trim();
    if (!t) {
      if (i === 0 || i === columns.length - 1) {
        continue;
      } else {
        return false;
      }
    }

    if (!/^:?-+:?$/.test(t)) { return false; }
    if (t.charCodeAt(t.length - 1) === 0x3A) {
      aligns.push(t.charCodeAt(0) === 0x3A ? 'center' : 'right');
    } else if (t.charCodeAt(0) === 0x3A) {
      aligns.push('left');
    } else {
      aligns.push('');
    }
  }

  lineText = getLine(state, startLine).trim();
  if (lineText.indexOf('|') === -1) { return false; }
  if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }
  columns = escapedSplit(lineText.replace(/^\||\|$/g, ''));
  columnCount = columns.length;
  if (columnCount > aligns.length) { return false; }

  if (silent) { return true; }

  token     = state.push('table_open', 'table', 1);
  token.map = tableLines = [ startLine, 0 ];

  token     = state.push('thead_open', 'thead', 1);
  token.map = [ startLine, startLine + 1 ];

  token     = state.push('tr_open', 'tr', 1);
  token.map = [ startLine, startLine + 1 ];

  for (i = 0; i < columns.length; i++) {
    token          = state.push('th_open', 'th', 1);
    token.map      = [ startLine, startLine + 1 ];
    if (aligns[i]) {
      token.attrs  = [ [ 'style', 'text-align:' + aligns[i] ] ];
    }

    token          = state.push('inline', '', 0);
    token.content  = columns[i].trim();
    token.map      = [ startLine, startLine + 1 ];
    token.children = [];

    token          = state.push('th_close', 'th', -1);
  }

  token     = state.push('tr_close', 'tr', -1);
  token     = state.push('thead_close', 'thead', -1);

  token     = state.push('tbody_open', 'tbody', 1);
  token.map = tbodyLines = [ startLine + 2, 0 ];

  for (nextLine = startLine + 2; nextLine < endLine; nextLine++) {
    if (state.sCount[nextLine] < state.blkIndent) { break; }

    lineText = getLine(state, nextLine).trim();
    if (lineText.indexOf('|') === -1) { break; }
    if (state.sCount[nextLine] - state.blkIndent >= 4) { break; }
    columns = escapedSplit(lineText.replace(/^\||\|$/g, ''));

    token = state.push('tr_open', 'tr', 1);
    for (i = 0; i < columnCount; i++) {
      token          = state.push('td_open', 'td', 1);
      if (aligns[i]) {
        token.attrs  = [ [ 'style', 'text-align:' + aligns[i] ] ];
      }

      token          = state.push('inline', '', 0);
      token.content  = columns[i] ? columns[i].trim() : '';
      token.children = [];

      token          = state.push('td_close', 'td', -1);
    }
    token = state.push('tr_close', 'tr', -1);
  }
  token = state.push('tbody_close', 'tbody', -1);
  token = state.push('table_close', 'table', -1);

  tableLines[1] = tbodyLines[1] = nextLine;
  state.line = nextLine;
  return true;
};

},{"../common/utils":4}],30:[function(require,module,exports){
'use strict';


module.exports = function block(state) {
  var token;

  if (state.inlineMode) {
    token          = new state.Token('inline', '', 0);
    token.content  = state.src;
    token.map      = [ 0, 1 ];
    token.children = [];
    state.tokens.push(token);
  } else {
    state.md.block.parse(state.src, state.md, state.env, state.tokens);
  }
};

},{}],31:[function(require,module,exports){
'use strict';

module.exports = function inline(state) {
  var tokens = state.tokens, tok, i, l;
  for (i = 0, l = tokens.length; i < l; i++) {
    tok = tokens[i];
    if (tok.type === 'inline') {
      state.md.inline.parse(tok.content, state.md, state.env, tok.children);
    }
  }
};

},{}],32:[function(require,module,exports){
'use strict';


var arrayReplaceAt = require('../common/utils').arrayReplaceAt;


function isLinkOpen(str) {
  return /^<a[>\s]/i.test(str);
}
function isLinkClose(str) {
  return /^<\/a\s*>/i.test(str);
}


module.exports = function linkify(state) {
  var i, j, l, tokens, token, currentToken, nodes, ln, text, pos, lastPos,
      level, htmlLinkLevel, url, fullUrl, urlText,
      blockTokens = state.tokens,
      links;

  if (!state.md.options.linkify) { return; }

  for (j = 0, l = blockTokens.length; j < l; j++) {
    if (blockTokens[j].type !== 'inline' ||
        !state.md.linkify.pretest(blockTokens[j].content)) {
      continue;
    }

    tokens = blockTokens[j].children;

    htmlLinkLevel = 0;
    for (i = tokens.length - 1; i >= 0; i--) {
      currentToken = tokens[i];
      if (currentToken.type === 'link_close') {
        i--;
        while (tokens[i].level !== currentToken.level && tokens[i].type !== 'link_open') {
          i--;
        }
        continue;
      }
      if (currentToken.type === 'html_inline') {
        if (isLinkOpen(currentToken.content) && htmlLinkLevel > 0) {
          htmlLinkLevel--;
        }
        if (isLinkClose(currentToken.content)) {
          htmlLinkLevel++;
        }
      }
      if (htmlLinkLevel > 0) { continue; }

      if (currentToken.type === 'text' && state.md.linkify.test(currentToken.content)) {

        text = currentToken.content;
        links = state.md.linkify.match(text);
        nodes = [];
        level = currentToken.level;
        lastPos = 0;

        for (ln = 0; ln < links.length; ln++) {

          url = links[ln].url;
          fullUrl = state.md.normalizeLink(url);
          if (!state.md.validateLink(fullUrl)) { continue; }

          urlText = links[ln].text;
          if (!links[ln].schema) {
            urlText = state.md.normalizeLinkText('http://' + urlText).replace(/^http:\/\//, '');
          } else if (links[ln].schema === 'mailto:' && !/^mailto:/i.test(urlText)) {
            urlText = state.md.normalizeLinkText('mailto:' + urlText).replace(/^mailto:/, '');
          } else {
            urlText = state.md.normalizeLinkText(urlText);
          }

          pos = links[ln].index;

          if (pos > lastPos) {
            token         = new state.Token('text', '', 0);
            token.content = text.slice(lastPos, pos);
            token.level   = level;
            nodes.push(token);
          }

          token         = new state.Token('link_open', 'a', 1);
          token.attrs   = [ [ 'href', fullUrl ] ];
          token.level   = level++;
          token.markup  = 'linkify';
          token.info    = 'auto';
          nodes.push(token);

          token         = new state.Token('text', '', 0);
          token.content = urlText;
          token.level   = level;
          nodes.push(token);

          token         = new state.Token('link_close', 'a', -1);
          token.level   = --level;
          token.markup  = 'linkify';
          token.info    = 'auto';
          nodes.push(token);

          lastPos = links[ln].lastIndex;
        }
        if (lastPos < text.length) {
          token         = new state.Token('text', '', 0);
          token.content = text.slice(lastPos);
          token.level   = level;
          nodes.push(token);
        }
        blockTokens[j].children = tokens = arrayReplaceAt(tokens, i, nodes);
      }
    }
  }
};

},{"../common/utils":4}],33:[function(require,module,exports){

'use strict';
var NEWLINES_RE  = /\r\n?|\n/g;
var NULL_RE      = /\0/g;


module.exports = function normalize(state) {
  var str;
  str = state.src.replace(NEWLINES_RE, '\n');
  str = str.replace(NULL_RE, '\uFFFD');

  state.src = str;
};

},{}],34:[function(require,module,exports){
'use strict';

var RARE_RE = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/;
var SCOPED_ABBR_TEST_RE = /\((c|tm|r|p)\)/i;

var SCOPED_ABBR_RE = /\((c|tm|r|p)\)/ig;
var SCOPED_ABBR = {
  c: '©',
  r: '®',
  p: '§',
  tm: '™'
};

function replaceFn(match, name) {
  return SCOPED_ABBR[name.toLowerCase()];
}

function replace_scoped(inlineTokens) {
  var i, token, inside_autolink = 0;

  for (i = inlineTokens.length - 1; i >= 0; i--) {
    token = inlineTokens[i];

    if (token.type === 'text' && !inside_autolink) {
      token.content = token.content.replace(SCOPED_ABBR_RE, replaceFn);
    }

    if (token.type === 'link_open' && token.info === 'auto') {
      inside_autolink--;
    }

    if (token.type === 'link_close' && token.info === 'auto') {
      inside_autolink++;
    }
  }
}

function replace_rare(inlineTokens) {
  var i, token, inside_autolink = 0;

  for (i = inlineTokens.length - 1; i >= 0; i--) {
    token = inlineTokens[i];

    if (token.type === 'text' && !inside_autolink) {
      if (RARE_RE.test(token.content)) {
        token.content = token.content
          .replace(/\+-/g, '±')
          .replace(/\.{2,}/g, '…').replace(/([?!])…/g, '$1..')
          .replace(/([?!]){4,}/g, '$1$1$1').replace(/,{2,}/g, ',')
          .replace(/(^|[^-])---([^-]|$)/mg, '$1\u2014$2')
          .replace(/(^|\s)--(\s|$)/mg, '$1\u2013$2')
          .replace(/(^|[^-\s])--([^-\s]|$)/mg, '$1\u2013$2');
      }
    }

    if (token.type === 'link_open' && token.info === 'auto') {
      inside_autolink--;
    }

    if (token.type === 'link_close' && token.info === 'auto') {
      inside_autolink++;
    }
  }
}


module.exports = function replace(state) {
  var blkIdx;

  if (!state.md.options.typographer) { return; }

  for (blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx--) {

    if (state.tokens[blkIdx].type !== 'inline') { continue; }

    if (SCOPED_ABBR_TEST_RE.test(state.tokens[blkIdx].content)) {
      replace_scoped(state.tokens[blkIdx].children);
    }

    if (RARE_RE.test(state.tokens[blkIdx].content)) {
      replace_rare(state.tokens[blkIdx].children);
    }

  }
};

},{}],35:[function(require,module,exports){
'use strict';


var isWhiteSpace   = require('../common/utils').isWhiteSpace;
var isPunctChar    = require('../common/utils').isPunctChar;
var isMdAsciiPunct = require('../common/utils').isMdAsciiPunct;

var QUOTE_TEST_RE = /['"]/;
var QUOTE_RE = /['"]/g;
var APOSTROPHE = '\u2019'; 


function replaceAt(str, index, ch) {
  return str.substr(0, index) + ch + str.substr(index + 1);
}

function process_inlines(tokens, state) {
  var i, token, text, t, pos, max, thisLevel, item, lastChar, nextChar,
      isLastPunctChar, isNextPunctChar, isLastWhiteSpace, isNextWhiteSpace,
      canOpen, canClose, j, isSingle, stack, openQuote, closeQuote;

  stack = [];

  for (i = 0; i < tokens.length; i++) {
    token = tokens[i];

    thisLevel = tokens[i].level;

    for (j = stack.length - 1; j >= 0; j--) {
      if (stack[j].level <= thisLevel) { break; }
    }
    stack.length = j + 1;

    if (token.type !== 'text') { continue; }

    text = token.content;
    pos = 0;
    max = text.length;
    OUTER:
    while (pos < max) {
      QUOTE_RE.lastIndex = pos;
      t = QUOTE_RE.exec(text);
      if (!t) { break; }

      canOpen = canClose = true;
      pos = t.index + 1;
      isSingle = (t[0] === "'");
      lastChar = 0x20;

      if (t.index - 1 >= 0) {
        lastChar = text.charCodeAt(t.index - 1);
      } else {
        for (j = i - 1; j >= 0; j--) {
          if (tokens[j].type === 'softbreak' || tokens[j].type === 'hardbreak') break; 
          if (tokens[j].type !== 'text') continue;

          lastChar = tokens[j].content.charCodeAt(tokens[j].content.length - 1);
          break;
        }
      }
      nextChar = 0x20;

      if (pos < max) {
        nextChar = text.charCodeAt(pos);
      } else {
        for (j = i + 1; j < tokens.length; j++) {
          if (tokens[j].type === 'softbreak' || tokens[j].type === 'hardbreak') break; 
          if (tokens[j].type !== 'text') continue;

          nextChar = tokens[j].content.charCodeAt(0);
          break;
        }
      }

      isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctChar(String.fromCharCode(lastChar));
      isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctChar(String.fromCharCode(nextChar));

      isLastWhiteSpace = isWhiteSpace(lastChar);
      isNextWhiteSpace = isWhiteSpace(nextChar);

      if (isNextWhiteSpace) {
        canOpen = false;
      } else if (isNextPunctChar) {
        if (!(isLastWhiteSpace || isLastPunctChar)) {
          canOpen = false;
        }
      }

      if (isLastWhiteSpace) {
        canClose = false;
      } else if (isLastPunctChar) {
        if (!(isNextWhiteSpace || isNextPunctChar)) {
          canClose = false;
        }
      }

      if (nextChar === 0x22  && t[0] === '"') {
        if (lastChar >= 0x30  && lastChar <= 0x39 ) {
          canClose = canOpen = false;
        }
      }

      if (canOpen && canClose) {
        canOpen = false;
        canClose = isNextPunctChar;
      }

      if (!canOpen && !canClose) {
        if (isSingle) {
          token.content = replaceAt(token.content, t.index, APOSTROPHE);
        }
        continue;
      }

      if (canClose) {
        for (j = stack.length - 1; j >= 0; j--) {
          item = stack[j];
          if (stack[j].level < thisLevel) { break; }
          if (item.single === isSingle && stack[j].level === thisLevel) {
            item = stack[j];

            if (isSingle) {
              openQuote = state.md.options.quotes[2];
              closeQuote = state.md.options.quotes[3];
            } else {
              openQuote = state.md.options.quotes[0];
              closeQuote = state.md.options.quotes[1];
            }
            token.content = replaceAt(token.content, t.index, closeQuote);
            tokens[item.token].content = replaceAt(
              tokens[item.token].content, item.pos, openQuote);

            pos += closeQuote.length - 1;
            if (item.token === i) { pos += openQuote.length - 1; }

            text = token.content;
            max = text.length;

            stack.length = j;
            continue OUTER;
          }
        }
      }

      if (canOpen) {
        stack.push({
          token: i,
          pos: t.index,
          single: isSingle,
          level: thisLevel
        });
      } else if (canClose && isSingle) {
        token.content = replaceAt(token.content, t.index, APOSTROPHE);
      }
    }
  }
}


module.exports = function smartquotes(state) {
  var blkIdx;

  if (!state.md.options.typographer) { return; }

  for (blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx--) {

    if (state.tokens[blkIdx].type !== 'inline' ||
        !QUOTE_TEST_RE.test(state.tokens[blkIdx].content)) {
      continue;
    }

    process_inlines(state.tokens[blkIdx].children, state);
  }
};

},{"../common/utils":4}],36:[function(require,module,exports){
'use strict';

var Token = require('../token');


function StateCore(src, md, env) {
  this.src = src;
  this.env = env;
  this.tokens = [];
  this.inlineMode = false;
  this.md = md; 
}
StateCore.prototype.Token = Token;


module.exports = StateCore;

},{"../token":51}],37:[function(require,module,exports){

'use strict';
var EMAIL_RE    = /^<([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)>/;
var AUTOLINK_RE = /^<([a-zA-Z][a-zA-Z0-9+.\-]{1,31}):([^<>\x00-\x20]*)>/;


module.exports = function autolink(state, silent) {
  var tail, linkMatch, emailMatch, url, fullUrl, token,
      pos = state.pos;

  if (state.src.charCodeAt(pos) !== 0x3C) { return false; }

  tail = state.src.slice(pos);

  if (tail.indexOf('>') < 0) { return false; }

  if (AUTOLINK_RE.test(tail)) {
    linkMatch = tail.match(AUTOLINK_RE);

    url = linkMatch[0].slice(1, -1);
    fullUrl = state.md.normalizeLink(url);
    if (!state.md.validateLink(fullUrl)) { return false; }

    if (!silent) {
      token         = state.push('link_open', 'a', 1);
      token.attrs   = [ [ 'href', fullUrl ] ];
      token.markup  = 'autolink';
      token.info    = 'auto';

      token         = state.push('text', '', 0);
      token.content = state.md.normalizeLinkText(url);

      token         = state.push('link_close', 'a', -1);
      token.markup  = 'autolink';
      token.info    = 'auto';
    }

    state.pos += linkMatch[0].length;
    return true;
  }

  if (EMAIL_RE.test(tail)) {
    emailMatch = tail.match(EMAIL_RE);

    url = emailMatch[0].slice(1, -1);
    fullUrl = state.md.normalizeLink('mailto:' + url);
    if (!state.md.validateLink(fullUrl)) { return false; }

    if (!silent) {
      token         = state.push('link_open', 'a', 1);
      token.attrs   = [ [ 'href', fullUrl ] ];
      token.markup  = 'autolink';
      token.info    = 'auto';

      token         = state.push('text', '', 0);
      token.content = state.md.normalizeLinkText(url);

      token         = state.push('link_close', 'a', -1);
      token.markup  = 'autolink';
      token.info    = 'auto';
    }

    state.pos += emailMatch[0].length;
    return true;
  }

  return false;
};

},{}],38:[function(require,module,exports){

'use strict';

module.exports = function backtick(state, silent) {
  var start, max, marker, matchStart, matchEnd, token,
      pos = state.pos,
      ch = state.src.charCodeAt(pos);

  if (ch !== 0x60) { return false; }

  start = pos;
  pos++;
  max = state.posMax;

  while (pos < max && state.src.charCodeAt(pos) === 0x60) { pos++; }

  marker = state.src.slice(start, pos);

  matchStart = matchEnd = pos;

  while ((matchStart = state.src.indexOf('`', matchEnd)) !== -1) {
    matchEnd = matchStart + 1;

    while (matchEnd < max && state.src.charCodeAt(matchEnd) === 0x60) { matchEnd++; }

    if (matchEnd - matchStart === marker.length) {
      if (!silent) {
        token         = state.push('code_inline', 'code', 0);
        token.markup  = marker;
        token.content = state.src.slice(pos, matchStart)
          .replace(/\n/g, ' ')
          .replace(/^ (.+) $/, '$1');
      }
      state.pos = matchEnd;
      return true;
    }
  }

  if (!silent) { state.pending += marker; }
  state.pos += marker.length;
  return true;
};

},{}],39:[function(require,module,exports){
'use strict';


function processDelimiters(state, delimiters) {
  var closerIdx, openerIdx, closer, opener, minOpenerIdx, newMinOpenerIdx,
      isOddMatch, lastJump,
      openersBottom = {},
      max = delimiters.length;

  for (closerIdx = 0; closerIdx < max; closerIdx++) {
    closer = delimiters[closerIdx];
    closer.length = closer.length || 0;

    if (!closer.close) continue;
    if (!openersBottom.hasOwnProperty(closer.marker)) {
      openersBottom[closer.marker] = [ -1, -1, -1 ];
    }

    minOpenerIdx = openersBottom[closer.marker][closer.length % 3];
    newMinOpenerIdx = -1;

    openerIdx = closerIdx - closer.jump - 1;

    for (; openerIdx > minOpenerIdx; openerIdx -= opener.jump + 1) {
      opener = delimiters[openerIdx];

      if (opener.marker !== closer.marker) continue;

      if (newMinOpenerIdx === -1) newMinOpenerIdx = openerIdx;

      if (opener.open &&
          opener.end < 0 &&
          opener.level === closer.level) {

        isOddMatch = false;
        if (opener.close || closer.open) {
          if ((opener.length + closer.length) % 3 === 0) {
            if (opener.length % 3 !== 0 || closer.length % 3 !== 0) {
              isOddMatch = true;
            }
          }
        }

        if (!isOddMatch) {
          lastJump = openerIdx > 0 && !delimiters[openerIdx - 1].open ?
            delimiters[openerIdx - 1].jump + 1 :
            0;

          closer.jump  = closerIdx - openerIdx + lastJump;
          closer.open  = false;
          opener.end   = closerIdx;
          opener.jump  = lastJump;
          opener.close = false;
          newMinOpenerIdx = -1;
          break;
        }
      }
    }

    if (newMinOpenerIdx !== -1) {
      openersBottom[closer.marker][(closer.length || 0) % 3] = newMinOpenerIdx;
    }
  }
}


module.exports = function link_pairs(state) {
  var curr,
      tokens_meta = state.tokens_meta,
      max = state.tokens_meta.length;

  processDelimiters(state, state.delimiters);

  for (curr = 0; curr < max; curr++) {
    if (tokens_meta[curr] && tokens_meta[curr].delimiters) {
      processDelimiters(state, tokens_meta[curr].delimiters);
    }
  }
};

},{}],40:[function(require,module,exports){
'use strict';
module.exports.tokenize = function emphasis(state, silent) {
  var i, scanned, token,
      start = state.pos,
      marker = state.src.charCodeAt(start);

  if (silent) { return false; }

  if (marker !== 0x5F  && marker !== 0x2A ) { return false; }

  scanned = state.scanDelims(state.pos, marker === 0x2A);

  for (i = 0; i < scanned.length; i++) {
    token         = state.push('text', '', 0);
    token.content = String.fromCharCode(marker);

    state.delimiters.push({
      marker: marker,
      length: scanned.length,
      jump:   i,
      token:  state.tokens.length - 1,
      end:    -1,
      open:   scanned.can_open,
      close:  scanned.can_close
    });
  }

  state.pos += scanned.length;

  return true;
};


function postProcess(state, delimiters) {
  var i,
      startDelim,
      endDelim,
      token,
      ch,
      isStrong,
      max = delimiters.length;

  for (i = max - 1; i >= 0; i--) {
    startDelim = delimiters[i];

    if (startDelim.marker !== 0x5F && startDelim.marker !== 0x2A) {
      continue;
    }
    if (startDelim.end === -1) {
      continue;
    }

    endDelim = delimiters[startDelim.end];
    isStrong = i > 0 &&
               delimiters[i - 1].end === startDelim.end + 1 &&
               delimiters[i - 1].token === startDelim.token - 1 &&
               delimiters[startDelim.end + 1].token === endDelim.token + 1 &&
               delimiters[i - 1].marker === startDelim.marker;

    ch = String.fromCharCode(startDelim.marker);

    token         = state.tokens[startDelim.token];
    token.type    = isStrong ? 'strong_open' : 'em_open';
    token.tag     = isStrong ? 'strong' : 'em';
    token.nesting = 1;
    token.markup  = isStrong ? ch + ch : ch;
    token.content = '';

    token         = state.tokens[endDelim.token];
    token.type    = isStrong ? 'strong_close' : 'em_close';
    token.tag     = isStrong ? 'strong' : 'em';
    token.nesting = -1;
    token.markup  = isStrong ? ch + ch : ch;
    token.content = '';

    if (isStrong) {
      state.tokens[delimiters[i - 1].token].content = '';
      state.tokens[delimiters[startDelim.end + 1].token].content = '';
      i--;
    }
  }
}
module.exports.postProcess = function emphasis(state) {
  var curr,
      tokens_meta = state.tokens_meta,
      max = state.tokens_meta.length;

  postProcess(state, state.delimiters);

  for (curr = 0; curr < max; curr++) {
    if (tokens_meta[curr] && tokens_meta[curr].delimiters) {
      postProcess(state, tokens_meta[curr].delimiters);
    }
  }
};

},{}],41:[function(require,module,exports){

'use strict';

var entities          = require('../common/entities');
var has               = require('../common/utils').has;
var isValidEntityCode = require('../common/utils').isValidEntityCode;
var fromCodePoint     = require('../common/utils').fromCodePoint;


var DIGITAL_RE = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i;
var NAMED_RE   = /^&([a-z][a-z0-9]{1,31});/i;


module.exports = function entity(state, silent) {
  var ch, code, match, pos = state.pos, max = state.posMax;

  if (state.src.charCodeAt(pos) !== 0x26) { return false; }

  if (pos + 1 < max) {
    ch = state.src.charCodeAt(pos + 1);

    if (ch === 0x23 ) {
      match = state.src.slice(pos).match(DIGITAL_RE);
      if (match) {
        if (!silent) {
          code = match[1][0].toLowerCase() === 'x' ? parseInt(match[1].slice(1), 16) : parseInt(match[1], 10);
          state.pending += isValidEntityCode(code) ? fromCodePoint(code) : fromCodePoint(0xFFFD);
        }
        state.pos += match[0].length;
        return true;
      }
    } else {
      match = state.src.slice(pos).match(NAMED_RE);
      if (match) {
        if (has(entities, match[1])) {
          if (!silent) { state.pending += entities[match[1]]; }
          state.pos += match[0].length;
          return true;
        }
      }
    }
  }

  if (!silent) { state.pending += '&'; }
  state.pos++;
  return true;
};

},{"../common/entities":1,"../common/utils":4}],42:[function(require,module,exports){

'use strict';

var isSpace = require('../common/utils').isSpace;

var ESCAPED = [];

for (var i = 0; i < 256; i++) { ESCAPED.push(0); }

'\\!"#$%&\'()*+,./:;<=>?@[]^_`{|}~-'
  .split('').forEach(function (ch) { ESCAPED[ch.charCodeAt(0)] = 1; });


module.exports = function escape(state, silent) {
  var ch, pos = state.pos, max = state.posMax;

  if (state.src.charCodeAt(pos) !== 0x5C) { return false; }

  pos++;

  if (pos < max) {
    ch = state.src.charCodeAt(pos);

    if (ch < 256 && ESCAPED[ch] !== 0) {
      if (!silent) { state.pending += state.src[pos]; }
      state.pos += 2;
      return true;
    }

    if (ch === 0x0A) {
      if (!silent) {
        state.push('hardbreak', 'br', 0);
      }

      pos++;
      while (pos < max) {
        ch = state.src.charCodeAt(pos);
        if (!isSpace(ch)) { break; }
        pos++;
      }

      state.pos = pos;
      return true;
    }
  }

  if (!silent) { state.pending += '\\'; }
  state.pos++;
  return true;
};

},{"../common/utils":4}],43:[function(require,module,exports){

'use strict';


var HTML_TAG_RE = require('../common/html_re').HTML_TAG_RE;


function isLetter(ch) {
  var lc = ch | 0x20; 
  return (lc >= 0x61) && (lc <= 0x7a);
}


module.exports = function html_inline(state, silent) {
  var ch, match, max, token,
      pos = state.pos;

  if (!state.md.options.html) { return false; }
  max = state.posMax;
  if (state.src.charCodeAt(pos) !== 0x3C ||
      pos + 2 >= max) {
    return false;
  }
  ch = state.src.charCodeAt(pos + 1);
  if (ch !== 0x21 &&
      ch !== 0x3F &&
      ch !== 0x2F &&
      !isLetter(ch)) {
    return false;
  }

  match = state.src.slice(pos).match(HTML_TAG_RE);
  if (!match) { return false; }

  if (!silent) {
    token         = state.push('html_inline', '', 0);
    token.content = state.src.slice(pos, pos + match[0].length);
  }
  state.pos += match[0].length;
  return true;
};

},{"../common/html_re":3}],44:[function(require,module,exports){

'use strict';

var normalizeReference   = require('../common/utils').normalizeReference;
var isSpace              = require('../common/utils').isSpace;


module.exports = function image(state, silent) {
  var attrs,
      code,
      content,
      label,
      labelEnd,
      labelStart,
      pos,
      ref,
      res,
      title,
      token,
      tokens,
      start,
      href = '',
      oldPos = state.pos,
      max = state.posMax;

  if (state.src.charCodeAt(state.pos) !== 0x21) { return false; }
  if (state.src.charCodeAt(state.pos + 1) !== 0x5B) { return false; }

  labelStart = state.pos + 2;
  labelEnd = state.md.helpers.parseLinkLabel(state, state.pos + 1, false);
  if (labelEnd < 0) { return false; }

  pos = labelEnd + 1;
  if (pos < max && state.src.charCodeAt(pos) === 0x28) {
    pos++;
    for (; pos < max; pos++) {
      code = state.src.charCodeAt(pos);
      if (!isSpace(code) && code !== 0x0A) { break; }
    }
    if (pos >= max) { return false; }
    start = pos;
    res = state.md.helpers.parseLinkDestination(state.src, pos, state.posMax);
    if (res.ok) {
      href = state.md.normalizeLink(res.str);
      if (state.md.validateLink(href)) {
        pos = res.pos;
      } else {
        href = '';
      }
    }
    start = pos;
    for (; pos < max; pos++) {
      code = state.src.charCodeAt(pos);
      if (!isSpace(code) && code !== 0x0A) { break; }
    }
    res = state.md.helpers.parseLinkTitle(state.src, pos, state.posMax);
    if (pos < max && start !== pos && res.ok) {
      title = res.str;
      pos = res.pos;
      for (; pos < max; pos++) {
        code = state.src.charCodeAt(pos);
        if (!isSpace(code) && code !== 0x0A) { break; }
      }
    } else {
      title = '';
    }

    if (pos >= max || state.src.charCodeAt(pos) !== 0x29) {
      state.pos = oldPos;
      return false;
    }
    pos++;
  } else {
    if (typeof state.env.references === 'undefined') { return false; }

    if (pos < max && state.src.charCodeAt(pos) === 0x5B) {
      start = pos + 1;
      pos = state.md.helpers.parseLinkLabel(state, pos);
      if (pos >= 0) {
        label = state.src.slice(start, pos++);
      } else {
        pos = labelEnd + 1;
      }
    } else {
      pos = labelEnd + 1;
    }
    if (!label) { label = state.src.slice(labelStart, labelEnd); }

    ref = state.env.references[normalizeReference(label)];
    if (!ref) {
      state.pos = oldPos;
      return false;
    }
    href = ref.href;
    title = ref.title;
  }
  if (!silent) {
    content = state.src.slice(labelStart, labelEnd);

    state.md.inline.parse(
      content,
      state.md,
      state.env,
      tokens = []
    );

    token          = state.push('image', 'img', 0);
    token.attrs    = attrs = [ [ 'src', href ], [ 'alt', '' ] ];
    token.children = tokens;
    token.content  = content;

    if (title) {
      attrs.push([ 'title', title ]);
    }
  }

  state.pos = pos;
  state.posMax = max;
  return true;
};

},{"../common/utils":4}],45:[function(require,module,exports){

'use strict';

var normalizeReference   = require('../common/utils').normalizeReference;
var isSpace              = require('../common/utils').isSpace;


module.exports = function link(state, silent) {
  var attrs,
      code,
      label,
      labelEnd,
      labelStart,
      pos,
      res,
      ref,
      title,
      token,
      href = '',
      oldPos = state.pos,
      max = state.posMax,
      start = state.pos,
      parseReference = true;

  if (state.src.charCodeAt(state.pos) !== 0x5B) { return false; }

  labelStart = state.pos + 1;
  labelEnd = state.md.helpers.parseLinkLabel(state, state.pos, true);
  if (labelEnd < 0) { return false; }

  pos = labelEnd + 1;
  if (pos < max && state.src.charCodeAt(pos) === 0x28) {
    parseReference = false;
    pos++;
    for (; pos < max; pos++) {
      code = state.src.charCodeAt(pos);
      if (!isSpace(code) && code !== 0x0A) { break; }
    }
    if (pos >= max) { return false; }
    start = pos;
    res = state.md.helpers.parseLinkDestination(state.src, pos, state.posMax);
    if (res.ok) {
      href = state.md.normalizeLink(res.str);
      if (state.md.validateLink(href)) {
        pos = res.pos;
      } else {
        href = '';
      }
    }
    start = pos;
    for (; pos < max; pos++) {
      code = state.src.charCodeAt(pos);
      if (!isSpace(code) && code !== 0x0A) { break; }
    }
    res = state.md.helpers.parseLinkTitle(state.src, pos, state.posMax);
    if (pos < max && start !== pos && res.ok) {
      title = res.str;
      pos = res.pos;
      for (; pos < max; pos++) {
        code = state.src.charCodeAt(pos);
        if (!isSpace(code) && code !== 0x0A) { break; }
      }
    } else {
      title = '';
    }

    if (pos >= max || state.src.charCodeAt(pos) !== 0x29) {
      parseReference = true;
    }
    pos++;
  }

  if (parseReference) {
    if (typeof state.env.references === 'undefined') { return false; }

    if (pos < max && state.src.charCodeAt(pos) === 0x5B) {
      start = pos + 1;
      pos = state.md.helpers.parseLinkLabel(state, pos);
      if (pos >= 0) {
        label = state.src.slice(start, pos++);
      } else {
        pos = labelEnd + 1;
      }
    } else {
      pos = labelEnd + 1;
    }
    if (!label) { label = state.src.slice(labelStart, labelEnd); }

    ref = state.env.references[normalizeReference(label)];
    if (!ref) {
      state.pos = oldPos;
      return false;
    }
    href = ref.href;
    title = ref.title;
  }
  if (!silent) {
    state.pos = labelStart;
    state.posMax = labelEnd;

    token        = state.push('link_open', 'a', 1);
    token.attrs  = attrs = [ [ 'href', href ] ];
    if (title) {
      attrs.push([ 'title', title ]);
    }

    state.md.inline.tokenize(state);

    token        = state.push('link_close', 'a', -1);
  }

  state.pos = pos;
  state.posMax = max;
  return true;
};

},{"../common/utils":4}],46:[function(require,module,exports){

'use strict';

var isSpace = require('../common/utils').isSpace;


module.exports = function newline(state, silent) {
  var pmax, max, pos = state.pos;

  if (state.src.charCodeAt(pos) !== 0x0A) { return false; }

  pmax = state.pending.length - 1;
  max = state.posMax;
  if (!silent) {
    if (pmax >= 0 && state.pending.charCodeAt(pmax) === 0x20) {
      if (pmax >= 1 && state.pending.charCodeAt(pmax - 1) === 0x20) {
        state.pending = state.pending.replace(/ +$/, '');
        state.push('hardbreak', 'br', 0);
      } else {
        state.pending = state.pending.slice(0, -1);
        state.push('softbreak', 'br', 0);
      }

    } else {
      state.push('softbreak', 'br', 0);
    }
  }

  pos++;
  while (pos < max && isSpace(state.src.charCodeAt(pos))) { pos++; }

  state.pos = pos;
  return true;
};

},{"../common/utils":4}],47:[function(require,module,exports){

'use strict';


var Token          = require('../token');
var isWhiteSpace   = require('../common/utils').isWhiteSpace;
var isPunctChar    = require('../common/utils').isPunctChar;
var isMdAsciiPunct = require('../common/utils').isMdAsciiPunct;


function StateInline(src, md, env, outTokens) {
  this.src = src;
  this.env = env;
  this.md = md;
  this.tokens = outTokens;
  this.tokens_meta = Array(outTokens.length);

  this.pos = 0;
  this.posMax = this.src.length;
  this.level = 0;
  this.pending = '';
  this.pendingLevel = 0;
  this.cache = {};
  this.delimiters = [];
  this._prev_delimiters = [];
}
StateInline.prototype.pushPending = function () {
  var token = new Token('text', '', 0);
  token.content = this.pending;
  token.level = this.pendingLevel;
  this.tokens.push(token);
  this.pending = '';
  return token;
};
StateInline.prototype.push = function (type, tag, nesting) {
  if (this.pending) {
    this.pushPending();
  }

  var token = new Token(type, tag, nesting);
  var token_meta = null;

  if (nesting < 0) {
    this.level--;
    this.delimiters = this._prev_delimiters.pop();
  }

  token.level = this.level;

  if (nesting > 0) {
    this.level++;
    this._prev_delimiters.push(this.delimiters);
    this.delimiters = [];
    token_meta = { delimiters: this.delimiters };
  }

  this.pendingLevel = this.level;
  this.tokens.push(token);
  this.tokens_meta.push(token_meta);
  return token;
};
StateInline.prototype.scanDelims = function (start, canSplitWord) {
  var pos = start, lastChar, nextChar, count, can_open, can_close,
      isLastWhiteSpace, isLastPunctChar,
      isNextWhiteSpace, isNextPunctChar,
      left_flanking = true,
      right_flanking = true,
      max = this.posMax,
      marker = this.src.charCodeAt(start);
  lastChar = start > 0 ? this.src.charCodeAt(start - 1) : 0x20;

  while (pos < max && this.src.charCodeAt(pos) === marker) { pos++; }

  count = pos - start;
  nextChar = pos < max ? this.src.charCodeAt(pos) : 0x20;

  isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctChar(String.fromCharCode(lastChar));
  isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctChar(String.fromCharCode(nextChar));

  isLastWhiteSpace = isWhiteSpace(lastChar);
  isNextWhiteSpace = isWhiteSpace(nextChar);

  if (isNextWhiteSpace) {
    left_flanking = false;
  } else if (isNextPunctChar) {
    if (!(isLastWhiteSpace || isLastPunctChar)) {
      left_flanking = false;
    }
  }

  if (isLastWhiteSpace) {
    right_flanking = false;
  } else if (isLastPunctChar) {
    if (!(isNextWhiteSpace || isNextPunctChar)) {
      right_flanking = false;
    }
  }

  if (!canSplitWord) {
    can_open  = left_flanking  && (!right_flanking || isLastPunctChar);
    can_close = right_flanking && (!left_flanking  || isNextPunctChar);
  } else {
    can_open  = left_flanking;
    can_close = right_flanking;
  }

  return {
    can_open:  can_open,
    can_close: can_close,
    length:    count
  };
};
StateInline.prototype.Token = Token;


module.exports = StateInline;

},{"../common/utils":4,"../token":51}],48:[function(require,module,exports){
'use strict';
module.exports.tokenize = function strikethrough(state, silent) {
  var i, scanned, token, len, ch,
      start = state.pos,
      marker = state.src.charCodeAt(start);

  if (silent) { return false; }

  if (marker !== 0x7E) { return false; }

  scanned = state.scanDelims(state.pos, true);
  len = scanned.length;
  ch = String.fromCharCode(marker);

  if (len < 2) { return false; }

  if (len % 2) {
    token         = state.push('text', '', 0);
    token.content = ch;
    len--;
  }

  for (i = 0; i < len; i += 2) {
    token         = state.push('text', '', 0);
    token.content = ch + ch;

    state.delimiters.push({
      marker: marker,
      length: 0, 
      jump:   i,
      token:  state.tokens.length - 1,
      end:    -1,
      open:   scanned.can_open,
      close:  scanned.can_close
    });
  }

  state.pos += scanned.length;

  return true;
};


function postProcess(state, delimiters) {
  var i, j,
      startDelim,
      endDelim,
      token,
      loneMarkers = [],
      max = delimiters.length;

  for (i = 0; i < max; i++) {
    startDelim = delimiters[i];

    if (startDelim.marker !== 0x7E) {
      continue;
    }

    if (startDelim.end === -1) {
      continue;
    }

    endDelim = delimiters[startDelim.end];

    token         = state.tokens[startDelim.token];
    token.type    = 's_open';
    token.tag     = 's';
    token.nesting = 1;
    token.markup  = '~~';
    token.content = '';

    token         = state.tokens[endDelim.token];
    token.type    = 's_close';
    token.tag     = 's';
    token.nesting = -1;
    token.markup  = '~~';
    token.content = '';

    if (state.tokens[endDelim.token - 1].type === 'text' &&
        state.tokens[endDelim.token - 1].content === '~') {

      loneMarkers.push(endDelim.token - 1);
    }
  }
  while (loneMarkers.length) {
    i = loneMarkers.pop();
    j = i + 1;

    while (j < state.tokens.length && state.tokens[j].type === 's_close') {
      j++;
    }

    j--;

    if (i !== j) {
      token = state.tokens[j];
      state.tokens[j] = state.tokens[i];
      state.tokens[i] = token;
    }
  }
}
module.exports.postProcess = function strikethrough(state) {
  var curr,
      tokens_meta = state.tokens_meta,
      max = state.tokens_meta.length;

  postProcess(state, state.delimiters);

  for (curr = 0; curr < max; curr++) {
    if (tokens_meta[curr] && tokens_meta[curr].delimiters) {
      postProcess(state, tokens_meta[curr].delimiters);
    }
  }
};

},{}],49:[function(require,module,exports){

'use strict';
function isTerminatorChar(ch) {
  switch (ch) {
    case 0x0A:
    case 0x21:
    case 0x23:
    case 0x24:
    case 0x25:
    case 0x26:
    case 0x2A:
    case 0x2B:
    case 0x2D:
    case 0x3A:
    case 0x3C:
    case 0x3D:
    case 0x3E:
    case 0x40:
    case 0x5B:
    case 0x5C:
    case 0x5D:
    case 0x5E:
    case 0x5F:
    case 0x60:
    case 0x7B:
    case 0x7D:
    case 0x7E:
      return true;
    default:
      return false;
  }
}

module.exports = function text(state, silent) {
  var pos = state.pos;

  while (pos < state.posMax && !isTerminatorChar(state.src.charCodeAt(pos))) {
    pos++;
  }

  if (pos === state.pos) { return false; }

  if (!silent) { state.pending += state.src.slice(state.pos, pos); }

  state.pos = pos;

  return true;
};

},{}],50:[function(require,module,exports){
'use strict';


module.exports = function text_collapse(state) {
  var curr, last,
      level = 0,
      tokens = state.tokens,
      max = state.tokens.length;

  for (curr = last = 0; curr < max; curr++) {
    if (tokens[curr].nesting < 0) level--; 
    tokens[curr].level = level;
    if (tokens[curr].nesting > 0) level++; 

    if (tokens[curr].type === 'text' &&
        curr + 1 < max &&
        tokens[curr + 1].type === 'text') {
      tokens[curr + 1].content = tokens[curr].content + tokens[curr + 1].content;
    } else {
      if (curr !== last) { tokens[last] = tokens[curr]; }

      last++;
    }
  }

  if (curr !== last) {
    tokens.length = last;
  }
};

},{}],51:[function(require,module,exports){

'use strict';
function Token(type, tag, nesting) {
  this.type     = type;
  this.tag      = tag;
  this.attrs    = null;
  this.map      = null;
  this.nesting  = nesting;
  this.level    = 0;
  this.children = null;
  this.content  = '';
  this.markup   = '';
  this.info     = '';
  this.meta     = null;
  this.block    = false;
  this.hidden   = false;
}
Token.prototype.attrIndex = function attrIndex(name) {
  var attrs, i, len;

  if (!this.attrs) { return -1; }

  attrs = this.attrs;

  for (i = 0, len = attrs.length; i < len; i++) {
    if (attrs[i][0] === name) { return i; }
  }
  return -1;
};
Token.prototype.attrPush = function attrPush(attrData) {
  if (this.attrs) {
    this.attrs.push(attrData);
  } else {
    this.attrs = [ attrData ];
  }
};
Token.prototype.attrSet = function attrSet(name, value) {
  var idx = this.attrIndex(name),
      attrData = [ name, value ];

  if (idx < 0) {
    this.attrPush(attrData);
  } else {
    this.attrs[idx] = attrData;
  }
};
Token.prototype.attrGet = function attrGet(name) {
  var idx = this.attrIndex(name), value = null;
  if (idx >= 0) {
    value = this.attrs[idx][1];
  }
  return value;
};
Token.prototype.attrJoin = function attrJoin(name, value) {
  var idx = this.attrIndex(name);

  if (idx < 0) {
    this.attrPush([ name, value ]);
  } else {
    this.attrs[idx][1] = this.attrs[idx][1] + ' ' + value;
  }
};


module.exports = Token;

},{}],52:[function(require,module,exports){
module.exports={ "Aacute": "\u00C1", "aacute": "\u00E1", "Abreve": "\u0102", "abreve": "\u0103", "ac": "\u223E", "acd": "\u223F", "acE": "\u223E\u0333", "Acirc": "\u00C2", "acirc": "\u00E2", "acute": "\u00B4", "Acy": "\u0410", "acy": "\u0430", "AElig": "\u00C6", "aelig": "\u00E6", "af": "\u2061", "Afr": "\uD835\uDD04", "afr": "\uD835\uDD1E", "Agrave": "\u00C0", "agrave": "\u00E0", "alefsym": "\u2135", "aleph": "\u2135", "Alpha": "\u0391", "alpha": "\u03B1", "Amacr": "\u0100", "amacr": "\u0101", "amalg": "\u2A3F", "amp": "&", "AMP": "&", "andand": "\u2A55", "And": "\u2A53", "and": "\u2227", "andd": "\u2A5C", "andslope": "\u2A58", "andv": "\u2A5A", "ang": "\u2220", "ange": "\u29A4", "angle": "\u2220", "angmsdaa": "\u29A8", "angmsdab": "\u29A9", "angmsdac": "\u29AA", "angmsdad": "\u29AB", "angmsdae": "\u29AC", "angmsdaf": "\u29AD", "angmsdag": "\u29AE", "angmsdah": "\u29AF", "angmsd": "\u2221", "angrt": "\u221F", "angrtvb": "\u22BE", "angrtvbd": "\u299D", "angsph": "\u2222", "angst": "\u00C5", "angzarr": "\u237C", "Aogon": "\u0104", "aogon": "\u0105", "Aopf": "\uD835\uDD38", "aopf": "\uD835\uDD52", "apacir": "\u2A6F", "ap": "\u2248", "apE": "\u2A70", "ape": "\u224A", "apid": "\u224B", "apos": "'", "ApplyFunction": "\u2061", "approx": "\u2248", "approxeq": "\u224A", "Aring": "\u00C5", "aring": "\u00E5", "Ascr": "\uD835\uDC9C", "ascr": "\uD835\uDCB6", "Assign": "\u2254", "ast": "*", "asymp": "\u2248", "asympeq": "\u224D", "Atilde": "\u00C3", "atilde": "\u00E3", "Auml": "\u00C4", "auml": "\u00E4", "awconint": "\u2233", "awint": "\u2A11", "backcong": "\u224C", "backepsilon": "\u03F6", "backprime": "\u2035", "backsim": "\u223D", "backsimeq": "\u22CD", "Backslash": "\u2216", "Barv": "\u2AE7", "barvee": "\u22BD", "barwed": "\u2305", "Barwed": "\u2306", "barwedge": "\u2305", "bbrk": "\u23B5", "bbrktbrk": "\u23B6", "bcong": "\u224C", "Bcy": "\u0411", "bcy": "\u0431", "bdquo": "\u201E", "becaus": "\u2235", "because": "\u2235", "Because": "\u2235", "bemptyv": "\u29B0", "bepsi": "\u03F6", "bernou": "\u212C", "Bernoullis": "\u212C", "Beta": "\u0392", "beta": "\u03B2", "beth": "\u2136", "between": "\u226C", "Bfr": "\uD835\uDD05", "bfr": "\uD835\uDD1F", "bigcap": "\u22C2", "bigcirc": "\u25EF", "bigcup": "\u22C3", "bigodot": "\u2A00", "bigoplus": "\u2A01", "bigotimes": "\u2A02", "bigsqcup": "\u2A06", "bigstar": "\u2605", "bigtriangledown": "\u25BD", "bigtriangleup": "\u25B3", "biguplus": "\u2A04", "bigvee": "\u22C1", "bigwedge": "\u22C0", "bkarow": "\u290D", "blacklozenge": "\u29EB", "blacksquare": "\u25AA", "blacktriangle": "\u25B4", "blacktriangledown": "\u25BE", "blacktriangleleft": "\u25C2", "blacktriangleright": "\u25B8", "blank": "\u2423", "blk12": "\u2592", "blk14": "\u2591", "blk34": "\u2593", "block": "\u2588", "bne": "=\u20E5", "bnequiv": "\u2261\u20E5", "bNot": "\u2AED", "bnot": "\u2310", "Bopf": "\uD835\uDD39", "bopf": "\uD835\uDD53", "bot": "\u22A5", "bottom": "\u22A5", "bowtie": "\u22C8", "boxbox": "\u29C9", "boxdl": "\u2510", "boxdL": "\u2555", "boxDl": "\u2556", "boxDL": "\u2557", "boxdr": "\u250C", "boxdR": "\u2552", "boxDr": "\u2553", "boxDR": "\u2554", "boxh": "\u2500", "boxH": "\u2550", "boxhd": "\u252C", "boxHd": "\u2564", "boxhD": "\u2565", "boxHD": "\u2566", "boxhu": "\u2534", "boxHu": "\u2567", "boxhU": "\u2568", "boxHU": "\u2569", "boxminus": "\u229F", "boxplus": "\u229E", "boxtimes": "\u22A0", "boxul": "\u2518", "boxuL": "\u255B", "boxUl": "\u255C", "boxUL": "\u255D", "boxur": "\u2514", "boxuR": "\u2558", "boxUr": "\u2559", "boxUR": "\u255A", "boxv": "\u2502", "boxV": "\u2551", "boxvh": "\u253C", "boxvH": "\u256A", "boxVh": "\u256B", "boxVH": "\u256C", "boxvl": "\u2524", "boxvL": "\u2561", "boxVl": "\u2562", "boxVL": "\u2563", "boxvr": "\u251C", "boxvR": "\u255E", "boxVr": "\u255F", "boxVR": "\u2560", "bprime": "\u2035", "breve": "\u02D8", "Breve": "\u02D8", "brvbar": "\u00A6", "bscr": "\uD835\uDCB7", "Bscr": "\u212C", "bsemi": "\u204F", "bsim": "\u223D", "bsime": "\u22CD", "bsolb": "\u29C5", "bsol": "\\", "bsolhsub": "\u27C8", "bull": "\u2022", "bullet": "\u2022", "bump": "\u224E", "bumpE": "\u2AAE", "bumpe": "\u224F", "Bumpeq": "\u224E", "bumpeq": "\u224F", "Cacute": "\u0106", "cacute": "\u0107", "capand": "\u2A44", "capbrcup": "\u2A49", "capcap": "\u2A4B", "cap": "\u2229", "Cap": "\u22D2", "capcup": "\u2A47", "capdot": "\u2A40", "CapitalDifferentialD": "\u2145", "caps": "\u2229\uFE00", "caret": "\u2041", "caron": "\u02C7", "Cayleys": "\u212D", "ccaps": "\u2A4D", "Ccaron": "\u010C", "ccaron": "\u010D", "Ccedil": "\u00C7", "ccedil": "\u00E7", "Ccirc": "\u0108", "ccirc": "\u0109", "Cconint": "\u2230", "ccups": "\u2A4C", "ccupssm": "\u2A50", "Cdot": "\u010A", "cdot": "\u010B", "cedil": "\u00B8", "Cedilla": "\u00B8", "cemptyv": "\u29B2", "cent": "\u00A2", "centerdot": "\u00B7", "CenterDot": "\u00B7", "cfr": "\uD835\uDD20", "Cfr": "\u212D", "CHcy": "\u0427", "chcy": "\u0447", "check": "\u2713", "checkmark": "\u2713", "Chi": "\u03A7", "chi": "\u03C7", "circ": "\u02C6", "circeq": "\u2257", "circlearrowleft": "\u21BA", "circlearrowright": "\u21BB", "circledast": "\u229B", "circledcirc": "\u229A", "circleddash": "\u229D", "CircleDot": "\u2299", "circledR": "\u00AE", "circledS": "\u24C8", "CircleMinus": "\u2296", "CirclePlus": "\u2295", "CircleTimes": "\u2297", "cir": "\u25CB", "cirE": "\u29C3", "cire": "\u2257", "cirfnint": "\u2A10", "cirmid": "\u2AEF", "cirscir": "\u29C2", "ClockwiseContourIntegral": "\u2232", "CloseCurlyDoubleQuote": "\u201D", "CloseCurlyQuote": "\u2019", "clubs": "\u2663", "clubsuit": "\u2663", "colon": ":", "Colon": "\u2237", "Colone": "\u2A74", "colone": "\u2254", "coloneq": "\u2254", "comma": ",", "commat": "@", "comp": "\u2201", "compfn": "\u2218", "complement": "\u2201", "complexes": "\u2102", "cong": "\u2245", "congdot": "\u2A6D", "Congruent": "\u2261", "conint": "\u222E", "Conint": "\u222F", "ContourIntegral": "\u222E", "copf": "\uD835\uDD54", "Copf": "\u2102", "coprod": "\u2210", "Coproduct": "\u2210", "copy": "\u00A9", "COPY": "\u00A9", "copysr": "\u2117", "CounterClockwiseContourIntegral": "\u2233", "crarr": "\u21B5", "cross": "\u2717", "Cross": "\u2A2F", "Cscr": "\uD835\uDC9E", "cscr": "\uD835\uDCB8", "csub": "\u2ACF", "csube": "\u2AD1", "csup": "\u2AD0", "csupe": "\u2AD2", "ctdot": "\u22EF", "cudarrl": "\u2938", "cudarrr": "\u2935", "cuepr": "\u22DE", "cuesc": "\u22DF", "cularr": "\u21B6", "cularrp": "\u293D", "cupbrcap": "\u2A48", "cupcap": "\u2A46", "CupCap": "\u224D", "cup": "\u222A", "Cup": "\u22D3", "cupcup": "\u2A4A", "cupdot": "\u228D", "cupor": "\u2A45", "cups": "\u222A\uFE00", "curarr": "\u21B7", "curarrm": "\u293C", "curlyeqprec": "\u22DE", "curlyeqsucc": "\u22DF", "curlyvee": "\u22CE", "curlywedge": "\u22CF", "curren": "\u00A4", "curvearrowleft": "\u21B6", "curvearrowright": "\u21B7", "cuvee": "\u22CE", "cuwed": "\u22CF", "cwconint": "\u2232", "cwint": "\u2231", "cylcty": "\u232D", "dagger": "\u2020", "Dagger": "\u2021", "daleth": "\u2138", "darr": "\u2193", "Darr": "\u21A1", "dArr": "\u21D3", "dash": "\u2010", "Dashv": "\u2AE4", "dashv": "\u22A3", "dbkarow": "\u290F", "dblac": "\u02DD", "Dcaron": "\u010E", "dcaron": "\u010F", "Dcy": "\u0414", "dcy": "\u0434", "ddagger": "\u2021", "ddarr": "\u21CA", "DD": "\u2145", "dd": "\u2146", "DDotrahd": "\u2911", "ddotseq": "\u2A77", "deg": "\u00B0", "Del": "\u2207", "Delta": "\u0394", "delta": "\u03B4", "demptyv": "\u29B1", "dfisht": "\u297F", "Dfr": "\uD835\uDD07", "dfr": "\uD835\uDD21", "dHar": "\u2965", "dharl": "\u21C3", "dharr": "\u21C2", "DiacriticalAcute": "\u00B4", "DiacriticalDot": "\u02D9", "DiacriticalDoubleAcute": "\u02DD", "DiacriticalGrave": "`", "DiacriticalTilde": "\u02DC", "diam": "\u22C4", "diamond": "\u22C4", "Diamond": "\u22C4", "diamondsuit": "\u2666", "diams": "\u2666", "die": "\u00A8", "DifferentialD": "\u2146", "digamma": "\u03DD", "disin": "\u22F2", "div": "\u00F7", "divide": "\u00F7", "divideontimes": "\u22C7", "divonx": "\u22C7", "DJcy": "\u0402", "djcy": "\u0452", "dlcorn": "\u231E", "dlcrop": "\u230D", "dollar": "$", "Dopf": "\uD835\uDD3B", "dopf": "\uD835\uDD55", "Dot": "\u00A8", "dot": "\u02D9", "DotDot": "\u20DC", "doteq": "\u2250", "doteqdot": "\u2251", "DotEqual": "\u2250", "dotminus": "\u2238", "dotplus": "\u2214", "dotsquare": "\u22A1", "doublebarwedge": "\u2306", "DoubleContourIntegral": "\u222F", "DoubleDot": "\u00A8", "DoubleDownArrow": "\u21D3", "DoubleLeftArrow": "\u21D0", "DoubleLeftRightArrow": "\u21D4", "DoubleLeftTee": "\u2AE4", "DoubleLongLeftArrow": "\u27F8", "DoubleLongLeftRightArrow": "\u27FA", "DoubleLongRightArrow": "\u27F9", "DoubleRightArrow": "\u21D2", "DoubleRightTee": "\u22A8", "DoubleUpArrow": "\u21D1", "DoubleUpDownArrow": "\u21D5", "DoubleVerticalBar": "\u2225", "DownArrowBar": "\u2913", "downarrow": "\u2193", "DownArrow": "\u2193", "Downarrow": "\u21D3", "DownArrowUpArrow": "\u21F5", "DownBreve": "\u0311", "downdownarrows": "\u21CA", "downharpoonleft": "\u21C3", "downharpoonright": "\u21C2", "DownLeftRightVector": "\u2950", "DownLeftTeeVector": "\u295E", "DownLeftVectorBar": "\u2956", "DownLeftVector": "\u21BD", "DownRightTeeVector": "\u295F", "DownRightVectorBar": "\u2957", "DownRightVector": "\u21C1", "DownTeeArrow": "\u21A7", "DownTee": "\u22A4", "drbkarow": "\u2910", "drcorn": "\u231F", "drcrop": "\u230C", "Dscr": "\uD835\uDC9F", "dscr": "\uD835\uDCB9", "DScy": "\u0405", "dscy": "\u0455", "dsol": "\u29F6", "Dstrok": "\u0110", "dstrok": "\u0111", "dtdot": "\u22F1", "dtri": "\u25BF", "dtrif": "\u25BE", "duarr": "\u21F5", "duhar": "\u296F", "dwangle": "\u29A6", "DZcy": "\u040F", "dzcy": "\u045F", "dzigrarr": "\u27FF", "Eacute": "\u00C9", "eacute": "\u00E9", "easter": "\u2A6E", "Ecaron": "\u011A", "ecaron": "\u011B", "Ecirc": "\u00CA", "ecirc": "\u00EA", "ecir": "\u2256", "ecolon": "\u2255", "Ecy": "\u042D", "ecy": "\u044D", "eDDot": "\u2A77", "Edot": "\u0116", "edot": "\u0117", "eDot": "\u2251", "ee": "\u2147", "efDot": "\u2252", "Efr": "\uD835\uDD08", "efr": "\uD835\uDD22", "eg": "\u2A9A", "Egrave": "\u00C8", "egrave": "\u00E8", "egs": "\u2A96", "egsdot": "\u2A98", "el": "\u2A99", "Element": "\u2208", "elinters": "\u23E7", "ell": "\u2113", "els": "\u2A95", "elsdot": "\u2A97", "Emacr": "\u0112", "emacr": "\u0113", "empty": "\u2205", "emptyset": "\u2205", "EmptySmallSquare": "\u25FB", "emptyv": "\u2205", "EmptyVerySmallSquare": "\u25AB", "emsp13": "\u2004", "emsp14": "\u2005", "emsp": "\u2003", "ENG": "\u014A", "eng": "\u014B", "ensp": "\u2002", "Eogon": "\u0118", "eogon": "\u0119", "Eopf": "\uD835\uDD3C", "eopf": "\uD835\uDD56", "epar": "\u22D5", "eparsl": "\u29E3", "eplus": "\u2A71", "epsi": "\u03B5", "Epsilon": "\u0395", "epsilon": "\u03B5", "epsiv": "\u03F5", "eqcirc": "\u2256", "eqcolon": "\u2255", "eqsim": "\u2242", "eqslantgtr": "\u2A96", "eqslantless": "\u2A95", "Equal": "\u2A75", "equals": "=", "EqualTilde": "\u2242", "equest": "\u225F", "Equilibrium": "\u21CC", "equiv": "\u2261", "equivDD": "\u2A78", "eqvparsl": "\u29E5", "erarr": "\u2971", "erDot": "\u2253", "escr": "\u212F", "Escr": "\u2130", "esdot": "\u2250", "Esim": "\u2A73", "esim": "\u2242", "Eta": "\u0397", "eta": "\u03B7", "ETH": "\u00D0", "eth": "\u00F0", "Euml": "\u00CB", "euml": "\u00EB", "euro": "\u20AC", "excl": "!", "exist": "\u2203", "Exists": "\u2203", "expectation": "\u2130", "exponentiale": "\u2147", "ExponentialE": "\u2147", "fallingdotseq": "\u2252", "Fcy": "\u0424", "fcy": "\u0444", "female": "\u2640", "ffilig": "\uFB03", "fflig": "\uFB00", "ffllig": "\uFB04", "Ffr": "\uD835\uDD09", "ffr": "\uD835\uDD23", "filig": "\uFB01", "FilledSmallSquare": "\u25FC", "FilledVerySmallSquare": "\u25AA", "fjlig": "fj", "flat": "\u266D", "fllig": "\uFB02", "fltns": "\u25B1", "fnof": "\u0192", "Fopf": "\uD835\uDD3D", "fopf": "\uD835\uDD57", "forall": "\u2200", "ForAll": "\u2200", "fork": "\u22D4", "forkv": "\u2AD9", "Fouriertrf": "\u2131", "fpartint": "\u2A0D", "frac12": "\u00BD", "frac13": "\u2153", "frac14": "\u00BC", "frac15": "\u2155", "frac16": "\u2159", "frac18": "\u215B", "frac23": "\u2154", "frac25": "\u2156", "frac34": "\u00BE", "frac35": "\u2157", "frac38": "\u215C", "frac45": "\u2158", "frac56": "\u215A", "frac58": "\u215D", "frac78": "\u215E", "frasl": "\u2044", "frown": "\u2322", "fscr": "\uD835\uDCBB", "Fscr": "\u2131", "gacute": "\u01F5", "Gamma": "\u0393", "gamma": "\u03B3", "Gammad": "\u03DC", "gammad": "\u03DD", "gap": "\u2A86", "Gbreve": "\u011E", "gbreve": "\u011F", "Gcedil": "\u0122", "Gcirc": "\u011C", "gcirc": "\u011D", "Gcy": "\u0413", "gcy": "\u0433", "Gdot": "\u0120", "gdot": "\u0121", "ge": "\u2265", "gE": "\u2267", "gEl": "\u2A8C", "gel": "\u22DB", "geq": "\u2265", "geqq": "\u2267", "geqslant": "\u2A7E", "gescc": "\u2AA9", "ges": "\u2A7E", "gesdot": "\u2A80", "gesdoto": "\u2A82", "gesdotol": "\u2A84", "gesl": "\u22DB\uFE00", "gesles": "\u2A94", "Gfr": "\uD835\uDD0A", "gfr": "\uD835\uDD24", "gg": "\u226B", "Gg": "\u22D9", "ggg": "\u22D9", "gimel": "\u2137", "GJcy": "\u0403", "gjcy": "\u0453", "gla": "\u2AA5", "gl": "\u2277", "glE": "\u2A92", "glj": "\u2AA4", "gnap": "\u2A8A", "gnapprox": "\u2A8A", "gne": "\u2A88", "gnE": "\u2269", "gneq": "\u2A88", "gneqq": "\u2269", "gnsim": "\u22E7", "Gopf": "\uD835\uDD3E", "gopf": "\uD835\uDD58", "grave": "`", "GreaterEqual": "\u2265", "GreaterEqualLess": "\u22DB", "GreaterFullEqual": "\u2267", "GreaterGreater": "\u2AA2", "GreaterLess": "\u2277", "GreaterSlantEqual": "\u2A7E", "GreaterTilde": "\u2273", "Gscr": "\uD835\uDCA2", "gscr": "\u210A", "gsim": "\u2273", "gsime": "\u2A8E", "gsiml": "\u2A90", "gtcc": "\u2AA7", "gtcir": "\u2A7A", "gt": ">", "GT": ">", "Gt": "\u226B", "gtdot": "\u22D7", "gtlPar": "\u2995", "gtquest": "\u2A7C", "gtrapprox": "\u2A86", "gtrarr": "\u2978", "gtrdot": "\u22D7", "gtreqless": "\u22DB", "gtreqqless": "\u2A8C", "gtrless": "\u2277", "gtrsim": "\u2273", "gvertneqq": "\u2269\uFE00", "gvnE": "\u2269\uFE00", "Hacek": "\u02C7", "hairsp": "\u200A", "half": "\u00BD", "hamilt": "\u210B", "HARDcy": "\u042A", "hardcy": "\u044A", "harrcir": "\u2948", "harr": "\u2194", "hArr": "\u21D4", "harrw": "\u21AD", "Hat": "^", "hbar": "\u210F", "Hcirc": "\u0124", "hcirc": "\u0125", "hearts": "\u2665", "heartsuit": "\u2665", "hellip": "\u2026", "hercon": "\u22B9", "hfr": "\uD835\uDD25", "Hfr": "\u210C", "HilbertSpace": "\u210B", "hksearow": "\u2925", "hkswarow": "\u2926", "hoarr": "\u21FF", "homtht": "\u223B", "hookleftarrow": "\u21A9", "hookrightarrow": "\u21AA", "hopf": "\uD835\uDD59", "Hopf": "\u210D", "horbar": "\u2015", "HorizontalLine": "\u2500", "hscr": "\uD835\uDCBD", "Hscr": "\u210B", "hslash": "\u210F", "Hstrok": "\u0126", "hstrok": "\u0127", "HumpDownHump": "\u224E", "HumpEqual": "\u224F", "hybull": "\u2043", "hyphen": "\u2010", "Iacute": "\u00CD", "iacute": "\u00ED", "ic": "\u2063", "Icirc": "\u00CE", "icirc": "\u00EE", "Icy": "\u0418", "icy": "\u0438", "Idot": "\u0130", "IEcy": "\u0415", "iecy": "\u0435", "iexcl": "\u00A1", "iff": "\u21D4", "ifr": "\uD835\uDD26", "Ifr": "\u2111", "Igrave": "\u00CC", "igrave": "\u00EC", "ii": "\u2148", "iiiint": "\u2A0C", "iiint": "\u222D", "iinfin": "\u29DC", "iiota": "\u2129", "IJlig": "\u0132", "ijlig": "\u0133", "Imacr": "\u012A", "imacr": "\u012B", "image": "\u2111", "ImaginaryI": "\u2148", "imagline": "\u2110", "imagpart": "\u2111", "imath": "\u0131", "Im": "\u2111", "imof": "\u22B7", "imped": "\u01B5", "Implies": "\u21D2", "incare": "\u2105", "in": "\u2208", "infin": "\u221E", "infintie": "\u29DD", "inodot": "\u0131", "intcal": "\u22BA", "int": "\u222B", "Int": "\u222C", "integers": "\u2124", "Integral": "\u222B", "intercal": "\u22BA", "Intersection": "\u22C2", "intlarhk": "\u2A17", "intprod": "\u2A3C", "InvisibleComma": "\u2063", "InvisibleTimes": "\u2062", "IOcy": "\u0401", "iocy": "\u0451", "Iogon": "\u012E", "iogon": "\u012F", "Iopf": "\uD835\uDD40", "iopf": "\uD835\uDD5A", "Iota": "\u0399", "iota": "\u03B9", "iprod": "\u2A3C", "iquest": "\u00BF", "iscr": "\uD835\uDCBE", "Iscr": "\u2110", "isin": "\u2208", "isindot": "\u22F5", "isinE": "\u22F9", "isins": "\u22F4", "isinsv": "\u22F3", "isinv": "\u2208", "it": "\u2062", "Itilde": "\u0128", "itilde": "\u0129", "Iukcy": "\u0406", "iukcy": "\u0456", "Iuml": "\u00CF", "iuml": "\u00EF", "Jcirc": "\u0134", "jcirc": "\u0135", "Jcy": "\u0419", "jcy": "\u0439", "Jfr": "\uD835\uDD0D", "jfr": "\uD835\uDD27", "jmath": "\u0237", "Jopf": "\uD835\uDD41", "jopf": "\uD835\uDD5B", "Jscr": "\uD835\uDCA5", "jscr": "\uD835\uDCBF", "Jsercy": "\u0408", "jsercy": "\u0458", "Jukcy": "\u0404", "jukcy": "\u0454", "Kappa": "\u039A", "kappa": "\u03BA", "kappav": "\u03F0", "Kcedil": "\u0136", "kcedil": "\u0137", "Kcy": "\u041A", "kcy": "\u043A", "Kfr": "\uD835\uDD0E", "kfr": "\uD835\uDD28", "kgreen": "\u0138", "KHcy": "\u0425", "khcy": "\u0445", "KJcy": "\u040C", "kjcy": "\u045C", "Kopf": "\uD835\uDD42", "kopf": "\uD835\uDD5C", "Kscr": "\uD835\uDCA6", "kscr": "\uD835\uDCC0", "lAarr": "\u21DA", "Lacute": "\u0139", "lacute": "\u013A", "laemptyv": "\u29B4", "lagran": "\u2112", "Lambda": "\u039B", "lambda": "\u03BB", "lang": "\u27E8", "Lang": "\u27EA", "langd": "\u2991", "langle": "\u27E8", "lap": "\u2A85", "Laplacetrf": "\u2112", "laquo": "\u00AB", "larrb": "\u21E4", "larrbfs": "\u291F", "larr": "\u2190", "Larr": "\u219E", "lArr": "\u21D0", "larrfs": "\u291D", "larrhk": "\u21A9", "larrlp": "\u21AB", "larrpl": "\u2939", "larrsim": "\u2973", "larrtl": "\u21A2", "latail": "\u2919", "lAtail": "\u291B", "lat": "\u2AAB", "late": "\u2AAD", "lates": "\u2AAD\uFE00", "lbarr": "\u290C", "lBarr": "\u290E", "lbbrk": "\u2772", "lbrace": "{", "lbrack": "[", "lbrke": "\u298B", "lbrksld": "\u298F", "lbrkslu": "\u298D", "Lcaron": "\u013D", "lcaron": "\u013E", "Lcedil": "\u013B", "lcedil": "\u013C", "lceil": "\u2308", "lcub": "{", "Lcy": "\u041B", "lcy": "\u043B", "ldca": "\u2936", "ldquo": "\u201C", "ldquor": "\u201E", "ldrdhar": "\u2967", "ldrushar": "\u294B", "ldsh": "\u21B2", "le": "\u2264", "lE": "\u2266", "LeftAngleBracket": "\u27E8", "LeftArrowBar": "\u21E4", "leftarrow": "\u2190", "LeftArrow": "\u2190", "Leftarrow": "\u21D0", "LeftArrowRightArrow": "\u21C6", "leftarrowtail": "\u21A2", "LeftCeiling": "\u2308", "LeftDoubleBracket": "\u27E6", "LeftDownTeeVector": "\u2961", "LeftDownVectorBar": "\u2959", "LeftDownVector": "\u21C3", "LeftFloor": "\u230A", "leftharpoondown": "\u21BD", "leftharpoonup": "\u21BC", "leftleftarrows": "\u21C7", "leftrightarrow": "\u2194", "LeftRightArrow": "\u2194", "Leftrightarrow": "\u21D4", "leftrightarrows": "\u21C6", "leftrightharpoons": "\u21CB", "leftrightsquigarrow": "\u21AD", "LeftRightVector": "\u294E", "LeftTeeArrow": "\u21A4", "LeftTee": "\u22A3", "LeftTeeVector": "\u295A", "leftthreetimes": "\u22CB", "LeftTriangleBar": "\u29CF", "LeftTriangle": "\u22B2", "LeftTriangleEqual": "\u22B4", "LeftUpDownVector": "\u2951", "LeftUpTeeVector": "\u2960", "LeftUpVectorBar": "\u2958", "LeftUpVector": "\u21BF", "LeftVectorBar": "\u2952", "LeftVector": "\u21BC", "lEg": "\u2A8B", "leg": "\u22DA", "leq": "\u2264", "leqq": "\u2266", "leqslant": "\u2A7D", "lescc": "\u2AA8", "les": "\u2A7D", "lesdot": "\u2A7F", "lesdoto": "\u2A81", "lesdotor": "\u2A83", "lesg": "\u22DA\uFE00", "lesges": "\u2A93", "lessapprox": "\u2A85", "lessdot": "\u22D6", "lesseqgtr": "\u22DA", "lesseqqgtr": "\u2A8B", "LessEqualGreater": "\u22DA", "LessFullEqual": "\u2266", "LessGreater": "\u2276", "lessgtr": "\u2276", "LessLess": "\u2AA1", "lesssim": "\u2272", "LessSlantEqual": "\u2A7D", "LessTilde": "\u2272", "lfisht": "\u297C", "lfloor": "\u230A", "Lfr": "\uD835\uDD0F", "lfr": "\uD835\uDD29", "lg": "\u2276", "lgE": "\u2A91", "lHar": "\u2962", "lhard": "\u21BD", "lharu": "\u21BC", "lharul": "\u296A", "lhblk": "\u2584", "LJcy": "\u0409", "ljcy": "\u0459", "llarr": "\u21C7", "ll": "\u226A", "Ll": "\u22D8", "llcorner": "\u231E", "Lleftarrow": "\u21DA", "llhard": "\u296B", "lltri": "\u25FA", "Lmidot": "\u013F", "lmidot": "\u0140", "lmoustache": "\u23B0", "lmoust": "\u23B0", "lnap": "\u2A89", "lnapprox": "\u2A89", "lne": "\u2A87", "lnE": "\u2268", "lneq": "\u2A87", "lneqq": "\u2268", "lnsim": "\u22E6", "loang": "\u27EC", "loarr": "\u21FD", "lobrk": "\u27E6", "longleftarrow": "\u27F5", "LongLeftArrow": "\u27F5", "Longleftarrow": "\u27F8", "longleftrightarrow": "\u27F7", "LongLeftRightArrow": "\u27F7", "Longleftrightarrow": "\u27FA", "longmapsto": "\u27FC", "longrightarrow": "\u27F6", "LongRightArrow": "\u27F6", "Longrightarrow": "\u27F9", "looparrowleft": "\u21AB", "looparrowright": "\u21AC", "lopar": "\u2985", "Lopf": "\uD835\uDD43", "lopf": "\uD835\uDD5D", "loplus": "\u2A2D", "lotimes": "\u2A34", "lowast": "\u2217", "lowbar": "_", "LowerLeftArrow": "\u2199", "LowerRightArrow": "\u2198", "loz": "\u25CA", "lozenge": "\u25CA", "lozf": "\u29EB", "lpar": "(", "lparlt": "\u2993", "lrarr": "\u21C6", "lrcorner": "\u231F", "lrhar": "\u21CB", "lrhard": "\u296D", "lrm": "\u200E", "lrtri": "\u22BF", "lsaquo": "\u2039", "lscr": "\uD835\uDCC1", "Lscr": "\u2112", "lsh": "\u21B0", "Lsh": "\u21B0", "lsim": "\u2272", "lsime": "\u2A8D", "lsimg": "\u2A8F", "lsqb": "[", "lsquo": "\u2018", "lsquor": "\u201A", "Lstrok": "\u0141", "lstrok": "\u0142", "ltcc": "\u2AA6", "ltcir": "\u2A79", "lt": "<", "LT": "<", "Lt": "\u226A", "ltdot": "\u22D6", "lthree": "\u22CB", "ltimes": "\u22C9", "ltlarr": "\u2976", "ltquest": "\u2A7B", "ltri": "\u25C3", "ltrie": "\u22B4", "ltrif": "\u25C2", "ltrPar": "\u2996", "lurdshar": "\u294A", "luruhar": "\u2966", "lvertneqq": "\u2268\uFE00", "lvnE": "\u2268\uFE00", "macr": "\u00AF", "male": "\u2642", "malt": "\u2720", "maltese": "\u2720", "Map": "\u2905", "map": "\u21A6", "mapsto": "\u21A6", "mapstodown": "\u21A7", "mapstoleft": "\u21A4", "mapstoup": "\u21A5", "marker": "\u25AE", "mcomma": "\u2A29", "Mcy": "\u041C", "mcy": "\u043C", "mdash": "\u2014", "mDDot": "\u223A", "measuredangle": "\u2221", "MediumSpace": "\u205F", "Mellintrf": "\u2133", "Mfr": "\uD835\uDD10", "mfr": "\uD835\uDD2A", "mho": "\u2127", "micro": "\u00B5", "midast": "*", "midcir": "\u2AF0", "mid": "\u2223", "middot": "\u00B7", "minusb": "\u229F", "minus": "\u2212", "minusd": "\u2238", "minusdu": "\u2A2A", "MinusPlus": "\u2213", "mlcp": "\u2ADB", "mldr": "\u2026", "mnplus": "\u2213", "models": "\u22A7", "Mopf": "\uD835\uDD44", "mopf": "\uD835\uDD5E", "mp": "\u2213", "mscr": "\uD835\uDCC2", "Mscr": "\u2133", "mstpos": "\u223E", "Mu": "\u039C", "mu": "\u03BC", "multimap": "\u22B8", "mumap": "\u22B8", "nabla": "\u2207", "Nacute": "\u0143", "nacute": "\u0144", "nang": "\u2220\u20D2", "nap": "\u2249", "napE": "\u2A70\u0338", "napid": "\u224B\u0338", "napos": "\u0149", "napprox": "\u2249", "natural": "\u266E", "naturals": "\u2115", "natur": "\u266E", "nbsp": "\u00A0", "nbump": "\u224E\u0338", "nbumpe": "\u224F\u0338", "ncap": "\u2A43", "Ncaron": "\u0147", "ncaron": "\u0148", "Ncedil": "\u0145", "ncedil": "\u0146", "ncong": "\u2247", "ncongdot": "\u2A6D\u0338", "ncup": "\u2A42", "Ncy": "\u041D", "ncy": "\u043D", "ndash": "\u2013", "nearhk": "\u2924", "nearr": "\u2197", "neArr": "\u21D7", "nearrow": "\u2197", "ne": "\u2260", "nedot": "\u2250\u0338", "NegativeMediumSpace": "\u200B", "NegativeThickSpace": "\u200B", "NegativeThinSpace": "\u200B", "NegativeVeryThinSpace": "\u200B", "nequiv": "\u2262", "nesear": "\u2928", "nesim": "\u2242\u0338", "NestedGreaterGreater": "\u226B", "NestedLessLess": "\u226A", "NewLine": "\n", "nexist": "\u2204", "nexists": "\u2204", "Nfr": "\uD835\uDD11", "nfr": "\uD835\uDD2B", "ngE": "\u2267\u0338", "nge": "\u2271", "ngeq": "\u2271", "ngeqq": "\u2267\u0338", "ngeqslant": "\u2A7E\u0338", "nges": "\u2A7E\u0338", "nGg": "\u22D9\u0338", "ngsim": "\u2275", "nGt": "\u226B\u20D2", "ngt": "\u226F", "ngtr": "\u226F", "nGtv": "\u226B\u0338", "nharr": "\u21AE", "nhArr": "\u21CE", "nhpar": "\u2AF2", "ni": "\u220B", "nis": "\u22FC", "nisd": "\u22FA", "niv": "\u220B", "NJcy": "\u040A", "njcy": "\u045A", "nlarr": "\u219A", "nlArr": "\u21CD", "nldr": "\u2025", "nlE": "\u2266\u0338", "nle": "\u2270", "nleftarrow": "\u219A", "nLeftarrow": "\u21CD", "nleftrightarrow": "\u21AE", "nLeftrightarrow": "\u21CE", "nleq": "\u2270", "nleqq": "\u2266\u0338", "nleqslant": "\u2A7D\u0338", "nles": "\u2A7D\u0338", "nless": "\u226E", "nLl": "\u22D8\u0338", "nlsim": "\u2274", "nLt": "\u226A\u20D2", "nlt": "\u226E", "nltri": "\u22EA", "nltrie": "\u22EC", "nLtv": "\u226A\u0338", "nmid": "\u2224", "NoBreak": "\u2060", "NonBreakingSpace": "\u00A0", "nopf": "\uD835\uDD5F", "Nopf": "\u2115", "Not": "\u2AEC", "not": "\u00AC", "NotCongruent": "\u2262", "NotCupCap": "\u226D", "NotDoubleVerticalBar": "\u2226", "NotElement": "\u2209", "NotEqual": "\u2260", "NotEqualTilde": "\u2242\u0338", "NotExists": "\u2204", "NotGreater": "\u226F", "NotGreaterEqual": "\u2271", "NotGreaterFullEqual": "\u2267\u0338", "NotGreaterGreater": "\u226B\u0338", "NotGreaterLess": "\u2279", "NotGreaterSlantEqual": "\u2A7E\u0338", "NotGreaterTilde": "\u2275", "NotHumpDownHump": "\u224E\u0338", "NotHumpEqual": "\u224F\u0338", "notin": "\u2209", "notindot": "\u22F5\u0338", "notinE": "\u22F9\u0338", "notinva": "\u2209", "notinvb": "\u22F7", "notinvc": "\u22F6", "NotLeftTriangleBar": "\u29CF\u0338", "NotLeftTriangle": "\u22EA", "NotLeftTriangleEqual": "\u22EC", "NotLess": "\u226E", "NotLessEqual": "\u2270", "NotLessGreater": "\u2278", "NotLessLess": "\u226A\u0338", "NotLessSlantEqual": "\u2A7D\u0338", "NotLessTilde": "\u2274", "NotNestedGreaterGreater": "\u2AA2\u0338", "NotNestedLessLess": "\u2AA1\u0338", "notni": "\u220C", "notniva": "\u220C", "notnivb": "\u22FE", "notnivc": "\u22FD", "NotPrecedes": "\u2280", "NotPrecedesEqual": "\u2AAF\u0338", "NotPrecedesSlantEqual": "\u22E0", "NotReverseElement": "\u220C", "NotRightTriangleBar": "\u29D0\u0338", "NotRightTriangle": "\u22EB", "NotRightTriangleEqual": "\u22ED", "NotSquareSubset": "\u228F\u0338", "NotSquareSubsetEqual": "\u22E2", "NotSquareSuperset": "\u2290\u0338", "NotSquareSupersetEqual": "\u22E3", "NotSubset": "\u2282\u20D2", "NotSubsetEqual": "\u2288", "NotSucceeds": "\u2281", "NotSucceedsEqual": "\u2AB0\u0338", "NotSucceedsSlantEqual": "\u22E1", "NotSucceedsTilde": "\u227F\u0338", "NotSuperset": "\u2283\u20D2", "NotSupersetEqual": "\u2289", "NotTilde": "\u2241", "NotTildeEqual": "\u2244", "NotTildeFullEqual": "\u2247", "NotTildeTilde": "\u2249", "NotVerticalBar": "\u2224", "nparallel": "\u2226", "npar": "\u2226", "nparsl": "\u2AFD\u20E5", "npart": "\u2202\u0338", "npolint": "\u2A14", "npr": "\u2280", "nprcue": "\u22E0", "nprec": "\u2280", "npreceq": "\u2AAF\u0338", "npre": "\u2AAF\u0338", "nrarrc": "\u2933\u0338", "nrarr": "\u219B", "nrArr": "\u21CF", "nrarrw": "\u219D\u0338", "nrightarrow": "\u219B", "nRightarrow": "\u21CF", "nrtri": "\u22EB", "nrtrie": "\u22ED", "nsc": "\u2281", "nsccue": "\u22E1", "nsce": "\u2AB0\u0338", "Nscr": "\uD835\uDCA9", "nscr": "\uD835\uDCC3", "nshortmid": "\u2224", "nshortparallel": "\u2226", "nsim": "\u2241", "nsime": "\u2244", "nsimeq": "\u2244", "nsmid": "\u2224", "nspar": "\u2226", "nsqsube": "\u22E2", "nsqsupe": "\u22E3", "nsub": "\u2284", "nsubE": "\u2AC5\u0338", "nsube": "\u2288", "nsubset": "\u2282\u20D2", "nsubseteq": "\u2288", "nsubseteqq": "\u2AC5\u0338", "nsucc": "\u2281", "nsucceq": "\u2AB0\u0338", "nsup": "\u2285", "nsupE": "\u2AC6\u0338", "nsupe": "\u2289", "nsupset": "\u2283\u20D2", "nsupseteq": "\u2289", "nsupseteqq": "\u2AC6\u0338", "ntgl": "\u2279", "Ntilde": "\u00D1", "ntilde": "\u00F1", "ntlg": "\u2278", "ntriangleleft": "\u22EA", "ntrianglelefteq": "\u22EC", "ntriangleright": "\u22EB", "ntrianglerighteq": "\u22ED", "Nu": "\u039D", "nu": "\u03BD", "num": "#", "numero": "\u2116", "numsp": "\u2007", "nvap": "\u224D\u20D2", "nvdash": "\u22AC", "nvDash": "\u22AD", "nVdash": "\u22AE", "nVDash": "\u22AF", "nvge": "\u2265\u20D2", "nvgt": ">\u20D2", "nvHarr": "\u2904", "nvinfin": "\u29DE", "nvlArr": "\u2902", "nvle": "\u2264\u20D2", "nvlt": "<\u20D2", "nvltrie": "\u22B4\u20D2", "nvrArr": "\u2903", "nvrtrie": "\u22B5\u20D2", "nvsim": "\u223C\u20D2", "nwarhk": "\u2923", "nwarr": "\u2196", "nwArr": "\u21D6", "nwarrow": "\u2196", "nwnear": "\u2927", "Oacute": "\u00D3", "oacute": "\u00F3", "oast": "\u229B", "Ocirc": "\u00D4", "ocirc": "\u00F4", "ocir": "\u229A", "Ocy": "\u041E", "ocy": "\u043E", "odash": "\u229D", "Odblac": "\u0150", "odblac": "\u0151", "odiv": "\u2A38", "odot": "\u2299", "odsold": "\u29BC", "OElig": "\u0152", "oelig": "\u0153", "ofcir": "\u29BF", "Ofr": "\uD835\uDD12", "ofr": "\uD835\uDD2C", "ogon": "\u02DB", "Ograve": "\u00D2", "ograve": "\u00F2", "ogt": "\u29C1", "ohbar": "\u29B5", "ohm": "\u03A9", "oint": "\u222E", "olarr": "\u21BA", "olcir": "\u29BE", "olcross": "\u29BB", "oline": "\u203E", "olt": "\u29C0", "Omacr": "\u014C", "omacr": "\u014D", "Omega": "\u03A9", "omega": "\u03C9", "Omicron": "\u039F", "omicron": "\u03BF", "omid": "\u29B6", "ominus": "\u2296", "Oopf": "\uD835\uDD46", "oopf": "\uD835\uDD60", "opar": "\u29B7", "OpenCurlyDoubleQuote": "\u201C", "OpenCurlyQuote": "\u2018", "operp": "\u29B9", "oplus": "\u2295", "orarr": "\u21BB", "Or": "\u2A54", "or": "\u2228", "ord": "\u2A5D", "order": "\u2134", "orderof": "\u2134", "ordf": "\u00AA", "ordm": "\u00BA", "origof": "\u22B6", "oror": "\u2A56", "orslope": "\u2A57", "orv": "\u2A5B", "oS": "\u24C8", "Oscr": "\uD835\uDCAA", "oscr": "\u2134", "Oslash": "\u00D8", "oslash": "\u00F8", "osol": "\u2298", "Otilde": "\u00D5", "otilde": "\u00F5", "otimesas": "\u2A36", "Otimes": "\u2A37", "otimes": "\u2297", "Ouml": "\u00D6", "ouml": "\u00F6", "ovbar": "\u233D", "OverBar": "\u203E", "OverBrace": "\u23DE", "OverBracket": "\u23B4", "OverParenthesis": "\u23DC", "para": "\u00B6", "parallel": "\u2225", "par": "\u2225", "parsim": "\u2AF3", "parsl": "\u2AFD", "part": "\u2202", "PartialD": "\u2202", "Pcy": "\u041F", "pcy": "\u043F", "percnt": "%", "period": ".", "permil": "\u2030", "perp": "\u22A5", "pertenk": "\u2031", "Pfr": "\uD835\uDD13", "pfr": "\uD835\uDD2D", "Phi": "\u03A6", "phi": "\u03C6", "phiv": "\u03D5", "phmmat": "\u2133", "phone": "\u260E", "Pi": "\u03A0", "pi": "\u03C0", "pitchfork": "\u22D4", "piv": "\u03D6", "planck": "\u210F", "planckh": "\u210E", "plankv": "\u210F", "plusacir": "\u2A23", "plusb": "\u229E", "pluscir": "\u2A22", "plus": "+", "plusdo": "\u2214", "plusdu": "\u2A25", "pluse": "\u2A72", "PlusMinus": "\u00B1", "plusmn": "\u00B1", "plussim": "\u2A26", "plustwo": "\u2A27", "pm": "\u00B1", "Poincareplane": "\u210C", "pointint": "\u2A15", "popf": "\uD835\uDD61", "Popf": "\u2119", "pound": "\u00A3", "prap": "\u2AB7", "Pr": "\u2ABB", "pr": "\u227A", "prcue": "\u227C", "precapprox": "\u2AB7", "prec": "\u227A", "preccurlyeq": "\u227C", "Precedes": "\u227A", "PrecedesEqual": "\u2AAF", "PrecedesSlantEqual": "\u227C", "PrecedesTilde": "\u227E", "preceq": "\u2AAF", "precnapprox": "\u2AB9", "precneqq": "\u2AB5", "precnsim": "\u22E8", "pre": "\u2AAF", "prE": "\u2AB3", "precsim": "\u227E", "prime": "\u2032", "Prime": "\u2033", "primes": "\u2119", "prnap": "\u2AB9", "prnE": "\u2AB5", "prnsim": "\u22E8", "prod": "\u220F", "Product": "\u220F", "profalar": "\u232E", "profline": "\u2312", "profsurf": "\u2313", "prop": "\u221D", "Proportional": "\u221D", "Proportion": "\u2237", "propto": "\u221D", "prsim": "\u227E", "prurel": "\u22B0", "Pscr": "\uD835\uDCAB", "pscr": "\uD835\uDCC5", "Psi": "\u03A8", "psi": "\u03C8", "puncsp": "\u2008", "Qfr": "\uD835\uDD14", "qfr": "\uD835\uDD2E", "qint": "\u2A0C", "qopf": "\uD835\uDD62", "Qopf": "\u211A", "qprime": "\u2057", "Qscr": "\uD835\uDCAC", "qscr": "\uD835\uDCC6", "quaternions": "\u210D", "quatint": "\u2A16", "quest": "?", "questeq": "\u225F", "quot": "\"", "QUOT": "\"", "rAarr": "\u21DB", "race": "\u223D\u0331", "Racute": "\u0154", "racute": "\u0155", "radic": "\u221A", "raemptyv": "\u29B3", "rang": "\u27E9", "Rang": "\u27EB", "rangd": "\u2992", "range": "\u29A5", "rangle": "\u27E9", "raquo": "\u00BB", "rarrap": "\u2975", "rarrb": "\u21E5", "rarrbfs": "\u2920", "rarrc": "\u2933", "rarr": "\u2192", "Rarr": "\u21A0", "rArr": "\u21D2", "rarrfs": "\u291E", "rarrhk": "\u21AA", "rarrlp": "\u21AC", "rarrpl": "\u2945", "rarrsim": "\u2974", "Rarrtl": "\u2916", "rarrtl": "\u21A3", "rarrw": "\u219D", "ratail": "\u291A", "rAtail": "\u291C", "ratio": "\u2236", "rationals": "\u211A", "rbarr": "\u290D", "rBarr": "\u290F", "RBarr": "\u2910", "rbbrk": "\u2773", "rbrace": "}", "rbrack": "]", "rbrke": "\u298C", "rbrksld": "\u298E", "rbrkslu": "\u2990", "Rcaron": "\u0158", "rcaron": "\u0159", "Rcedil": "\u0156", "rcedil": "\u0157", "rceil": "\u2309", "rcub": "}", "Rcy": "\u0420", "rcy": "\u0440", "rdca": "\u2937", "rdldhar": "\u2969", "rdquo": "\u201D", "rdquor": "\u201D", "rdsh": "\u21B3", "real": "\u211C", "realine": "\u211B", "realpart": "\u211C", "reals": "\u211D", "Re": "\u211C", "rect": "\u25AD", "reg": "\u00AE", "REG": "\u00AE", "ReverseElement": "\u220B", "ReverseEquilibrium": "\u21CB", "ReverseUpEquilibrium": "\u296F", "rfisht": "\u297D", "rfloor": "\u230B", "rfr": "\uD835\uDD2F", "Rfr": "\u211C", "rHar": "\u2964", "rhard": "\u21C1", "rharu": "\u21C0", "rharul": "\u296C", "Rho": "\u03A1", "rho": "\u03C1", "rhov": "\u03F1", "RightAngleBracket": "\u27E9", "RightArrowBar": "\u21E5", "rightarrow": "\u2192", "RightArrow": "\u2192", "Rightarrow": "\u21D2", "RightArrowLeftArrow": "\u21C4", "rightarrowtail": "\u21A3", "RightCeiling": "\u2309", "RightDoubleBracket": "\u27E7", "RightDownTeeVector": "\u295D", "RightDownVectorBar": "\u2955", "RightDownVector": "\u21C2", "RightFloor": "\u230B", "rightharpoondown": "\u21C1", "rightharpoonup": "\u21C0", "rightleftarrows": "\u21C4", "rightleftharpoons": "\u21CC", "rightrightarrows": "\u21C9", "rightsquigarrow": "\u219D", "RightTeeArrow": "\u21A6", "RightTee": "\u22A2", "RightTeeVector": "\u295B", "rightthreetimes": "\u22CC", "RightTriangleBar": "\u29D0", "RightTriangle": "\u22B3", "RightTriangleEqual": "\u22B5", "RightUpDownVector": "\u294F", "RightUpTeeVector": "\u295C", "RightUpVectorBar": "\u2954", "RightUpVector": "\u21BE", "RightVectorBar": "\u2953", "RightVector": "\u21C0", "ring": "\u02DA", "risingdotseq": "\u2253", "rlarr": "\u21C4", "rlhar": "\u21CC", "rlm": "\u200F", "rmoustache": "\u23B1", "rmoust": "\u23B1", "rnmid": "\u2AEE", "roang": "\u27ED", "roarr": "\u21FE", "robrk": "\u27E7", "ropar": "\u2986", "ropf": "\uD835\uDD63", "Ropf": "\u211D", "roplus": "\u2A2E", "rotimes": "\u2A35", "RoundImplies": "\u2970", "rpar": ")", "rpargt": "\u2994", "rppolint": "\u2A12", "rrarr": "\u21C9", "Rrightarrow": "\u21DB", "rsaquo": "\u203A", "rscr": "\uD835\uDCC7", "Rscr": "\u211B", "rsh": "\u21B1", "Rsh": "\u21B1", "rsqb": "]", "rsquo": "\u2019", "rsquor": "\u2019", "rthree": "\u22CC", "rtimes": "\u22CA", "rtri": "\u25B9", "rtrie": "\u22B5", "rtrif": "\u25B8", "rtriltri": "\u29CE", "RuleDelayed": "\u29F4", "ruluhar": "\u2968", "rx": "\u211E", "Sacute": "\u015A", "sacute": "\u015B", "sbquo": "\u201A", "scap": "\u2AB8", "Scaron": "\u0160", "scaron": "\u0161", "Sc": "\u2ABC", "sc": "\u227B", "sccue": "\u227D", "sce": "\u2AB0", "scE": "\u2AB4", "Scedil": "\u015E", "scedil": "\u015F", "Scirc": "\u015C", "scirc": "\u015D", "scnap": "\u2ABA", "scnE": "\u2AB6", "scnsim": "\u22E9", "scpolint": "\u2A13", "scsim": "\u227F", "Scy": "\u0421", "scy": "\u0441", "sdotb": "\u22A1", "sdot": "\u22C5", "sdote": "\u2A66", "searhk": "\u2925", "searr": "\u2198", "seArr": "\u21D8", "searrow": "\u2198", "sect": "\u00A7", "semi": ";", "seswar": "\u2929", "setminus": "\u2216", "setmn": "\u2216", "sext": "\u2736", "Sfr": "\uD835\uDD16", "sfr": "\uD835\uDD30", "sfrown": "\u2322", "sharp": "\u266F", "SHCHcy": "\u0429", "shchcy": "\u0449", "SHcy": "\u0428", "shcy": "\u0448", "ShortDownArrow": "\u2193", "ShortLeftArrow": "\u2190", "shortmid": "\u2223", "shortparallel": "\u2225", "ShortRightArrow": "\u2192", "ShortUpArrow": "\u2191", "shy": "\u00AD", "Sigma": "\u03A3", "sigma": "\u03C3", "sigmaf": "\u03C2", "sigmav": "\u03C2", "sim": "\u223C", "simdot": "\u2A6A", "sime": "\u2243", "simeq": "\u2243", "simg": "\u2A9E", "simgE": "\u2AA0", "siml": "\u2A9D", "simlE": "\u2A9F", "simne": "\u2246", "simplus": "\u2A24", "simrarr": "\u2972", "slarr": "\u2190", "SmallCircle": "\u2218", "smallsetminus": "\u2216", "smashp": "\u2A33", "smeparsl": "\u29E4", "smid": "\u2223", "smile": "\u2323", "smt": "\u2AAA", "smte": "\u2AAC", "smtes": "\u2AAC\uFE00", "SOFTcy": "\u042C", "softcy": "\u044C", "solbar": "\u233F", "solb": "\u29C4", "sol": "/", "Sopf": "\uD835\uDD4A", "sopf": "\uD835\uDD64", "spades": "\u2660", "spadesuit": "\u2660", "spar": "\u2225", "sqcap": "\u2293", "sqcaps": "\u2293\uFE00", "sqcup": "\u2294", "sqcups": "\u2294\uFE00", "Sqrt": "\u221A", "sqsub": "\u228F", "sqsube": "\u2291", "sqsubset": "\u228F", "sqsubseteq": "\u2291", "sqsup": "\u2290", "sqsupe": "\u2292", "sqsupset": "\u2290", "sqsupseteq": "\u2292", "square": "\u25A1", "Square": "\u25A1", "SquareIntersection": "\u2293", "SquareSubset": "\u228F", "SquareSubsetEqual": "\u2291", "SquareSuperset": "\u2290", "SquareSupersetEqual": "\u2292", "SquareUnion": "\u2294", "squarf": "\u25AA", "squ": "\u25A1", "squf": "\u25AA", "srarr": "\u2192", "Sscr": "\uD835\uDCAE", "sscr": "\uD835\uDCC8", "ssetmn": "\u2216", "ssmile": "\u2323", "sstarf": "\u22C6", "Star": "\u22C6", "star": "\u2606", "starf": "\u2605", "straightepsilon": "\u03F5", "straightphi": "\u03D5", "strns": "\u00AF", "sub": "\u2282", "Sub": "\u22D0", "subdot": "\u2ABD", "subE": "\u2AC5", "sube": "\u2286", "subedot": "\u2AC3", "submult": "\u2AC1", "subnE": "\u2ACB", "subne": "\u228A", "subplus": "\u2ABF", "subrarr": "\u2979", "subset": "\u2282", "Subset": "\u22D0", "subseteq": "\u2286", "subseteqq": "\u2AC5", "SubsetEqual": "\u2286", "subsetneq": "\u228A", "subsetneqq": "\u2ACB", "subsim": "\u2AC7", "subsub": "\u2AD5", "subsup": "\u2AD3", "succapprox": "\u2AB8", "succ": "\u227B", "succcurlyeq": "\u227D", "Succeeds": "\u227B", "SucceedsEqual": "\u2AB0", "SucceedsSlantEqual": "\u227D", "SucceedsTilde": "\u227F", "succeq": "\u2AB0", "succnapprox": "\u2ABA", "succneqq": "\u2AB6", "succnsim": "\u22E9", "succsim": "\u227F", "SuchThat": "\u220B", "sum": "\u2211", "Sum": "\u2211", "sung": "\u266A", "sup1": "\u00B9", "sup2": "\u00B2", "sup3": "\u00B3", "sup": "\u2283", "Sup": "\u22D1", "supdot": "\u2ABE", "supdsub": "\u2AD8", "supE": "\u2AC6", "supe": "\u2287", "supedot": "\u2AC4", "Superset": "\u2283", "SupersetEqual": "\u2287", "suphsol": "\u27C9", "suphsub": "\u2AD7", "suplarr": "\u297B", "supmult": "\u2AC2", "supnE": "\u2ACC", "supne": "\u228B", "supplus": "\u2AC0", "supset": "\u2283", "Supset": "\u22D1", "supseteq": "\u2287", "supseteqq": "\u2AC6", "supsetneq": "\u228B", "supsetneqq": "\u2ACC", "supsim": "\u2AC8", "supsub": "\u2AD4", "supsup": "\u2AD6", "swarhk": "\u2926", "swarr": "\u2199", "swArr": "\u21D9", "swarrow": "\u2199", "swnwar": "\u292A", "szlig": "\u00DF", "Tab": "\t", "target": "\u2316", "Tau": "\u03A4", "tau": "\u03C4", "tbrk": "\u23B4", "Tcaron": "\u0164", "tcaron": "\u0165", "Tcedil": "\u0162", "tcedil": "\u0163", "Tcy": "\u0422", "tcy": "\u0442", "tdot": "\u20DB", "telrec": "\u2315", "Tfr": "\uD835\uDD17", "tfr": "\uD835\uDD31", "there4": "\u2234", "therefore": "\u2234", "Therefore": "\u2234", "Theta": "\u0398", "theta": "\u03B8", "thetasym": "\u03D1", "thetav": "\u03D1", "thickapprox": "\u2248", "thicksim": "\u223C", "ThickSpace": "\u205F\u200A", "ThinSpace": "\u2009", "thinsp": "\u2009", "thkap": "\u2248", "thksim": "\u223C", "THORN": "\u00DE", "thorn": "\u00FE", "tilde": "\u02DC", "Tilde": "\u223C", "TildeEqual": "\u2243", "TildeFullEqual": "\u2245", "TildeTilde": "\u2248", "timesbar": "\u2A31", "timesb": "\u22A0", "times": "\u00D7", "timesd": "\u2A30", "tint": "\u222D", "toea": "\u2928", "topbot": "\u2336", "topcir": "\u2AF1", "top": "\u22A4", "Topf": "\uD835\uDD4B", "topf": "\uD835\uDD65", "topfork": "\u2ADA", "tosa": "\u2929", "tprime": "\u2034", "trade": "\u2122", "TRADE": "\u2122", "triangle": "\u25B5", "triangledown": "\u25BF", "triangleleft": "\u25C3", "trianglelefteq": "\u22B4", "triangleq": "\u225C", "triangleright": "\u25B9", "trianglerighteq": "\u22B5", "tridot": "\u25EC", "trie": "\u225C", "triminus": "\u2A3A", "TripleDot": "\u20DB", "triplus": "\u2A39", "trisb": "\u29CD", "tritime": "\u2A3B", "trpezium": "\u23E2", "Tscr": "\uD835\uDCAF", "tscr": "\uD835\uDCC9", "TScy": "\u0426", "tscy": "\u0446", "TSHcy": "\u040B", "tshcy": "\u045B", "Tstrok": "\u0166", "tstrok": "\u0167", "twixt": "\u226C", "twoheadleftarrow": "\u219E", "twoheadrightarrow": "\u21A0", "Uacute": "\u00DA", "uacute": "\u00FA", "uarr": "\u2191", "Uarr": "\u219F", "uArr": "\u21D1", "Uarrocir": "\u2949", "Ubrcy": "\u040E", "ubrcy": "\u045E", "Ubreve": "\u016C", "ubreve": "\u016D", "Ucirc": "\u00DB", "ucirc": "\u00FB", "Ucy": "\u0423", "ucy": "\u0443", "udarr": "\u21C5", "Udblac": "\u0170", "udblac": "\u0171", "udhar": "\u296E", "ufisht": "\u297E", "Ufr": "\uD835\uDD18", "ufr": "\uD835\uDD32", "Ugrave": "\u00D9", "ugrave": "\u00F9", "uHar": "\u2963", "uharl": "\u21BF", "uharr": "\u21BE", "uhblk": "\u2580", "ulcorn": "\u231C", "ulcorner": "\u231C", "ulcrop": "\u230F", "ultri": "\u25F8", "Umacr": "\u016A", "umacr": "\u016B", "uml": "\u00A8", "UnderBar": "_", "UnderBrace": "\u23DF", "UnderBracket": "\u23B5", "UnderParenthesis": "\u23DD", "Union": "\u22C3", "UnionPlus": "\u228E", "Uogon": "\u0172", "uogon": "\u0173", "Uopf": "\uD835\uDD4C", "uopf": "\uD835\uDD66", "UpArrowBar": "\u2912", "uparrow": "\u2191", "UpArrow": "\u2191", "Uparrow": "\u21D1", "UpArrowDownArrow": "\u21C5", "updownarrow": "\u2195", "UpDownArrow": "\u2195", "Updownarrow": "\u21D5", "UpEquilibrium": "\u296E", "upharpoonleft": "\u21BF", "upharpoonright": "\u21BE", "uplus": "\u228E", "UpperLeftArrow": "\u2196", "UpperRightArrow": "\u2197", "upsi": "\u03C5", "Upsi": "\u03D2", "upsih": "\u03D2", "Upsilon": "\u03A5", "upsilon": "\u03C5", "UpTeeArrow": "\u21A5", "UpTee": "\u22A5", "upuparrows": "\u21C8", "urcorn": "\u231D", "urcorner": "\u231D", "urcrop": "\u230E", "Uring": "\u016E", "uring": "\u016F", "urtri": "\u25F9", "Uscr": "\uD835\uDCB0", "uscr": "\uD835\uDCCA", "utdot": "\u22F0", "Utilde": "\u0168", "utilde": "\u0169", "utri": "\u25B5", "utrif": "\u25B4", "uuarr": "\u21C8", "Uuml": "\u00DC", "uuml": "\u00FC", "uwangle": "\u29A7", "vangrt": "\u299C", "varepsilon": "\u03F5", "varkappa": "\u03F0", "varnothing": "\u2205", "varphi": "\u03D5", "varpi": "\u03D6", "varpropto": "\u221D", "varr": "\u2195", "vArr": "\u21D5", "varrho": "\u03F1", "varsigma": "\u03C2", "varsubsetneq": "\u228A\uFE00", "varsubsetneqq": "\u2ACB\uFE00", "varsupsetneq": "\u228B\uFE00", "varsupsetneqq": "\u2ACC\uFE00", "vartheta": "\u03D1", "vartriangleleft": "\u22B2", "vartriangleright": "\u22B3", "vBar": "\u2AE8", "Vbar": "\u2AEB", "vBarv": "\u2AE9", "Vcy": "\u0412", "vcy": "\u0432", "vdash": "\u22A2", "vDash": "\u22A8", "Vdash": "\u22A9", "VDash": "\u22AB", "Vdashl": "\u2AE6", "veebar": "\u22BB", "vee": "\u2228", "Vee": "\u22C1", "veeeq": "\u225A", "vellip": "\u22EE", "verbar": "|", "Verbar": "\u2016", "vert": "|", "Vert": "\u2016", "VerticalBar": "\u2223", "VerticalLine": "|", "VerticalSeparator": "\u2758", "VerticalTilde": "\u2240", "VeryThinSpace": "\u200A", "Vfr": "\uD835\uDD19", "vfr": "\uD835\uDD33", "vltri": "\u22B2", "vnsub": "\u2282\u20D2", "vnsup": "\u2283\u20D2", "Vopf": "\uD835\uDD4D", "vopf": "\uD835\uDD67", "vprop": "\u221D", "vrtri": "\u22B3", "Vscr": "\uD835\uDCB1", "vscr": "\uD835\uDCCB", "vsubnE": "\u2ACB\uFE00", "vsubne": "\u228A\uFE00", "vsupnE": "\u2ACC\uFE00", "vsupne": "\u228B\uFE00", "Vvdash": "\u22AA", "vzigzag": "\u299A", "Wcirc": "\u0174", "wcirc": "\u0175", "wedbar": "\u2A5F", "wedge": "\u2227", "Wedge": "\u22C0", "wedgeq": "\u2259", "weierp": "\u2118", "Wfr": "\uD835\uDD1A", "wfr": "\uD835\uDD34", "Wopf": "\uD835\uDD4E", "wopf": "\uD835\uDD68", "wp": "\u2118", "wr": "\u2240", "wreath": "\u2240", "Wscr": "\uD835\uDCB2", "wscr": "\uD835\uDCCC", "xcap": "\u22C2", "xcirc": "\u25EF", "xcup": "\u22C3", "xdtri": "\u25BD", "Xfr": "\uD835\uDD1B", "xfr": "\uD835\uDD35", "xharr": "\u27F7", "xhArr": "\u27FA", "Xi": "\u039E", "xi": "\u03BE", "xlarr": "\u27F5", "xlArr": "\u27F8", "xmap": "\u27FC", "xnis": "\u22FB", "xodot": "\u2A00", "Xopf": "\uD835\uDD4F", "xopf": "\uD835\uDD69", "xoplus": "\u2A01", "xotime": "\u2A02", "xrarr": "\u27F6", "xrArr": "\u27F9", "Xscr": "\uD835\uDCB3", "xscr": "\uD835\uDCCD", "xsqcup": "\u2A06", "xuplus": "\u2A04", "xutri": "\u25B3", "xvee": "\u22C1", "xwedge": "\u22C0", "Yacute": "\u00DD", "yacute": "\u00FD", "YAcy": "\u042F", "yacy": "\u044F", "Ycirc": "\u0176", "ycirc": "\u0177", "Ycy": "\u042B", "ycy": "\u044B", "yen": "\u00A5", "Yfr": "\uD835\uDD1C", "yfr": "\uD835\uDD36", "YIcy": "\u0407", "yicy": "\u0457", "Yopf": "\uD835\uDD50", "yopf": "\uD835\uDD6A", "Yscr": "\uD835\uDCB4", "yscr": "\uD835\uDCCE", "YUcy": "\u042E", "yucy": "\u044E", "yuml": "\u00FF", "Yuml": "\u0178", "Zacute": "\u0179", "zacute": "\u017A", "Zcaron": "\u017D", "zcaron": "\u017E", "Zcy": "\u0417", "zcy": "\u0437", "Zdot": "\u017B", "zdot": "\u017C", "zeetrf": "\u2128", "ZeroWidthSpace": "\u200B", "Zeta": "\u0396", "zeta": "\u03B6", "zfr": "\uD835\uDD37", "Zfr": "\u2128", "ZHcy": "\u0416", "zhcy": "\u0436", "zigrarr": "\u21DD", "zopf": "\uD835\uDD6B", "Zopf": "\u2124", "Zscr": "\uD835\uDCB5", "zscr": "\uD835\uDCCF", "zwj": "\u200D", "zwnj": "\u200C" }

},{}],53:[function(require,module,exports){
'use strict';
function assign(obj ) {
  var sources = Array.prototype.slice.call(arguments, 1);

  sources.forEach(function (source) {
    if (!source) { return; }

    Object.keys(source).forEach(function (key) {
      obj[key] = source[key];
    });
  });

  return obj;
}

function _class(obj) { return Object.prototype.toString.call(obj); }
function isString(obj) { return _class(obj) === '[object String]'; }
function isObject(obj) { return _class(obj) === '[object Object]'; }
function isRegExp(obj) { return _class(obj) === '[object RegExp]'; }
function isFunction(obj) { return _class(obj) === '[object Function]'; }


function escapeRE(str) { return str.replace(/[.?*+^$[\]\\(){}|-]/g, '\\$&'); }


var defaultOptions = {
  fuzzyLink: true,
  fuzzyEmail: true,
  fuzzyIP: false
};


function isOptionsObj(obj) {
  return Object.keys(obj || {}).reduce(function (acc, k) {
    return acc || defaultOptions.hasOwnProperty(k);
  }, false);
}


var defaultSchemas = {
  'http:': {
    validate: function (text, pos, self) {
      var tail = text.slice(pos);

      if (!self.re.http) {
        self.re.http =  new RegExp(
          '^\\/\\/' + self.re.src_auth + self.re.src_host_port_strict + self.re.src_path, 'i'
        );
      }
      if (self.re.http.test(tail)) {
        return tail.match(self.re.http)[0].length;
      }
      return 0;
    }
  },
  'https:':  'http:',
  'ftp:':    'http:',
  '//':      {
    validate: function (text, pos, self) {
      var tail = text.slice(pos);

      if (!self.re.no_http) {
        self.re.no_http =  new RegExp(
          '^' +
          self.re.src_auth +
          '(?:localhost|(?:(?:' + self.re.src_domain + ')\\.)+' + self.re.src_domain_root + ')' +
          self.re.src_port +
          self.re.src_host_terminator +
          self.re.src_path,

          'i'
        );
      }

      if (self.re.no_http.test(tail)) {
        if (pos >= 3 && text[pos - 3] === ':') { return 0; }
        if (pos >= 3 && text[pos - 3] === '/') { return 0; }
        return tail.match(self.re.no_http)[0].length;
      }
      return 0;
    }
  },
  'mailto:': {
    validate: function (text, pos, self) {
      var tail = text.slice(pos);

      if (!self.re.mailto) {
        self.re.mailto =  new RegExp(
          '^' + self.re.src_email_name + '@' + self.re.src_host_strict, 'i'
        );
      }
      if (self.re.mailto.test(tail)) {
        return tail.match(self.re.mailto)[0].length;
      }
      return 0;
    }
  }
};
var tlds_2ch_src_re = 'a[cdefgilmnoqrstuwxz]|b[abdefghijmnorstvwyz]|c[acdfghiklmnoruvwxyz]|d[ejkmoz]|e[cegrstu]|f[ijkmor]|g[abdefghilmnpqrstuwy]|h[kmnrtu]|i[delmnoqrst]|j[emop]|k[eghimnprwyz]|l[abcikrstuvy]|m[acdeghklmnopqrstuvwxyz]|n[acefgilopruz]|om|p[aefghklmnrstwy]|qa|r[eosuw]|s[abcdeghijklmnortuvxyz]|t[cdfghjklmnortvwz]|u[agksyz]|v[aceginu]|w[fs]|y[et]|z[amw]';
var tlds_default = 'biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф'.split('|');

function resetScanCache(self) {
  self.__index__ = -1;
  self.__text_cache__   = '';
}

function createValidator(re) {
  return function (text, pos) {
    var tail = text.slice(pos);

    if (re.test(tail)) {
      return tail.match(re)[0].length;
    }
    return 0;
  };
}

function createNormalizer() {
  return function (match, self) {
    self.normalize(match);
  };
}
function compile(self) {
  var re = self.re = require('./lib/re')(self.__opts__);
  var tlds = self.__tlds__.slice();

  self.onCompile();

  if (!self.__tlds_replaced__) {
    tlds.push(tlds_2ch_src_re);
  }
  tlds.push(re.src_xn);

  re.src_tlds = tlds.join('|');

  function untpl(tpl) { return tpl.replace('%TLDS%', re.src_tlds); }

  re.email_fuzzy      = RegExp(untpl(re.tpl_email_fuzzy), 'i');
  re.link_fuzzy       = RegExp(untpl(re.tpl_link_fuzzy), 'i');
  re.link_no_ip_fuzzy = RegExp(untpl(re.tpl_link_no_ip_fuzzy), 'i');
  re.host_fuzzy_test  = RegExp(untpl(re.tpl_host_fuzzy_test), 'i');

  var aliases = [];

  self.__compiled__ = {}; 

  function schemaError(name, val) {
    throw new Error('(LinkifyIt) Invalid schema "' + name + '": ' + val);
  }

  Object.keys(self.__schemas__).forEach(function (name) {
    var val = self.__schemas__[name];
    if (val === null) { return; }

    var compiled = { validate: null, link: null };

    self.__compiled__[name] = compiled;

    if (isObject(val)) {
      if (isRegExp(val.validate)) {
        compiled.validate = createValidator(val.validate);
      } else if (isFunction(val.validate)) {
        compiled.validate = val.validate;
      } else {
        schemaError(name, val);
      }

      if (isFunction(val.normalize)) {
        compiled.normalize = val.normalize;
      } else if (!val.normalize) {
        compiled.normalize = createNormalizer();
      } else {
        schemaError(name, val);
      }

      return;
    }

    if (isString(val)) {
      aliases.push(name);
      return;
    }

    schemaError(name, val);
  });

  aliases.forEach(function (alias) {
    if (!self.__compiled__[self.__schemas__[alias]]) {
      return;
    }

    self.__compiled__[alias].validate =
      self.__compiled__[self.__schemas__[alias]].validate;
    self.__compiled__[alias].normalize =
      self.__compiled__[self.__schemas__[alias]].normalize;
  });
  self.__compiled__[''] = { validate: null, normalize: createNormalizer() };
  var slist = Object.keys(self.__compiled__)
                      .filter(function (name) {
                        return name.length > 0 && self.__compiled__[name];
                      })
                      .map(escapeRE)
                      .join('|');
  self.re.schema_test   = RegExp('(^|(?!_)(?:[><\uff5c]|' + re.src_ZPCc + '))(' + slist + ')', 'i');
  self.re.schema_search = RegExp('(^|(?!_)(?:[><\uff5c]|' + re.src_ZPCc + '))(' + slist + ')', 'ig');

  self.re.pretest = RegExp(
    '(' + self.re.schema_test.source + ')|(' + self.re.host_fuzzy_test.source + ')|@',
    'i'
  );

  resetScanCache(self);
}
function Match(self, shift) {
  var start = self.__index__,
      end   = self.__last_index__,
      text  = self.__text_cache__.slice(start, end);
  this.schema    = self.__schema__.toLowerCase();
  this.index     = start + shift;
  this.lastIndex = end + shift;
  this.raw       = text;
  this.text      = text;
  this.url       = text;
}

function createMatch(self, shift) {
  var match = new Match(self, shift);

  self.__compiled__[match.schema].normalize(match, self);

  return match;
}
function LinkifyIt(schemas, options) {
  if (!(this instanceof LinkifyIt)) {
    return new LinkifyIt(schemas, options);
  }

  if (!options) {
    if (isOptionsObj(schemas)) {
      options = schemas;
      schemas = {};
    }
  }

  this.__opts__           = assign({}, defaultOptions, options);
  this.__index__          = -1;
  this.__last_index__     = -1; 
  this.__schema__         = '';
  this.__text_cache__     = '';

  this.__schemas__        = assign({}, defaultSchemas, schemas);
  this.__compiled__       = {};

  this.__tlds__           = tlds_default;
  this.__tlds_replaced__  = false;

  this.re = {};

  compile(this);
}
LinkifyIt.prototype.add = function add(schema, definition) {
  this.__schemas__[schema] = definition;
  compile(this);
  return this;
};
LinkifyIt.prototype.set = function set(options) {
  this.__opts__ = assign(this.__opts__, options);
  return this;
};
LinkifyIt.prototype.test = function test(text) {
  this.__text_cache__ = text;
  this.__index__      = -1;

  if (!text.length) { return false; }

  var m, ml, me, len, shift, next, re, tld_pos, at_pos;
  if (this.re.schema_test.test(text)) {
    re = this.re.schema_search;
    re.lastIndex = 0;
    while ((m = re.exec(text)) !== null) {
      len = this.testSchemaAt(text, m[2], re.lastIndex);
      if (len) {
        this.__schema__     = m[2];
        this.__index__      = m.index + m[1].length;
        this.__last_index__ = m.index + m[0].length + len;
        break;
      }
    }
  }

  if (this.__opts__.fuzzyLink && this.__compiled__['http:']) {
    tld_pos = text.search(this.re.host_fuzzy_test);
    if (tld_pos >= 0) {
      if (this.__index__ < 0 || tld_pos < this.__index__) {
        if ((ml = text.match(this.__opts__.fuzzyIP ? this.re.link_fuzzy : this.re.link_no_ip_fuzzy)) !== null) {

          shift = ml.index + ml[1].length;

          if (this.__index__ < 0 || shift < this.__index__) {
            this.__schema__     = '';
            this.__index__      = shift;
            this.__last_index__ = ml.index + ml[0].length;
          }
        }
      }
    }
  }

  if (this.__opts__.fuzzyEmail && this.__compiled__['mailto:']) {
    at_pos = text.indexOf('@');
    if (at_pos >= 0) {
      if ((me = text.match(this.re.email_fuzzy)) !== null) {

        shift = me.index + me[1].length;
        next  = me.index + me[0].length;

        if (this.__index__ < 0 || shift < this.__index__ ||
            (shift === this.__index__ && next > this.__last_index__)) {
          this.__schema__     = 'mailto:';
          this.__index__      = shift;
          this.__last_index__ = next;
        }
      }
    }
  }

  return this.__index__ >= 0;
};
LinkifyIt.prototype.pretest = function pretest(text) {
  return this.re.pretest.test(text);
};
LinkifyIt.prototype.testSchemaAt = function testSchemaAt(text, schema, pos) {
  if (!this.__compiled__[schema.toLowerCase()]) {
    return 0;
  }
  return this.__compiled__[schema.toLowerCase()].validate(text, pos, this);
};
LinkifyIt.prototype.match = function match(text) {
  var shift = 0, result = [];
  if (this.__index__ >= 0 && this.__text_cache__ === text) {
    result.push(createMatch(this, shift));
    shift = this.__last_index__;
  }
  var tail = shift ? text.slice(shift) : text;
  while (this.test(tail)) {
    result.push(createMatch(this, shift));

    tail = tail.slice(this.__last_index__);
    shift += this.__last_index__;
  }

  if (result.length) {
    return result;
  }

  return null;
};
LinkifyIt.prototype.tlds = function tlds(list, keepOld) {
  list = Array.isArray(list) ? list : [ list ];

  if (!keepOld) {
    this.__tlds__ = list.slice();
    this.__tlds_replaced__ = true;
    compile(this);
    return this;
  }

  this.__tlds__ = this.__tlds__.concat(list)
                                  .sort()
                                  .filter(function (el, idx, arr) {
                                    return el !== arr[idx - 1];
                                  })
                                  .reverse();

  compile(this);
  return this;
};
LinkifyIt.prototype.normalize = function normalize(match) {

  if (!match.schema) { match.url = 'http://' + match.url; }

  if (match.schema === 'mailto:' && !/^mailto:/i.test(match.url)) {
    match.url = 'mailto:' + match.url;
  }
};
LinkifyIt.prototype.onCompile = function onCompile() {
};


module.exports = LinkifyIt;

},{"./lib/re":54}],54:[function(require,module,exports){
'use strict';


module.exports = function (opts) {
  var re = {};
  re.src_Any = require('uc.micro/properties/Any/regex').source;
  re.src_Cc  = require('uc.micro/categories/Cc/regex').source;
  re.src_Z   = require('uc.micro/categories/Z/regex').source;
  re.src_P   = require('uc.micro/categories/P/regex').source;
  re.src_ZPCc = [ re.src_Z, re.src_P, re.src_Cc ].join('|');
  re.src_ZCc = [ re.src_Z, re.src_Cc ].join('|');
  var text_separators = '[><\uff5c]';
  re.src_pseudo_letter       = '(?:(?!' + text_separators + '|' + re.src_ZPCc + ')' + re.src_Any + ')';

  re.src_ip4 =

    '(?:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)';
  re.src_auth    = '(?:(?:(?!' + re.src_ZCc + '|[@/\\[\\]()]).)+@)?';

  re.src_port =

    '(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?';

  re.src_host_terminator =

    '(?=$|' + text_separators + '|' + re.src_ZPCc + ')(?!-|_|:\\d|\\.-|\\.(?!$|' + re.src_ZPCc + '))';

  re.src_path =

    '(?:' +
      '[/?#]' +
        '(?:' +
          '(?!' + re.src_ZCc + '|' + text_separators + '|[()[\\]{}.,"\'?!\\-]).|' +
          '\\[(?:(?!' + re.src_ZCc + '|\\]).)*\\]|' +
          '\\((?:(?!' + re.src_ZCc + '|[)]).)*\\)|' +
          '\\{(?:(?!' + re.src_ZCc + '|[}]).)*\\}|' +
          '\\"(?:(?!' + re.src_ZCc + '|["]).)+\\"|' +
          "\\'(?:(?!" + re.src_ZCc + "|[']).)+\\'|" +
          "\\'(?=" + re.src_pseudo_letter + '|[-]).|' +  
          '\\.{2,4}[a-zA-Z0-9%/]|' + 
          '\\.(?!' + re.src_ZCc + '|[.]).|' +
          (opts && opts['---'] ?
            '\\-(?!--(?:[^-]|$))(?:-*)|' 
            :
            '\\-+|'
          ) +
          '\\,(?!' + re.src_ZCc + ').|' +      
          '\\!(?!' + re.src_ZCc + '|[!]).|' +
          '\\?(?!' + re.src_ZCc + '|[?]).' +
        ')+' +
      '|\\/' +
    ')?';
  re.src_email_name =

    '[\\-;:&=\\+\\$,\\.a-zA-Z0-9_][\\-;:&=\\+\\$,\\"\\.a-zA-Z0-9_]*';

  re.src_xn =

    'xn--[a-z0-9\\-]{1,59}';

  re.src_domain_root =
    '(?:' +
      re.src_xn +
      '|' +
      re.src_pseudo_letter + '{1,63}' +
    ')';

  re.src_domain =

    '(?:' +
      re.src_xn +
      '|' +
      '(?:' + re.src_pseudo_letter + ')' +
      '|' +
      '(?:' + re.src_pseudo_letter + '(?:-|' + re.src_pseudo_letter + '){0,61}' + re.src_pseudo_letter + ')' +
    ')';

  re.src_host =

    '(?:' +
      '(?:(?:(?:' + re.src_domain + ')\\.)*' + re.src_domain + ')' +
    ')';

  re.tpl_host_fuzzy =

    '(?:' +
      re.src_ip4 +
    '|' +
      '(?:(?:(?:' + re.src_domain + ')\\.)+(?:%TLDS%))' +
    ')';

  re.tpl_host_no_ip_fuzzy =

    '(?:(?:(?:' + re.src_domain + ')\\.)+(?:%TLDS%))';

  re.src_host_strict =

    re.src_host + re.src_host_terminator;

  re.tpl_host_fuzzy_strict =

    re.tpl_host_fuzzy + re.src_host_terminator;

  re.src_host_port_strict =

    re.src_host + re.src_port + re.src_host_terminator;

  re.tpl_host_port_fuzzy_strict =

    re.tpl_host_fuzzy + re.src_port + re.src_host_terminator;

  re.tpl_host_port_no_ip_fuzzy_strict =

    re.tpl_host_no_ip_fuzzy + re.src_port + re.src_host_terminator;
  re.tpl_host_fuzzy_test =

    'localhost|www\\.|\\.\\d{1,3}\\.|(?:\\.(?:%TLDS%)(?:' + re.src_ZPCc + '|>|$))';

  re.tpl_email_fuzzy =

      '(^|' + text_separators + '|"|\\(|' + re.src_ZCc + ')' +
      '(' + re.src_email_name + '@' + re.tpl_host_fuzzy_strict + ')';

  re.tpl_link_fuzzy =
      '(^|(?![.:/\\-_@])(?:[$+<=>^`|\uff5c]|' + re.src_ZPCc + '))' +
      '((?![$+<=>^`|\uff5c])' + re.tpl_host_port_fuzzy_strict + re.src_path + ')';

  re.tpl_link_no_ip_fuzzy =
      '(^|(?![.:/\\-_@])(?:[$+<=>^`|\uff5c]|' + re.src_ZPCc + '))' +
      '((?![$+<=>^`|\uff5c])' + re.tpl_host_port_no_ip_fuzzy_strict + re.src_path + ')';

  return re;
};

},{"uc.micro/categories/Cc/regex":61,"uc.micro/categories/P/regex":63,"uc.micro/categories/Z/regex":64,"uc.micro/properties/Any/regex":66}],55:[function(require,module,exports){

'use strict';

var decodeCache = {};

function getDecodeCache(exclude) {
  var i, ch, cache = decodeCache[exclude];
  if (cache) { return cache; }

  cache = decodeCache[exclude] = [];

  for (i = 0; i < 128; i++) {
    ch = String.fromCharCode(i);
    cache.push(ch);
  }

  for (i = 0; i < exclude.length; i++) {
    ch = exclude.charCodeAt(i);
    cache[ch] = '%' + ('0' + ch.toString(16).toUpperCase()).slice(-2);
  }

  return cache;
}
function decode(string, exclude) {
  var cache;

  if (typeof exclude !== 'string') {
    exclude = decode.defaultChars;
  }

  cache = getDecodeCache(exclude);

  return string.replace(/(%[a-f0-9]{2})+/gi, function(seq) {
    var i, l, b1, b2, b3, b4, chr,
        result = '';

    for (i = 0, l = seq.length; i < l; i += 3) {
      b1 = parseInt(seq.slice(i + 1, i + 3), 16);

      if (b1 < 0x80) {
        result += cache[b1];
        continue;
      }

      if ((b1 & 0xE0) === 0xC0 && (i + 3 < l)) {
        b2 = parseInt(seq.slice(i + 4, i + 6), 16);

        if ((b2 & 0xC0) === 0x80) {
          chr = ((b1 << 6) & 0x7C0) | (b2 & 0x3F);

          if (chr < 0x80) {
            result += '\ufffd\ufffd';
          } else {
            result += String.fromCharCode(chr);
          }

          i += 3;
          continue;
        }
      }

      if ((b1 & 0xF0) === 0xE0 && (i + 6 < l)) {
        b2 = parseInt(seq.slice(i + 4, i + 6), 16);
        b3 = parseInt(seq.slice(i + 7, i + 9), 16);

        if ((b2 & 0xC0) === 0x80 && (b3 & 0xC0) === 0x80) {
          chr = ((b1 << 12) & 0xF000) | ((b2 << 6) & 0xFC0) | (b3 & 0x3F);

          if (chr < 0x800 || (chr >= 0xD800 && chr <= 0xDFFF)) {
            result += '\ufffd\ufffd\ufffd';
          } else {
            result += String.fromCharCode(chr);
          }

          i += 6;
          continue;
        }
      }

      if ((b1 & 0xF8) === 0xF0 && (i + 9 < l)) {
        b2 = parseInt(seq.slice(i + 4, i + 6), 16);
        b3 = parseInt(seq.slice(i + 7, i + 9), 16);
        b4 = parseInt(seq.slice(i + 10, i + 12), 16);

        if ((b2 & 0xC0) === 0x80 && (b3 & 0xC0) === 0x80 && (b4 & 0xC0) === 0x80) {
          chr = ((b1 << 18) & 0x1C0000) | ((b2 << 12) & 0x3F000) | ((b3 << 6) & 0xFC0) | (b4 & 0x3F);

          if (chr < 0x10000 || chr > 0x10FFFF) {
            result += '\ufffd\ufffd\ufffd\ufffd';
          } else {
            chr -= 0x10000;
            result += String.fromCharCode(0xD800 + (chr >> 10), 0xDC00 + (chr & 0x3FF));
          }

          i += 9;
          continue;
        }
      }

      result += '\ufffd';
    }

    return result;
  });
}


decode.defaultChars   = ';/?:@&=+$,#';
decode.componentChars = '';


module.exports = decode;

},{}],56:[function(require,module,exports){

'use strict';


var encodeCache = {};
function getEncodeCache(exclude) {
  var i, ch, cache = encodeCache[exclude];
  if (cache) { return cache; }

  cache = encodeCache[exclude] = [];

  for (i = 0; i < 128; i++) {
    ch = String.fromCharCode(i);

    if (/^[0-9a-z]$/i.test(ch)) {
      cache.push(ch);
    } else {
      cache.push('%' + ('0' + i.toString(16).toUpperCase()).slice(-2));
    }
  }

  for (i = 0; i < exclude.length; i++) {
    cache[exclude.charCodeAt(i)] = exclude[i];
  }

  return cache;
}
function encode(string, exclude, keepEscaped) {
  var i, l, code, nextCode, cache,
      result = '';

  if (typeof exclude !== 'string') {
    keepEscaped  = exclude;
    exclude = encode.defaultChars;
  }

  if (typeof keepEscaped === 'undefined') {
    keepEscaped = true;
  }

  cache = getEncodeCache(exclude);

  for (i = 0, l = string.length; i < l; i++) {
    code = string.charCodeAt(i);

    if (keepEscaped && code === 0x25  && i + 2 < l) {
      if (/^[0-9a-f]{2}$/i.test(string.slice(i + 1, i + 3))) {
        result += string.slice(i, i + 3);
        i += 2;
        continue;
      }
    }

    if (code < 128) {
      result += cache[code];
      continue;
    }

    if (code >= 0xD800 && code <= 0xDFFF) {
      if (code >= 0xD800 && code <= 0xDBFF && i + 1 < l) {
        nextCode = string.charCodeAt(i + 1);
        if (nextCode >= 0xDC00 && nextCode <= 0xDFFF) {
          result += encodeURIComponent(string[i] + string[i + 1]);
          i++;
          continue;
        }
      }
      result += '%EF%BF%BD';
      continue;
    }

    result += encodeURIComponent(string[i]);
  }

  return result;
}

encode.defaultChars   = ";/?:@&=+$,-_.!~*'()#";
encode.componentChars = "-_.!~*'()";


module.exports = encode;

},{}],57:[function(require,module,exports){

'use strict';


module.exports = function format(url) {
  var result = '';

  result += url.protocol || '';
  result += url.slashes ? '//' : '';
  result += url.auth ? url.auth + '@' : '';

  if (url.hostname && url.hostname.indexOf(':') !== -1) {
    result += '[' + url.hostname + ']';
  } else {
    result += url.hostname || '';
  }

  result += url.port ? ':' + url.port : '';
  result += url.pathname || '';
  result += url.search || '';
  result += url.hash || '';

  return result;
};

},{}],58:[function(require,module,exports){
'use strict';


module.exports.encode = require('./encode');
module.exports.decode = require('./decode');
module.exports.format = require('./format');
module.exports.parse  = require('./parse');

},{"./decode":55,"./encode":56,"./format":57,"./parse":59}],59:[function(require,module,exports){

'use strict';


function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.pathname = null;
}
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,
    delims = [ '<', '>', '"', '`', ' ', '\r', '\n', '\t' ],
    unwise = [ '{', '}', '|', '\\', '^', '`' ].concat(delims),
    autoEscape = [ '\'' ].concat(unwise),
    nonHostChars = [ '%', '/', '?', ';', '#' ].concat(autoEscape),
    hostEndingChars = [ '/', '?', '#' ],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    };

function urlParse(url, slashesDenoteHost) {
  if (url && url instanceof Url) { return url; }

  var u = new Url();
  u.parse(url, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, slashesDenoteHost) {
  var i, l, lowerProto, hec, slashes,
      rest = url;
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    lowerProto = proto.toLowerCase();
    this.protocol = proto;
    rest = rest.substr(proto.length);
  }
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {
    var hostEnd = -1;
    for (i = 0; i < hostEndingChars.length; i++) {
      hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) {
        hostEnd = hec;
      }
    }
    var auth, atSign;
    if (hostEnd === -1) {
      atSign = rest.lastIndexOf('@');
    } else {
      atSign = rest.lastIndexOf('@', hostEnd);
    }
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = auth;
    }
    hostEnd = -1;
    for (i = 0; i < nonHostChars.length; i++) {
      hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) {
        hostEnd = hec;
      }
    }
    if (hostEnd === -1) {
      hostEnd = rest.length;
    }

    if (rest[hostEnd - 1] === ':') { hostEnd--; }
    var host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);
    this.parseHost(host);
    this.hostname = this.hostname || '';
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) { continue; }
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    }
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
    }
  }
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    rest = rest.slice(0, qm);
  }
  if (rest) { this.pathname = rest; }
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '';
  }

  return this;
};

Url.prototype.parseHost = function(host) {
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) { this.hostname = host; }
};

module.exports = urlParse;

},{}],60:[function(require,module,exports){
(function (global){
;(function(root) {
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}
	var punycode,
	maxInt = 2147483647, 
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, 
	delimiter = '-', 
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, 
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, 
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,
	key;
	function error(type) {
		throw new RangeError(errors[type]);
	}
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			result = parts[0] + '@';
			string = parts[1];
		}
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { 
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}
	function digitToBasic(digit, flag) {
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}
	function decode(input) {
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    baseMinusT;

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; ) {
			for (oldi = i, w = 1, k = base; ; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    inputLength,
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;
		input = ucs2decode(input);
		inputLength = input.length;
		n = initialN;
		delta = 0;
		bias = initialBias;
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;
		if (basicLength) {
			output.push(delimiter);
		}
		while (handledCPCount < inputLength) {
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					for (q = delta, k = base; ; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}
	punycode = {
		'version': '1.4.1',
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			freeModule.exports = punycode;
		} else {
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],61:[function(require,module,exports){
module.exports=/[\0-\x1F\x7F-\x9F]/
},{}],62:[function(require,module,exports){
module.exports=/[\xAD\u0600-\u0605\u061C\u06DD\u070F\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/
},{}],63:[function(require,module,exports){
module.exports=/[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4E\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDF55-\uDF59]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDF3C-\uDF3E]|\uD806[\uDC3B\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/
},{}],64:[function(require,module,exports){
module.exports=/[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/
},{}],65:[function(require,module,exports){
'use strict';

exports.Any = require('./properties/Any/regex');
exports.Cc  = require('./categories/Cc/regex');
exports.Cf  = require('./categories/Cf/regex');
exports.P   = require('./categories/P/regex');
exports.Z   = require('./categories/Z/regex');

},{"./categories/Cc/regex":61,"./categories/Cf/regex":62,"./categories/P/regex":63,"./categories/Z/regex":64,"./properties/Any/regex":66}],66:[function(require,module,exports){
module.exports=/[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/
},{}],67:[function(require,module,exports){
'use strict';


module.exports = require('./lib/');

},{"./lib/":9}]},{},[67])(67)
});
;
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var r;r="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,r.markdownitSub=e()}}(function(){return function e(r,o,n){function t(i,u){if(!o[i]){if(!r[i]){var f="function"==typeof require&&require;if(!u&&f)return f(i,!0);if(s)return s(i,!0);var p=new Error("Cannot find module '"+i+"'");throw p.code="MODULE_NOT_FOUND",p}var a=o[i]={exports:{}};r[i][0].call(a.exports,function(e){var o=r[i][1][e];return t(o?o:e)},a,a.exports,e,r,o,n)}return o[i].exports}for(var s="function"==typeof require&&require,i=0;i<n.length;i++)t(n[i]);return t}({1:[function(e,r){"use strict";function o(e,r){var o,t,s,i=e.posMax,u=e.pos;if(126!==e.src.charCodeAt(u))return!1;if(r)return!1;if(u+2>=i)return!1;for(e.pos=u+1;e.pos<i;){if(126===e.src.charCodeAt(e.pos)){o=!0;break}e.md.inline.skipToken(e)}return o&&u+1!==e.pos?(t=e.src.slice(u+1,e.pos),t.match(/(^|[^\\])(\\\\)*\s/)?(e.pos=u,!1):(e.posMax=e.pos,e.pos=u+1,s=e.push("sub_open","sub",1),s.markup="~",s=e.push("text","",0),s.content=t.replace(n,"$1"),s=e.push("sub_close","sub",-1),s.markup="~",e.pos=e.posMax+1,e.posMax=i,!0)):(e.pos=u,!1)}var n=/\\([ \\!"#$%&'()*+,.\/:;<=>?@[\]^_`{|}~-])/g;r.exports=function(e){e.inline.ruler.after("emphasis","sub",o)}},{}]},{},[1])(1)});;/*! markdown-it-sup 1.0.0 https://github.com//markdown-it/markdown-it-sup @license MIT */
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var r;r="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,r.markdownitSup=e()}}(function(){return function e(r,o,n){function t(i,p){if(!o[i]){if(!r[i]){var u="function"==typeof require&&require;if(!p&&u)return u(i,!0);if(s)return s(i,!0);var f=new Error("Cannot find module '"+i+"'");throw f.code="MODULE_NOT_FOUND",f}var a=o[i]={exports:{}};r[i][0].call(a.exports,function(e){var o=r[i][1][e];return t(o?o:e)},a,a.exports,e,r,o,n)}return o[i].exports}for(var s="function"==typeof require&&require,i=0;i<n.length;i++)t(n[i]);return t}({1:[function(e,r){"use strict";function o(e,r){var o,t,s,i=e.posMax,p=e.pos;if(94!==e.src.charCodeAt(p))return!1;if(r)return!1;if(p+2>=i)return!1;for(e.pos=p+1;e.pos<i;){if(94===e.src.charCodeAt(e.pos)){o=!0;break}e.md.inline.skipToken(e)}return o&&p+1!==e.pos?(t=e.src.slice(p+1,e.pos),t.match(/(^|[^\\])(\\\\)*\s/)?(e.pos=p,!1):(e.posMax=e.pos,e.pos=p+1,s=e.push("sup_open","sup",1),s.markup="^",s=e.push("text","",0),s.content=t.replace(n,"$1"),s=e.push("sup_close","sup",-1),s.markup="^",e.pos=e.posMax+1,e.posMax=i,!0)):(e.pos=p,!1)}var n=/\\([ \\!"#$%&'()*+,.\/:;<=>?@[\]^_`{|}~-])/g;r.exports=function(e){e.inline.ruler.after("emphasis","sup",o)}},{}]},{},[1])(1)});;!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this).markdownitFootnote=e()}}(function(){return function(){return function e(o,t,n){function r(f,l){if(!t[f]){if(!o[f]){var i="function"==typeof require&&require;if(!l&&i)return i(f,!0);if(s)return s(f,!0);var u=new Error("Cannot find module '"+f+"'");throw u.code="MODULE_NOT_FOUND",u}var a=t[f]={exports:{}};o[f][0].call(a.exports,function(e){return r(o[f][1][e]||e)},a,a.exports,e,o,t,n)}return t[f].exports}for(var s="function"==typeof require&&require,f=0;f<n.length;f++)r(n[f]);return r}}()({1:[function(e,o,t){"use strict";function n(e,o,t,n){var r=Number(e[o].meta.id+1).toString(),s="";return"string"==typeof n.docId&&(s="-"+n.docId+"-"),s+r}function r(e,o){var t=Number(e[o].meta.id+1).toString();return e[o].meta.subId>0&&(t+=":"+e[o].meta.subId),"["+t+"]"}function s(e,o,t,n,r){var s=r.rules.footnote_anchor_name(e,o,t,n,r),f=r.rules.footnote_caption(e,o,t,n,r),l=s;return e[o].meta.subId>0&&(l+=":"+e[o].meta.subId),'<sup class="footnote-ref"><a href="#fn'+s+'" id="fnref'+l+'">'+f+"</a></sup>"}function f(e,o,t){return(t.xhtmlOut?'<hr class="footnotes-sep" />\n':'<hr class="footnotes-sep">\n')+'<section class="footnotes">\n<ol class="footnotes-list">\n'}function l(){return"</ol>\n</section>\n"}function i(e,o,t,n,r){var s=r.rules.footnote_anchor_name(e,o,t,n,r);return e[o].meta.subId>0&&(s+=":"+e[o].meta.subId),'<li id="fn'+s+'" class="footnote-item">'}function u(){return"</li>\n"}function a(e,o,t,n,r){var s=r.rules.footnote_anchor_name(e,o,t,n,r);return e[o].meta.subId>0&&(s+=":"+e[o].meta.subId),' <a href="#fnref'+s+'" class="footnote-backref">\u21a9\ufe0e</a>'}o.exports=function(e){var o=e.helpers.parseLinkLabel,t=e.utils.isSpace;e.renderer.rules.footnote_ref=s,e.renderer.rules.footnote_block_open=f,e.renderer.rules.footnote_block_close=l,e.renderer.rules.footnote_open=i,e.renderer.rules.footnote_close=u,e.renderer.rules.footnote_anchor=a,e.renderer.rules.footnote_caption=r,e.renderer.rules.footnote_anchor_name=n,e.block.ruler.before("reference","footnote_def",function(e,o,n,r){var s,f,l,i,u,a,c,p,d,h,k,b=e.bMarks[o]+e.tShift[o],v=e.eMarks[o];if(b+4>v)return!1;if(91!==e.src.charCodeAt(b))return!1;if(94!==e.src.charCodeAt(b+1))return!1;for(u=b+2;u<v;u++){if(32===e.src.charCodeAt(u))return!1;if(93===e.src.charCodeAt(u))break}if(u===b+2)return!1;if(u+1>=v||58!==e.src.charCodeAt(++u))return!1;if(r)return!0;for(u++,e.env.footnotes||(e.env.footnotes={}),e.env.footnotes.refs||(e.env.footnotes.refs={}),a=e.src.slice(b+2,u-2),e.env.footnotes.refs[":"+a]=-1,(c=new e.Token("footnote_reference_open","",1)).meta={label:a},c.level=e.level++,e.tokens.push(c),s=e.bMarks[o],f=e.tShift[o],l=e.sCount[o],i=e.parentType,k=u,p=d=e.sCount[o]+u-(e.bMarks[o]+e.tShift[o]);u<v&&(h=e.src.charCodeAt(u),t(h));)9===h?d+=4-d%4:d++,u++;return e.tShift[o]=u-k,e.sCount[o]=d-p,e.bMarks[o]=k,e.blkIndent+=4,e.parentType="footnote",e.sCount[o]<e.blkIndent&&(e.sCount[o]+=e.blkIndent),e.md.block.tokenize(e,o,n,!0),e.parentType=i,e.blkIndent-=4,e.tShift[o]=f,e.sCount[o]=l,e.bMarks[o]=s,(c=new e.Token("footnote_reference_close","",-1)).level=--e.level,e.tokens.push(c),!0},{alt:["paragraph","reference"]}),e.inline.ruler.after("image","footnote_inline",function(e,t){var n,r,s,f,l=e.posMax,i=e.pos;return!(i+2>=l||94!==e.src.charCodeAt(i)||91!==e.src.charCodeAt(i+1)||(n=i+2,(r=o(e,i+1))<0||(t||(e.env.footnotes||(e.env.footnotes={}),e.env.footnotes.list||(e.env.footnotes.list=[]),s=e.env.footnotes.list.length,e.md.inline.parse(e.src.slice(n,r),e.md,e.env,f=[]),e.push("footnote_ref","",0).meta={id:s},e.env.footnotes.list[s]={content:e.src.slice(n,r),tokens:f}),e.pos=r+1,e.posMax=l,0)))}),e.inline.ruler.after("footnote_inline","footnote_ref",function(e,o){var t,n,r,s,f=e.posMax,l=e.pos;if(l+3>f)return!1;if(!e.env.footnotes||!e.env.footnotes.refs)return!1;if(91!==e.src.charCodeAt(l))return!1;if(94!==e.src.charCodeAt(l+1))return!1;for(n=l+2;n<f;n++){if(32===e.src.charCodeAt(n))return!1;if(10===e.src.charCodeAt(n))return!1;if(93===e.src.charCodeAt(n))break}return!(n===l+2||n>=f||(n++,t=e.src.slice(l+2,n-1),void 0===e.env.footnotes.refs[":"+t]||(o||(e.env.footnotes.list||(e.env.footnotes.list=[]),e.env.footnotes.refs[":"+t]<0?(r=e.env.footnotes.list.length,e.env.footnotes.list[r]={label:t,count:0},e.env.footnotes.refs[":"+t]=r):r=e.env.footnotes.refs[":"+t],s=e.env.footnotes.list[r].count,e.env.footnotes.list[r].count++,e.push("footnote_ref","",0).meta={id:r,subId:s,label:t}),e.pos=n,e.posMax=f,0)))}),e.core.ruler.after("inline","footnote_tail",function(e){var o,t,n,r,s,f,l,i,u,a,c=!1,p={};if(e.env.footnotes&&(e.tokens=e.tokens.filter(function(e){return"footnote_reference_open"===e.type?(c=!0,u=[],a=e.meta.label,!1):"footnote_reference_close"===e.type?(c=!1,p[":"+a]=u,!1):(c&&u.push(e),!c)}),e.env.footnotes.list)){for(f=e.env.footnotes.list,l=new e.Token("footnote_block_open","",1),e.tokens.push(l),o=0,t=f.length;o<t;o++){for((l=new e.Token("footnote_open","",1)).meta={id:o,label:f[o].label},e.tokens.push(l),f[o].tokens?(i=[],(l=new e.Token("paragraph_open","p",1)).block=!0,i.push(l),(l=new e.Token("inline","",0)).children=f[o].tokens,l.content=f[o].content,i.push(l),(l=new e.Token("paragraph_close","p",-1)).block=!0,i.push(l)):f[o].label&&(i=p[":"+f[o].label]),i&&(e.tokens=e.tokens.concat(i)),s="paragraph_close"===e.tokens[e.tokens.length-1].type?e.tokens.pop():null,r=f[o].count>0?f[o].count:1,n=0;n<r;n++)(l=new e.Token("footnote_anchor","",0)).meta={id:o,subId:n,label:f[o].label},e.tokens.push(l);s&&e.tokens.push(s),l=new e.Token("footnote_close","",-1),e.tokens.push(l)}l=new e.Token("footnote_block_close","",-1),e.tokens.push(l)}})}},{}]},{},[1])(1)});
;
!function(n){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=n();else if("function"==typeof define&&define.amd)define([],n);else{var e;e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,e.markdownitTaskLists=n()}}(function(){return function(){function n(e,t,i){function r(c,l){if(!t[c]){if(!e[c]){var f="function"==typeof require&&require;if(!l&&f)return f(c,!0);if(o)return o(c,!0);var u=new Error("Cannot find module '"+c+"'");throw u.code="MODULE_NOT_FOUND",u}var a=t[c]={exports:{}};e[c][0].call(a.exports,function(n){var t=e[c][1][n];return r(t?t:n)},a,a.exports,n,e,t,i)}return t[c].exports}for(var o="function"==typeof require&&require,c=0;c<i.length;c++)r(i[c]);return r}return n}()({1:[function(n,e,t){function i(n,e,t){var i=n.attrIndex(e),r=[e,t];0>i?n.attrPush(r):n.attrs[i]=r}function r(n,e){for(var t=n[e].level-1,i=e-1;i>=0;i--)if(n[i].level===t)return i;return-1}function o(n,e){return s(n[e])&&d(n[e-1])&&h(n[e-2])&&p(n[e])}function c(n,e){if(n.children.unshift(l(n,e)),n.children[1].content=n.children[1].content.slice(3),n.content=n.content.slice(3),b)if(v){n.children.pop();var t="task-item-"+Math.ceil(1e7*Math.random()-1e3);n.children[0].content=n.children[0].content.slice(0,-1)+' id="'+t+'">',n.children.push(a(n.content,t,e))}else n.children.unshift(f(e)),n.children.push(u(e))}function l(n,e){var t=new e("html_inline","",0),i=x?' disabled="" ':"";return 0===n.content.indexOf("[ ] ")?t.content='<input class="task-list-item-checkbox"'+i+'type="checkbox">':(0===n.content.indexOf("[x] ")||0===n.content.indexOf("[X] "))&&(t.content='<input class="task-list-item-checkbox" checked=""'+i+'type="checkbox">'),t}function f(n){var e=new n("html_inline","",0);return e.content="<label>",e}function u(n){var e=new n("html_inline","",0);return e.content="</label>",e}function a(n,e,t){var i=new t("html_inline","",0);return i.content='<label class="task-list-item-label" for="'+e+'">'+n+"</label>",i.attrs=[{"for":e}],i}function s(n){return"inline"===n.type}function d(n){return"paragraph_open"===n.type}function h(n){return"list_item_open"===n.type}function p(n){return 0===n.content.indexOf("[ ] ")||0===n.content.indexOf("[x] ")||0===n.content.indexOf("[X] ")}var x=!0,b=!1,v=!1;e.exports=function(n,e){e&&(x=!e.enabled,b=!!e.label,v=!!e.labelAfter),n.core.ruler.after("inline","github-task-lists",function(n){for(var e=n.tokens,t=2;t<e.length;t++)o(e,t)&&(c(e[t],n.Token),i(e[t-2],"class","task-list-item"+(x?"":" enabled")),i(e[r(e,t-2)],"class","contains-task-list"))})}},{}]},{},[1])(1)});
;!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define("ComponentRelay",[],t):"object"==typeof exports?exports.ComponentRelay=t():e.ComponentRelay=t()}(self,(function(){return(()=>{"use strict";var e={d:(t,s)=>{for(var n in s)e.o(s,n)&&!e.o(t,n)&&Object.defineProperty(t,n,{enumerable:!0,get:s[n]})},o:(e,t)=>Object.prototype.hasOwnProperty.call(e,t)},t={};let s,n,i,o;var a;e.d(t,{default:()=>w}),function(e){e.SetSize="set-size",e.StreamItems="stream-items",e.StreamContextItem="stream-context-item",e.SaveItems="save-items",e.SelectItem="select-item",e.AssociateItem="associate-item",e.DeassociateItem="deassociate-item",e.ClearSelection="clear-selection",e.CreateItem="create-item",e.CreateItems="create-items",e.DeleteItems="delete-items",e.SetComponentData="set-component-data",e.InstallLocalComponent="install-local-component",e.ToggleActivateComponent="toggle-activate-component",e.RequestPermissions="request-permissions",e.PresentConflictResolution="present-conflict-resolution",e.DuplicateItem="duplicate-item",e.ComponentRegistered="component-registered",e.ActivateThemes="themes",e.Reply="reply",e.SaveSuccess="save-success",e.SaveError="save-error",e.ThemesActivated="themes-activated",e.KeyDown="key-down",e.KeyUp="key-up",e.Click="click"}(s||(s={})),function(e){e[e.Web=1]="Web",e[e.Desktop=2]="Desktop",e[e.Mobile=3]="Mobile"}(n||(n={})),function(e){e.Any="*",e.Item="SF|Item",e.RootKey="SN|RootKey|NoSync",e.ItemsKey="SN|ItemsKey",e.EncryptedStorage="SN|EncryptedStorage",e.Note="Note",e.Tag="Tag",e.SmartTag="SN|SmartTag",e.Component="SN|Component",e.Editor="SN|Editor",e.ActionsExtension="Extension",e.UserPrefs="SN|UserPreferences",e.HistorySession="SN|HistorySession",e.Theme="SN|Theme",e.Mfa="SF|MFA",e.ServerExtension="SF|Extension",e.FilesafeCredentials="SN|FileSafe|Credentials",e.FilesafeFileMetadata="SN|FileSafe|FileMetadata",e.FilesafeIntegration="SN|FileSafe|Integration",e.ExtensionRepo="SN|ExtensionRepo"}(i||(i={})),function(e){e.Pinned="pinned",e.Archived="archived",e.Locked="locked",e.UserModifiedDate="client_updated_at",e.DefaultEditor="defaultEditor",e.MobileRules="mobileRules",e.NotAvailableOnMobile="notAvailableOnMobile",e.MobileActive="mobileActive",e.LastSize="lastSize",e.PrefersPlainEditor="prefersPlainEditor",e.ComponentInstallError="installError"}(o||(o={}));var r=new Uint8Array(16);function c(){if(!a&&!(a="undefined"!=typeof crypto&&crypto.getRandomValues&&crypto.getRandomValues.bind(crypto)||"undefined"!=typeof msCrypto&&"function"==typeof msCrypto.getRandomValues&&msCrypto.getRandomValues.bind(msCrypto)))throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");return a(r)}const m=/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i,l=function(e){return"string"==typeof e&&m.test(e)};for(var d=[],h=0;h<256;++h)d.push((h+256).toString(16).substr(1));const p=function(e,t,s){var n=(e=e||{}).random||(e.rng||c)();if(n[6]=15&n[6]|64,n[8]=63&n[8]|128,t){s=s||0;for(var i=0;i<16;++i)t[s+i]=n[i];return t}return function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:0,s=(d[e[t+0]]+d[e[t+1]]+d[e[t+2]]+d[e[t+3]]+"-"+d[e[t+4]]+d[e[t+5]]+"-"+d[e[t+6]]+d[e[t+7]]+"-"+d[e[t+8]]+d[e[t+9]]+"-"+d[e[t+10]]+d[e[t+11]]+d[e[t+12]]+d[e[t+13]]+d[e[t+14]]+d[e[t+15]]).toLowerCase();if(!l(s))throw TypeError("Stringified UUID is invalid");return s}(n)},u=e=>{var t;const s={[n.Web]:"web",[n.Desktop]:"desktop",[n.Mobile]:"mobile"};return null!==(t=s[e])&&void 0!==t?t:s[n.Web]},v=e=>null!=e,g=()=>{};class f{static get isSupported(){return!(!window.console&&!console)}static get info(){return f.isSupported&&this.enabled?console.log.bind(console):g}static get error(){return f.isSupported?console.error.bind(console):g}}var y,S,b,I;function k(e,t){var s=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),s.push.apply(s,n)}return s}function E(e){for(var t=1;t<arguments.length;t++){var s=null!=arguments[t]?arguments[t]:{};t%2?k(Object(s),!0).forEach((function(t){C(e,t,s[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(s)):k(Object(s)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(s,t))}))}return e}function C(e,t,s){return t in e?Object.defineProperty(e,t,{value:s,enumerable:!0,configurable:!0,writable:!0}):e[t]=s,e}(S="enabled")in(y=f)?Object.defineProperty(y,S,{value:false,enumerable:!0,configurable:!0,writable:!0}):y[S]=false,function(e){e.Component="component"}(b||(b={})),function(e){e.Shift="Shift",e.Ctrl="Control",e.Meta="Meta"}(I||(I={}));class w{constructor(e){if(C(this,"contentWindow",void 0),C(this,"initialPermissions",void 0),C(this,"onReadyCallback",void 0),C(this,"component",{activeThemes:[],acceptsThemes:!0}),C(this,"sentMessages",[]),C(this,"messageQueue",[]),C(this,"lastStreamedItem",void 0),C(this,"pendingSaveItems",void 0),C(this,"pendingSaveTimeout",void 0),C(this,"pendingSaveParams",void 0),C(this,"coallesedSaving",!0),C(this,"coallesedSavingDelay",250),C(this,"messageHandler",void 0),C(this,"keyDownEventListener",void 0),C(this,"keyUpEventListener",void 0),C(this,"clickEventListener",void 0),C(this,"onThemesChangeCallback",void 0),C(this,"concernTimeouts",[]),!e||!e.targetWindow)throw new Error("contentWindow must be a valid Window object.");this.contentWindow=e.targetWindow,this.processParameters(e),this.registerMessageHandler(),this.registerKeyboardEventListeners(),this.registerMouseEventListeners()}processParameters(e){var t;const{initialPermissions:s,options:n,onReady:i,onThemesChange:o}=e;var a;s&&s.length>0&&(this.initialPermissions=s),v(null==n?void 0:n.coallesedSaving)&&(this.coallesedSaving=n.coallesedSaving),v(null==n?void 0:n.coallesedSavingDelay)&&(this.coallesedSavingDelay=n.coallesedSavingDelay),v(null==n?void 0:n.acceptsThemes)&&(this.component.acceptsThemes=null===(a=null==n?void 0:n.acceptsThemes)||void 0===a||a),v(i)&&(this.onReadyCallback=i),v(o)&&(this.onThemesChangeCallback=o),f.enabled=null!==(t=null==n?void 0:n.debug)&&void 0!==t&&t}deinit(){this.onReadyCallback=void 0,this.component={acceptsThemes:!0,activeThemes:[]},this.messageQueue=[],this.sentMessages=[],this.lastStreamedItem=void 0,this.pendingSaveItems=void 0,this.pendingSaveTimeout=void 0,this.pendingSaveParams=void 0,this.messageHandler&&(this.contentWindow.document.removeEventListener("message",this.messageHandler),this.contentWindow.removeEventListener("message",this.messageHandler)),this.keyDownEventListener&&this.contentWindow.removeEventListener("keydown",this.keyDownEventListener),this.keyUpEventListener&&this.contentWindow.removeEventListener("keyup",this.keyUpEventListener),this.clickEventListener&&this.contentWindow.removeEventListener("click",this.clickEventListener)}registerMessageHandler(){this.messageHandler=e=>{if(f.info("Components API Message received:",e.data),document.referrer&&new URL(document.referrer).origin!==new URL(e.origin).origin)return;const{data:t}=e,n=(e=>{if("string"!=typeof e)return!1;try{const t=JSON.parse(e),s=Object.prototype.toString.call(t);return"[object Object]"===s||"[object Array]"===s}catch(e){return!1}})(t)?JSON.parse(t):t;if(n){if(void 0===this.component.origin&&n.action===s.ComponentRegistered)this.component.origin=e.origin;else if(e.origin!==this.component.origin)return;this.handleMessage(n)}else f.error("Invalid data received. Skipping...")},this.contentWindow.document.addEventListener("message",this.messageHandler,!1),this.contentWindow.addEventListener("message",this.messageHandler,!1),f.info("Waiting for messages...")}registerKeyboardEventListeners(){this.keyDownEventListener=e=>{f.info("A key has been pressed: ".concat(e.key)),e.ctrlKey?this.keyDownEvent(I.Ctrl):e.shiftKey?this.keyDownEvent(I.Shift):(e.metaKey||"Meta"===e.key)&&this.keyDownEvent(I.Meta)},this.keyUpEventListener=e=>{f.info("A key has been released: ".concat(e.key)),"Control"===e.key?this.keyUpEvent(I.Ctrl):"Shift"===e.key?this.keyUpEvent(I.Shift):"Meta"===e.key&&this.keyUpEvent(I.Meta)},this.contentWindow.addEventListener("keydown",this.keyDownEventListener,!1),this.contentWindow.addEventListener("keyup",this.keyUpEventListener,!1)}registerMouseEventListeners(){this.clickEventListener=e=>{f.info("A click has been performed."),this.mouseClickEvent()},this.contentWindow.addEventListener("click",this.clickEventListener,!1)}handleMessage(e){switch(e.action){case s.ComponentRegistered:this.component.sessionKey=e.sessionKey,e.componentData&&(this.component.data=e.componentData),this.onReady(e.data),f.info("Component successfully registered with payload:",e);break;case s.ActivateThemes:this.activateThemes(e.data.themes);break;default:{var t,n;if(!e.original)return;const s=null===(t=this.sentMessages)||void 0===t?void 0:t.filter((t=>{var s;return t.messageId===(null===(s=e.original)||void 0===s?void 0:s.messageId)}))[0];if(!s){const e=this.contentWindow.document.title,t=("The extension '".concat(e,"' is attempting to communicate with Standard Notes, ")+"but an error is preventing it from doing so. Please restart this extension and try again.").replace("  "," ");return void f.info(t)}null==s||null===(n=s.callback)||void 0===n||n.call(s,e.data);break}}}onReady(e){this.component.environment=e.environment,this.component.platform=e.platform,this.component.uuid=e.uuid,this.initialPermissions&&this.initialPermissions.length>0&&this.requestPermissions(this.initialPermissions);for(const e of this.messageQueue)this.postMessage(e.action,e.data,e.callback);this.messageQueue=[],f.info("Data passed to onReady:",e),this.activateThemes(e.activeThemeUrls||[]),this.postMessage(s.ThemesActivated,{}),this.onReadyCallback&&this.onReadyCallback()}getSelfComponentUUID(){return this.component.uuid}isRunningInDesktopApplication(){return this.component.environment===u(n.Desktop)}isRunningInMobileApplication(){return this.component.environment===u(n.Mobile)}getComponentDataValueForKey(e){if(this.component.data)return this.component.data[e]}setComponentDataValueForKey(e,t){if(!this.component.data)throw new Error("The component has not been initialized.");if(!e||e&&0===e.length)throw new Error("The key for the data value should be a valid string.");this.component.data=E(E({},this.component.data),{},{[e]:t}),this.postMessage(s.SetComponentData,{componentData:this.component.data})}clearComponentData(){this.component.data={},this.postMessage(s.SetComponentData,{componentData:this.component.data})}postMessage(e,t,s){if(!this.component.sessionKey)return void this.messageQueue.push({action:e,data:t,api:b.Component,callback:s});const n={action:e,data:t,messageId:this.generateUUID(),sessionKey:this.component.sessionKey,api:b.Component},i=JSON.parse(JSON.stringify(n));let o;i.callback=s,this.sentMessages.push(i),o=this.isRunningInMobileApplication()?JSON.stringify(n):n,f.info("Posting message:",o),this.contentWindow.parent.postMessage(o,this.component.origin)}requestPermissions(e,t){this.postMessage(s.RequestPermissions,{permissions:e},(()=>{t&&t()}))}activateThemes(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:[];if(!this.component.acceptsThemes)return;f.info("Incoming themes:",e);const{activeThemes:t}=this.component;if(t&&t.sort().toString()==e.sort().toString())return;let s=e;const n=[];for(const i of t)e.includes(i)?s=s.filter((e=>e!==i)):n.push(i);f.info("Deactivating themes:",n),f.info("Activating themes:",s);for(const e of n)this.deactivateTheme(e);this.component.activeThemes=e;for(const e of s){if(!e)continue;const t=this.contentWindow.document.createElement("link");t.id=btoa(e),t.href=e,t.type="text/css",t.rel="stylesheet",t.media="screen,print",t.className="custom-theme",this.contentWindow.document.getElementsByTagName("head")[0].appendChild(t)}this.onThemesChangeCallback&&this.onThemesChangeCallback()}themeElementForUrl(e){return Array.from(this.contentWindow.document.getElementsByClassName("custom-theme")).slice().find((t=>t.id==btoa(e)))}deactivateTheme(e){const t=this.themeElementForUrl(e);t&&t.parentNode&&(t.setAttribute("disabled","true"),t.parentNode.removeChild(t))}generateUUID(){return p()}get platform(){return this.component.platform}get environment(){return this.component.environment}streamItems(e,t){this.postMessage(s.StreamItems,{content_types:e},(e=>{t(e.items)}))}streamContextItem(e){this.postMessage(s.StreamContextItem,{},(t=>{const{item:s}=t;(!this.lastStreamedItem||this.lastStreamedItem.uuid!==s.uuid)&&this.pendingSaveTimeout&&(clearTimeout(this.pendingSaveTimeout),this.performSavingOfItems(this.pendingSaveParams),this.pendingSaveTimeout=void 0,this.pendingSaveParams=void 0),this.lastStreamedItem=s,e(this.lastStreamedItem)}))}selectItem(e){this.postMessage(s.SelectItem,{item:this.jsonObjectForItem(e)})}clearSelection(){this.postMessage(s.ClearSelection,{content_type:i.Tag})}createItem(e,t){this.postMessage(s.CreateItem,{item:this.jsonObjectForItem(e)},(e=>{let{item:s}=e;!s&&e.items&&e.items.length>0&&(s=e.items[0]),this.associateItem(s),t&&t(s)}))}createItems(e,t){const n=e.map((e=>this.jsonObjectForItem(e)));this.postMessage(s.CreateItems,{items:n},(e=>{t&&t(e.items)}))}associateItem(e){this.postMessage(s.AssociateItem,{item:this.jsonObjectForItem(e)})}deassociateItem(e){this.postMessage(s.DeassociateItem,{item:this.jsonObjectForItem(e)})}deleteItem(e,t){this.deleteItems([e],t)}deleteItems(e,t){const n={items:e.map((e=>this.jsonObjectForItem(e)))};this.postMessage(s.DeleteItems,n,(e=>{t&&t(e)}))}sendCustomEvent(e,t,s){this.postMessage(e,t,(e=>{s&&s(e)}))}saveItem(e,t){let s=arguments.length>2&&void 0!==arguments[2]&&arguments[2];this.saveItems([e],t,s)}saveItemWithPresave(e,t,s){this.saveItemsWithPresave([e],t,s)}saveItemsWithPresave(e,t,s){this.saveItems(e,s,!1,t)}performSavingOfItems(e){let{items:t,presave:n,callback:i}=e;const o=setTimeout((()=>{this.concernTimeouts.forEach((e=>clearTimeout(e))),alert("This editor is unable to communicate with Standard Notes. Your changes may not be saved. Please backup your changes, then restart the application and try again.")}),5e3);this.concernTimeouts.push(o),n&&n();const a=[];for(const e of t)a.push(this.jsonObjectForItem(e));this.postMessage(s.SaveItems,{items:a},(()=>{this.concernTimeouts.forEach((e=>clearTimeout(e))),null==i||i()}))}saveItems(e,t){let s=arguments.length>2&&void 0!==arguments[2]&&arguments[2],n=arguments.length>3?arguments[3]:void 0;if(this.pendingSaveItems||(this.pendingSaveItems=[]),this.coallesedSaving&&!s){this.pendingSaveTimeout&&clearTimeout(this.pendingSaveTimeout);const s=e.map((e=>e.uuid)),i=this.pendingSaveItems.filter((e=>!s.includes(e.uuid)));this.pendingSaveItems=i.concat(e),this.pendingSaveParams={items:this.pendingSaveItems,presave:n,callback:t},this.pendingSaveTimeout=setTimeout((()=>{this.performSavingOfItems(this.pendingSaveParams),this.pendingSaveItems=[],this.pendingSaveTimeout=void 0,this.pendingSaveParams=null}),this.coallesedSavingDelay)}else this.performSavingOfItems({items:e,presave:n,callback:t})}setSize(e,t){this.postMessage(s.SetSize,{type:"container",width:e,height:t})}keyDownEvent(e){this.postMessage(s.KeyDown,{keyboardModifier:e})}keyUpEvent(e){this.postMessage(s.KeyUp,{keyboardModifier:e})}mouseClickEvent(){this.postMessage(s.Click,{})}jsonObjectForItem(e){const t=Object.assign({},e);return t.children=null,t.parent=null,t}getItemAppDataValue(e,t){var s,n;return null==e||null===(s=e.content)||void 0===s||null===(n=s.appData)||void 0===n?void 0:n["org.standardnotes.sn"][t]}}return t.default})()}));
;(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

document.addEventListener('DOMContentLoaded', function (event) {
  var editor = document.getElementById('editor-source');
  var workingNote;
  var componentRelay = new ComponentRelay({
    targetWindow: window,
    onReady: function onReady() {
      var platform = componentRelay.platform;

      if (platform) {
        document.body.classList.add(platform);
      }
    }
  });
  componentRelay.streamContextItem(function (note) {
    workingNote = note; 

    if (note.isMetadataUpdate) {
      return;
    }

    editor.value = note.content.text;
    window.upmath.updateText();
    editor.setAttribute('spellcheck', JSON.stringify(workingNote.content.spellcheck));
  });
  editor.addEventListener('input', function (event) {
    var text = editor.value || '';

    function strip(html) {
      var tmp = document.implementation.createHTMLDocument('New').body;
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    }

    function truncateString(string) {
      var limit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 90;

      if (string.length <= limit) {
        return string;
      } else {
        return string.substring(0, limit) + '...';
      }
    }

    if (workingNote) {
      var note = workingNote;
      componentRelay.saveItemWithPresave(note, function () {
        window.upmath.updateText();
        var html = window.upmath.getHTML();
        var strippedHtml = truncateString(strip(html));
        note.content.preview_plain = strippedHtml;
        note.content.preview_html = null;
        note.content.text = text;
      });
    }
  }); 

  editor.addEventListener('keydown', function (event) {
    if (!event.shiftKey && event.which == 9) {
      event.preventDefault(); 

      if (!document.execCommand('insertText', false, '\t')) {
        var start = this.selectionStart;
        var end = this.selectionEnd;
        var spaces = '    '; 

        this.value = this.value.substring(0, start) + spaces + this.value.substring(end); 

        this.selectionStart = this.selectionEnd = start + 4;
      }
    }
  });
});


},{}]},{},[1]);
