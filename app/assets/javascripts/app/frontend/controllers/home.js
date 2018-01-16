angular.module('app.frontend')
.controller('HomeCtrl', function ($scope, $location, $rootScope, $timeout, modelManager,
  dbManager, syncManager, authManager, themeManager, passcodeManager, storageManager, migrationManager) {

    storageManager.initialize(passcodeManager.hasPasscode(), authManager.isEphemeralSession());

    $scope.onUpdateAvailable = function(version) {
      $rootScope.$broadcast('new-update-available', version);
    }

    /* Used to avoid circular dependencies where syncManager cannot be imported but rootScope can */
    $rootScope.sync = function() {
      syncManager.sync();
    }

    $rootScope.lockApplication = function() {
      // Reloading wipes current objects from memory
      window.location.reload();
    }

    function load() {
      // pass keys to storageManager to decrypt storage
      storageManager.setKeys(passcodeManager.keys());

      openDatabase();
      // Retrieve local data and begin sycing timer
      initiateSync();
      // Configure "All" psuedo-tag
      loadAllTag();
      // Configure "Archived" psuedo-tag
      loadArchivedTag();
    }

    if(passcodeManager.isLocked()) {
      $scope.needsUnlock = true;
    } else {
      load();
    }

    $scope.onSuccessfulUnlock = function() {
      $timeout(() => {
        $scope.needsUnlock = false;
        load();
      })
    }

    function openDatabase() {
      dbManager.setLocked(false);
      dbManager.openDatabase(null, function() {
        // new database, delete syncToken so that items can be refetched entirely from server
        syncManager.clearSyncToken();
        syncManager.sync();
      })
    }

    function initiateSync() {
      authManager.loadInitialData();
      syncManager.loadLocalItems(function(items) {
        $scope.allTag.didLoad = true;
        themeManager.activateInitialTheme();
        $scope.$apply();

        $rootScope.$broadcast("initial-data-loaded");

        syncManager.sync(null);
        // refresh every 30s
        // setInterval(function () {
        //   syncManager.sync(null);
        // }, 30000);
      });
    }

    function loadAllTag() {
      var allTag = new Tag({all: true, title: "All"});
      allTag.needsLoad = true;
      $scope.allTag = allTag;
      $scope.tags = modelManager.tags;
      $scope.allTag.notes = modelManager.notes;
    }

    function loadArchivedTag() {
      var archiveTag = new Tag({archiveTag: true, title: "Archived"});
      $scope.archiveTag = archiveTag;
      $scope.archiveTag.notes = modelManager.notes;
    }

    /*
    Editor Callbacks
    */

    $scope.updateTagsForNote = function(note, stringTags) {
      var toRemove = [];
      for(var tag of note.tags) {
        if(stringTags.indexOf(tag.title) === -1) {
          // remove this tag
          toRemove.push(tag);
        }
      }

      for(var tagToRemove of toRemove) {
        note.removeItemAsRelationship(tagToRemove);
        tagToRemove.removeItemAsRelationship(note);
        tagToRemove.setDirty(true);
      }

      var tags = [];
      for(var tagString of stringTags) {
        var existingRelationship = _.find(note.tags, {title: tagString});
        if(!existingRelationship) {
          tags.push(modelManager.findOrCreateTagByTitle(tagString));
        }
      }

      for(var tag of tags) {
        modelManager.createRelationshipBetweenItems(note, tag);
      }

      note.setDirty(true);
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
      if(!tag.title || tag.title.length == 0) {
        $scope.removeTag(tag);
        return;
      }
      tag.setDirty(true);
      syncManager.sync(callback);
      $rootScope.$broadcast("tag-changed");
      modelManager.resortTag(tag);
    }

    /*
    Notes Ctrl Callbacks
    */

    $scope.removeTag = function(tag) {
      if(confirm("Are you sure you want to delete this tag? Note: deleting a tag will not delete its notes.")) {
        modelManager.setItemToBeDeleted(tag);
        // if no more notes, delete tag
        syncManager.sync(function(){
          // force scope tags to update on sub directives
          $scope.safeApply();
        });
      }
    }

    $scope.notesSelectionMade = function(note) {
      $scope.selectedNote = note;
    }

    $scope.notesAddNew = function(note) {
      modelManager.addItem(note);

      if(!$scope.selectedTag.all && !$scope.selectedTag.archiveTag) {
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
          if(callback) {
            callback(false);
          }
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

    $scope.notifyDelete = function() {
      $timeout(function() {
        $rootScope.$broadcast("noteDeleted");
      }.bind(this), 0);
    }

    $scope.deleteNote = function(note) {

      modelManager.setItemToBeDeleted(note);

      if(note == $scope.selectedNote) {
        $scope.selectedNote = null;
      }

      if(note.dummy) {
        modelManager.removeItemLocally(note);
        $scope.notifyDelete();
        return;
      }

      syncManager.sync(function(){
        if(authManager.offline()) {
          // when deleting items while ofline, we need to explictly tell angular to refresh UI
          setTimeout(function () {
            $scope.notifyDelete();
            $scope.safeApply();
          }, 50);
        } else {
          $scope.notifyDelete();
        }
      });
    }



    // Handle Auto Sign In From URL

    function urlParam(key) {
      return $location.search()[key];
    }

    function autoSignInFromParams() {
      var server = urlParam("server");
      var email = urlParam("email");
      var pw = urlParam("pw");

      if(!authManager.offline()) {
        // check if current account
        if(syncManager.serverURL === server && authManager.user.email === email) {
          // already signed in, return
          return;
        } else {
          // sign out
          syncManager.destroyLocalData(function(){
            window.location.reload();
          })
        }
      } else {
        authManager.login(server, email, pw, false, function(response){
          window.location.reload();
        })
      }
    }

    if(urlParam("server")) {
      autoSignInFromParams();
    }
});
