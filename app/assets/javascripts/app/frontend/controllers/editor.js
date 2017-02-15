angular.module('app.frontend')
  .directive("editorSection", function($timeout, $sce){
    return {
      restrict: 'E',
      scope: {
        save: "&",
        remove: "&",
        note: "=",
        updateTags: "&"
      },
      templateUrl: 'frontend/editor.html',
      replace: true,
      controller: 'EditorCtrl',
      controllerAs: 'ctrl',
      bindToController: true,

      link:function(scope, elem, attrs, ctrl) {

        var handler = function(event) {
          if (event.ctrlKey || event.metaKey) {
              switch (String.fromCharCode(event.which).toLowerCase()) {
              case 'o':
                  event.preventDefault();
                  $timeout(function(){
                    ctrl.toggleFullScreen();
                  })
                  break;
              }
          }
        };

        scope.$watch('ctrl.note', function(note, oldNote){
          if(note) {
            ctrl.setNote(note, oldNote);
          } else {
            ctrl.note = {};
          }
        });
      }
    }
  })
  .controller('EditorCtrl', function ($sce, $timeout, authManager, markdownRenderer, $rootScope, extensionManager, syncManager, modelManager) {

    window.addEventListener("message", function(){
      console.log("App received message:", event);
      if(event.data.status) {
        this.postNoteToExternalEditor();
      } else {
        var id = event.data.id;
        var text = event.data.text;
        if(this.note.uuid == id) {
          this.note.text = text;
          this.changesMade();
        }
      }
    }.bind(this), false);

    this.setNote = function(note, oldNote) {
      this.editorMode = 'edit';
      this.showExtensions = false;
      this.showMenu = false;
      this.loadTagsString();

      if(note.editorUrl) {
        this.customEditor = this.editorForUrl(note.editorUrl);
        this.postNoteToExternalEditor();
      } else {
        this.customEditor = null;
      }

      if(note.safeText().length == 0 && note.dummy) {
        this.focusTitle(100);
      }

      if(oldNote && oldNote != note) {
        if(oldNote.hasChanges) {
          this.save()(oldNote, null);
        } else if(oldNote.dummy) {
          this.remove()(oldNote);
        }
      }
    }

    this.selectedEditor = function(editor) {
      this.showEditorMenu = false;
      if(editor.default) {
        this.customEditor = null;
      } else {
        this.customEditor = editor;
      }
      this.note.editorUrl = editor.url;
    }.bind(this)

    this.editorForUrl = function(url) {
      var editors = modelManager.itemsForContentType("SN|Editor");
      return editors.filter(function(editor){return editor.url == url})[0];
    }

    this.postNoteToExternalEditor = function() {
      var externalEditorElement = document.getElementById("editor-iframe");
      if(externalEditorElement) {
        externalEditorElement.contentWindow.postMessage({text: this.note.text, id: this.note.uuid}, '*');
      }
    }

    this.hasAvailableExtensions = function() {
      return extensionManager.extensionsInContextOfItem(this.note).length > 0;
    }

    this.onPreviewDoubleClick = function() {
      this.editorMode = 'edit';
      this.focusEditor(100);
    }

    this.focusEditor = function(delay) {
      setTimeout(function(){
        var element = document.getElementById("note-text-editor");
        element.focus();
      }, delay)
    }

    this.focusTitle = function(delay) {
      setTimeout(function(){
        document.getElementById("note-title-editor").focus();
      }, delay)
    }

    this.clickedTextArea = function() {
      this.showMenu = false;
    }

    this.renderedContent = function() {
      return markdownRenderer.renderHtml(markdownRenderer.renderedContentForText(this.note.safeText()));
    }

    var statusTimeout;

    this.saveNote = function($event) {
      var note = this.note;
      note.dummy = false;
      this.save()(note, function(success){
        if(success) {
          if(statusTimeout) $timeout.cancel(statusTimeout);
          statusTimeout = $timeout(function(){
            var status = "All changes saved"
            if(authManager.offline()) {
              status += " (offline)";
            }
            this.saveError = false;
            this.noteStatus = $sce.trustAsHtml(status);
          }.bind(this), 200)
        } else {
          if(statusTimeout) $timeout.cancel(statusTimeout);
          statusTimeout = $timeout(function(){
            this.saveError = true;
            this.noteStatus = $sce.trustAsHtml("Error syncing<br>(changes saved offline)")
          }.bind(this), 200)
        }
      }.bind(this));
    }

    this.saveTitle = function($event) {
      $event.target.blur();
      this.saveNote($event);
      this.focusEditor();
    }

    var saveTimeout;
    this.changesMade = function() {
      this.note.hasChanges = true;
      this.note.dummy = false;

      if(saveTimeout) $timeout.cancel(saveTimeout);
      if(statusTimeout) $timeout.cancel(statusTimeout);
      saveTimeout = $timeout(function(){
        this.noteStatus = $sce.trustAsHtml("Saving...");
        this.saveNote();
      }.bind(this), 275)
    }


    this.contentChanged = function() {
      this.changesMade();
    }

    this.nameChanged = function() {
      this.changesMade();
    }

    this.onNameFocus = function() {
      this.editingName = true;
    }

    this.onContentFocus = function() {
      this.showSampler = false;
      $rootScope.$broadcast("editorFocused");
    }

    this.onNameBlur = function() {
      this.editingName = false;
    }

    this.toggleFullScreen = function() {
      this.fullscreen = !this.fullscreen;
      if(this.fullscreen) {
        if(this.editorMode == 'edit') {
          // refocus
          this.focusEditor(0);
        }
      } else {

      }
    }

    this.selectedMenuItem = function() {
      this.showMenu = false;
    }

    this.toggleMarkdown = function() {
      if(this.editorMode == 'preview') {
        this.editorMode = 'edit';
        this.focusEditor(0);
      } else {
        this.editorMode = 'preview';
      }
    }

    this.deleteNote = function() {
      if(confirm("Are you sure you want to delete this note?")) {
        this.remove()(this.note);
        this.showMenu = false;
      }
    }

    this.clickedEditNote = function() {
      this.editorMode = 'edit';
      this.focusEditor(100);
    }

    /* Tags */

    this.loadTagsString = function() {
      var string = "";
      for(var tag of this.note.tags) {
        string += "#" + tag.title + " ";
      }
      this.tagsString = string;
    }

    this.updateTagsFromTagsString = function($event) {
      $event.target.blur();

      var tags = this.tagsString.split("#");
      tags = _.filter(tags, function(tag){
        return tag.length > 0;
      })
      tags = _.map(tags, function(tag){
        return tag.trim();
      })

      this.note.dummy = false;
      this.updateTags()(this.note, tags);
    }

  });
