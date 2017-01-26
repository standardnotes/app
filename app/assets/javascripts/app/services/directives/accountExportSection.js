class AccountExportSection {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/account-menu/account-export-section.html";
    this.scope = {
    };
  }

  controller($scope, apiController, $timeout) {
    'ngInject';

    $scope.archiveFormData = {encryption_type: $scope.user ? 'mk' : 'ek'};
    $scope.user = apiController.user;

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

      link.href = apiController.itemsDataFile(encrypted, ek);
      link.click();
    }

    $scope.performImport = function(data, password) {
      $scope.importData.loading = true;
      // allow loading indicator to come up with timeout
      $timeout(function(){
        apiController.importJSONData(data, password, function(success, response){
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

  }

}

angular.module('app.frontend').directive('accountExportSection', () => new AccountExportSection);
