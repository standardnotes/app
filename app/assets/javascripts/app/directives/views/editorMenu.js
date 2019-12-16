import { isDesktopApplication } from '@/utils';
import template from '%/directives/editor-menu.pug';

export class EditorMenu {
  constructor() {
    this.restrict = 'E';
    this.template = template;
    this.scope = {
      callback: '&',
      selectedEditor: '=',
      currentItem: '='
    };
  }

  /* @ngInject */
  controller($scope, componentManager, syncManager, modelManager, $timeout) {
    $scope.formData = {};

    $scope.editors = componentManager.componentsForArea("editor-editor").sort((a, b) => {
      return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
    });

    $scope.isDesktop = isDesktopApplication();

    $scope.defaultEditor = $scope.editors.filter((e) => {return e.isDefaultEditor()})[0];

    $scope.selectComponent = function(component) {
      if(component) {
        if(component.content.conflict_of) {
          component.content.conflict_of = null; // clear conflict if applicable
          modelManager.setItemDirty(component, true);
          syncManager.sync();
        }
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
        modelManager.setItemDirty(currentDefault, true);
      }

      component.setAppDataItem("defaultEditor", true);
      modelManager.setItemDirty(component, true);
      syncManager.sync();

      $scope.defaultEditor = component;
    }

    $scope.removeEditorDefault = function(component) {
      component.setAppDataItem("defaultEditor", false);
      modelManager.setItemDirty(component, true);
      syncManager.sync();

      $scope.defaultEditor = null;
    }

    $scope.shouldDisplayRunningLocallyLabel = function(component) {
      if(!component.runningLocally) {
        return false;
      }

      if(component == $scope.selectedEditor) {
        return true;
      } else {
        return false;
      }
    }
  }
}
