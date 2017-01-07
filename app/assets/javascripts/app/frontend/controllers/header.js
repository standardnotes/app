angular.module('app.frontend')
  .directive("header", function(apiController, extensionManager){
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
        scope.$on("sync:updated_token", function(){
          ctrl.syncUpdated();
        })
      }
    }
  })
  .controller('HeaderCtrl', function ($state, apiController, modelManager, serverSideValidation, $timeout, extensionManager) {

    this.extensionManager = extensionManager;

    this.changePasswordPressed = function() {
      this.showNewPasswordForm = !this.showNewPasswordForm;
    }

    this.accountMenuPressed = function() {
      this.serverData = {url: apiController.getServer()};
      this.showAccountMenu = !this.showAccountMenu;
      this.showFaq = false;
      this.showNewPasswordForm = false;
    }

    this.toggleExtensions = function() {
      this.showExtensionsMenu = !this.showExtensionsMenu;
    }

    this.toggleExtensionForm = function() {
      this.newExtensionData = {};
      this.showNewExtensionForm = !this.showNewExtensionForm;
    }

    this.submitNewExtensionForm = function() {
      if(this.newExtensionData.url) {
        extensionManager.addExtension(this.newExtensionData.url, function(response){
          if(!response) {
            alert("Unable to register this extension. Make sure the link is valid and try again.");
          }
        })
      }
    }

    this.selectedAction = function(action, extension) {
      action.running = true;
      extensionManager.executeAction(action, extension, null, function(response){
        action.running = false;
        apiController.sync(null);
      })
    }

    this.deleteExtension = function(extension) {
      if(confirm("Are you sure you want to delete this extension?")) {
        extensionManager.deleteExtension(extension);
      }
    }

    this.reloadExtensionsPressed = function() {
      if(confirm("For your security, reloading extensions will disable any currently enabled repeat actions.")) {
        extensionManager.refreshExtensionsFromServer();
      }
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

    this.refreshData = function() {
      this.isRefreshing = true;
      apiController.sync(function(response){
        $timeout(function(){
          this.isRefreshing = false;
        }.bind(this), 200)
        if(!response) {
          alert("There was an error syncing. Please try again. If all else fails, log out and log back in.");
        } else {
          this.syncUpdated();
        }
      }.bind(this));
    }

    this.syncUpdated = function() {
      this.lastSyncDate = new Date();
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

    this.archiveEncryptionFormat = {encrypted: true};

    this.downloadDataArchive = function() {
      var link = document.createElement('a');
      link.setAttribute('download', 'notes.json');
      link.href = apiController.itemsDataFile(this.archiveEncryptionFormat.encrypted);
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

      // if(this.user.shouldMerge && this.hasLocalData()) {
        // apiController.mergeLocalDataRemotely(this.user, function(){
        //   window.location.reload();
        // });
      // } else {
        window.location.reload();
      // }

      this.showLogin = false;
      this.showRegistration = false;
    }

  });
