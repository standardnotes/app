angular.module('app.frontend')
  .directive("editorSection", function($timeout){
    return {
      restrict: 'E',
      scope: {
        save: "&",
        remove: "&",
        note: "=",
        user: "="
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
  .controller('EditorCtrl', function ($sce, $timeout, apiController, modelManager, markdownRenderer, $rootScope) {

    this.setNote = function(note, oldNote) {
      this.editorMode = 'edit';

      if(note.content.text.length == 0 && note.dummy) {
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
      return markdownRenderer.renderHtml(markdownRenderer.renderedContentForText(this.note.content.text));
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
      if(this.user.uuid) {
        // signed out users have local autosave, dont need draft saving
        apiController.saveDraftToDisk(this.note);
      }

      if(saveTimeout) $timeout.cancel(saveTimeout);
      if(statusTimeout) $timeout.cancel(statusTimeout);
      saveTimeout = $timeout(function(){
        this.noteStatus = "Saving...";
        this.saveNote();
      }.bind(this), 150)
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
      this.editingUrl = false;
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
      } else {
        this.editorMode = 'preview';
      }
    }

    this.editUrlPressed = function() {
      this.showMenu = false;
      var url = this.publicUrlForNote(this.note);
      url = url.replace(this.note.presentation_name, "");
      this.url = {base: url, token : this.note.presentation_name};
      this.editingUrl = true;
    }

    this.saveUrl = function($event) {
      $event.target.blur();

      var original = this.note.presentation_name;
      this.note.presentation_name = this.url.token;
      modelManager.addDirtyItems([this.note]);

      apiController.sync(function(response){
        if(!response) {
          this.note.presentation_name = original;
          this.url.token = original;
          alert("This URL is not available.");
        } else {
          this.editingUrl = false;
        }
      }.bind(this))
    }

    this.shareNote = function() {

      function openInNewTab(url) {
        var a = document.createElement("a");
        a.target = "_blank";
        a.href = url;
        a.click();
    }

      apiController.shareItem(this.note, function(note){
        openInNewTab(this.publicUrlForNote(note));
      }.bind(this))
      this.showMenu = false;
    }

    this.unshareNote = function() {
      apiController.unshareItem(this.note, function(note){

      })
      this.showMenu = false;
    }

    this.publicUrlForNote = function() {
      return this.note.presentationURL();
    }

    this.clickedMenu = function() {
      if(this.note.locked) {
        alert("This note has been shared without an account, and can therefore not be changed.")
      } else {
        this.showMenu = !this.showMenu;
      }
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

  });
