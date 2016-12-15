angular.module('app.frontend')
.controller('HomeCtrl', function ($scope, $rootScope, Restangular, $timeout, $state, $sce, $auth, apiController) {
    $rootScope.bodyClass = "app-body-class";
    $rootScope.title = "Notes — Neeto, a secure code box for developers";
    $rootScope.description = "A secure code box for developers to store common commands and useful notes.";

    var onUserSet = function() {

      $scope.allGroup = new Group({name: "All", all: true});
      $scope.groups = $scope.defaultUser.groups;

      apiController.verifyEncryptionStatusOfAllItems($scope.defaultUser, function(success){

      });
    }

    apiController.getCurrentUser(function(response){
      if(response && !response.errors) {
        $scope.defaultUser = new User(response.plain());
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
      var allNotes = Note.filterDummyNotes($scope.defaultUser.notes);
      $scope.defaultUser.notes = allNotes;
      $scope.allGroup.notes = allNotes;
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
      $scope.defaultUser.groups.unshift(group);
    }

    $scope.groupsSave = function(group, callback) {
      apiController.saveItem($scope.defaultUser, group, callback);
    }

    /*
    Called to update the group of a note after drag and drop change
    The note object is a copy of the original
    */
    $scope.groupsUpdateNoteGroup = function(noteCopy, newGroup, oldGroup) {

      var originalNote = _.find($scope.defaultUser.notes, {id: noteCopy.id});

      $scope.defaultUser.itemManager.removeReferencesBetweenItems(oldGroup, originalNote);

      if(!newGroup.all) {
        $scope.defaultUser.itemManager.createReferencesBetweenItems(newGroup, originalNote);
        newGroup.updateReferencesLocalMapping();
      }

      apiController.saveBatchItems($scope.defaultUser, [originalNote, newGroup, oldGroup], function(){

      });
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
            $scope.groups = $scope.defaultUser.groups;
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

      $scope.defaultUser.notes.unshift(note);

      if(!$scope.selectedGroup.all) {
        $scope.selectedGroup.notes.unshift(note);
        note.group_id = $scope.selectedGroup.id;

      }
    }

    /*
    Shared Callbacks
    */

    $scope.saveNote = function(note, callback) {
      apiController.saveNote($scope.defaultUser, note, function(){
        // add to All notes if it doesnt exist
        if(!_.find($scope.defaultUser.notes, {id: note.id})) {
          $scope.defaultUser.notes.unshift(note);
        }
        note.hasChanges = false;

        if(callback) {
          callback(true);
        }
      })
    }

    $scope.deleteNote = function(note) {
      _.remove($scope.defaultUser.notes, note);
      if($scope.selectedGroup.all && note.group_id) {
        var originalGroup = _.find($scope.groups, {id: note.group_id});
        if(originalGroup) {
          _.remove(originalGroup.notes, note);
        }
      } else {
        _.remove($scope.selectedGroup.notes, note);
      }

      if(note == $scope.selectedNote) {
        $scope.selectedNote = null;
      }

      if(note.dummy) {
        return;
      }

      apiController.deleteNote($scope.defaultUser, note, function(success){
      })
    }

    /*
    Header Ctrl Callbacks
    */

    $scope.headerLogout = function() {
      $scope.defaultUser = apiController.localUser();
      $scope.groups = $scope.defaultUser.groups;
    }


});
