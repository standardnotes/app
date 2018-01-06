class EditorMenu {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/editor-menu.html";
    this.scope = {
      callback: "&",
      selectedEditor: "="
    };
  }

  controller($scope, componentManager, syncManager) {
    'ngInject';

    $scope.formData = {};

    $scope.editors = componentManager.componentsForArea("editor-editor");

    $scope.isDesktop = isDesktopApplication();

    $scope.defaultEditor = $scope.editors.filter((e) => {return e.isDefaultEditor()})[0];

    $scope.selectEditor = function($event, editor) {
      if(editor) {
        editor.conflict_of = null; // clear conflict if applicable
        if(editor.local && !isDesktopApplication()) {
          alert("This editor is installed locally and is available only through Standard Notes for Desktop.")
          return;
        }
      }
      $scope.callback()(editor);
    }

    $scope.toggleDefaultForEditor = function(editor) {
      console.log("Toggling editor", editor);
      if($scope.defaultEditor == editor) {
        $scope.removeEditorDefault(editor);
      } else {
        $scope.makeEditorDefault(editor);
      }
    }

    $scope.makeEditorDefault = function(component) {
      var currentDefault = componentManager.componentsForArea("editor-editor").filter((e) => {return e.isDefaultEditor()})[0];
      if(currentDefault) {
        currentDefault.setAppDataItem("defaultEditor", false);
        currentDefault.setDirty(true);
      }
      component.setAppDataItem("defaultEditor", true);
      component.setDirty(true);
      syncManager.sync();

      $scope.defaultEditor = component;
    }

    $scope.removeEditorDefault = function(component) {
      component.setAppDataItem("defaultEditor", false);
      component.setDirty(true);
      syncManager.sync();

      $scope.defaultEditor = null;
    }

  }

}

angular.module('app.frontend').directive('editorMenu', () => new EditorMenu);
