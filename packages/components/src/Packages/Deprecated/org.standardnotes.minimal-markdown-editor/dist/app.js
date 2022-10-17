(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

document.addEventListener('DOMContentLoaded', function (event) {
  var componentRelay;
  var workingNote, clientData;
  var lastValue, lastUUID;
  var editor;
  var ignoreTextChange = false;
  var initialLoad = true;

  function loadComponentRelay() {
    var initialPermissions = [{
      name: 'stream-context-item'
    }];
    componentRelay = new ComponentRelay({
      initialPermissions: initialPermissions,
      targetWindow: window,
      onReady: function onReady() {
        var platform = componentRelay.platform;

        if (platform) {
          document.body.classList.add(platform);
        }

        loadEditor(); // only use CodeMirror selection color if we're not on mobile.

        editor.setOption('styleSelectedText', !componentRelay.isMobile);
      }
    });
    componentRelay.streamContextItem(function (note) {
      onReceivedNote(note);
    });
  }

  function saveNote() {
    if (workingNote) {
      // Be sure to capture this object as a variable, as this.note may be reassigned in `streamContextItem`, so by the time
      // you modify it in the presave block, it may not be the same object anymore, so the presave values will not be applied to
      // the right object, and it will save incorrectly.
      var note = workingNote;
      componentRelay.saveItemWithPresave(note, function () {
        lastValue = editor.getValue();
        note.content.text = lastValue;
        note.clientData = clientData; // clear previews

        note.content.preview_plain = null;
        note.content.preview_html = null;
      });
    }
  }

  function onReceivedNote(note) {
    if (note.uuid !== lastUUID) {
      // Note changed, reset last values
      lastValue = null;
      initialLoad = true;
      lastUUID = note.uuid;
    }

    workingNote = note; // Only update UI on non-metadata updates.

    if (note.isMetadataUpdate) {
      return;
    }

    clientData = note.clientData;

    if (editor) {
      if (note.content.text !== lastValue) {
        ignoreTextChange = true;
        editor.getDoc().setValue(workingNote.content.text);
        ignoreTextChange = false;
      }

      if (initialLoad) {
        initialLoad = false;
        editor.getDoc().clearHistory();
      }

      editor.setOption('spellcheck', workingNote.content.spellcheck);
    }
  }

  function loadEditor() {
    editor = CodeMirror.fromTextArea(document.getElementById('code'), {
      mode: 'gfm',
      lineWrapping: true,
      extraKeys: {
        'Alt-F': 'findPersistent'
      },
      inputStyle: getInputStyleForEnvironment()
    });
    editor.setSize(undefined, '100%');
    editor.on('change', function () {
      if (ignoreTextChange) {
        return;
      }

      saveNote();
    });
  }

  function getInputStyleForEnvironment() {
    var _componentRelay$envir;

    var environment = (_componentRelay$envir = componentRelay.environment) !== null && _componentRelay$envir !== void 0 ? _componentRelay$envir : 'web';
    return environment === 'mobile' ? 'textarea' : 'contenteditable';
  }

  loadComponentRelay();
});


},{}]},{},[1]);
