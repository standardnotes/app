angular.module('app.frontend')
  .directive("header", function(){
    return {
      restrict: 'E',
      scope: {
        user: "=",
        logout: "&"
      },
      templateUrl: 'frontend/header.html',
      replace: true,
      controller: 'HeaderCtrl',
      controllerAs: 'ctrl',
      bindToController: true,

      link:function(scope, elem, attrs, ctrl) {
        scope.$on('auth:login-success', function(event, user) {
          ctrl.onAuthSuccess(user);
        });

        scope.$on('auth:validation-success', function(ev) {
          setTimeout(function(){
            ctrl.onValidationSuccess();
          })

        });
      }
    }
  })
  .controller('HeaderCtrl', function ($auth, $state, apiController, serverSideValidation, $timeout) {

    this.changePasswordPressed = function() {
      this.showNewPasswordForm = !this.showNewPasswordForm;
    }

    this.accountMenuPressed = function() {
      this.serverData = {url: apiController.getServer()};
      this.showAccountMenu = !this.showAccountMenu;
      this.showFaq = false;
      this.showNewPasswordForm = false;
    }

    this.changeServer = function() {
      apiController.setServer(this.serverData.url, true);
    }

    this.signOutPressed = function() {
      this.showAccountMenu = false;
      $auth.signOut();
      this.logout()();
      apiController.clearGk();
      window.location.reload();
    }

    this.submitPasswordChange = function() {
      this.passwordChangeData.status = "Generating New Keys...";

      $timeout(function(){
        var current_keys = Neeto.crypto.generateEncryptionKeysForUser(this.passwordChangeData.current_password, this.user.email);
        var new_keys = Neeto.crypto.generateEncryptionKeysForUser(this.passwordChangeData.new_password, this.user.email);
        // var new_pw_conf_keys = Neeto.crypto.generateEncryptionKeysForUser(this.passwordChangeData.new_password_confirmation, this.user.email);

        var data = {};
        data.current_password = current_keys.pw;
        data.password = new_keys.pw;
        data.password_confirmation = new_keys.pw;

        var user = this.user;

        if(data.password == data.password_confirmation) {
          $auth.updatePassword(data)
          .then(function(response) {
            this.showNewPasswordForm = false;
            if(user.local_encryption_enabled) {
              // reencrypt data with new gk
              apiController.reencryptAllNotesAndSave(user, new_keys.gk, current_keys.gk, function(success){
                if(success) {
                  apiController.setGk(new_keys.gk);
                  alert("Your password has been changed and your data re-encrypted.");
                } else {
                  // rollback password
                  $auth.updatePassword({current_password: new_keys.pw, password: current_keys.pw, password_confirmation: current_keys.pw })
                  .then(function(response){
                    alert("There was an error changing your password. Your password has been rolled back.");
                    window.location.reload();
                  })
                }
              });
            } else {
              alert("Your password has been changed.");
            }
          }.bind(this))
          .catch(function(response){
            this.showNewPasswordForm = false;
            alert("There was an error changing your password. Please try again.");
          }.bind(this))

        } else {
          alert("Your new password does not match its confirmation.");
        }
      }.bind(this))

    }

    this.hasLocalData = function() {
      return this.user.filteredNotes().length > 0;
    }

    this.mergeLocalChanged = function() {
      if(!this.user.shouldMerge) {
        if(!confirm("Unchecking this option means any locally stored groups and notes you have now will be deleted. Are you sure you want to continue?")) {
          this.user.shouldMerge = true;
        }
      }
    }

    this.loginSubmitPressed = function() {
      this.loginData.status = "Generating Login Keys...";
      $timeout(function(){
        var keys = Neeto.crypto.generateEncryptionKeysForUser(this.loginData.user_password, this.loginData.email);
        var data = {password: keys.pw, email: this.loginData.email};

        apiController.setGk(keys.gk);
        $auth.submitLogin(data)
        .then(function(response){

        })
        .catch(function(response){
          this.loginData.status = response.errors[0];
        }.bind(this))
      }.bind(this))
    }

    this.submitRegistrationForm = function() {
      this.loginData.status = "Generating Account Keys...";

      $timeout(function(){
        var keys = Neeto.crypto.generateEncryptionKeysForUser(this.loginData.user_password, this.loginData.email);
        var data = {password: keys.pw, email: this.loginData.email};

        apiController.setGk(keys.gk);

        $auth.submitRegistration(data)
        .then(function(response) {
          $auth.user.id = response.data.data.id;
          this.onAuthSuccess($auth.user);
        }.bind(this))
        .catch(function(response) {
          this.loginData.status = response.data.errors.full_messages[0];
        }.bind(this));
      }.bind(this))
    }

    this.forgotPasswordSubmit = function() {
      $auth.requestPasswordReset(this.resetData)
        .then(function(resp) {
          this.resetData.response = "Success";
          // handle success response
        }.bind(this))
        .catch(function(resp) {
          // handle error response
          this.resetData.response = "Error";
        }.bind(this));
    }

    this.onValidationSuccess = function() {
      if(this.user.local_encryption_enabled) {
        apiController.verifyEncryptionStatusOfAllNotes(this.user, function(success){

        });
      }
    }

    this.encryptionStatusForNotes = function() {
      var allNotes = this.user.filteredNotes();
      var countEncrypted = 0;
      allNotes.forEach(function(note){
        if(note.isEncrypted()) {
          countEncrypted++;
        }
      }.bind(this))

      return countEncrypted + "/" + allNotes.length + " notes encrypted";
    }

    this.toggleEncryptionStatus = function() {
      this.encryptionConfirmation = true;
    }

    this.cancelEncryptionChange = function() {
      this.encryptionConfirmation = false;
    }

    this.confirmEncryptionChange = function() {

      var callback = function(success, enabled) {
        if(success) {
          this.encryptionConfirmation = false;
          this.user.local_encryption_enabled = enabled;
        }
      }.bind(this)

      if(this.user.local_encryption_enabled) {
        apiController.disableEncryptionForUser(this.user, callback);
      } else {
        apiController.enableEncryptionForUser(this.user, callback);
      }
    }


    this.downloadDataArchive = function() {
      var link = document.createElement('a');
      link.setAttribute('download', 'neeto.json');
      link.href = apiController.notesDataFile(this.user);
      link.click();
    }

    this.onAuthSuccess = function(user) {
      this.user.id = user.id;

      if(this.user.shouldMerge && this.hasLocalData()) {
        apiController.mergeLocalDataRemotely(this.user, function(){
          window.location.reload();
        });
      } else {
        window.location.reload();
      }

      this.showLogin = false;
      this.showRegistration = false;
    }

  });
