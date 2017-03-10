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
        scope.$watch('ctrl.note', function(note, oldNote){
          if(note) {
            ctrl.setNote(note, oldNote);
          }
        });
      }
    }
  })
  .controller('EditorCtrl', function ($sce, $timeout, authManager, $rootScope, extensionManager, syncManager, modelManager) {

    window.addEventListener("message", function(event){
      if(event.data.status) {
        this.postNoteToExternalEditor();
      } else {
        var id = event.data.id;
        var text = event.data.text;
        var data = event.data.data;

        if(this.note.uuid === id) {
          this.note.text = text;
          if(data) {
            var changesMade = this.customEditor.setData(id, data);
            if(changesMade) {
              this.customEditor.setDirty(true);
            }
          }
          this.changesMade();
        }
      }
    }.bind(this), false);

    $rootScope.$on("tag-changed", function(){
      this.loadTagsString();
    }.bind(this));

    this.setNote = function(note, oldNote) {
      var currentEditor = this.customEditor;
      this.customEditor = null;
      this.showExtensions = false;
      this.showMenu = false;
      this.loadTagsString();

      var setEditor = function(editor) {
        this.customEditor = editor;
        this.postNoteToExternalEditor();
      }.bind(this)

      var editor = this.editorForNote(note);
      if(editor) {
        if(currentEditor !== editor) {
          // switch after timeout, so that note data isnt posted to current editor
          $timeout(function(){
            setEditor(editor);
          }.bind(this));
        } else {
          // switch immediately
          setEditor(editor);
        }
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

      if(this.customEditor && editor !== this.customEditor) {
        this.customEditor.removeItemAsRelationship(this.note);
        this.customEditor.setDirty(true);
      }

      if(editor.default) {
        this.customEditor = null;
      } else {
        this.customEditor = editor;
        this.customEditor.addItemAsRelationship(this.note);
        this.customEditor.setDirty(true);
      }
    }.bind(this)

    this.editorForNote = function(note) {
      var editors = modelManager.itemsForContentType("SN|Editor");
      for(var editor of editors) {
        if(_.includes(editor.notes, note)) {
          return editor;
        }
      }
      return null;
    }

    this.postNoteToExternalEditor = function() {
      var externalEditorElement = document.getElementById("editor-iframe");
      if(externalEditorElement) {
        externalEditorElement.contentWindow.postMessage({text: this.note.text, data: this.customEditor.dataForKey(this.note.uuid), id: this.note.uuid}, '*');
      }
    }

    this.hasAvailableExtensions = function() {
      return extensionManager.extensionsInContextOfItem(this.note).length > 0;
    }

    this.focusEditor = function(delay) {
      setTimeout(function(){
        var element = document.getElementById("note-text-editor");
        if(element) {
          element.focus();
        }
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
      $rootScope.$broadcast("editorFocused");
    }

    this.onNameBlur = function() {
      this.editingName = false;
    }

    this.toggleFullScreen = function() {
      this.fullscreen = !this.fullscreen;
      if(this.fullscreen) {
        this.focusEditor(0);
      }
    }

    this.selectedMenuItem = function() {
      this.showMenu = false;
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
