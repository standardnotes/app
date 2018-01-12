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
            ctrl.noteDidChange(note, oldNote);
          }
        });
      }
    }
  })
  .controller('EditorCtrl', function ($sce, $timeout, authManager, $rootScope, extensionManager, syncManager, modelManager, themeManager, componentManager, storageManager) {

    this.componentManager = componentManager;
    this.componentStack = [];

    $rootScope.$on("sync:taking-too-long", function(){
      this.syncTakingTooLong = true;
    }.bind(this));

    $rootScope.$on("sync:completed", function(){
      this.syncTakingTooLong = false;
    }.bind(this));

    $rootScope.$on("tag-changed", function(){
      this.loadTagsString();
    }.bind(this));

    this.noteDidChange = function(note, oldNote) {
      this.setNote(note, oldNote);
      this.reloadComponentContext();
    }

    this.setNote = function(note, oldNote) {
      this.showExtensions = false;
      this.showMenu = false;
      this.loadTagsString();

      let onReady = () => {
        this.noteReady = true;
        $timeout(() => {
          this.loadPreferences();
        })
      }

      let associatedEditor = this.editorForNote(note);
      if(associatedEditor && associatedEditor != this.selectedEditor) {
        // setting note to not ready will remove the editor from view in a flash,
        // so we only want to do this if switching between external editors
        this.noteReady = false;
        // switch after timeout, so that note data isnt posted to current editor
        $timeout(() => {
          this.selectedEditor = associatedEditor;
          onReady();
        })
      } else if(associatedEditor) {
        // Same editor as currently active
        onReady();
      } else {
        // No editor
        this.selectedEditor = null;
        onReady();
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

    this.editorForNote = function(note) {
      let editors = componentManager.componentsForArea("editor-editor");
      for(var editor of editors) {
        if(editor.isActiveForItem(note)) {
          return editor;
        }
      }

      // No editor found for note. Use default editor, if note does not prefer system editor
      if(!note.getAppDataItem("prefersPlainEditor")) {
        return editors.filter((e) => {return e.isDefaultEditor()})[0];
      }
    }

    this.onEditorMenuClick = function() {
      // App bar menu item click
      this.showEditorMenu = !this.showEditorMenu;
      this.showMenu = false;
      this.showExtensions = false;
    }

    this.editorMenuOnSelect = function(component) {
      if(!component || component.area == "editor-editor") {
        // if plain editor or other editor
        this.showEditorMenu = false;
        var editor = component;
        if(this.selectedEditor && editor !== this.selectedEditor) {
          this.disassociateComponentWithCurrentNote(this.selectedEditor);
        }
        if(editor) {
          if(this.note.getAppDataItem("prefersPlainEditor") == true) {
            this.note.setAppDataItem("prefersPlainEditor", false);
            this.note.setDirty(true);
          }
          this.associateComponentWithCurrentNote(editor);
        } else {
          // Note prefers plain editor
          if(!this.note.getAppDataItem("prefersPlainEditor")) {
            this.note.setAppDataItem("prefersPlainEditor", true);
            this.note.setDirty(true);
          }
          $timeout(() => {
            this.reloadFont();
          })
        }

        this.selectedEditor = editor;
      } else if(component.area == "editor-stack") {
        // If component stack item
        this.toggleStackComponentForCurrentItem(component);
      }

      // Lots of dirtying can happen above, so we'll sync
      syncManager.sync();
    }.bind(this)

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
            this.saveError = false;
            this.syncTakingTooLong = false;
            this.showAllChangesSavedStatus();
          }.bind(this), 200)
        } else {
          if(statusTimeout) $timeout.cancel(statusTimeout);
          statusTimeout = $timeout(function(){
            this.saveError = true;
            this.syncTakingTooLong = false;
            this.showErrorStatus();
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
        this.showSavingStatus();
        this.saveNote();
      }.bind(this), 275)
    }

    this.showSavingStatus = function() {
      this.noteStatus = $sce.trustAsHtml("Saving...");
    }

    this.showAllChangesSavedStatus = function() {
      var status = "All changes saved";
      if(authManager.offline()) {
        status += " (offline)";
      }
      this.noteStatus = $sce.trustAsHtml(status);
    }

    this.showErrorStatus = function() {
      this.noteStatus = $sce.trustAsHtml("Error syncing<br>(changes saved offline)")
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
      this.updateTagsFromTagsString()
    }

    this.toggleFullScreen = function() {
      this.fullscreen = !this.fullscreen;
      if(this.fullscreen) {
        this.focusEditor(0);
      }
    }

    this.selectedMenuItem = function($event) {
      this.showMenu = false;
    }

    this.deleteNote = function() {
      let title = this.note.safeTitle().length ? `'${this.note.title}'` : "this note";
      if(confirm(`Are you sure you want to delete ${title}?`)) {
        this.remove()(this.note);
        this.showMenu = false;
      }
    }

    this.togglePin = function() {
      this.note.setAppDataItem("pinned", !this.note.pinned);
      this.note.setDirty(true);
      this.changesMade();
    }

    this.toggleArchiveNote = function() {
      this.note.setAppDataItem("archived", !this.note.archived);
      this.note.setDirty(true);
      this.changesMade();
      $rootScope.$broadcast("noteArchived");
    }

    this.clickedEditNote = function() {
      this.focusEditor(100);
    }








    /*
    Tags
    */

    this.loadTagsString = function() {
      var string = "";
      for(var tag of this.note.tags) {
        string += "#" + tag.title + " ";
      }
      this.tagsString = string;
    }

    this.addTag = function(tag) {
      var tags = this.note.tags;
      var strings = tags.map(function(_tag){
        return _tag.title;
      })
      strings.push(tag.title);
      this.updateTags()(this.note, strings);
      this.loadTagsString();
    }

    this.removeTag = function(tag) {
      var tags = this.note.tags;
      var strings = tags.map(function(_tag){
        return _tag.title;
      }).filter(function(_tag){
        return _tag !== tag.title;
      })
      this.updateTags()(this.note, strings);
      this.loadTagsString();
    }

    this.updateTagsFromTagsString = function() {
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


    /* Resizability */

    this.resizeControl = {};

    this.onPanelResizeFinish = function(width, left, isMaxWidth) {
      if(isMaxWidth) {
        authManager.setUserPrefValue("editorWidth", null);
      } else {
        if(width !== undefined && width !== null) {
          authManager.setUserPrefValue("editorWidth", width);
        }
      }

      if(left !== undefined && left !== null) {
        authManager.setUserPrefValue("editorLeft", left);
      }
      authManager.syncUserPreferences();
    }

    $rootScope.$on("user-preferences-changed", () => {
      this.loadPreferences();
    });

    this.loadPreferences = function() {
      this.monospaceFont = authManager.getUserPrefValue("monospaceFont", "monospace");

      if(!document.getElementById("editor-content")) {
        // Elements have not yet loaded due to ng-if around wrapper
        return;
      }

      this.reloadFont();

      let width = authManager.getUserPrefValue("editorWidth", null);
      if(width !== null) {
        this.resizeControl.setWidth(width);
      }

      let left = authManager.getUserPrefValue("editorLeft", null);
      if(left !== null) {
        this.resizeControl.setLeft(left);
      }
    }

    this.reloadFont = function() {
      var editable = document.getElementById("note-text-editor");

      if(!editable) {
        return;
      }

      if(this.monospaceFont) {
        if(isMacApplication()) {
          editable.style.fontFamily = "Menlo, Consolas, 'DejaVu Sans Mono', monospace";
        } else {
          editable.style.fontFamily = "monospace";
        }
      } else {
        editable.style.fontFamily = "inherit";
      }
    }

    this.toggleKey = function(key) {
      this[key] = !this[key];
      authManager.setUserPrefValue(key, this[key], true);
      this.reloadFont();
    }



    /*
    Components
    */

    componentManager.registerHandler({identifier: "editor", areas: ["note-tags", "editor-stack", "editor-editor"], activationHandler: function(component){

      if(component.area === "note-tags") {
        // Autocomplete Tags
        this.tagsComponent = component.active ? component : null;
      } else if(component.area == "editor-stack") {
        // Stack
        if(component.active) {
          if(!_.find(this.componentStack, component)) {
            this.componentStack.push(component);
          }
        } else {
          _.pull(this.componentStack, component);
        }
      } else {
        // Editor
        if(component.active && this.note && (component.isActiveForItem(this.note) || component.isDefaultEditor())) {
          this.selectedEditor = component;
        } else {
          this.selectedEditor = null;
        }
      }
    }.bind(this), contextRequestHandler: function(component){
      return this.note;
    }.bind(this), actionHandler: function(component, action, data){
      if(action === "set-size") {
        var setSize = function(element, size) {
          var widthString = typeof size.width === 'string' ? size.width : `${data.width}px`;
          var heightString = typeof size.height === 'string' ? size.height : `${data.height}px`;
          element.setAttribute("style", `width:${widthString}; height:${heightString}; `);
        }

        if(data.type == "container") {
          if(component.area == "note-tags") {
            var container = document.getElementById("note-tags-component-container");
            setSize(container, data);
          }
        }
      }

      else if(action === "associate-item") {
        if(data.item.content_type == "Tag") {
          var tag = modelManager.findItem(data.item.uuid);
          this.addTag(tag);
        }
      }

      else if(action === "deassociate-item") {
        var tag = modelManager.findItem(data.item.uuid);
        this.removeTag(tag);
      }

      else if(action === "save-items" || action === "save-success" || action == "save-error") {
        if(data.items.map((item) => {return item.uuid}).includes(this.note.uuid)) {

          if(action == "save-items") {
            if(this.componentSaveTimeout) $timeout.cancel(this.componentSaveTimeout);
            this.componentSaveTimeout = $timeout(this.showSavingStatus.bind(this), 10);
          }

          else {
            if(this.componentStatusTimeout) $timeout.cancel(this.componentStatusTimeout);
            if(action == "save-success") {
              this.componentStatusTimeout = $timeout(this.showAllChangesSavedStatus.bind(this), 400);
            } else {
              this.componentStatusTimeout = $timeout(this.showErrorStatus.bind(this), 400);
            }
          }
        }
      }
    }.bind(this)});

    this.reloadComponentContext = function() {
      componentManager.contextItemDidChangeInArea("note-tags");
      componentManager.contextItemDidChangeInArea("editor-stack");
      componentManager.contextItemDidChangeInArea("editor-editor");

      var stack = componentManager.componentsForArea("editor-stack");
      for(var component of stack) {
        var activeForItem = component.isActiveForItem(this.note);
        if(activeForItem) {
          if(!component.active) {
            componentManager.activateComponent(component);
          }
        } else {
          if(component.active) {
            componentManager.deactivateComponent(component);
          }
        }
      }
    }

    this.toggleStackComponentForCurrentItem = function(component) {
      if(component.isActiveForItem(this.note)) {
        componentManager.deactivateComponent(component);
        this.disassociateComponentWithCurrentNote(component);
      } else {
        componentManager.activateComponent(component);
        componentManager.contextItemDidChangeInArea("editor-stack");
        this.associateComponentWithCurrentNote(component);
      }
    }

    this.disassociateComponentWithCurrentNote = function(component) {
      component.associatedItemIds = component.associatedItemIds.filter((id) => {return id !== this.note.uuid});

      // Only disassociative components should modify the disassociatedItemIds
      if(!component.isAssociative() && !component.disassociatedItemIds.includes(this.note.uuid)) {
        component.disassociatedItemIds.push(this.note.uuid);
      }

      component.setDirty(true);
    }

    this.associateComponentWithCurrentNote = function(component) {
      component.disassociatedItemIds = component.disassociatedItemIds.filter((id) => {return id !== this.note.uuid});

      if(component.isAssociative() && !component.associatedItemIds.includes(this.note.uuid)) {
        component.associatedItemIds.push(this.note.uuid);
      }

      component.setDirty(true);
    }






    /*
    Editor Customization
    */

    this.onSystemEditorLoad = function() {
      if(this.loadedTabListener) {
        return;
      }
      this.loadedTabListener = true;
      /**
       * Insert 4 spaces when a tab key is pressed,
       * only used when inside of the text editor.
       * If the shift key is pressed first, this event is
       * not fired.
      */
      var parent = this;
      var handleTab = function (event) {
        if (!event.shiftKey && event.which == 9) {
          event.preventDefault();

          // Using document.execCommand gives us undo support
          if(!document.execCommand("insertText", false, "\t")) {
            // document.execCommand works great on Chrome/Safari but not Firefox
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

          parent.note.text = this.value;
          parent.changesMade();
        }
      }

      var element = document.getElementById("note-text-editor");
      element.addEventListener('keydown', handleTab);

      angular.element(element).on('$destroy', function(){
        window.removeEventListener('keydown', handleTab);
        this.loadedTabListener = false;
      }.bind(this))
    }


  });
