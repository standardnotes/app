angular.module('app.frontend')
  .directive("editorSection", function($timeout){
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

        /**
         * Insert 4 spaces when a tab key is pressed,
         * only used when inside of the text editor.
         */
        var handleTab = function (event) {
          if (event.which == 9) {
            event.preventDefault();
            var start = this.selectionStart;
            var end = this.selectionEnd;
            var spaces = "    ";

	    // Insert 4 spaces
            this.value = this.value.substring(0, start)
              + spaces + this.value.substring(end);

	    // Place cursor 4 spaces away from where
	    // the tab key was pressed
	    this.selectionStart = this.selectionEnd = start + 4;
          }
        }

        var handler = function(event) {
          if (event.ctrlKey || event.metaKey) {
              switch (String.fromCharCode(event.which).toLowerCase()) {
              case 's':
                  event.preventDefault();
                  $timeout(function(){
                    ctrl.saveNote(event);
                  });
                  break;
              case 'e':
                  event.preventDefault();
                  $timeout(function(){
                    ctrl.clickedEditNote();
                  })
                  break;
              case 'm':
                  event.preventDefault();
                  $timeout(function(){
                    ctrl.toggleMarkdown();
                  })
                  break;
              case 'o':
                  event.preventDefault();
                  $timeout(function(){
                    ctrl.toggleFullScreen();
                  })
                  break;
              }
          }
        };

        window.addEventListener('keydown', handler);
        var element = document.getElementById("note-text-editor");
        element.addEventListener('keydown', handleTab);

        scope.$on('$destroy', function(){
          window.removeEventListener('keydown', handler);
        })

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
  .controller('EditorCtrl', function ($sce, $timeout, apiController, markdownRenderer, $rootScope, extensionManager) {

    this.setNote = function(note, oldNote) {
      this.editorMode = 'edit';
      this.showExtensions = false;
      this.showMenu = false;
      this.loadTagsString();

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
          apiController.clearDraft();

          if(statusTimeout) $timeout.cancel(statusTimeout);
          statusTimeout = $timeout(function(){
            this.noteStatus = "All changes saved"
          }.bind(this), 200)
        } else {
          if(statusTimeout) $timeout.cancel(statusTimeout);
          statusTimeout = $timeout(function(){
            this.noteStatus = "(Offline) — All changes saved"
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
      if(apiController.isUserSignedIn()) {
        // signed out users have local autosave, dont need draft saving
        apiController.saveDraftToDisk(this.note);
      }

      if(saveTimeout) $timeout.cancel(saveTimeout);
      if(statusTimeout) $timeout.cancel(statusTimeout);
      saveTimeout = $timeout(function(){
        this.noteStatus = "Saving...";
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

    this.clickedMenu = function() {
      this.showMenu = !this.showMenu;
    }

    this.deleteNote = function() {
      apiController.clearDraft();
      this.remove()(this.note);
      this.showMenu = false;
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
