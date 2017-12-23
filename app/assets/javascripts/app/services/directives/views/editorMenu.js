class EditorMenu {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/editor-menu.html";
    this.scope = {
      callback: "&",
      selectedEditor: "="
    };
  }

  controller($scope, componentManager) {
    'ngInject';

    $scope.formData = {};

    $scope.editors = componentManager.componentsForArea("editor-editor");

    $scope.isDesktop = isDesktopApplication();

    $scope.selectEditor = function($event, editor) {
      if(editor) {
        editor.conflict_of = null; // clear conflict if applicable
        if(editor.local && !isDesktopApplication()) {
          alert("This editor is installed ")
          return;
        }
      }
      $scope.callback()(editor);
    }

  }

}

angular.module('app.frontend').directive('editorMenu', () => new EditorMenu);
