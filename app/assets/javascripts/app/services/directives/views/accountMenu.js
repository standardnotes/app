class AccountMenu {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/account-menu.html";
    this.scope = {};
  }

  controller($scope, authManager, modelManager, syncManager, $timeout) {
    'ngInject';

    $scope.formData = {url: syncManager.serverURL};
    $scope.user = authManager.user;

    $scope.changePasswordPressed = function() {
      $scope.showNewPasswordForm = !$scope.showNewPasswordForm;
    }

    $scope.submitPasswordChange = function() {
      $scope.passwordChangeData.status = "Generating New Keys...";

      $timeout(function(){
        if(data.password != data.password_confirmation) {
          alert("Your new password does not match its confirmation.");
          return;
        }

        authManager.changePassword($scope.passwordChangeData.current_password, $scope.passwordChangeData.new_password, function(response){

        })

      })
    }

    $scope.loginSubmitPressed = function() {
      $scope.formData.status = "Generating Login Keys...";
      console.log("logging in with url", $scope.formData.url);
      $timeout(function(){
        authManager.login($scope.formData.url, $scope.formData.email, $scope.formData.user_password, function(response){
          $scope.formData.status = null;
          if(!response || response.error) {
            var error = response ? response.error : {message: "An unknown error occured."}
            if(!response || (response && !response.didDisplayAlert)) {
              alert(error.message);
            }
          } else {
             window.location.reload();
          }
        });
      })
    }

    $scope.submitRegistrationForm = function() {
      $scope.formData.status = "Generating Account Keys...";

      $timeout(function(){
        authManager.register($scope.formData.url, $scope.formData.email, $scope.formData.user_password, function(response){
          $scope.formData.status = null;
          if(!response || response.error) {
            var error = response ? response.error : {message: "An unknown error occured."}
            alert(error.message);
          } else {
             window.location.reload();
          }
        });
      })
    }

    $scope.destroyLocalData = function() {
      if(!confirm("Are you sure you want to end your session? This will delete all local items and extensions.")) {
        return;
      }

      syncManager.destroyLocalData(function(){
        window.location.reload();
      })
    }


    /* Import/Export */

    $scope.archiveFormData = {encryption_type: $scope.user ? 'mk' : 'ek'};
    $scope.user = authManager.user;

    $scope.downloadDataArchive = function() {
      if($scope.archiveFormData.encryption_type == 'ek') {
        if(!$scope.archiveFormData.ek) {
          alert("You must set an encryption key to export the data encrypted.")
          return;
        }
      }

      var link = document.createElement('a');
      link.setAttribute('download', 'notes.json');

      var ek = $scope.archiveFormData.encryption_type == 'ek' ? $scope.archiveFormData.ek : null;
      var encrypted = $scope.archiveFormData.encryption_type != 'none';

      link.href = authManager.itemsDataFile(encrypted, ek);
      link.click();
    }

    $scope.performImport = function(data, password) {
      $scope.importData.loading = true;
      // allow loading indicator to come up with timeout
      $timeout(function(){
        authManager.importJSONData(data, password, function(success, response){
          console.log("Import response:", success, response);
          $scope.importData.loading = false;
          if(success) {
            $scope.importData = null;
          } else {
            alert("There was an error importing your data. Please try again.");
          }
        })
      })
    }

    $scope.submitImportPassword = function() {
      $scope.performImport($scope.importData.data, $scope.importData.password);
    }

    $scope.importFileSelected = function(files) {
      $scope.importData = {};

      var file = files[0];
      var reader = new FileReader();
      reader.onload = function(e) {
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
      }

      reader.readAsText(file);
    }

    $scope.encryptionStatusForNotes = function() {
      var allNotes = modelManager.filteredNotes;
      return allNotes.length + "/" + allNotes.length + " notes encrypted";
    }

  }
}

angular.module('app.frontend').directive('accountMenu', () => new AccountMenu);
