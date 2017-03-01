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

    $scope.deleteEditor = function(editor) {
      if(confirm("Are you sure you want to delete this editor?")) {
        modelManager.setItemToBeDeleted(editor);
        syncManager.sync();
        _.pull($scope.editors, editor);
      }
    }

    $scope.submitNewEditorRequest = function() {
      var editor = createEditor($scope.formData.url);
      modelManager.addItem(editor);
      editor.setDirty(true);
      syncManager.sync();
      $scope.editors.push(editor);
      $scope.formData = {};
    }

    function createEditor(url) {
      var name = getParameterByName("name", url);
      return modelManager.createItem({
        content_type: editorContentType,
        url: url,
        name: name
      })
    }

    function getParameterByName(name, url) {
      name = name.replace(/[\[\]]/g, "\\$&");
      var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
          results = regex.exec(url);
      if (!results) return null;
      if (!results[2]) return '';
      return decodeURIComponent(results[2].replace(/\+/g, " "));
    }
  }

}

angular.module('app.frontend').directive('editorMenu', () => new EditorMenu);
