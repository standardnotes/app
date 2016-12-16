angular.module('app.frontend')
.controller('HomeCtrl', function ($scope, $rootScope, $timeout, apiController, modelManager) {
    $rootScope.bodyClass = "app-body-class";
    $rootScope.title = "Notes — Neeto, a secure code box for developers";
    $rootScope.description = "A secure code box for developers to store common commands and useful notes.";

    var onUserSet = function() {
      apiController.setUser($scope.defaultUser);
      $scope.allTag = new Tag({all: true});
      $scope.allTag.content.name = "All";
      $scope.tags = modelManager.tags;

      // apiController.verifyEncryptionStatusOfAllItems($scope.defaultUser, function(success){});
    }

    apiController.getCurrentUser(function(response){
      if(response && !response.errors) {
        console.log("Get user response", response);
        $scope.defaultUser = new User(response);
        modelManager.items = _.map(response.items, function(json_obj){
          if(json_obj.content_type == "Note") {
            return new Note(json_obj);
          } else if(json_obj.content_type == "Tag") {
            return new Tag(json_obj);
          } else {
            return new Item(json_obj);
          }
        });
        $rootScope.title = "Notes — Neeto";
        onUserSet();
      } else {
        $scope.defaultUser = new User(apiController.localUser());
        onUserSet();
      }
    });

    /*
    Tags Ctrl Callbacks
    */

    $scope.updateAllTag = function() {
      $scope.allTag.notes = modelManager.filteredNotes;
    }

    $scope.tagsWillMakeSelection = function(tag) {
      if(tag.all) {
        $scope.updateAllTag();
      }
    }

    $scope.tagsSelectionMade = function(tag) {
      $scope.selectedTag = tag;
    }

    $scope.tagsAddNew = function(tag) {
      modelManager.addTag(tag);
    }

    $scope.tagsSave = function(tag, callback) {
      apiController.saveItems([tag], callback);
    }

    /*
    Called to update the tag of a note after drag and drop change
    The note object is a copy of the original
    */
    $scope.tagsUpdateNoteTag = function(noteCopy, newTag, oldTag) {

      var originalNote = _.find(modelManager.notes, {uuid: noteCopy.uuid});
      if(!newTag.all) {
        modelManager.addTagToNote(newTag, originalNote);
      }

      apiController.saveDirtyItems(function(){});
    }

    /*
    Notes Ctrl Callbacks
    */

    $scope.notesRemoveTag = function(tag) {
      var validNotes = Note.filterDummyNotes(tag.notes);
      if(validNotes == 0) {
        // if no more notes, delete tag
        apiController.deleteItem($scope.defaultUser, tag, function(){
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
      modelManager.addNote(note);

      if(!$scope.selectedTag.all) {
        modelManager.addTagToNote($scope.selectedTag, note);
        $scope.updateAllTag();
      } else {
        $scope.selectedTag.notes.unshift(note);
      }

    }

    /*
    Shared Callbacks
    */

    $scope.saveNote = function(note, callback) {
      modelManager.addDirtyItems(note);

      apiController.saveDirtyItems(function(){
        modelManager.addNote(note);
        note.hasChanges = false;

        if(callback) {
          callback(true);
        }
      })
    }

    $scope.deleteNote = function(note) {

      modelManager.deleteNote(note);

      if(note == $scope.selectedNote) {
        $scope.selectedNote = null;
      }

      $scope.updateAllTag();

      if(note.dummy) {
        return;
      }

      apiController.deleteItem(note, function(success){})
      apiController.saveDirtyItems(function(){});
    }

    /*
    Header Ctrl Callbacks
    */

    $scope.headerLogout = function() {
      $scope.defaultUser = apiController.localUser();
      $scope.tags = $scope.defaultUser.tags;
    }


});
