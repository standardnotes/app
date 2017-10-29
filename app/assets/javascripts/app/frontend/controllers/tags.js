angular.module('app.frontend')
  .directive("tagsSection", function(){
    return {
      restrict: 'E',
      scope: {
        addNew: "&",
        selectionMade: "&",
        willSelect: "&",
        save: "&",
        tags: "=",
        allTag: "=",
        archiveTag: "=",
        updateNoteTag: "&",
        removeTag: "&"
      },
      templateUrl: 'frontend/tags.html',
      replace: true,
      controller: 'TagsCtrl',
      controllerAs: 'ctrl',
      bindToController: true,

      link:function(scope, elem, attrs, ctrl) {
        scope.$watch('ctrl.tags', function(newTags){
          if(newTags) {
            ctrl.setTags(newTags);
          }
        });

        scope.$watch('ctrl.allTag', function(allTag){
          if(allTag) {
            ctrl.setAllTag(allTag);
          }
        });
      }
    }
  })
  .controller('TagsCtrl', function ($rootScope, modelManager, $timeout, componentManager, userManager, keyboardManager) {

    this.keyboardManager = keyboardManager;

    keyboardManager.registerShortcut("down", "tags", false, () => {
      this.selectNextTag();
    })

    keyboardManager.registerShortcut("up", "tags", false, () => {
      this.selectPreviousTag();
    })

    keyboardManager.registerShortcut(["command+t", "command+e"], "*", false, () => {
      this.createNewTag();
    })

    this.selectNextTag = function() {
      let currentIndex = this.tags.indexOf(this.selectedTag);
      if(currentIndex + 1 < this.tags.length) {
        this.selectTag(this.tags[currentIndex + 1]);
      }
    }

    this.selectPreviousTag = function() {
      let currentIndex = this.tags.indexOf(this.selectedTag);
      if(currentIndex - 1 >= 0) {
        this.selectTag(this.tags[currentIndex - 1]);
      } else {
        this.selectTag(this.allTag);
      }
    }

    var initialLoad = true;

    this.panelController = {};

    $rootScope.$on("user-preferences-changed", () => {
      this.loadPreferences();
    });

    this.loadPreferences = function() {
      let width = userManager.userPreferences.getAppDataItem("tagsPanelWidth");
      if(width) {
        this.panelController.setWidth(width);
      }
    }

    this.loadPreferences();

    this.onPanelResize = function(newWidth) {
      userManager.userPreferences.setAppDataItem("tagsPanelWidth", newWidth);
      userManager.syncUserPreferences();
    }

    componentManager.registerHandler({identifier: "tags", areas: ["tags-list"], activationHandler: function(component){
      this.component = component;

      if(component.active) {
        $timeout(function(){
          var iframe = document.getElementById("tags-list-iframe");
          iframe.onload = function() {
            componentManager.registerComponentWindow(this.component, iframe.contentWindow);
          }.bind(this);
        }.bind(this));
      }

    }.bind(this), contextRequestHandler: function(component){
      return null;
    }.bind(this), actionHandler: function(component, action, data){

      if(action === "select-item") {
        var tag = modelManager.findItem(data.item.uuid);
        if(tag) {
          this.selectTag(tag);
        }
      }

      else if(action === "clear-selection") {
        this.selectTag(this.allTag);
      }

    }.bind(this)});

    this.setAllTag = function(allTag) {
      this.selectTag(this.allTag);
    }

    this.setTags = function(tags) {
      if(initialLoad) {
          initialLoad = false;
          this.selectTag(this.allTag);
      } else {
        if(tags && tags.length > 0) {
          this.selectTag(tags[0]);
        }
      }
    }

    this.selectTag = function(tag) {
      this.willSelect()(tag);
      this.selectedTag = tag;
      tag.conflict_of = null; // clear conflict
      this.selectionMade()(tag);
    }

    this.createNewTag = function() {
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

      this.save()(tag, function(savedTag){
        this.selectTag(tag);
        this.newTag = null;
      }.bind(this));
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
    }

    this.noteCount = function(tag) {
      var validNotes = Note.filterDummyNotes(tag.notes).filter(function(note){
        return !note.archived;
      });
      return validNotes.length;
    }

  });
