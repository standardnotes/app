class MigrationManager extends SFMigrationManager {

  constructor($rootScope, modelManager, syncManager, componentManager, storageManager, statusManager, authManager, desktopManager) {
    super(modelManager, syncManager, storageManager, authManager);
    this.componentManager = componentManager;
    this.statusManager = statusManager;
    this.desktopManager = desktopManager;
  }

  registeredMigrations() {
    return [
      this.editorToComponentMigration(),
      this.componentUrlToHostedUrl(),
      this.removeTagReferencesFromNotes()
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

  April 3, 2019 note: it seems this migration is mis-named. The first part of the description doesn't match what the code is actually doing.
  It has nothing to do with url/hosted_url relationship and more to do with just mapping client data from the note's hosted_url to its uuid

  Created: July 6, 2018
  */
  componentUrlToHostedUrl() {
    return {
      name: "component-url-to-hosted-url",
      content_type: "SN|Component",
      handler: async (components) => {
        let hasChanges = false;
        let notes = this.modelManager.validItemsForContentType("Note");
        for(let note of notes) {
          for(let component of components) {
            let clientData = note.getDomainDataItem(component.hosted_url, ComponentManager.ClientDataDomain);
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



  /*
  Migrate notes which have relationships on tags to migrate those relationships to the tags themselves.
  That is, notes.content.references should not include any mention of tags.
  This will apply to notes created before the schema change. Now, only tags reference notes.
  Created: April 3, 2019
  */
  removeTagReferencesFromNotes() {
    return {
      name: "remove-tag-references-from-notes",
      content_type: "Note",
      handler: async (notes) => {

        let needsSync = false;
        let status = this.statusManager.addStatusFromString("Optimizing data...");
        let dirtyCount = 0;

        for(let note of notes) {
          if(!note.content) {
            continue;
          }

          let references = note.content.references;
          // Remove any tag references, and transfer them to the tag if neccessary.
          let newReferences = [];

          for(let reference of references)  {
            if(reference.content_type != "Tag") {
              newReferences.push(reference);
              continue;
            }

            // is Tag content_type, we will not be adding this to newReferences
            let tag = this.modelManager.findItem(reference.uuid);
            if(tag && !tag.hasRelationshipWithItem(note)) {
              tag.addItemAsRelationship(note);
              tag.setDirty(true, true);
              dirtyCount++;
            }
          }

          if(newReferences.length != references.length) {
            note.content.references = newReferences;
            note.setDirty(true, true);
            dirtyCount++;
          }
        }

        if(dirtyCount > 0) {
          if(isDesktopApplication()) {
            this.desktopManager.saveBackup();
          }

          status = this.statusManager.replaceStatusWithString(status, `${dirtyCount} items optimized.`);
          await this.syncManager.sync();
        }

        status = this.statusManager.replaceStatusWithString(status, `Optimization complete.`);
        setTimeout(() => {
          this.statusManager.removeStatus(status);
        }, 2000);

      }
    }
  }
}

angular.module('app').service('migrationManager', MigrationManager);
