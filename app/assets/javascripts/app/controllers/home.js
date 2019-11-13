angular.module('app')
.controller('HomeCtrl', function ($scope, $location, $rootScope, $timeout, modelManager,
  dbManager, syncManager, authManager, themeManager, passcodeManager, storageManager, migrationManager,
  privilegesManager, statusManager, alertManager) {

    storageManager.initialize(passcodeManager.hasPasscode(), authManager.isEphemeralSession());

    $scope.platform = getPlatformString();

    $scope.onUpdateAvailable = function() {
      $rootScope.$broadcast('new-update-available');
    }

    $rootScope.$on("panel-resized", (event, info) => {
      if(info.panel == "notes") { this.notesCollapsed = info.collapsed; }
      if(info.panel == "tags") { this.tagsCollapsed = info.collapsed; }

      let appClass = "";
      if(this.notesCollapsed) { appClass += "collapsed-notes"; }
      if(this.tagsCollapsed) { appClass += " collapsed-tags"; }

      $scope.appClass = appClass;
    })

    /* Used to avoid circular dependencies where syncManager cannot be imported but rootScope can */
    $rootScope.sync = function(source) {
      syncManager.sync();
    }

    $rootScope.lockApplication = function() {
      // Reloading wipes current objects from memory
      window.location.reload();
    }

    const initiateSync = () => {
      authManager.loadInitialData();

      this.syncStatusObserver = syncManager.registerSyncStatusObserver((status) => {
        if(status.retrievedCount > 20) {
          var text = `Downloading ${status.retrievedCount} items. Keep app open.`
          this.syncStatus = statusManager.replaceStatusWithString(this.syncStatus, text);
          this.showingDownloadStatus = true;
        } else if(this.showingDownloadStatus) {
          this.showingDownloadStatus = false;
          var text = "Download Complete.";
          this.syncStatus = statusManager.replaceStatusWithString(this.syncStatus, text);
          setTimeout(() => {
            this.syncStatus = statusManager.removeStatus(this.syncStatus);
          }, 2000);
        } else if(status.total > 20) {
          this.uploadSyncStatus = statusManager.replaceStatusWithString(this.uploadSyncStatus, `Syncing ${status.current}/${status.total} items...`)
        } else if(this.uploadSyncStatus) {
          this.uploadSyncStatus = statusManager.removeStatus(this.uploadSyncStatus);
        }
      })

      syncManager.setKeyRequestHandler(async () => {
        let offline = authManager.offline();
        let auth_params = offline ? passcodeManager.passcodeAuthParams() : await authManager.getAuthParams();
        let keys = offline ? passcodeManager.keys() : await authManager.keys();
        return {
          keys: keys,
          offline: offline,
          auth_params: auth_params
        }
      });

      let lastSessionInvalidAlert;

      syncManager.addEventHandler((syncEvent, data) => {
        $rootScope.$broadcast(syncEvent, data || {});
        if(syncEvent == "sync-session-invalid") {
          // On Windows, some users experience issues where this message keeps appearing. It might be that on focus, the app syncs, and this message triggers again.
          // We'll only show it once every X seconds
          let showInterval = 30; // At most 30 seconds in between
          if(!lastSessionInvalidAlert || (new Date() - lastSessionInvalidAlert)/1000 > showInterval) {
            lastSessionInvalidAlert = new Date();
            setTimeout(function () {
              // If this alert is displayed on launch, it may sometimes dismiss automatically really quicky for some reason. So we wrap in timeout
              alertManager.alert({text: "Your session has expired. New changes will not be pulled in. Please sign out and sign back in to refresh your session."});
            }, 500);
          }
        } else if(syncEvent == "sync-exception") {
          alertManager.alert({text: `There was an error while trying to save your items. Please contact support and share this message: ${data}`});
        }
      });

      let encryptionEnabled = authManager.user || passcodeManager.hasPasscode();
      this.syncStatus = statusManager.addStatusFromString(encryptionEnabled ? "Decrypting items..." : "Loading items...");

      let incrementalCallback = (current, total) => {
        let notesString = `${current}/${total} items...`
        this.syncStatus = statusManager.replaceStatusWithString(this.syncStatus, encryptionEnabled ? `Decrypting ${notesString}` : `Loading ${notesString}`);
      }

      syncManager.loadLocalItems({incrementalCallback}).then(() => {
        $timeout(() => {
          $rootScope.$broadcast("initial-data-loaded"); // This needs to be processed first before sync is called so that singletonManager observers function properly.
          // Perform integrity check on first sync
          this.syncStatus = statusManager.replaceStatusWithString(this.syncStatus, "Syncing...");
          syncManager.sync({performIntegrityCheck: true}).then(() => {
            this.syncStatus = statusManager.removeStatus(this.syncStatus);
          })
          // refresh every 30s
          setInterval(function () {
            syncManager.sync();
          }, 30000);
        })
      });

      authManager.addEventHandler((event) => {
        if(event == SFAuthManager.DidSignOutEvent) {
          modelManager.handleSignout();
          syncManager.handleSignout();
        }
      })
    }

    function load() {
      // pass keys to storageManager to decrypt storage
      // Update: Wait, why? passcodeManager already handles this.
      // storageManager.setKeys(passcodeManager.keys());

      openDatabase();
      // Retrieve local data and begin sycing timer
      initiateSync();
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
        tagToRemove.removeItemAsRelationship(note);
      }

      modelManager.setItemsDirty(toRemove, true);

      var tags = [];
      for(var tagString of stringTags) {
        var existingRelationship = _.find(note.tags, {title: tagString});
        if(!existingRelationship) {
          tags.push(modelManager.findOrCreateTagByTitle(tagString));
        }
      }

      for(var tag of tags) {
        tag.addItemAsRelationship(note);
      }

      modelManager.setItemsDirty(tags, true);

      syncManager.sync();
    }

    /*
    Tags Ctrl Callbacks
    */

    $scope.tagsSelectionMade = function(tag) {
      // If a tag is selected twice, then the needed dummy note is removed.
      // So we perform this check.
      if($scope.selectedTag && tag && $scope.selectedTag.uuid == tag.uuid) {
        return;
      }

      if($scope.selectedNote && $scope.selectedNote.dummy) {
        modelManager.removeItemLocally($scope.selectedNote);
        $scope.selectedNote = null;
      }

      $scope.selectedTag = tag;
    }

    $scope.tagsAddNew = function(tag) {
      modelManager.addItem(tag);
    }

    $scope.tagsSave = function(tag, callback) {
      if(!tag.title || tag.title.length == 0) {
        $scope.removeTag(tag);
        return;
      }

      modelManager.setItemDirty(tag, true);
      syncManager.sync().then(callback);
      modelManager.resortTag(tag);
    }

    /*
    Notes Ctrl Callbacks
    */

    $scope.removeTag = function(tag) {
      alertManager.confirm({text: "Are you sure you want to delete this tag? Note: deleting a tag will not delete its notes.", destructive: true, onConfirm: () => {
        modelManager.setItemToBeDeleted(tag);
        syncManager.sync().then(() => {
          // force scope tags to update on sub directives
          $rootScope.safeApply();
        });
      }})
    }

    $scope.notesSelectionMade = function(note) {
      $scope.selectedNote = note;
    }

    $scope.notesAddNew = function(note) {
      modelManager.addItem(note);
      modelManager.setItemDirty(note);

      if(!$scope.selectedTag.isSmartTag()) {
        $scope.selectedTag.addItemAsRelationship(note);
        modelManager.setItemDirty($scope.selectedTag, true);
      }
    }

    /*
    Shared Callbacks
    */

    $rootScope.safeApply = function(fn) {
      var phase = this.$root.$$phase;
      if(phase == '$apply' || phase == '$digest')
        this.$eval(fn);
      else
        this.$apply(fn);
    };

    $rootScope.notifyDelete = function() {
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
        $rootScope.notifyDelete();
        return;
      }

      syncManager.sync().then(() => {
        if(authManager.offline()) {
          // when deleting items while ofline, we need to explictly tell angular to refresh UI
          setTimeout(function () {
            $rootScope.notifyDelete();
            $rootScope.safeApply();
          }, 50);
        } else {
          $timeout(() => {
            $rootScope.notifyDelete();
          });
        }
      });
    }

    /*
      Disable dragging and dropping of files into main SN interface.
      both 'dragover' and 'drop' are required to prevent dropping of files.
      This will not prevent extensions from receiving drop events.
    */
    window.addEventListener('dragover', (event) => {
      event.preventDefault();
    }, false)

    window.addEventListener('drop', (event) => {
      event.preventDefault();
      alertManager.alert({text: "Please use FileSafe or the Bold Editor to attach images and files. Learn more at standardnotes.org/filesafe."})
    }, false)


    /*
      Handle Auto Sign In From URL
    */

    function urlParam(key) {
      return $location.search()[key];
    }

    async function autoSignInFromParams() {
      var server = urlParam("server");
      var email = urlParam("email");
      var pw = urlParam("pw");

      if(!authManager.offline()) {
        // check if current account
        if(await syncManager.getServerURL() === server && authManager.user.email === email) {
          // already signed in, return
          return;
        } else {
          // sign out
          authManager.signout(true).then(() => {
            window.location.reload();
          });
        }
      } else {
        authManager.login(server, email, pw, false, false, {}).then((response) => {
          window.location.reload();
        })
      }
    }

    if(urlParam("server")) {
      autoSignInFromParams();
    }
});
