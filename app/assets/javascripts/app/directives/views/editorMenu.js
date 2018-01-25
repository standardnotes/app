class EditorMenu {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "directives/editor-menu.html";
    this.scope = {
      callback: "&",
      selectedEditor: "=",
      currentItem: "="
    };
  }

  controller($scope, componentManager, syncManager, $timeout) {
    'ngInject';

    $scope.formData = {};

    $scope.editors = componentManager.componentsForArea("editor-editor");
    $scope.stack = componentManager.componentsForArea("editor-stack");

    $scope.isDesktop = isDesktopApplication();

    $scope.defaultEditor = $scope.editors.filter((e) => {return e.isDefaultEditor()})[0];

    $scope.selectComponent = function($event, component) {
      $event.stopPropagation();
      if(component) {
        component.conflict_of = null; // clear conflict if applicable
      }
      $timeout(() => {
        $scope.callback()(component);
      })
    }

    $scope.toggleDefaultForEditor = function(editor) {
      if($scope.defaultEditor == editor) {
        $scope.removeEditorDefault(editor);
      } else {
        $scope.makeEditorDefault(editor);
      }
    }

    $scope.offlineAvailableForComponent = function(component) {
      return component.local_url && isDesktopApplication();
    }

    $scope.makeEditorDefault = function(component) {
      var currentDefault = componentManager.componentsForArea("editor-editor").filter((e) => {return e.isDefaultEditor()})[0];
      if(currentDefault) {
        currentDefault.setAppDataItem("defaultEditor", false);
        currentDefault.setDirty(true);
      }

      component.setAppDataItem("defaultEditor", true);
      component.setDirty(true);
      syncManager.sync("makeEditorDefault");

      $scope.defaultEditor = component;
    }

    $scope.removeEditorDefault = function(component) {
      component.setAppDataItem("defaultEditor", false);
      component.setDirty(true);
      syncManager.sync("removeEditorDefault");

      $scope.defaultEditor = null;
    }

    $scope.stackComponentEnabled = function(component) {
      return component.active && !component.isExplicitlyDisabledForItem($scope.currentItem);
    }

  }

}

angular.module('app').directive('editorMenu', () => new EditorMenu);
