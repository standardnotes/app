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
  .controller('EditorCtrl', function ($sce, $timeout, authManager, $rootScope, extensionManager, syncManager, modelManager, editorManager, themeManager, componentManager) {

    this.componentManager = componentManager;
    this.componentStack = [];

    $rootScope.$on("theme-changed", function(){
      this.postThemeToExternalEditor();
    }.bind(this))

    $rootScope.$on("sync:taking-too-long", function(){
      this.syncTakingTooLong = true;
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
        var tag = modelManager.findItem(data.item.uuid);
        this.addTag(tag);
      }

      else if(action === "deassociate-item") {
        var tag = modelManager.findItem(data.item.uuid);
        this.removeTag(tag);
      }

    }.bind(this)});

    this.didLoadComponents = false;

    this.loadComponents = function() {
      this.didLoadComponents = true;
      componentManager.loadComponentStateForArea("note-tags");
      componentManager.loadComponentStateForArea("editor-stack");

      // for(var component of componentManager.components) {
      //   component.permissions = [];
      //   component.setDirty(true);
      // }
      // syncManager.sync();
    }

    $rootScope.$on("data-loaded", function(){
      if(this.note) {
        this.loadComponents();
      }
    }.bind(this))


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
      if(!this.didLoadComponents) {
        this.loadComponents();
      }
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

      var setEditor = function(editor) {
        this.editor = editor;
        this.postNoteToExternalEditor();
        this.noteReady = true;
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
        this.editor = null;
        this.noteReady = true;
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

      if(this.editor && editor !== this.editor) {
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
      if(!this.editor) {
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
        this.syncTakingTooLong = false;
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

    this.selectedMenuItem = function($event) {
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

    /* Components */

    let alertKey = "displayed-component-disable-alert";

    this.disableComponent = function(component) {
      componentManager.disableComponentForItem(component, this.note);
      componentManager.setEventFlowForComponent(component, false);
      if(!localStorage.getItem(alertKey)) {
        alert("This component will be disabled for this note. You can re-enable this component in the 'Menu' of the editor pane.");
        localStorage.setItem(alertKey, true);
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

  });
