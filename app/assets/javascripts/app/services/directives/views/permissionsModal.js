class PermissionsModal {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/permissions-modal.html";
    this.scope = {
      show: "=",
      component: "=",
      permissions: "=",
      callback: "="
    };
  }

  link($scope, el, attrs) {

    $scope.dismiss = function() {
      el.remove();
    }

    $scope.accept = function() {
      $scope.callback(true);
      $scope.dismiss();
    }

    $scope.deny = function() {
      $scope.callback(false);
      $scope.dismiss();
    }
  }

  controller($scope, modelManager) {
    $scope.formattedPermissions = $scope.permissions.map(function(permission){
      if(permission.name === "stream-items") {
        var title = "Access to ";
        var types = permission.content_types.map(function(type){
          var desc = modelManager.humanReadableDisplayForContentType(type);
          if(desc) {
            return desc + "s";
          } else {
            return "items of type " + type;
          }
        })
        var typesString = "";
        var separator = ", ";

        for(var i = 0;i < types.length;i++) {
          var type = types[i];
          if(i == 0) {
            // first element
            typesString = typesString + type;
          } else if(i == types.length - 1) {
            // last element
            if(types.length > 2) {
              typesString += separator + "and " + typesString;
            } else if(types.length == 2) {
              typesString = typesString + " and " + type;
            }
          } else {
            typesString += separator + type;
          }
        }

        return title + typesString;
      } else if(permission.name === "stream-context-item") {
        var mapping = {
          "editor-stack" : "working note",
          "note-tags" : "working note",
          "editor-editor": "working note"
        }
        return "Access to " + mapping[$scope.component.area];
      }
    })
  }

}

angular.module('app.frontend').directive('permissionsModal', () => new PermissionsModal);
