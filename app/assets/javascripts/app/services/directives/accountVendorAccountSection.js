class AccountVendorAccountSection {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/account-vendor-account-section.html";
    this.scope = {
    };
  }

  controller($scope, apiController, modelManager, $timeout, dbManager) {
    'ngInject';

    $scope.loginData = {mergeLocal: true, url: apiController.defaultServerURL()};
    $scope.user = apiController.user;

    $scope.changePasswordPressed = function() {
      $scope.showNewPasswordForm = !$scope.showNewPasswordForm;
    }

    $scope.signOutPressed = function() {
      $scope.showAccountMenu = false;
      apiController.signoutOfStandardFile(function(){
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
      if(!$scope.loginData.mergeLocal) {
        if(!confirm("Unchecking this option means any of the notes you have written while you were signed out will be deleted. Are you sure you want to discard these notes?")) {
          $scope.loginData.mergeLocal = true;
        }
      }
    }

    $scope.loginSubmitPressed = function() {
      $scope.loginData.status = "Generating Login Keys...";
      console.log("logging in with url", $scope.loginData.url);
      $timeout(function(){
        apiController.login($scope.loginData.url, $scope.loginData.email, $scope.loginData.user_password, function(response){
          if(!response || response.error) {
            var error = response ? response.error : {message: "An unknown error occured."}
            $scope.loginData.status = null;
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
      $scope.loginData.status = "Generating Account Keys...";

      $timeout(function(){
        apiController.register($scope.loginData.url, $scope.loginData.email, $scope.loginData.user_password, function(response){
          if(!response || response.error) {
            var error = response ? response.error : {message: "An unknown error occured."}
            $scope.loginData.status = null;
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

      if(!$scope.loginData.mergeLocal) {
          dbManager.clearAllItems(function(){
            block();
          });
      } else {
        block();
      }
    }

  }
}

angular.module('app.frontend').directive('accountVendorAccountSection', () => new AccountVendorAccountSection);
