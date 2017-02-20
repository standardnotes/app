class EditorMenu {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/editor-menu.html";
    this.scope = {
      callback: "&",
      selectedEditor: "="
    };
  }

  controller($scope, modelManager, extensionManager, syncManager) {
    'ngInject';

    $scope.formData = {};

    let editorContentType = "SN|Editor";

    let defaultEditor = {
      default: true,
      name: "Plain"
    }

    $scope.sysEditors = [defaultEditor];
    $scope.editors = modelManager.itemsForContentType(editorContentType);

    $scope.editorForUrl = function(url) {
      return $scope.editors.filter(function(editor){return editor.url == url})[0];
    }

    $scope.selectEditor = function(editor) {
      $scope.callback()(editor);
    }
  }

}

angular.module('app.frontend').directive('editorMenu', () => new EditorMenu);
