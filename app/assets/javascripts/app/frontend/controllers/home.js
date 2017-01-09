angular.module('app.frontend')
.controller('HomeCtrl', function ($scope, $rootScope, $timeout, apiController, modelManager) {
    $rootScope.bodyClass = "app-body-class";

    apiController.loadLocalItems();
    $scope.allTag = new Tag({all: true});
    $scope.allTag.title = "All";
    $scope.tags = modelManager.tags;
    $scope.allTag.notes = modelManager.notes;

    apiController.sync(null);
    // refresh every 30s
    setInterval(function () {
      apiController.sync(null);
    }, 30000);

    /*
    Tags Ctrl Callbacks
    */

    $scope.updateAllTag = function() {
      // $scope.allTag.notes = modelManager.notes;
    }

    $scope.tagsWillMakeSelection = function(tag) {
      if(tag.all) {
        $scope.updateAllTag();
      }
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
      tag.setDirty(true);
      apiController.sync(callback);
    }

    /*
    Called to update the tag of a note after drag and drop change
    The note object is a copy of the original
    */
    $scope.tagsUpdateNoteTag = function(noteCopy, newTag, oldTag) {

      var originalNote = _.find(modelManager.notes, {uuid: noteCopy.uuid});
      if(!newTag.all) {
        modelManager.createRelationshipBetweenItems(newTag, originalNote);
      }

      apiController.sync(function(){});
    }

    /*
    Notes Ctrl Callbacks
    */

    $scope.notesRemoveTag = function(tag) {
      var validNotes = Note.filterDummyNotes(tag.notes);
      if(validNotes == 0) {
        modelManager.setItemToBeDeleted(tag);
        // if no more notes, delete tag
        apiController.sync(function(){
          // force scope tags to update on sub directives
          $scope.tags = [];
          $timeout(function(){
            $scope.tags = modelManager.tags;
          })
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
        $scope.updateAllTag();
      }
    }

    /*
    Shared Callbacks
    */

    $scope.saveNote = function(note, callback) {
      note.setDirty(true);

      apiController.sync(function(response){
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

    $scope.deleteNote = function(note) {

      modelManager.setItemToBeDeleted(note);

      if(note == $scope.selectedNote) {
        $scope.selectedNote = null;
      }

      if(note.dummy) {
        modelManager.removeItemLocally(note);
        return;
      }

      apiController.sync(null);
    }

    /*
    Header Ctrl Callbacks
    */

    $scope.headerLogout = function() {
      apiController.clearLocalStorage();
    }


});
