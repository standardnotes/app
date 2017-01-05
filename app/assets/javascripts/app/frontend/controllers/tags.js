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
        user: "=",
        updateNoteTag: "&"
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
  .controller('TagsCtrl', function () {

    var initialLoad = true;

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
      this.selectionMade()(tag);
    }

    this.clickedAddNewTag = function() {
      if(this.editingTag) {
        return;
      }

      this.newTag = new Tag({});
      this.selectedTag = this.newTag;
      this.editingTag = this.newTag;
      this.addNew()(this.newTag);
    }

    var originalTagName = "";
    this.onTagTitleFocus = function(tag) {
      originalTagName = tag.title;
    }

    this.tagTitleDidChange = function(tag) {
      this.editingTag = tag;
    }

    this.saveTag = function($event, tag) {
      this.editingTag = null;
      if(tag.title.length == 0) {
        tag.title = originalTagName;
        originalTagName = "";
        return;
      }

      $event.target.blur();
      if(!tag.title || tag.title.length == 0) {
          return;
      }

      this.save()(tag, function(savedTag){
        // _.merge(tag, savedTag);
        this.selectTag(tag);
        this.newTag = null;
      }.bind(this));
    }

    this.noteCount = function(tag) {
      var validNotes = Note.filterDummyNotes(tag.notes);
      return validNotes.length;
    }

    this.handleDrop = function(e, newTag, note) {
      this.updateNoteTag()(note, newTag, this.selectedTag);
    }.bind(this)


  });
