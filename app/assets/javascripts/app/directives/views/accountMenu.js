class AccountMenu {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "directives/account-menu.html";
    this.scope = {
      "onSuccessfulAuth" : "&",
      "closeFunction" : "&"
    };
  }

  controller($scope, $rootScope, authManager, modelManager, syncManager, storageManager, dbManager, passcodeManager,
    $timeout, $compile, archiveManager, privilegesManager) {
    'ngInject';

    $scope.formData = {mergeLocal: true, ephemeral: false};
    $scope.user = authManager.user;

    syncManager.getServerURL().then((url) => {
      $timeout(() => {
        $scope.server = url;
        $scope.formData.url = url;
      })
    })

    authManager.checkForSecurityUpdate().then((available) => {
        $scope.securityUpdateAvailable = available;
    })

    $scope.close = function() {
      $timeout(() => {
        $scope.closeFunction()();
      })
    }

    $scope.encryptedBackupsAvailable = function() {
      return authManager.user || passcodeManager.hasPasscode();
    }

    $scope.canAddPasscode = !authManager.isEphemeralSession();
    $scope.syncStatus = syncManager.syncStatus;

    $scope.submitMfaForm = function() {
      var params = {};
      params[$scope.formData.mfa.payload.mfa_key] = $scope.formData.userMfaCode;
      $scope.login(params);
    }

    $scope.submitAuthForm = function() {
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
      // Prevent a timed sync from occuring while signing in. There may be a race condition where when
      // calling `markAllItemsDirtyAndSaveOffline` during sign in, if an authenticated sync happens to occur
      // right before that's called, items retreived from that sync will be marked as dirty, then resynced, causing mass duplication.
      // Unlock sync after all sign in processes are complete.
      syncManager.lockSyncing();

      $scope.formData.status = "Generating Login Keys...";
      $scope.formData.authenticating = true;
      $timeout(function(){
        authManager.login($scope.formData.url, $scope.formData.email, $scope.formData.user_password,
          $scope.formData.ephemeral, $scope.formData.strictSignin, extraParams).then((response) => {
            $timeout(() => {
              if(!response || response.error) {

                syncManager.unlockSyncing();

                $scope.formData.status = null;
                var error = response ? response.error : {message: "An unknown error occured."}

                // MFA Error
                if(error.tag == "mfa-required" || error.tag == "mfa-invalid") {
                  $scope.formData.showLogin = false;
                  $scope.formData.mfa = error;
                }
                // General Error
                else {
                  $scope.formData.showLogin = true;
                  $scope.formData.mfa = null;
                  if(error.message) { alert(error.message); }
                }

                $scope.formData.authenticating = false;
              }
              // Success
              else {
                $scope.onAuthSuccess(() => {
                  syncManager.unlockSyncing();
                  syncManager.sync();
                });
              }
            })
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
      $scope.formData.authenticating = true;

      $timeout(function(){
        authManager.register($scope.formData.url, $scope.formData.email, $scope.formData.user_password, $scope.formData.ephemeral).then((response) => {
          $timeout(() => {
            if(!response || response.error) {
              $scope.formData.status = null;
              var error = response ? response.error : {message: "An unknown error occured."}
              $scope.formData.authenticating = false;
              alert(error.message);
            } else {
              $scope.onAuthSuccess(() => {
                syncManager.sync();
              });
            }
          })
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

    $scope.onAuthSuccess = function(callback) {
      var block = function() {
        $timeout(function(){
          $scope.formData.authenticating = false;
          $scope.onSuccessfulAuth()();
          syncManager.refreshErroredItems();
          callback && callback();
        })
      }

      if($scope.formData.mergeLocal) {
        // Allows desktop to make backup file
        $rootScope.$broadcast("major-data-change");
        $scope.clearDatabaseAndRewriteAllItems(true, block);
      }
      else {
        modelManager.removeAllItemsFromMemory();
        storageManager.clearAllModels().then(() => {
          block();
        })
      }
    }

    $scope.openPasswordWizard = function(type) {
      // Close the account menu
      $scope.close();
      authManager.presentPasswordWizard(type);
    }

    $scope.openPrivilegesModal = async function() {
      let run = () => {
        $timeout(() => {
          privilegesManager.presentPrivilegesManagementModal();
        })
      }

      if(await privilegesManager.actionRequiresPrivilege(PrivilegesManager.ActionManagePrivileges)) {
        privilegesManager.presentPrivilegesModal(PrivilegesManager.ActionManagePrivileges, () => {
          run();
        });
      } else {
        run();
      }
    }

    // Allows indexeddb unencrypted logs to be deleted
    // clearAllModels will remove data from backing store, but not from working memory
    // See: https://github.com/standardnotes/desktop/issues/131
    $scope.clearDatabaseAndRewriteAllItems = function(alternateUuids, callback) {
      storageManager.clearAllModels().then(() => {
        syncManager.markAllItemsDirtyAndSaveOffline(alternateUuids).then(() => {
          callback && callback();
        })
      });
    }

    $scope.destroyLocalData = function() {
      if(!confirm("Are you sure you want to end your session? This will delete all local items and extensions.")) {
        return;
      }

      authManager.signout(true).then(() => {
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
              // Response can be null if syncing offline
              if(response && response.error) {
                alert("There was an error importing your data. Please try again.");
              } else {
                if(errorCount > 0) {
                  var message = `Import complete. ${errorCount} items were not imported because there was an error decrypting them. Make sure the password is correct and try again.`;
                  alert(message);
                } else {
                  alert("Your data has been successfully imported.")
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

              $timeout(() => {
                var element = document.getElementById("import-password-request");
                if(element) {
                  element.scrollIntoView(false);
                }
              })
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
      var onDataReady = (errorCount) => {
        var items = modelManager.importItems(data.items);
        for(var item of items) {
          // We don't want to activate any components during import process in case of exceptions
          // breaking up the import proccess
          if(item.content_type == "SN|Component") { item.active = false; }
        }

        syncManager.sync({additionalFields: ["created_at", "updated_at"]}).then((response) => {
          // Response can be null if syncing offline
          callback(response, errorCount);
        });
      }

      if(data.auth_params) {
        SFJS.crypto.computeEncryptionKeysForUser(password, data.auth_params).then((keys) => {
          try {
            SFJS.itemTransformer.decryptMultipleItems(data.items, keys, false) /* throws = false as we don't want to interrupt all decryption if just one fails */
            .then(() => {
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
            })
          }
          catch (e) {
            console.log("Error decrypting", e);
            alert("There was an error decrypting your items. Make sure the password you entered is correct and try again.");
            callback(null);
            return;
          }
        });
      } else {
        onDataReady();
      }
    }

    /*
    Export
    */

    $scope.downloadDataArchive = async function() {
      let run = () => {
        archiveManager.downloadBackup($scope.archiveFormData.encrypted);
      }

      if(await privilegesManager.actionRequiresPrivilege(PrivilegesManager.ActionDownloadBackup)) {
        privilegesManager.presentPrivilegesModal(PrivilegesManager.ActionDownloadBackup, () => {
          run();
        });
      } else {
        run();
      }
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
        return "End-to-end encryption is enabled. Your data is encrypted before syncing to your private account.";
      } else if(passcodeManager.hasPasscode()) {
        return "Encryption is enabled. Your data is encrypted using your passcode before saving to your device storage.";
      } else {
        return "Encryption is not enabled. Sign in, register, or add a passcode lock to enable encryption.";
      }
    }

    /*
    Passcode Lock
    */

    $scope.passcodeAutoLockOptions = passcodeManager.getAutoLockIntervalOptions();

    $scope.reloadAutoLockInterval = function() {
       passcodeManager.getAutoLockInterval().then((interval) => {
         $timeout(() => {
           $scope.selectedAutoLockInterval = interval;
         })
       })
    }

    $scope.reloadAutoLockInterval();

    $scope.selectAutoLockInterval = async function(interval) {
      let run = async () => {
        await passcodeManager.setAutoLockInterval(interval);
        $timeout(() => {
          $scope.reloadAutoLockInterval();
        });
      }

      if(await privilegesManager.actionRequiresPrivilege(PrivilegesManager.ActionManagePasscode)) {
        privilegesManager.presentPrivilegesModal(PrivilegesManager.ActionManagePasscode, () => {
          run();
        });
      } else {
        run();
      }
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

      let fn = $scope.formData.changingPasscode ? passcodeManager.changePasscode.bind(passcodeManager) : passcodeManager.setPasscode.bind(passcodeManager);

      fn(passcode, () => {
        $timeout(() => {
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

    $scope.changePasscodePressed = async function() {
      let run = () => {
        $timeout(() => {
          $scope.formData.changingPasscode = true;
          $scope.addPasscodeClicked();
          $scope.formData.changingPasscode = false;
        })
      }

      if(await privilegesManager.actionRequiresPrivilege(PrivilegesManager.ActionManagePasscode)) {
        privilegesManager.presentPrivilegesModal(PrivilegesManager.ActionManagePasscode, () => {
          run();
        });
      } else {
        run();
      }
    }

    $scope.removePasscodePressed = async function() {
      let run = () => {
        $timeout(() => {
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
        })
      }

      if(await privilegesManager.actionRequiresPrivilege(PrivilegesManager.ActionManagePasscode)) {
        privilegesManager.presentPrivilegesModal(PrivilegesManager.ActionManagePasscode, () => {
          run();
        });
      } else {
        run();
      }
    }

    $scope.isDesktopApplication = function() {
      return isDesktopApplication();
    }

  }
}

angular.module('app').directive('accountMenu', () => new AccountMenu);
