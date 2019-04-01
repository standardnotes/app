angular.module('app')
  .directive("editorSection", function($timeout, $sce){
    return {
      restrict: 'E',
      scope: {
        remove: "&",
        note: "=",
        updateTags: "&"
      },
      templateUrl: 'editor.html',
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
  .controller('EditorCtrl', function ($sce, $timeout, authManager, $rootScope, actionsManager,
    syncManager, modelManager, themeManager, componentManager, storageManager, sessionHistory, privilegesManager) {

    this.spellcheck = true;
    this.componentManager = componentManager;
    this.componentStack = [];
    this.isDesktop = isDesktopApplication();

    $rootScope.$on("sync:taking-too-long", function(){
      this.syncTakingTooLong = true;
    }.bind(this));

    $rootScope.$on("sync:completed", function(){
      this.syncTakingTooLong = false;
    }.bind(this));

    // Right now this only handles offline saving status changes.
    this.syncStatusObserver = syncManager.registerSyncStatusObserver((status) => {
      if(status.localError) {
        $timeout(() => {
          this.showErrorStatus({
            message: "Offline Saving Issue",
            desc: "Changes not saved"
          });
        }, 500)
      } else {
      }
    })

    modelManager.addItemSyncObserver("editor-note-observer", "Note", (allItems, validItems, deletedItems, source) => {
      if(!this.note) { return; }

      // Before checking if isMappingSourceRetrieved, we check if this item was deleted via a local source,
      // such as alternating uuids during sign in. Otherwise, we only want to make interface updates if it's a
      // remote retrieved source.
      if(this.note.deleted || this.note.content.trashed) {
        $rootScope.notifyDelete();
        return;
      }

      if(!SFModelManager.isMappingSourceRetrieved(source)) {
        return;
      }

      var matchingNote = allItems.find((item) => {
        return item.uuid == this.note.uuid;
      });

      if(!matchingNote) {
        return;
      }

      // Update tags
      this.loadTagsString();
    });

    modelManager.addItemSyncObserver("editor-tag-observer", "Tag", (allItems, validItems, deletedItems, source) => {
      if(!this.note) { return; }

      for(var tag of allItems) {
        // If a tag is deleted then we'll have lost references to notes. Reload anyway.
        if(this.note.savedTagsString == null || tag.deleted || tag.hasRelationshipWithItem(this.note)) {
          this.loadTagsString();
          return;
        }
      }
    });


    modelManager.addItemSyncObserver("editor-component-observer", "SN|Component", (allItems, validItems, deletedItems, source) => {
      if(!this.note) { return; }

      // Reload componentStack in case new ones were added or removed
      this.reloadComponentStackArray();

      // Observe editor changes to see if the current note should update its editor
      var editors = allItems.filter(function(item) {
        return item.isEditor();
      });

      // If no editors have changed
      if(editors.length == 0) {
        return;
      }

      // Look through editors again and find the most proper one
      var editor = this.editorForNote(this.note);
      this.selectedEditor = editor;
    });

    this.noteDidChange = function(note, oldNote) {
      this.setNote(note, oldNote);
      this.reloadComponentContext();
    }

    this.setNote = function(note, oldNote) {
      this.showExtensions = false;
      this.showMenu = false;
      this.noteStatus = null;
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
          this.saveNote(oldNote);
        } else if(oldNote.dummy) {
          this.remove()(oldNote);
        }
      }
    }

    this.editorForNote = function(note) {
      return componentManager.editorForNote(note);
    }

    this.closeAllMenus = function() {
      this.showEditorMenu = false;
      this.showMenu = false;
      this.showExtensions = false;
    }

    this.toggleMenu = function(menu) {
      this[menu] = !this[menu];

      let allMenus = ['showMenu', 'showEditorMenu', 'showExtensions', 'showSessionHistory'];
      for(var candidate of allMenus) {
        if(candidate != menu) {
          this[candidate] = false;
        }
      }
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
      return actionsManager.extensionsInContextOfItem(this.note).length > 0;
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

    this.saveNote = function(note, callback, dontUpdateClientModified, dontUpdatePreviews) {
      // We don't want to update the client modified date if toggling lock for note.
      note.setDirty(true, dontUpdateClientModified);

      if(!dontUpdatePreviews) {
        let limit = 80;
        var text = note.text || "";
        var truncate = text.length > limit;
        note.content.preview_plain = text.substring(0, limit) + (truncate ? "..." : "");

        // Clear dynamic previews if using plain editor
        note.content.preview_html = null;
      }

      syncManager.sync().then((response) => {
        if(response && response.error) {
          if(!this.didShowErrorAlert) {
            this.didShowErrorAlert = true;
            alert("There was an error saving your note. Please try again.");
          }
          $timeout(() => {
            callback && callback(false);
          })
        } else {
          note.hasChanges = false;
          $timeout(() => {
            callback && callback(true);
          });
        }
      })
    }

    let saveTimeout;
    this.changesMade = function({bypassDebouncer, dontUpdateClientModified, dontUpdatePreviews} = {}) {
      let note = this.note;
      note.dummy = false;

      /* In the case of keystrokes, saving should go through a debouncer to avoid frequent calls.
        In the case of deleting or archiving a note, it should happen immediately before the note is switched out
       */
      let delay = bypassDebouncer ? 0 : 275;

      // In the case of archiving a note, the note is saved immediately, then switched to another note.
      // Usually note.hasChanges is set back to false after the saving delay, but in this case, because there is no delay,
      // we set it to false immediately so that it is not saved twice: once now, and the other on setNote in oldNote.hasChanges.
      note.hasChanges = bypassDebouncer ? false : true;

      if(saveTimeout) $timeout.cancel(saveTimeout);
      if(statusTimeout) $timeout.cancel(statusTimeout);
      saveTimeout = $timeout(() => {
        this.showSavingStatus();
        note.dummy = false;
        // Make sure the note exists. A safety measure, as toggling between tags triggers deletes for dummy notes.
        // Race conditions have been fixed, but we'll keep this here just in case.
        if(!modelManager.findItem(note.uuid)) {
          alert("The note you are attempting to save can not be found or has been deleted. Changes you make will not be synced. Please copy this note's text and start a new note.");
          return;
        }

        this.saveNote(note, (success) => {
          if(success) {
            if(statusTimeout) $timeout.cancel(statusTimeout);
            statusTimeout = $timeout(() => {
              this.showAllChangesSavedStatus();
            }, 200)
          } else {
            if(statusTimeout) $timeout.cancel(statusTimeout);
            statusTimeout = $timeout(() => {
              this.showErrorStatus();
            }, 200)
          }
        }, dontUpdateClientModified, dontUpdatePreviews);
      }, delay)
    }

    this.showSavingStatus = function() {
      this.noteStatus = {message: "Saving..."};
    }

    this.showAllChangesSavedStatus = function() {
      this.saveError = false;
      this.syncTakingTooLong = false;

      var status = "All changes saved";
      if(authManager.offline()) {
        status += " (offline)";
      }
      this.noteStatus = {message: status};
    }

    this.showErrorStatus = function(error) {
      if(!error) {
        error = {
          message: "Sync Unreachable",
          desc: "All changes saved offline"
        }
      }
      this.saveError = true;
      this.syncTakingTooLong = false;
      this.noteStatus = error;
    }

    this.contentChanged = function() {
      // content changes should bypass manual debouncer as we use the built in ng-model-options debouncer
      this.changesMade({bypassDebouncer: true});
    }

    this.onTitleEnter = function($event) {
      $event.target.blur();
      this.onTitleChange();
      this.focusEditor();
    }

    this.onTitleChange = function() {
      this.changesMade({dontUpdatePreviews: true});
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

    this.selectedMenuItem = function(hide) {
      if(hide) {
        this.showMenu = false;
      }
    }

    this.deleteNote = async function(permanently) {
      let run = () => {
        $timeout(() => {
          if(this.note.locked) {
            alert("This note is locked. If you'd like to delete it, unlock it, and try again.");
            return;
          }

          let title = this.note.safeTitle().length ? `'${this.note.title}'` : "this note";
          let message = permanently ? `Are you sure you want to permanently delete ${title}?`
            : `Are you sure you want to move ${title} to the trash?`
          if(confirm(message)) {
            if(permanently) {
              this.remove()(this.note);
            } else {
              this.note.content.trashed = true;
              this.changesMade({bypassDebouncer: true, dontUpdateClientModified: true, dontUpdatePreviews: true});
            }
            this.showMenu = false;
          }
        });
      }

      if(await privilegesManager.actionRequiresPrivilege(PrivilegesManager.ActionDeleteNote)) {
        privilegesManager.presentPrivilegesModal(PrivilegesManager.ActionDeleteNote, () => {
          run();
        });
      } else {
        run();
      }
    }

    this.restoreTrashedNote = function() {
      this.note.content.trashed = false;
      this.changesMade({bypassDebouncer: true, dontUpdateClientModified: true, dontUpdatePreviews: true});
    }

    this.deleteNotePermanantely = function() {
      this.deleteNote(true);
    }

    this.getTrashCount = function() {
      return modelManager.trashedItems().length;
    }

    this.emptyTrash = function() {
      let count = this.getTrashCount();
      if(confirm(`Are you sure you want to permanently delete ${count} note(s)?`)) {
        modelManager.emptyTrash();
        syncManager.sync();
      }
    }

    this.togglePin = function() {
      this.note.setAppDataItem("pinned", !this.note.pinned);
      this.changesMade({bypassDebouncer: true, dontUpdatePreviews: true});
    }

    this.toggleLockNote = function() {
      this.note.setAppDataItem("locked", !this.note.locked);
      this.changesMade({bypassDebouncer: true, dontUpdateClientModified: true, dontUpdatePreviews: true});
    }

    this.toggleProtectNote = function() {
      this.note.content.protected = !this.note.content.protected;
      this.changesMade({bypassDebouncer: true, dontUpdateClientModified: true, dontUpdatePreviews: true});

      // Show privilegesManager if Protection is not yet set up
      privilegesManager.actionHasPrivilegesConfigured(PrivilegesManager.ActionViewProtectedNotes).then((configured) => {
        if(!configured) {
          privilegesManager.presentPrivilegesManagementModal();
        }
      })
    }

    this.toggleNotePreview = function() {
      this.note.content.hidePreview = !this.note.content.hidePreview;
      this.changesMade({bypassDebouncer: true, dontUpdateClientModified: true, dontUpdatePreviews: true});
    }

    this.toggleArchiveNote = function() {
      this.note.setAppDataItem("archived", !this.note.archived);
      this.changesMade({bypassDebouncer: true, dontUpdatePreviews: true});
      $rootScope.$broadcast("noteArchived");
    }

    this.clickedEditNote = function() {
      this.focusEditor(100);
    }








    /*
    Tags
    */

    this.loadTagsString = function() {
      this.tagsString = this.note.tagsString();
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
      if(this.tagsString == this.note.tagsString()) {
        return;
      }

      var strings = this.tagsString.split("#").filter((string) => {
        return string.length > 0;
      }).map((string) => {
        return string.trim();
      })

      this.note.dummy = false;
      this.updateTags()(this.note, strings);
    }


    /* Resizability */

    this.leftResizeControl = {};
    this.rightResizeControl = {};

    this.onPanelResizeFinish = (width, left, isMaxWidth) => {
      if(isMaxWidth) {
        authManager.setUserPrefValue("editorWidth", null);
      } else {
        if(width !== undefined && width !== null) {
          authManager.setUserPrefValue("editorWidth", width);
          this.leftResizeControl.setWidth(width);
        }
      }

      if(left !== undefined && left !== null) {
        authManager.setUserPrefValue("editorLeft", left);
        this.rightResizeControl.setLeft(left);
      }
      authManager.syncUserPreferences();
    }

    $rootScope.$on("user-preferences-changed", () => {
      this.loadPreferences();
    });

    this.loadPreferences = function() {
      this.monospaceFont = authManager.getUserPrefValue("monospaceFont", "monospace");
      this.spellcheck = authManager.getUserPrefValue("spellcheck", true);
      this.marginResizersEnabled = authManager.getUserPrefValue("marginResizersEnabled", true);

      if(!document.getElementById("editor-content")) {
        // Elements have not yet loaded due to ng-if around wrapper
        return;
      }

      this.reloadFont();

      if(this.marginResizersEnabled) {
        let width = authManager.getUserPrefValue("editorWidth", null);
        if(width !== null) {
          this.leftResizeControl.setWidth(width);
          this.rightResizeControl.setWidth(width);
        }

        let left = authManager.getUserPrefValue("editorLeft", null);
        if(left !== null) {
          this.leftResizeControl.setLeft(left);
          this.rightResizeControl.setLeft(left);
        }
      }
    }

    this.reloadFont = function() {
      var editable = document.getElementById("note-text-editor");

      if(!editable) {
        return;
      }

      if(this.monospaceFont) {
        if(isDesktopApplication()) {
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

      if(key == "spellcheck") {
        // Allows textarea to reload
        this.noteReady = false;
        $timeout(() => {
          this.noteReady = true;
          $timeout(() => {
            this.reloadFont();
          })
        }, 0)
      } else if(key == "marginResizersEnabled" && this[key] == true) {
        $timeout(() => {
          this.leftResizeControl.flash();
          this.rightResizeControl.flash();
        })
      }
    }



    /*
    Components
    */

    componentManager.registerHandler({identifier: "editor", areas: ["note-tags", "editor-stack", "editor-editor"], activationHandler: (component) => {
      if(component.area === "note-tags") {
        // Autocomplete Tags
        this.tagsComponent = component.active ? component : null;
      } else if(component.area == "editor-editor") {
        // An editor is already active, ensure the potential replacement is explicitely enabled for this item
        // We also check if the selectedEditor is active. If it's inactive, we want to treat it as an external reference wishing to deactivate this editor (i.e componentView)
        if(this.selectedEditor && this.selectedEditor == component && component.active == false) {
          this.selectedEditor = null;
        }
        else if(this.selectedEditor) {
          if(this.selectedEditor.active) {
            // In the case where an editor is duplicated, then you'll have two editors who are explicitely enabled for the same note.
            // This will cause an infinite loop, where as soon as the first is enabled, the second will come in, pass the `isExplicitlyEnabledForItem` check,
            // and replace the previous one. So we now check to make the current editor isn't also explicitely enabled, and if it is, then we'll just keep that one active.
            if(component.isExplicitlyEnabledForItem(this.note) && !this.selectedEditor.isExplicitlyEnabledForItem(this.note)) {
              this.selectedEditor = component;
            }
          }
        }
        else {
          // If no selected editor, let's see if the incoming one is a candidate
          if(component.active && this.note && (component.isExplicitlyEnabledForItem(this.note) || component.isDefaultEditor())) {
            this.selectedEditor = component;
          } else {
            // Not a candidate, and no selected editor. Disable the current editor by setting selectedEditor to null
            this.selectedEditor = null;
          }
        }

      } else if(component.area == "editor-stack") {
        this.reloadComponentContext();
      }
    }, contextRequestHandler: (component) => {
      if(component == this.selectedEditor || component == this.tagsComponent || this.componentStack.includes(component)) {
        return this.note;
      }
    }, focusHandler: (component, focused) => {
      if(component.isEditor() && focused) {
        this.closeAllMenus();
      }
    }, actionHandler: (component, action, data) => {
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

          // Currently extensions are not notified of association until a full server sync completes.
          // We need a better system for this, but for now, we'll manually notify observers
          modelManager.notifySyncObserversOfModels([tag], SFModelManager.MappingSourceLocalSaved);
        }
      }

      else if(action === "deassociate-item") {
        var tag = modelManager.findItem(data.item.uuid);
        this.removeTag(tag);

        // Currently extensions are not notified of association until a full server sync completes.
        // We need a better system for this, but for now, we'll manually notify observers
        modelManager.notifySyncObserversOfModels([tag], SFModelManager.MappingSourceLocalSaved);
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
    }});

    this.reloadComponentStackArray = function() {
      this.componentStack = componentManager.componentsForArea("editor-stack").sort((a, b) => {
        // Careful here. For some reason (probably because re-assigning array everytime quickly destroys componentView elements, causing deallocs),
        // sorting by updated_at (or any other property that may always be changing)
        // causes weird problems with ext communication when changing notes or activating/deactivating in quick succession
        return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
      });
    }

    this.reloadComponentContext = function() {
      // componentStack is used by the template to ng-repeat
      this.reloadComponentStackArray();
      /*
      In the past, we were doing this looping code even if the note wasn't currently defined.
      The problem is if an editor stack item loaded first, requested to stream items, and the note was undefined,
      we would set component.hidden = true. Which means messages would not be sent to the component.
      Theoretically, upon the note loading, we would run this code again, and unhide the extension.
      However, if you had requested to stream items when it was hidden, and then it unhid, it would never
      resend those items upon unhiding.

      Our solution here is to check that the note is defined before setting hidden. The question remains, when
      would note really ever be undefined? Maybe temprarily when you're deleting a note?
      */
      if(this.note) {
        for(var component of this.componentStack) {
          if(component.active) {
            componentManager.setComponentHidden(component, !component.isExplicitlyEnabledForItem(this.note));
          }
        }
      }

      componentManager.contextItemDidChangeInArea("note-tags");
      componentManager.contextItemDidChangeInArea("editor-stack");
      componentManager.contextItemDidChangeInArea("editor-editor");
    }

    this.toggleStackComponentForCurrentItem = function(component) {
      // If it's hidden, we want to show it
      // If it's not active, then hidden won't be set, and we mean to activate and show it.
      if(component.hidden || !component.active) {
        // Unhide, associate with current item
        componentManager.setComponentHidden(component, false);
        this.associateComponentWithCurrentNote(component);
        if(!component.active) {
          componentManager.activateComponent(component);
        }
        componentManager.contextItemDidChangeInArea("editor-stack");
      } else {
        // not hidden, hide
        componentManager.setComponentHidden(component, true);
        this.disassociateComponentWithCurrentNote(component);
      }
    }

    this.disassociateComponentWithCurrentNote = function(component) {
      component.associatedItemIds = component.associatedItemIds.filter((id) => {return id !== this.note.uuid});

      if(!component.disassociatedItemIds.includes(this.note.uuid)) {
        component.disassociatedItemIds.push(this.note.uuid);
      }

      component.setDirty(true);
      syncManager.sync();
    }

    this.associateComponentWithCurrentNote = function(component) {
      component.disassociatedItemIds = component.disassociatedItemIds.filter((id) => {return id !== this.note.uuid});

      if(!component.associatedItemIds.includes(this.note.uuid)) {
        component.associatedItemIds.push(this.note.uuid);
      }

      component.setDirty(true);
      syncManager.sync();
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
