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

    $scope.selectEditor = function(editor) {
      editor.conflict_of = null; // clear conflict if applicable
      $scope.callback()(editor);
    }

    $scope.deleteEditor = function(editor) {
      if(confirm("Are you sure you want to delete this editor?")) {
        editorManager.deleteEditor(editor);
      }
    }

    $scope.setDefaultEditor = function(editor) {
      editorManager.setDefaultEditor(editor);
    }

    $scope.removeDefaultEditor = function(editor) {
      editorManager.removeDefaultEditor(editor);
    }

    $scope.submitNewEditorRequest = function() {
      editorManager.addNewEditorFromURL($scope.formData.url);
      $scope.formData = {};
    }

  }

}

angular.module('app.frontend').directive('editorMenu', () => new EditorMenu);
