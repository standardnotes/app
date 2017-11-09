class MigrationManager {

  constructor($rootScope, modelManager, syncManager, componentManager) {
    this.$rootScope = $rootScope;
    this.modelManager = modelManager;
    this.syncManager = syncManager;
    this.componentManager = componentManager;

    this.migrators = [];

    this.addEditorToComponentMigrator();

    this.modelManager.addItemSyncObserver("migration-manager", "*", (allItems, validItems, deletedItems) => {
      for(var migrator of this.migrators) {
        var items = allItems.filter((item) => {return item.content_type == migrator.content_type});
        if(items.length > 0) {
          migrator.handler(items);
        }
      }
    });
  }

  /*
  Migrate SN|Editor to SN|Component. Editors are deprecated as of November 2017. Editors using old APIs must
  convert to using the new component API.
  */

  addEditorToComponentMigrator() {
    this.migrators.push({
      content_type: "SN|Editor",

      handler: (editors) => {
        // Convert editors to components
        for(var editor of editors) {
          // If there's already a component for this url, then skip this editor
          if(editor.url && !this.componentManager.componentForUrl(editor.url)) {
            var component = this.modelManager.createItem({
              content_type: "SN|Component",
              url: editor.url,
              name: editor.name,
              area: "editor-editor"
            })
            component.setAppDataItem("data", editor.data);
            component.setDirty(true);
            this.modelManager.addItem(component);
            console.log("Created component", component, "From editor", editor);
          }
        }

        for(let editor of editors) {
          editor.setItemToBeDeleted();
        }

        this.syncManager.sync();
      }
    })
  }


}

angular.module('app.frontend').service('migrationManager', MigrationManager);
