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

      }
    }
  })
  .controller('HeaderCtrl', function ($state, apiController, modelManager, serverSideValidation, $timeout) {

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
      return modelManager.filteredNotes.length > 0;
    }

    this.mergeLocalChanged = function() {
      if(!this.user.shouldMerge) {
        if(!confirm("Unchecking this option means any locally stored tags and notes you have now will be deleted. Are you sure you want to continue?")) {
          this.user.shouldMerge = true;
        }
      }
    }

    this.loginSubmitPressed = function() {
      this.loginData.status = "Generating Login Keys...";
      $timeout(function(){
        apiController.login(this.loginData.email, this.loginData.user_password, function(response){
          if(!response || response.error) {
            var error = response ? response.error : {message: "An unknown error occured."}
            this.loginData.status = null;
            alert(error.message);
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
          if(!response || response.error) {
            var error = response ? response.error : {message: "An unknown error occured."}
            this.loginData.status = null;
            alert(error.message);
          } else {
            this.onAuthSuccess(response.user);
          }
        }.bind(this));
      }.bind(this))
    }

    this.forgotPasswordSubmit = function() {
      // $auth.requestPasswordReset(this.resetData)
      //   .then(function(resp) {
      //     this.resetData.response = "Success";
      //     // handle success response
      //   }.bind(this))
      //   .catch(function(resp) {
      //     // handle error response
      //     this.resetData.response = "Error";
      //   }.bind(this));
    }

    this.encryptionStatusForNotes = function() {
      var allNotes = modelManager.filteredNotes;
      var countEncrypted = 0;
      allNotes.forEach(function(note){
        if(note.encryptionEnabled()) {
          countEncrypted++;
        }
      }.bind(this))

      return countEncrypted + "/" + allNotes.length + " notes encrypted";
    }

    this.downloadDataArchive = function() {
      var link = document.createElement('a');
      link.setAttribute('download', 'neeto.json');
      link.href = apiController.itemsDataFile();
      link.click();
    }

    this.importFileSelected = function(files) {
      var file = files[0];
      var reader = new FileReader();
      reader.onload = function(e) {
        apiController.importJSONData(e.target.result, function(success, response){
          console.log("import response", success, response);
          if(success) {
            // window.location.reload();
          } else {
            alert("There was an error importing your data. Please try again.");
          }
        })
      }
      reader.readAsText(file);
    }

    this.onAuthSuccess = function(user) {
      this.user.uuid = user.uuid;

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
