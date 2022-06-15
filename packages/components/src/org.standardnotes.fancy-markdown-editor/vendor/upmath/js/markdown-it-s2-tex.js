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
