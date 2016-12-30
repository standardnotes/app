angular.module('app.frontend')
.controller('HomeCtrl', function ($scope, $rootScope, $timeout, apiController, modelManager) {
    $rootScope.bodyClass = "app-body-class";

    var onUserSet = function() {
      apiController.setUser($scope.defaultUser);
      $scope.allTag = new Tag({all: true});
      $scope.allTag.content.title = "All";
      $scope.tags = modelManager.tags;
      $scope.allTag.notes = modelManager.notes;

      // setInterval(function () {
      //   apiController.refreshItems(null);
      // }, 1000);

      // apiController.verifyEncryptionStatusOfAllItems($scope.defaultUser, function(success){});
    }

    apiController.getCurrentUser(function(user){
      if(user) {
        // console.log("Get user response", user);
        $scope.defaultUser = user;
        $rootScope.title = "Notes — Standard Notes";
        onUserSet();
      } else {
        $scope.defaultUser = new User(apiController.loadLocalItemsAndUser());
        onUserSet();
      }
    });

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
        modelManager.deleteTag(tag);
        // if no more notes, delete tag
        apiController.deleteItem(tag, function(){
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
      }
    }

    /*
    Shared Callbacks
    */

    $scope.saveNote = function(note, callback) {
      modelManager.addDirtyItems(note);

      apiController.saveDirtyItems(function(){
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
      $scope.defaultUser = apiController.loadLocalItemsAndUser();
      $scope.tags = $scope.defaultUser.tags;
    }


});
