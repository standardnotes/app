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
}