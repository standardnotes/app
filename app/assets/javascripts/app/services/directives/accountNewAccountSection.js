class AccountNewAccountSection {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/account-menu/account-new-account-section.html";
    this.scope = {
    };
  }

  controller($scope, apiController, modelManager, $timeout, dbManager, syncManager) {
    'ngInject';

    $scope.formData = {url: syncManager.defaultServerURL()};
    $scope.user = apiController.user;

    $scope.showForm = syncManager.syncProviders.length == 0;

    $scope.changePasswordPressed = function() {
      $scope.showNewPasswordForm = !$scope.showNewPasswordForm;
    }

    $scope.submitExternalSyncURL = function() {
      syncManager.addSyncProviderFromURL($scope.formData.secretUrl);
      $scope.formData.showAddLinkForm = false;
      $scope.formData.secretUrl = null;
      $scope.showForm = false;
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

    $scope.loginSubmitPressed = function() {
      $scope.formData.status = "Generating Login Keys...";
      console.log("logging in with url", $scope.formData.url);
      $timeout(function(){
        apiController.login($scope.formData.url, $scope.formData.email, $scope.formData.user_password, function(response){
          $scope.formData.status = null;
          if(!response || response.error) {
            var error = response ? response.error : {message: "An unknown error occured."}
            if(!response || (response && !response.didDisplayAlert)) {
              alert(error.message);
            }
          } else {
            $scope.showForm = false;
          }
        });
      })
    }

    $scope.submitRegistrationForm = function() {
      $scope.formData.status = "Generating Account Keys...";

      $timeout(function(){
        apiController.register($scope.formData.url, $scope.formData.email, $scope.formData.user_password, function(response){
          $scope.formData.status = null;
          if(!response || response.error) {
            var error = response ? response.error : {message: "An unknown error occured."}
            alert(error.message);
          } else {
            $scope.showForm = false;
          }
        });
      })
    }
  }
}

angular.module('app.frontend').directive('accountNewAccountSection', () => new AccountNewAccountSection);
