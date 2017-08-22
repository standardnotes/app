class AccountMenu {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/account-menu.html";
    this.scope = {};
  }

  controller($scope, authManager, modelManager, syncManager, dbManager, analyticsManager, $timeout) {
    'ngInject';

    $scope.formData = {mergeLocal: true, url: syncManager.serverURL};
    $scope.user = authManager.user;
    $scope.server = syncManager.serverURL;

    $scope.syncStatus = syncManager.syncStatus;
    $scope.analyticsManager = analyticsManager;

    $scope.encryptionKey = function() {
      return authManager.keys().mk;
    }

    $scope.authKey = function() {
      return authManager.keys().ak;
    }

    $scope.serverPassword = function() {
      return syncManager.serverPassword;
    }

    $scope.dashboardURL = function() {
      return `${$scope.server}/dashboard/?server=${$scope.server}&id=${encodeURIComponent($scope.user.email)}&pw=${$scope.serverPassword()}`;
    }

    $scope.newPasswordData = {};

    $scope.showPasswordChangeForm = function() {
      $scope.newPasswordData.showForm = true;
    }

    $scope.submitPasswordChange = function() {

      if($scope.newPasswordData.newPassword != $scope.newPasswordData.newPasswordConfirmation) {
        alert("Your new password does not match its confirmation.");
        $scope.newPasswordData.status = null;
        return;
      }

      var email = $scope.user.email;
      if(!email) {
        alert("We don't have your email stored. Please log out then log back in to fix this issue.");
        $scope.newPasswordData.status = null;
        return;
      }

      $scope.newPasswordData.status = "Generating New Keys...";
      $scope.newPasswordData.showForm = false;

      // perform a sync beforehand to pull in any last minutes changes before we change the encryption key (and thus cant decrypt new changes)
      syncManager.sync(function(response){
        authManager.changePassword(email, $scope.newPasswordData.newPassword, function(response){
          if(response.error) {
            alert("There was an error changing your password. Please try again.");
            $scope.newPasswordData.status = null;
            return;
          }

          // re-encrypt all items
          $scope.newPasswordData.status = "Re-encrypting all items with your new key...";

          modelManager.setAllItemsDirty();
          syncManager.sync(function(response){
            if(response.error) {
              alert("There was an error re-encrypting your items. Your password was changed, but not all your items were properly re-encrypted and synced. You should try syncing again. If all else fails, you should restore your notes from backup.")
              return;
            }
            $scope.newPasswordData.status = "Successfully changed password and re-encrypted all items.";
            $timeout(function(){
              alert("Your password has been changed, and your items successfully re-encrypted and synced. You must sign out of all other signed in applications and sign in again, or else you may corrupt your data.")
              $scope.newPasswordData = {};
            }, 1000)
          });
        })
      })
    }

    $scope.submitAuthForm = function() {
      if($scope.formData.showLogin) {
        $scope.login();
      } else {
        $scope.register();
      }
    }

    $scope.login = function() {
      $scope.formData.status = "Generating Login Keys...";
      $timeout(function(){
        authManager.login($scope.formData.url, $scope.formData.email, $scope.formData.user_password, function(response){
          if(!response || response.error) {
            $scope.formData.status = null;
            var error = response ? response.error : {message: "An unknown error occured."}
            if(!response || (response && !response.didDisplayAlert)) {
              alert(error.message);
            }
          } else {
            $scope.onAuthSuccess();
          }
        });
      })
    }

    $scope.register = function() {
      let confirmation = $scope.formData.password_conf;
      if(confirmation !== $scope.formData.user_password) {
        alert("The two passwords you entered do not match. Please try again.");
        return;
      }

      $scope.formData.confirmPassword = false;
      $scope.formData.status = "Generating Account Keys...";

      $timeout(function(){
        authManager.register($scope.formData.url, $scope.formData.email, $scope.formData.user_password, function(response){
          if(!response || response.error) {
            $scope.formData.status = null;
            var error = response ? response.error : {message: "An unknown error occured."}
            alert(error.message);
          } else {
            $scope.onAuthSuccess();
          }
        });
      })
    }

    $scope.localNotesCount = function() {
      return modelManager.filteredNotes.length;
    }

    $scope.mergeLocalChanged = function() {
      if(!$scope.formData.mergeLocal) {
        if(!confirm("Unchecking this option means any of the notes you have written while you were signed out will be deleted. Are you sure you want to discard these notes?")) {
          $scope.formData.mergeLocal = true;
        }
      }
    }

    $scope.onAuthSuccess = function() {
      var block = function() {
        window.location.reload();
      }

      if($scope.formData.mergeLocal) {
        syncManager.markAllItemsDirtyAndSaveOffline(function(){
          block();
        })
      } else {
        dbManager.clearAllItems(function(){
          $timeout(function(){
            block();
          })
        })
      }
    }

    $scope.destroyLocalData = function() {
      if(!confirm("Are you sure you want to end your session? This will delete all local items and extensions.")) {
        return;
      }

      authManager.signOut();
      syncManager.destroyLocalData(function(){
        window.location.reload();
      })
    }

    /* Import/Export */

    $scope.archiveFormData = {encrypted: $scope.user ? true : false};
    $scope.user = authManager.user;

    $scope.submitImportPassword = function() {
      $scope.performImport($scope.importData.data, $scope.importData.password);
    }

    $scope.performImport = function(data, password) {
      $scope.importData.loading = true;
      // allow loading indicator to come up with timeout
      $timeout(function(){
        $scope.importJSONData(data, password, function(response){
          $timeout(function(){
            $scope.importData.loading = false;
            $scope.importData = null;
            if(!response) {
              alert("There was an error importing your data. Please try again.");
            } else {
              alert("Your data was successfully imported.")
            }
          })
        })
      })
    }

    $scope.importFileSelected = function(files) {
      $scope.importData = {};

      var file = files[0];
      var reader = new FileReader();
      reader.onload = function(e) {
        var data = JSON.parse(e.target.result);
        $timeout(function(){
          if(data.auth_params) {
            // request password
            $scope.importData.requestPassword = true;
            $scope.importData.data = data;
          } else {
            $scope.performImport(data, null);
          }
        })
      }

      reader.readAsText(file);
    }

    $scope.encryptionStatusForNotes = function() {
      var items = modelManager.allItemsMatchingTypes(["Note", "Tag"]);
      return items.length + "/" + items.length + " notes and tags encrypted";
    }

    $scope.importJSONData = function(data, password, callback) {
      var onDataReady = function() {
        var items = modelManager.mapResponseItemsToLocalModels(data.items);
        items.forEach(function(item){
          item.setDirty(true);
          item.deleted = false;
          item.markAllReferencesDirty();
        })

        syncManager.sync(callback, {additionalFields: ["created_at", "updated_at"]});
      }.bind(this)

      if(data.auth_params) {
        Neeto.crypto.computeEncryptionKeysForUser(_.merge({password: password}, data.auth_params), function(keys){
          try {
            EncryptionHelper.decryptMultipleItems(data.items, keys, false); /* throws = false as we don't want to interrupt all decryption if just one fails */
            // delete items enc_item_key since the user's actually key will do the encrypting once its passed off
            data.items.forEach(function(item){
              item.enc_item_key = null;
              item.auth_hash = null;
            })
            onDataReady();
          }
          catch (e) {
            console.log("Error decrypting", e);
            alert("There was an error decrypting your items. Make sure the password you entered is correct and try again.");
            callback(null);
            return;
          }
        }.bind(this));
      } else {
        onDataReady();
      }
    }

    /*
    Export
    */

    function loadZip(callback) {
      if(window.zip) {
        callback();
        return;
      }

      var scriptTag = document.createElement('script');
      scriptTag.src = "/assets/zip/zip.js";
      scriptTag.async = false;
      var headTag = document.getElementsByTagName('head')[0];
      headTag.appendChild(scriptTag);
      scriptTag.onload = function() {
        zip.workerScriptsPath = "assets/zip/";
        callback();
      }
    }

    function downloadZippedNotes(notes) {
      loadZip(function(){

        zip.createWriter(new zip.BlobWriter("application/zip"), function(zipWriter) {

          var index = 0;
          function nextFile() {
            var note = notes[index];
            var blob = new Blob([note.text], {type: 'text/plain'});
            zipWriter.add(`${note.title}-${note.uuid}.txt`, new zip.BlobReader(blob), function() {
              index++;
              if(index < notes.length) {
                nextFile();
              } else {
                zipWriter.close(function(blob) {
                  downloadData(blob, `Notes Txt Archive - ${new Date()}.zip`)
        					zipWriter = null;
        				});
              }
            });
          }

          nextFile();
        }, onerror);
      })
    }

    var textFile = null;

    function hrefForData(data) {
      // If we are replacing a previously generated file we need to
      // manually revoke the object URL to avoid memory leaks.
      if (textFile !== null) {
        window.URL.revokeObjectURL(textFile);
      }

      textFile = window.URL.createObjectURL(data);

      // returns a URL you can use as a href
      return textFile;
    }

    function downloadData(data, fileName) {
      var link = document.createElement('a');
      link.setAttribute('download', fileName);
      link.href = hrefForData(data);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }

    $scope.downloadDataArchive = function() {
      // download in Standard File format
      var keys = $scope.archiveFormData.encrypted ? authManager.keys() : null;
      var data = $scope.itemsData(keys);
      downloadData(data, `SN Archive - ${new Date()}.txt`);

      // download as zipped plain text files
      if(!keys) {
        var notes = modelManager.allItemsMatchingTypes(["Note"]);
        downloadZippedNotes(notes);
      }
    }

    $scope.itemsData = function(keys) {
      var items = _.map(modelManager.allItems, function(item){
        var itemParams = new ItemParams(item, keys, authManager.protocolVersion());
        return itemParams.paramsForExportFile();
      }.bind(this));

      var data = {items: items}

      if(keys) {
        // auth params are only needed when encrypted with a standard file key
        data["auth_params"] = authManager.getAuthParams();
      }

      var data = new Blob([JSON.stringify(data, null, 2 /* pretty print */)], {type: 'text/json'});
      return data;
    }



    // Advanced

    $scope.reencryptPressed = function() {
      if(!confirm("Are you sure you want to re-encrypt and sync all your items? This is useful when updates are made to our encryption specification. You should have been instructed to come here from our website.")) {
        return;
      }

      if(!confirm("It is highly recommended that you download a backup of your data before proceeding. Press cancel to go back. Note that this procedure can take some time, depending on the number of items you have. Do not close the app during process.")) {
        return;
      }

      modelManager.setAllItemsDirty();
      syncManager.sync(function(response){
        if(response.error) {
          alert("There was an error re-encrypting your items. You should try syncing again. If all else fails, you should restore your notes from backup.")
          return;
        }

        $timeout(function(){
          alert("Your items have been successfully re-encrypted and synced. You must sign out of all other signed in applications (mobile, desktop, web) and sign in again, or else you may corrupt your data.")
          $scope.newPasswordData = {};
        }, 1000)
      });

    }



    // 002 Update

    $scope.securityUpdateAvailable = function() {
      var keys = authManager.keys()
      return keys && !keys.ak;
    }

    $scope.clickedSecurityUpdate = function() {
      if(!$scope.securityUpdateData) {
        $scope.securityUpdateData = {};
      }
      $scope.securityUpdateData.showForm = true;
    }

    $scope.submitSecurityUpdateForm = function() {
      $scope.securityUpdateData.processing = true;
      var authParams = authManager.getAuthParams();

      Neeto.crypto.computeEncryptionKeysForUser(_.merge({password: $scope.securityUpdateData.password}, authParams), function(keys){
        if(keys.mk !== authManager.keys().mk) {
          alert("Invalid password. Please try again.");
          $timeout(function(){
            $scope.securityUpdateData.processing = false;
          })
          return;
        }

        authManager.saveKeys(keys);
      });
    }

  }
}

angular.module('app.frontend').directive('accountMenu', () => new AccountMenu);
