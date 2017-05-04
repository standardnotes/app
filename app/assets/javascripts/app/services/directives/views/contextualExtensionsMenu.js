class ContextualExtensionsMenu {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/contextual-menu.html";
    this.scope = {
      item: "="
    };
  }

  controller($scope, modelManager, extensionManager) {
    'ngInject';

    $scope.renderData = {};

    $scope.extensions = _.map(extensionManager.extensionsInContextOfItem($scope.item), function(ext){
      // why are we cloning deep? commenting out because we want original reference so that extension.hide is saved between menu opens
      // return _.cloneDeep(ext);
      return ext;
    });

    for(let ext of $scope.extensions) {
      ext.loading = true;
      extensionManager.loadExtensionInContextOfItem(ext, $scope.item, function(scopedExtension) {
        ext.loading = false;
      })
    }

    $scope.executeAction = function(action, extension) {
      if(!$scope.isActionEnabled(action, extension)) {
        alert("This action requires " + action.access_type + " access to this note. You can change this setting in the Extensions menu on the bottom of the app.");
        return;
      }
      if(action.verb == "nested") {
        action.showNestedActions = !action.showNestedActions;
        return;
      }
      action.running = true;
      extensionManager.executeAction(action, extension, $scope.item, function(response){
        action.running = false;
        $scope.handleActionResponse(action, response);

        // reload extension actions
        extensionManager.loadExtensionInContextOfItem(extension, $scope.item, null);
      })
    }

    $scope.handleActionResponse = function(action, response) {
      switch (action.verb) {
        case "render": {
          var item = response.item;
          if(item.content_type == "Note") {
            $scope.renderData.title = item.title;
            $scope.renderData.text = item.text;
            $scope.renderData.showRenderModal = true;
          }
        }
      }
    }

    $scope.isActionEnabled = function(action, extension) {
      if(action.access_type) {
        var extEncryptedAccess = extensionManager.extensionUsesEncryptedData(extension);
        if(action.access_type == "decrypted" && extEncryptedAccess) {
          return false;
        } else if(action.access_type == "encrypted" && !extEncryptedAccess) {
          return false;
        }
      }
      return true;
    }

    $scope.accessTypeForExtension = function(extension) {
      return extensionManager.extensionUsesEncryptedData(extension) ? "encrypted" : "decrypted";
    }
  }

}

angular.module('app.frontend').directive('contextualExtensionsMenu', () => new ContextualExtensionsMenu);
