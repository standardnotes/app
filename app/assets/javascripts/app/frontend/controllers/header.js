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
        // scope.$on('auth:login-success', function(event, user) {
          // ctrl.onAuthSuccess(user);
        // });

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
      this.logout()();
      apiController.signout();
      window.location.reload();
    }

    this.submitPasswordChange = function() {
      this.passwordChangeData.status = "Generating New Keys...";

      $timeout(function(){
        if(data.password != data.password_confirmation) {
          alert("Your new password does not match its confirmation.");
          return;
        }

        apiController.changePassword(this.user, this.passwordChangeData.current_password, this.passwordChangeData.new_password, function(response){

        })

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
        apiController.login(this.loginData.email, this.loginData.user_password, function(response){
          if(response.errors) {
            this.loginData.status = response.errors[0];
          } else {
            this.onAuthSuccess(response.user);
          }
        }.bind(this));
      }.bind(this))
    }

    this.submitRegistrationForm = function() {
      this.loginData.status = "Generating Account Keys...";

      $timeout(function(){
        apiController.register(this.loginData.email, this.loginData.user_password, function(response){
          if(response.errors) {
            this.loginData.status = response.errors[0];
          } else {
            this.onAuthSuccess(response.user);
          }
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
