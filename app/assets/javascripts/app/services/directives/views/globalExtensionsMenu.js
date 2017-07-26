class GlobalExtensionsMenu {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/global-extensions-menu.html";
    this.scope = {
    };
  }

  controller($scope, extensionManager, syncManager, modelManager, themeManager, editorManager, componentManager) {
    'ngInject';

    $scope.formData = {};

    $scope.extensionManager = extensionManager;
    $scope.themeManager = themeManager;
    $scope.editorManager = editorManager;
    $scope.componentManager = componentManager;

    $scope.selectedAction = function(action, extension) {
      extensionManager.executeAction(action, extension, null, function(response){
        if(response && response.error) {
          action.error = true;
          alert("There was an error performing this action. Please try again.");
        } else {
          action.error = false;
          syncManager.sync(null);
        }
      })
    }

    $scope.changeExtensionEncryptionFormat = function(encrypted, extension) {
      extensionManager.changeExtensionEncryptionFormat(encrypted, extension);
    }

    $scope.deleteActionExtension = function(extension) {
      if(confirm("Are you sure you want to delete this extension?")) {
        extensionManager.deleteExtension(extension);
      }
    }

    $scope.reloadExtensionsPressed = function() {
      if(confirm("For your security, reloading extensions will disable any currently enabled repeat actions.")) {
        extensionManager.refreshExtensionsFromServer();
      }
    }

    $scope.deleteTheme = function(theme) {
      if(confirm("Are you sure you want to delete this theme?")) {
        themeManager.deactivateTheme(theme);
        modelManager.setItemToBeDeleted(theme);
        syncManager.sync();
      }
    }


    // Editors

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


    // Components

    $scope.revokePermissions = function(component) {
      component.permissions = [];
      component.setDirty(true);
      syncManager.sync();
    }

    $scope.deleteComponent = function(component) {
      if(confirm("Are you sure you want to delete this component?")) {
        componentManager.deleteComponent(component);
      }
    }

    // Installation

    $scope.submitInstallLink = function() {

      var fullLink = $scope.formData.installLink;
      if(!fullLink) {
        return;
      }

      var completion = function() {
        $scope.formData.installLink = "";
        $scope.formData.successfullyInstalled = true;
      }

      var links = fullLink.split(",");
      for(var link of links) {
        var type = getParameterByName("type", link);

        if(type == "sf") {
          $scope.handleSyncAdapterLink(link, completion);
        } else if(type == "editor") {
          $scope.handleEditorLink(link, completion);
        } else if(link.indexOf(".css") != -1 || type == "theme") {
          $scope.handleThemeLink(link, completion);
        } else if(type == "component") {
          $scope.handleComponentLink(link, completion);
        }

        else {
          $scope.handleActionLink(link, completion);
        }
      }
    }

    $scope.handleSyncAdapterLink = function(link, completion) {
      var params = parametersFromURL(link);
      var ext = new SyncAdapter({content: params});
      ext.setDirty(true);
      modelManager.addItem(ext);
      syncManager.sync();
      completion();
    }

    $scope.handleThemeLink = function(link, completion) {
      themeManager.submitTheme(link);
      completion();
    }

    $scope.handleComponentLink = function(link, completion) {
      componentManager.installComponent(link);
      completion();
    }

    $scope.handleActionLink = function(link, completion) {
      if(link) {
        extensionManager.addExtension(link, function(response){
          if(!response) {
            alert("Unable to register this extension. Make sure the link is valid and try again.");
          } else {
            completion();
          }
        })
      }
    }

    $scope.handleEditorLink = function(link, completion) {
      editorManager.addNewEditorFromURL(link);
      completion();
    }

  }

}

angular.module('app.frontend').directive('globalExtensionsMenu', () => new GlobalExtensionsMenu);
