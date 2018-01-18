class ActionsMenu {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/actions-menu.html";
    this.scope = {
      item: "="
    };
  }

  controller($scope, modelManager, actionsManager) {
    'ngInject';

    $scope.renderData = {};

    $scope.extensions = actionsManager.extensions;

    for(let ext of $scope.extensions) {
      ext.loading = true;
      actionsManager.loadExtensionInContextOfItem(ext, $scope.item, function(scopedExtension) {
        ext.loading = false;
      })
    }

    $scope.executeAction = function(action, extension, parentAction) {
      if(!$scope.isActionEnabled(action, extension)) {
        alert("This action requires " + action.access_type + " access to this note. You can change this setting in the Extensions menu on the bottom of the app.");
        return;
      }
      if(action.verb == "nested") {
        action.showNestedActions = !action.showNestedActions;
        return;
      }
      action.running = true;
      actionsManager.executeAction(action, extension, $scope.item, function(response){
        action.running = false;
        $scope.handleActionResponse(action, response);

        // reload extension actions
        actionsManager.loadExtensionInContextOfItem(extension, $scope.item, function(ext){
          // keep nested state
          if(parentAction) {
            var matchingAction = _.find(ext.actions, {label: parentAction.label});
            matchingAction.showNestedActions = true;
          }
        });
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
        var extEncryptedAccess = extension.encrypted;
        if(action.access_type == "decrypted" && extEncryptedAccess) {
          return false;
        } else if(action.access_type == "encrypted" && !extEncryptedAccess) {
          return false;
        }
      }
      return true;
    }

    $scope.accessTypeForExtension = function(extension) {
      return extension.encrypted ? "encrypted" : "decrypted";
    }
  }

}

angular.module('app.frontend').directive('actionsMenu', () => new ActionsMenu);
