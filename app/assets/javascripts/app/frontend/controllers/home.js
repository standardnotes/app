angular.module('app.frontend')
.controller('HomeCtrl', function ($scope, $rootScope, $timeout, modelManager, syncManager, authManager) {
    $rootScope.bodyClass = "app-body-class";

    syncManager.loadLocalItems(function(items) {
      $scope.$apply();

      syncManager.sync(null);
      // refresh every 30s
      // setInterval(function () {
      //   syncManager.sync(null);
      // }, 30000);
    });

    $scope.allTag = new Tag({all: true});
    $scope.allTag.title = "All";
    $scope.tags = modelManager.tags;
    $scope.allTag.notes = modelManager.notes;

    /*
    Editor Callbacks
    */

    $scope.updateTagsForNote = function(note, stringTags) {
      note.removeAllRelationships();
      var tags = [];
      for(var tagString of stringTags) {
        tags.push(modelManager.findOrCreateTagByTitle(tagString));
      }
      for(var tag of tags) {
        modelManager.createRelationshipBetweenItems(note, tag);
      }

      syncManager.sync();
    }

    /*
    Tags Ctrl Callbacks
    */


    $scope.tagsWillMakeSelection = function(tag) {

    }

    $scope.tagsSelectionMade = function(tag) {
      $scope.selectedTag = tag;

      if($scope.selectedNote && $scope.selectedNote.dummy) {
        modelManager.removeItemLocally($scope.selectedNote);
      }
    }

    $scope.tagsAddNew = function(tag) {
      modelManager.addItem(tag);
    }

    $scope.tagsSave = function(tag, callback) {
      console.log("saving tag", tag);
      if(!tag.title || tag.title.length == 0) {
        $scope.notesRemoveTag(tag);
        return;
      }
      tag.setDirty(true);
      syncManager.sync(callback);
    }

    /*
    Notes Ctrl Callbacks
    */

    $scope.notesRemoveTag = function(tag) {
      var validNotes = Note.filterDummyNotes(tag.notes);
      if(validNotes == 0) {
        modelManager.setItemToBeDeleted(tag);
        // if no more notes, delete tag
        syncManager.sync(function(){
          // force scope tags to update on sub directives
          $scope.safeApply();
        });
      } else {
        alert("To delete this tag, remove all its notes first.");
      }
    }

    $scope.notesSelectionMade = function(note) {
      $scope.selectedNote = note;
    }

    $scope.notesAddNew = function(note) {
      modelManager.addItem(note);

      if(!$scope.selectedTag.all) {
        modelManager.createRelationshipBetweenItems($scope.selectedTag, note);
      }
    }

    /*
    Shared Callbacks
    */

    $scope.saveNote = function(note, callback) {
      note.setDirty(true);

      syncManager.sync(function(response){
        if(response && response.error) {
          if(!$scope.didShowErrorAlert) {
            $scope.didShowErrorAlert = true;
            alert("There was an error saving your note. Please try again.");
          }
          callback(false);
        } else {
          note.hasChanges = false;
          if(callback) {
            callback(true);
          }
        }
      })
    }

    $scope.safeApply = function(fn) {
      var phase = this.$root.$$phase;
      if(phase == '$apply' || phase == '$digest')
        this.$eval(fn);
      else
        this.$apply(fn);
    };

    $scope.deleteNote = function(note) {

      modelManager.setItemToBeDeleted(note);

      if(note == $scope.selectedNote) {
        $scope.selectedNote = null;
      }

      if(note.dummy) {
        modelManager.removeItemLocally(note);
        return;
      }

      syncManager.sync(function(){
        if(authManager.offline()) {
          // when deleting items while ofline, we need to explictly tell angular to refresh UI
          setTimeout(function () {
            $scope.safeApply();
          }, 50);
        }
      });
    }
});
