angular.module('app.frontend')
.controller('HomeCtrl', function ($scope, $rootScope, $timeout, apiController, modelManager) {
    $rootScope.bodyClass = "app-body-class";
    $rootScope.title = "Notes — Neeto, a secure code box for developers";
    $rootScope.description = "A secure code box for developers to store common commands and useful notes.";

    var onUserSet = function() {

      $scope.allGroup = new Group({name: "All", all: true});
      $scope.groups = modelManager.groups;

      apiController.verifyEncryptionStatusOfAllItems($scope.defaultUser, function(success){

      });
    }

    apiController.getCurrentUser(function(response){
      if(response && !response.errors) {
        $scope.defaultUser = new User(response);
        modelManager.items = response.items;
        $rootScope.title = "Notes — Neeto";
        onUserSet();
      } else {
        $scope.defaultUser = new User(apiController.localUser());
        onUserSet();
      }
    });

    /*
    Groups Ctrl Callbacks
    */

    $scope.updateAllGroup = function() {
      $scope.allGroup.notes = modelManager.filteredNotes;
    }

    $scope.groupsWillMakeSelection = function(group) {
      if(group.all) {
        $scope.updateAllGroup();
      }
    }

    $scope.groupsSelectionMade = function(group) {
      if(!group.notes) {
        group.notes = [];
      }
      $scope.selectedGroup = group;
    }

    $scope.groupsAddNew = function(group) {
      modelManager.addTag(group);
    }

    $scope.groupsSave = function(group, callback) {
      apiController.saveItems([group], callback);
    }

    /*
    Called to update the group of a note after drag and drop change
    The note object is a copy of the original
    */
    $scope.groupsUpdateNoteGroup = function(noteCopy, newGroup, oldGroup) {

      var originalNote = _.find($scope.defaultUser.notes, {uuid: noteCopy.uuid});
      modelManager.removeTagFromNote(oldGroup, originalNote);
      if(!newGroup.all) {
        modelManager.addTagToNote(newGroup, originalNote);
      }

      apiController.saveDirtyItems(function(){});
    }

    /*
    Notes Ctrl Callbacks
    */

    $scope.notesRemoveGroup = function(group) {
      var validNotes = Note.filterDummyNotes(group.notes);
      if(validNotes == 0) {
        // if no more notes, delete group
        apiController.deleteItem($scope.defaultUser, group, function(){
          // force scope groups to update on sub directives
          $scope.groups = [];
          $timeout(function(){
            $scope.groups = modelManager.groups;
          })
        });
      } else {
        alert("To delete this group, remove all its notes first.");
      }
    }

    $scope.notesSelectionMade = function(note) {
      $scope.selectedNote = note;
    }

    $scope.notesAddNew = function(note) {
      if(!$scope.defaultUser.id) {
        // generate local id for note
        note.id = Neeto.crypto.generateRandomKey();
      }

      modelManager.addNote(note);

      if(!$scope.selectedGroup.all) {
        modelManager.addTagToNote($scope.selectedGroup, note);
      }
    }

    /*
    Shared Callbacks
    */

    $scope.saveNote = function(note, callback) {
      apiController.saveItems([note], function(){
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

      if(note.dummy) {
        return;
      }

      apiController.deleteItem($scope.defaultUser, note, function(success){})
      apiController.saveDirtyItems(function(){});
    }

    /*
    Header Ctrl Callbacks
    */

    $scope.headerLogout = function() {
      $scope.defaultUser = apiController.localUser();
      $scope.groups = $scope.defaultUser.groups;
    }


});
