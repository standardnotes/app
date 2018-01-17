class AccountMenu {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/account-menu.html";
    this.scope = {
      "onSuccessfulAuth" : "&",
      "closeFunction" : "&"
    };
  }

  controller($scope, $rootScope, authManager, modelManager, syncManager, dbManager, passcodeManager, $timeout, storageManager) {
    'ngInject';

    $scope.formData = {mergeLocal: true, url: syncManager.serverURL, ephemeral: false};
    $scope.user = authManager.user;
    $scope.server = syncManager.serverURL;

    $scope.close = function() {
      $scope.closeFunction()();
    }

    $scope.encryptedBackupsAvailable = function() {
      return authManager.user || passcodeManager.hasPasscode();
    }

    $scope.syncStatus = syncManager.syncStatus;
    $scope.newPasswordData = {};

    $scope.showPasswordChangeForm = function() {
      $scope.newPasswordData.showForm = true;
    }

    $scope.submitPasswordChange = function() {

      let newPass = $scope.newPasswordData.newPassword;

      if(!newPass || newPass.length == 0) {
        return;
      }

      if(newPass != $scope.newPasswordData.newPasswordConfirmation) {
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
        authManager.changePassword(email, newPass, function(response){
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

    $scope.submitMfaForm = function() {
      var params = {};
      params[$scope.formData.mfa.payload.mfa_key] = $scope.formData.userMfaCode;
      $scope.login(params);
    }

    $scope.submitAuthForm = function() {
      console.log("Submitting auth form");
      if(!$scope.formData.email || !$scope.formData.user_password) {
        return;
      }
      if($scope.formData.showLogin) {
        $scope.login();
      } else {
        $scope.register();
      }
    }

    $scope.login = function(extraParams) {
      console.log("Logging in");
      $scope.formData.status = "Generating Login Keys...";
      $timeout(function(){
        authManager.login($scope.formData.url, $scope.formData.email, $scope.formData.user_password, $scope.formData.ephemeral, extraParams,
          (response) => {
            if(!response || response.error) {
              $scope.formData.status = null;
              var error = response ? response.error : {message: "An unknown error occured."}
              if(error.tag == "mfa-required" || error.tag == "mfa-invalid") {
                $timeout(() => {
                  $scope.formData.showLogin = false;
                  $scope.formData.mfa = error;
                })
              } else if(!response || (response && !response.didDisplayAlert)) {
                $timeout(() => {
                  $scope.formData.showLogin = true;
                  $scope.formData.mfa = null;
                })
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
        authManager.register($scope.formData.url, $scope.formData.email, $scope.formData.user_password, $scope.formData.ephemeral ,function(response){
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

    $scope.mergeLocalChanged = function() {
      if(!$scope.formData.mergeLocal) {
        if(!confirm("Unchecking this option means any of the notes you have written while you were signed out will be deleted. Are you sure you want to discard these notes?")) {
          $scope.formData.mergeLocal = true;
        }
      }
    }

    $scope.onAuthSuccess = function() {
      var block = function() {
        $timeout(function(){
          $scope.onSuccessfulAuth()();
          syncManager.sync();
        })
      }

      if($scope.formData.mergeLocal) {
        // Allows desktop to make backup file
        $rootScope.$broadcast("major-data-change");
        $scope.clearDatabaseAndRewriteAllItems(true, block);
      }

      else {
        modelManager.resetLocalMemory();
        storageManager.clearAllModels(function(){
          block();
        })
      }
    }

    // Allows indexeddb unencrypted logs to be deleted
    // clearAllModels will remove data from backing store, but not from working memory
    // See: https://github.com/standardnotes/desktop/issues/131
    $scope.clearDatabaseAndRewriteAllItems = function(alternateUuids, callback) {
      storageManager.clearAllModels(function(){
        syncManager.markAllItemsDirtyAndSaveOffline(function(){
          callback && callback();
        }, alternateUuids)
      });
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

    $scope.archiveFormData = {encrypted: $scope.encryptedBackupsAvailable() ? true : false};
    $scope.user = authManager.user;

    $scope.submitImportPassword = function() {
      $scope.performImport($scope.importData.data, $scope.importData.password);
    }

    $scope.performImport = function(data, password) {
      $scope.importData.loading = true;
      // allow loading indicator to come up with timeout
      $timeout(function(){
        $scope.importJSONData(data, password, function(response, errorCount){
          $timeout(function(){
            $scope.importData.loading = false;
            $scope.importData = null;

            // Update UI before showing alert
            setTimeout(function () {
              if(!response) {
                alert("There was an error importing your data. Please try again.");
              } else {
                if(errorCount > 0) {
                  var message = `Import complete. ${errorCount} items were not imported because there was an error decrypting them. Make sure the password is correct and try again.`;
                  alert(message);
                } else {
                  alert("Your data was successfully imported.")
                }
              }
            }, 10);
          })
        })
      })
    }

    $scope.importFileSelected = function(files) {
      $scope.importData = {};

      var file = files[0];
      var reader = new FileReader();
      reader.onload = function(e) {
        try {
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
        } catch (e) {
            alert("Unable to open file. Ensure it is a proper JSON file and try again.");
        }
      }

      reader.readAsText(file);
    }

    $scope.importJSONData = function(data, password, callback) {
      var onDataReady = function(errorCount) {
        var items = modelManager.mapResponseItemsToLocalModels(data.items, ModelManager.MappingSourceFileImport);
        items.forEach(function(item){
          item.setDirty(true);
          item.deleted = false;
          item.markAllReferencesDirty();

          // We don't want to activate any components during import process in case of exceptions
          // breaking up the import proccess
          if(item.content_type == "SN|Component") {
            item.active = false;
          }
        })

        syncManager.sync((response) => {
          callback(response, errorCount);
        }, {additionalFields: ["created_at", "updated_at"]});
      }.bind(this)

      if(data.auth_params) {
        Neeto.crypto.computeEncryptionKeysForUser(_.merge({password: password}, data.auth_params), function(keys){
          try {
            EncryptionHelper.decryptMultipleItems(data.items, keys, false); /* throws = false as we don't want to interrupt all decryption if just one fails */
            // delete items enc_item_key since the user's actually key will do the encrypting once its passed off
            data.items.forEach(function(item){
              item.enc_item_key = null;
              item.auth_hash = null;
            });

            var errorCount = 0;
            // Don't import items that didn't decrypt properly
            data.items = data.items.filter(function(item){
              if(item.errorDecrypting) {
                errorCount++;
                return false;
              }
              return true;
            })

            onDataReady(errorCount);
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
      var keys, authParams, protocolVersion;
      if($scope.archiveFormData.encrypted) {
        if(authManager.offline() && passcodeManager.hasPasscode()) {
          keys = passcodeManager.keys();
          authParams = passcodeManager.passcodeAuthParams();
          protocolVersion = authParams.version;
        } else {
          keys = authManager.keys();
          authParams = authManager.getAuthParams();
          protocolVersion = authManager.protocolVersion();
        }
      }
      var data = $scope.itemsData(keys, authParams, protocolVersion);
      downloadData(data, `SN Archive - ${new Date()}.txt`);

      // download as zipped plain text files
      if(!keys) {
        var notes = modelManager.allItemsMatchingTypes(["Note"]);
        downloadZippedNotes(notes);
      }
    }

    $scope.itemsData = function(keys, authParams, protocolVersion) {
      let data = modelManager.getAllItemsJSONData(keys, authParams, protocolVersion);
      let blobData = new Blob([data], {type: 'text/json'});
      return blobData;
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


    /*
    Encryption Status
    */

    $scope.notesAndTagsCount = function() {
      var items = modelManager.allItemsMatchingTypes(["Note", "Tag"]);
      return items.length;
    }

    $scope.encryptionStatusForNotes = function() {
      var length = $scope.notesAndTagsCount();
      return length + "/" + length + " notes and tags encrypted";
    }

    $scope.encryptionEnabled = function() {
      return passcodeManager.hasPasscode() || !authManager.offline();
    }

    $scope.encryptionSource = function() {
      if(!authManager.offline()) {
        return "Account keys";
      } else if(passcodeManager.hasPasscode()) {
        return "Local Passcode";
      } else {
        return null;
      }
    }

    $scope.encryptionStatusString = function() {
      if(!authManager.offline()) {
        return "End-to-end encryption is enabled. Your data is encrypted before being synced to your private account.";
      } else if(passcodeManager.hasPasscode()) {
        return "Encryption is enabled. Your data is encrypted using your passcode before being stored on disk.";
      } else {
        return "Encryption is not enabled. Sign in, register, or add a passcode lock to enable encryption.";
      }
    }

    /*
    Passcode Lock
    */

    $scope.passcodeOptionAvailable = function() {
      // If you're signed in with an ephemeral session, passcode lock is unavailable
      return authManager.offline() || !authManager.isEphemeralSession();
    }

    $scope.hasPasscode = function() {
      return passcodeManager.hasPasscode();
    }

    $scope.addPasscodeClicked = function() {
      $scope.formData.showPasscodeForm = true;
    }

    $scope.submitPasscodeForm = function() {
      var passcode = $scope.formData.passcode;
      if(passcode !== $scope.formData.confirmPasscode) {
        alert("The two passcodes you entered do not match. Please try again.");
        return;
      }

      passcodeManager.setPasscode(passcode, () => {
        $timeout(function(){
          $scope.formData.showPasscodeForm = false;
          var offline = authManager.offline();

          if(offline) {
            // Allows desktop to make backup file
            $rootScope.$broadcast("major-data-change");
            $scope.clearDatabaseAndRewriteAllItems(false);
          }
        })
      })
    }

    $scope.removePasscodePressed = function() {
      var signedIn = !authManager.offline();
      var message = "Are you sure you want to remove your local passcode?";
      if(!signedIn) {
        message += " This will remove encryption from your local data.";
      }
      if(confirm(message)) {
        passcodeManager.clearPasscode();

        if(authManager.offline()) {
          syncManager.markAllItemsDirtyAndSaveOffline();
          // Don't create backup here, as if the user is temporarily removing the passcode to change it,
          // we don't want to write unencrypted data to disk.
          // $rootScope.$broadcast("major-data-change");
        }
      }
    }

    $scope.isDesktopApplication = function() {
      return isDesktopApplication();
    }

  }
}

angular.module('app.frontend').directive('accountMenu', () => new AccountMenu);
