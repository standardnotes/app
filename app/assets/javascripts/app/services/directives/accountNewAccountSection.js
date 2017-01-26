class AccountNewAccountSection {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/account-menu/account-new-account-section.html";
    this.scope = {
    };
  }

  controller($scope, apiController, modelManager, $timeout, dbManager, syncManager) {
    'ngInject';

    $scope.formData = {mergeLocal: true, url: syncManager.serverURL()};
    $scope.user = apiController.user;

    $scope.showForm = syncManager.syncProviders.length == 0;

    $scope.changePasswordPressed = function() {
      $scope.showNewPasswordForm = !$scope.showNewPasswordForm;
    }

    $scope.submitExternalSyncURL = function() {
      syncManager.addSyncProviderFromURL($scope.newSyncData.url);
      $scope.newSyncData.showAddSyncForm = false;
    }

    $scope.signOutPressed = function() {
      $scope.showAccountMenu = false;
      apiController.signoutOfStandardFile(false, function(){
        window.location.reload();
      })
    }

    $scope.submitPasswordChange = function() {
      $scope.passwordChangeData.status = "Generating New Keys...";

      $timeout(function(){
        if(data.password != data.password_confirmation) {
          alert("Your new password does not match its confirmation.");
          return;
        }

        apiController.changePassword($scope.passwordChangeData.current_password, $scope.passwordChangeData.new_password, function(response){

        })

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

    $scope.loginSubmitPressed = function() {
      $scope.formData.status = "Generating Login Keys...";
      console.log("logging in with url", $scope.formData.url);
      $timeout(function(){
        apiController.login($scope.formData.url, $scope.formData.email, $scope.formData.user_password, function(response){
          if(!response || response.error) {
            var error = response ? response.error : {message: "An unknown error occured."}
            $scope.formData.status = null;
            if(!response || (response && !response.didDisplayAlert)) {
              alert(error.message);
            }
          } else {
            $scope.onAuthSuccess(response.user);
          }
        });
      })
    }

    $scope.submitRegistrationForm = function() {
      $scope.formData.status = "Generating Account Keys...";

      $timeout(function(){
        apiController.register($scope.formData.url, $scope.formData.email, $scope.formData.user_password, function(response){
          if(!response || response.error) {
            var error = response ? response.error : {message: "An unknown error occured."}
            $scope.formData.status = null;
            alert(error.message);
          } else {
            $scope.onAuthSuccess(response.user);
          }
        });
      })
    }

    $scope.encryptionStatusForNotes = function() {
      var allNotes = modelManager.filteredNotes;
      return allNotes.length + "/" + allNotes.length + " notes encrypted";
    }

    $scope.onAuthSuccess = function(user) {
      var block = function(){
        window.location.reload();
        $scope.showLogin = false;
        $scope.showRegistration = false;
      };

      if(!$scope.formData.mergeLocal) {
          dbManager.clearAllItems(function(){
            block();
          });
      } else {
        block();
      }
    }

  }
}

angular.module('app.frontend').directive('accountNewAccountSection', () => new AccountNewAccountSection);
