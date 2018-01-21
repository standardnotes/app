class PermissionsModal {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "directives/permissions-modal.html";
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

    $scope.permissionsString = function() {
      var finalString = "";
      let permissionsCount = $scope.permissions.length;

      let addSeparator = (index, length) => {
        if(index > 0) {
          if(index == length - 1) {
            if(length == 2) {
              return " and ";
            } else {
              return ", and "
            }
          } else {
            return ", ";
          }
        }

        return "";
      }

      $scope.permissions.forEach((permission, index) => {

        if(permission.name === "stream-items") {
          var types = permission.content_types.map(function(type){
            var desc = modelManager.humanReadableDisplayForContentType(type);
            if(desc) {
              return desc + "s";
            } else {
              return "items of type " + type;
            }
          })
          var typesString = "";

          for(var i = 0;i < types.length;i++) {
            var type = types[i];
            typesString += addSeparator(i, types.length + permissionsCount - index - 1);
            typesString += type;
          }

          finalString += addSeparator(index, permissionsCount);

          finalString += typesString;

          if(types.length >= 2 && index < permissionsCount - 1) {
            // If you have a list of types, and still an additional root-level permission coming up, add a comma
            finalString += ", ";
          }
        } else if(permission.name === "stream-context-item") {
          var mapping = {
            "editor-stack" : "working note",
            "note-tags" : "working note",
            "editor-editor": "working note"
          }

          finalString += addSeparator(index, permissionsCount, true);

          finalString += mapping[$scope.component.area];
        }
      })

      return finalString + ".";
    }
  }

}

angular.module('app').directive('permissionsModal', () => new PermissionsModal);
