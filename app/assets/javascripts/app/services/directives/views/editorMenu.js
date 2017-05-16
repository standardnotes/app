class EditorMenu {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/editor-menu.html";
    this.scope = {
      callback: "&",
      selectedEditor: "="
    };
  }

  controller($scope, editorManager) {
    'ngInject';

    $scope.formData = {};
    $scope.editorManager = editorManager;

    $scope.selectEditor = function($event, editor) {
      editor.conflict_of = null; // clear conflict if applicable
      $scope.callback()(editor);
    }

  }

}

angular.module('app.frontend').directive('editorMenu', () => new EditorMenu);
