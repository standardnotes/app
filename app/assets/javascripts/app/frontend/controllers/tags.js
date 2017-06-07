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
  .controller('TagsCtrl', function (modelManager, $timeout, componentManager) {

    var initialLoad = true;

    componentManager.addSelectionObserver("tags-list", "Tag", function(tag){
      if(tag) {
        this.selectTag(tag);
      } else {
        this.selectTag(this.allTag);
      }
    }.bind(this));

    componentManager.addActivationObserver("tags-list", "tags-list", function(component){
      console.log("Activating tags list comp", component);
      this.component = component;

      if(component.active) {
        $timeout(function(){
          var iframe = document.getElementById("tags-list-iframe");
          iframe.onload = function() {
            componentManager.registerComponentWindow(this.component, iframe.contentWindow);
          }.bind(this);
        }.bind(this));
      }
    }.bind(this));


    // this.tagsComponentUrl = "http://localhost:8000?type=component&name=Folders&area=tags-list";

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
      var validNotes = Note.filterDummyNotes(tag.notes);
      return validNotes.length;
    }

  });
