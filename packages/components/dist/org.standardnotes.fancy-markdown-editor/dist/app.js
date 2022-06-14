(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
