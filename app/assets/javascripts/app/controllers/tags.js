angular.module('app')
  .directive("tagsSection", function(){
    return {
      restrict: 'E',
      scope: {
        addNew: "&",
        selectionMade: "&",
        save: "&",
        tags: "=",
        updateNoteTag: "&",
        removeTag: "&"
      },
      templateUrl: 'tags.html',
      replace: true,
      controller: 'TagsCtrl',
      controllerAs: 'ctrl',
      bindToController: true,
    }
  })
  .controller('TagsCtrl', function ($rootScope, modelManager, syncManager, $timeout, componentManager, authManager) {
    let initialLoad = true;

    syncManager.addEventHandler((syncEvent, data) => {
      if(syncEvent == "initial-data-loaded" || syncEvent == "sync:completed") {
        this.tags = modelManager.tags;
        this.smartTags = modelManager.getSmartTags();

        if(initialLoad) {
          initialLoad = false;
          this.selectTag(this.smartTags[0]);
        }
      }
    });

    this.panelController = {};

    $rootScope.$on("user-preferences-changed", () => {
      this.loadPreferences();
    });

    this.loadPreferences = function() {
      let width = authManager.getUserPrefValue("tagsPanelWidth");
      if(width) {
        this.panelController.setWidth(width);
        if(this.panelController.isCollapsed()) {
          $rootScope.$broadcast("panel-resized", {panel: "tags", collapsed: this.panelController.isCollapsed()})
        }
      }
    }

    this.loadPreferences();

    this.onPanelResize = function(newWidth, lastLeft, isAtMaxWidth, isCollapsed) {
      authManager.setUserPrefValue("tagsPanelWidth", newWidth, true);
      $rootScope.$broadcast("panel-resized", {panel: "tags", collapsed: isCollapsed})
    }

    this.componentManager = componentManager;

    componentManager.registerHandler({identifier: "tags", areas: ["tags-list"], activationHandler: function(component){
      this.component = component;
    }.bind(this), contextRequestHandler: function(component){
      return null;
    }.bind(this), actionHandler: function(component, action, data){
      if(action === "select-item") {
        if(data.item.content_type == "Tag") {
          let tag = modelManager.findItem(data.item.uuid);
          if(tag) {
            this.selectTag(tag);
          }
        } else if(data.item.content_type == "SN|SmartTag") {
          let smartTag = new SNSmartTag(data.item);
          this.selectTag(smartTag);
        }
      } else if(action === "clear-selection") {
        this.selectTag(this.smartTags[0]);
      }
    }.bind(this)});

    this.selectTag = function(tag) {
      if(tag.isSmartTag()) {
        Object.defineProperty(tag, "notes", {
          get: () => {
            return modelManager.notesMatchingPredicate(tag.content.predicate);
          }
        });
      }
      this.selectedTag = tag;
      tag.conflict_of = null; // clear conflict
      this.selectionMade()(tag);
    }

    this.clickedAddNewTag = function() {
      if(this.editingTag) {
        return;
      }

      this.newTag = modelManager.createItem({content_type: "Tag"});
      this.selectedTag = this.newTag;
      this.editingTag = this.newTag;
      this.addNew()(this.newTag);
    }

    this.tagTitleDidChange = function(tag) {
      this.editingTag = tag;
    }

    this.saveTag = function($event, tag) {
      this.editingTag = null;
      $event.target.blur();

      if(!tag.title || tag.title.length == 0) {
        if(originalTagName) {
          tag.title = originalTagName;
          originalTagName = null;
        } else {
          // newly created tag without content
          modelManager.removeItemLocally(tag);
        }
        return;
      }

      this.save()(tag, (savedTag) => {
        $timeout(() => {
          this.selectTag(tag);
          this.newTag = null;
        })
      });
    }

    function inputElementForTag(tag) {
      return document.getElementById("tag-" + tag.uuid);
    }

    var originalTagName = "";
    this.selectedRenameTag = function($event, tag) {
      originalTagName = tag.title;
      this.editingTag = tag;
      $timeout(function(){
        inputElementForTag(tag).focus();
      })
    }

    this.selectedDeleteTag = function(tag) {
      this.removeTag()(tag);
      this.selectTag(this.smartTags[0]);
    }

    this.noteCount = function(tag) {
      var validNotes = SNNote.filterDummyNotes(tag.notes).filter(function(note){
        return !note.archived && !note.content.trashed;
      });
      return validNotes.length;
    }

  });
