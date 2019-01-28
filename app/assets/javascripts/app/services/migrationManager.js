class MigrationManager extends SFMigrationManager {

  constructor($rootScope, modelManager, syncManager, componentManager, storageManager) {
    super(modelManager, syncManager, storageManager);
    this.componentManager = componentManager;
  }

  registeredMigrations() {
    return [
      this.editorToComponentMigration(),
      this.componentUrlToHostedUrl()
    ];
  }

  /*
  Migrate SN|Editor to SN|Component. Editors are deprecated as of November 2017. Editors using old APIs must
  convert to using the new component API.
  */

  editorToComponentMigration() {
    return {
      name: "editor-to-component",
      content_type: "SN|Editor",
      handler: async (editors) => {
        // Convert editors to components
        for(var editor of editors) {
          // If there's already a component for this url, then skip this editor
          if(editor.url && !this.componentManager.componentForUrl(editor.url)) {
            var component = this.modelManager.createItem({
              content_type: "SN|Component",
              content: {
                url: editor.url,
                name: editor.name,
                area: "editor-editor"
              }
            })
            component.setAppDataItem("data", editor.data);
            component.setDirty(true);
            this.modelManager.addItem(component);
          }
        }

        for(let editor of editors) {
          this.modelManager.setItemToBeDeleted(editor);
        }

        this.syncManager.sync();
      }
    }
  }

  /*
  Migrate component.url fields to component.hosted_url. This involves rewriting any note data that relied on the
  component.url value to store clientData, such as the CodeEditor, which stores the programming language for the note
  in the note's clientData[component.url]. We want to rewrite any matching items to transfer that clientData into
  clientData[component.uuid].
  Created: July 6, 2018
  */
  componentUrlToHostedUrl() {
    return {
      name: "component-url-to-hosted-url",
      content_type: "SN|Component",
      handler: async (components) => {
        let hasChanges = false;
        var notes = this.modelManager.validItemsForContentType("Note");
        for(var note of notes) {
          for(var component of components) {
            var clientData = note.getDomainDataItem(component.hosted_url, ComponentManager.ClientDataDomain);
            if(clientData) {
              note.setDomainDataItem(component.uuid, clientData, ComponentManager.ClientDataDomain);
              note.setDomainDataItem(component.hosted_url, null, ComponentManager.ClientDataDomain);
              note.setDirty(true, true); // dont update client date
              hasChanges = true;
            }
          }
        }

        if(hasChanges) {
          this.syncManager.sync();
        }
      }
    }
  }
}

angular.module('app').service('migrationManager', MigrationManager);
