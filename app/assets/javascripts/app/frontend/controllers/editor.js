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

        scope.$watch('ctrl.note.text', function(newText){
          if(!ctrl.note) {
            return;
          }

          // ignore this change if it originated from here
          if(ctrl.changingTextFromEditor) {
            ctrl.changingTextFromEditor = false;
            return;
          }

          ctrl.postNoteToExternalEditor(ctrl.note);
        })
      }
    }
  })
  .controller('EditorCtrl', function ($sce, $timeout, authManager, $rootScope, extensionManager, syncManager, modelManager, editorManager, themeManager, componentManager, storageManager) {

    this.resizeControl = {};

    this.onPanelResizeFinish = function(width, left) {
      if(width !== undefined && width !== null) {
        authManager.userPreferences.setAppDataItem("editorWidth", width);
      }
      if(left !== undefined && left !== null) {
        authManager.userPreferences.setAppDataItem("editorLeft", left);
      }
      authManager.syncUserPreferences();
    }


    $rootScope.$on("user-preferences-changed", () => {
      this.loadPreferences();
    });

    this.loadPreferences = function() {
      this.monospaceFont = authManager.getUserPref("monospaceFont", "monospace");

      if(!document.getElementById("editor-content")) {
        // Elements have not yet loaded due to ng-if around wrapper, schedule load
        this.queueLoadPreferences = true;
        return;
      }

      this.reloadFont();

      let width = authManager.getUserPref("editorWidth", null);
      if(width !== null) {
        this.resizeControl.setWidth(width);
      }

      let left = authManager.getUserPref("editorLeft", null);
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
        editable.style.fontFamily = "monospace";
      } else {
        editable.style.fontFamily = "inherit";
      }
    }

    this.toggleKey = function(key) {
      this[key] = !this[key];
      authManager.userPreferences.setAppDataItem(key, this[key]);
      authManager.syncUserPreferences();
      this.reloadFont();
    }

    this.componentManager = componentManager;
    this.componentStack = [];

    $rootScope.$on("theme-changed", function(){
      this.postThemeToExternalEditor();
    }.bind(this))

    $rootScope.$on("sync:taking-too-long", function(){
      this.syncTakingTooLong = true;
    }.bind(this));

    $rootScope.$on("sync:completed", function(){
      this.syncTakingTooLong = false;
    }.bind(this));

    $rootScope.$on("tag-changed", function(){
      this.loadTagsString();
    }.bind(this));

    componentManager.registerHandler({identifier: "editor", areas: ["note-tags", "editor-stack"], activationHandler: function(component){

      if(!component.active) {
        return;
      }

      if(component.area === "note-tags") {
        this.tagsComponent = component;
      } else {
        // stack
        if(!_.find(this.componentStack, component)) {
          this.componentStack.push(component);
        }
      }

      $timeout(function(){
        var iframe = componentManager.iframeForComponent(component);
        if(iframe) {
          iframe.onload = function() {
            componentManager.registerComponentWindow(component, iframe.contentWindow);
          }.bind(this);
        }
      }.bind(this));

    }.bind(this), contextRequestHandler: function(component){
      return this.note;
    }.bind(this), actionHandler: function(component, action, data){
      if(action === "set-size") {
        var setSize = function(element, size) {
          var widthString = typeof size.width === 'string' ? size.width : `${data.width}px`;
          var heightString = typeof size.height === 'string' ? size.height : `${data.height}px`;
          element.setAttribute("style", `width:${widthString}; height:${heightString}; `);
        }

        if(data.type === "content") {
          var iframe = componentManager.iframeForComponent(component);
          var width = data.width;
          var height = data.height;
          iframe.width  = width;
          iframe.height = height;

          setSize(iframe, data);
        } else {
          if(component.area == "note-tags") {
            var container = document.getElementById("note-tags-component-container");
            setSize(container, data);
          } else {
            var container = document.getElementById("component-" + component.uuid);
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

    }.bind(this)});

    window.addEventListener("message", function(event){
      if(event.data.status) {
        this.postNoteToExternalEditor();
      } else if(!event.data.api) {
        // console.log("Received message", event.data);
        var id = event.data.id;
        var text = event.data.text;
        var data = event.data.data;

        if(this.note.uuid === id) {
          // to ignore $watch events
          this.changingTextFromEditor = true;
          this.note.text = text;
          if(data) {
            var changesMade = this.editor.setData(id, data);
            if(changesMade) {
              this.editor.setDirty(true);
            }
          }
          this.changesMade();
        }
      }
    }.bind(this), false);

    this.noteDidChange = function(note, oldNote) {
      this.setNote(note, oldNote);
      for(var component of this.componentStack) {
        componentManager.setEventFlowForComponent(component, component.isActiveForItem(this.note));
      }
      componentManager.contextItemDidChangeInArea("note-tags");
      componentManager.contextItemDidChangeInArea("editor-stack");
    }

    this.setNote = function(note, oldNote) {
      var currentEditor = this.editor;
      this.editor = null;
      this.showExtensions = false;
      this.showMenu = false;
      this.loadTagsString();

      let onReady = () => {
        this.noteReady = true;
        if(this.queueLoadPreferences) {
          this.queueLoadPreferences = false;
          $timeout(() => {
            this.loadPreferences();
          })
        }
        this.reloadFont();
      }

      var setEditor = function(editor) {
        this.editor = editor;
        this.postNoteToExternalEditor();
        onReady();
      }.bind(this)

      var editor = this.editorForNote(note);
      if(editor && !editor.systemEditor) {
        // setting note to not ready will remove the editor from view in a flash,
        // so we only want to do this if switching between external editors
        this.noteReady = false;
      }
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
        this.editor = editorManager.systemEditor;
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

    this.selectedEditor = function(editor) {
      this.showEditorMenu = false;

      if(this.editor && editor !== this.editor && !this.editor.systemEditor) {
        this.editor.removeItemAsRelationship(this.note);
        this.editor.setDirty(true);
      }

      editor.addItemAsRelationship(this.note);
      editor.setDirty(true);

      syncManager.sync();

      this.editor = editor;
    }.bind(this)

    this.editorForNote = function(note) {
      var editors = modelManager.itemsForContentType("SN|Editor");
      for(var editor of editors) {
        if(_.includes(editor.notes, note)) {
          return editor;
        }
      }
      return _.find(editors, {default: true});
    }

    this.postDataToExternalEditor = function(data) {
      var externalEditorElement = document.getElementById("editor-iframe");
      if(externalEditorElement) {
        externalEditorElement.contentWindow.postMessage(data, '*');
      }
    }

    function themeData() {
      return {
        themes: [themeManager.currentTheme ? themeManager.currentTheme.url : null]
      }
    }

    this.postThemeToExternalEditor = function() {
      this.postDataToExternalEditor(themeData())
    }

    this.postNoteToExternalEditor = function() {
      if(!this.editor || this.editor.systemEditor) {
        return;
      }

      var data = {
        text: this.note.text,
        data: this.editor.dataForKey(this.note.uuid),
        id: this.note.uuid,
      }
      _.merge(data, themeData());
      this.postDataToExternalEditor(data);
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
            var status = "All changes saved";
            if(authManager.offline()) {
              status += " (offline)";
            }
            this.saveError = false;
            this.syncTakingTooLong = false;
            this.noteStatus = $sce.trustAsHtml(status);
          }.bind(this), 200)
        } else {
          if(statusTimeout) $timeout.cancel(statusTimeout);
          statusTimeout = $timeout(function(){
            this.saveError = true;
            this.syncTakingTooLong = false;
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

    this.selectedMenuItem = function($event) {
      this.showMenu = false;
    }

    this.deleteNote = function() {
      if(confirm("Are you sure you want to delete this note?")) {
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
      this.editorMode = 'edit';
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






    /*
    Components
    */

    let alertKey = "displayed-component-disable-alert";

    this.disableComponent = function(component) {
      componentManager.disableComponentForItem(component, this.note);
      componentManager.setEventFlowForComponent(component, false);
      if(!storageManager.getItem(alertKey)) {
        alert("This component will be disabled for this note. You can re-enable this component in the 'Menu' of the editor pane.");
        storageManager.setItem(alertKey, true);
      }
    }

    this.hasDisabledComponents = function() {
      for(var component of this.componentStack) {
        if(component.ignoreEvents) {
          return true;
        }
      }

      return false;
    }

    this.restoreDisabledComponents = function() {
      var relevantComponents = this.componentStack.filter(function(component){
        return component.ignoreEvents;
      })

      componentManager.enableComponentsForItem(relevantComponents, this.note);

      for(var component of relevantComponents) {
        componentManager.setEventFlowForComponent(component, true);
        componentManager.contextItemDidChangeInArea("editor-stack");
      }
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
