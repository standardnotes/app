angular.module('app.frontend')
  .directive("header", function(apiController, extensionManager){
    return {
      restrict: 'E',
      scope: {},
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
  .controller('HeaderCtrl', function ($state, apiController, modelManager, $timeout, extensionManager, dbManager) {

    this.user = apiController.user;
    this.extensionManager = extensionManager;
    this.loginData = {mergeLocal: true};

    this.changePasswordPressed = function() {
      this.showNewPasswordForm = !this.showNewPasswordForm;
    }

    this.accountMenuPressed = function() {
      this.serverData = {url: apiController.getServer()};
      this.showAccountMenu = !this.showAccountMenu;
      this.showFaq = false;
      this.showNewPasswordForm = false;
      this.showExtensionsMenu = false;
    }

    this.toggleExtensions = function() {
      this.showAccountMenu = false;
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
          } else {
            this.newExtensionData.url = "";
            this.showNewExtensionForm = false;
          }
        }.bind(this))
      }
    }

    this.selectedAction = function(action, extension) {
      action.running = true;
      extensionManager.executeAction(action, extension, null, function(response){
        action.running = false;
        if(response && response.error) {
          action.error = true;
          alert("There was an error performing this action. Please try again.");
        } else {
          action.error = false;
          apiController.sync(null);
        }
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
      apiController.signout(function(){
        window.location.reload();
      })
    }

    this.submitPasswordChange = function() {
      this.passwordChangeData.status = "Generating New Keys...";

      $timeout(function(){
        if(data.password != data.password_confirmation) {
          alert("Your new password does not match its confirmation.");
          return;
        }

        apiController.changePassword(this.passwordChangeData.current_password, this.passwordChangeData.new_password, function(response){

        })

      }.bind(this))
    }

    this.localNotesCount = function() {
      return modelManager.filteredNotes.length;
    }

    this.mergeLocalChanged = function() {
      if(!this.loginData.mergeLocal) {
        if(!confirm("Unchecking this option means any of the notes you have written while you were signed out will be deleted. Are you sure you want to discard these notes?")) {
          this.loginData.mergeLocal = true;
        }
      }
    }

    this.refreshData = function() {
      this.isRefreshing = true;
      apiController.sync(function(response){
        $timeout(function(){
          this.isRefreshing = false;
        }.bind(this), 200)
        if(response && response.error) {
          this.isOffline = true
          alert("There was an error syncing. Please try again. If all else fails, log out and log back in.");
        } else {
          this.isOffline = false
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
            if(!response || (response && !response.didDisplayAlert)) {
              alert(error.message);
            }
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
      return allNotes.length + "/" + allNotes.length + " notes encrypted";
    }

    this.archiveEncryptionFormat = {encrypted: true};

    this.downloadDataArchive = function() {
      var link = document.createElement('a');
      link.setAttribute('download', 'notes.json');
      link.href = apiController.itemsDataFile(this.archiveEncryptionFormat.encrypted);
      link.click();
    }

    this.performImport = function(data, password) {
      this.importData.loading = true;
      // allow loading indicator to come up with timeout
      $timeout(function(){
        apiController.importJSONData(data, password, function(success, response){
          console.log("Import response:", success, response);
          this.importData.loading = false;
          if(success) {
            this.importData = null;
          } else {
            alert("There was an error importing your data. Please try again.");
          }
        }.bind(this))
      }.bind(this))
    }

    this.submitImportPassword = function() {
      this.performImport(this.importData.data, this.importData.password);
    }

    this.importFileSelected = function(files) {
      this.importData = {};

      var file = files[0];
      var reader = new FileReader();
      reader.onload = function(e) {
        var data = JSON.parse(e.target.result);
        $timeout(function(){
          if(data.auth_params) {
            // request password
            this.importData.requestPassword = true;
            this.importData.data = data;
          } else {
            this.performImport(data, null);
          }
        }.bind(this))
      }.bind(this)

      reader.readAsText(file);
    }

    this.onAuthSuccess = function(user) {
      var block = function(){
        window.location.reload();
        this.showLogin = false;
        this.showRegistration = false;
      }.bind(this);

      if(!this.loginData.mergeLocal) {
          dbManager.clearAllItems(function(){
            block();
          });
      } else {
        block();
      }
    }

  });
