SFModelManager.ContentTypeClassMapping = {
  "Note" : SNNote,
  "Tag" : SNTag,
  "SN|SmartTag" : SNSmartTag,
  "Extension" : SNExtension,
  "SN|Editor" : SNEditor,
  "SN|Theme" : SNTheme,
  "SN|Component" : SNComponent,
  "SF|Extension" : SNServerExtension,
  "SF|MFA" : SNMfa
};

SFItem.AppDomain = "org.standardnotes.sn";

class ModelManager extends SFModelManager {

  constructor(storageManager, $timeout) {
    super($timeout);
    this.notes = [];
    this.tags = [];
    this.components = [];

    this.storageManager = storageManager;
  }

  handleSignout() {
    super.handleSignout();
    this.notes.length = 0;
    this.tags.length = 0;
    this.components.length = 0;
  }

  noteCount() {
    return this.notes.length;
  }

  removeAllItemsFromMemory() {
    for(var item of this.items) {
      item.deleted = true;
    }
    this.notifySyncObserversOfModels(this.items);
    this.handleSignout();
  }

  findOrCreateTagByTitle(title) {
    var tag = _.find(this.tags, {title: title})
    if(!tag) {
      tag = this.createItem({content_type: "Tag", content: {title: title}});
      tag.setDirty(true);
      this.addItem(tag);
    }
    return tag;
  }

  addItems(items, globalOnly = false) {
    super.addItems(items, globalOnly);

    items.forEach((item) => {
      // In some cases, you just want to add the item to this.items, and not to the individual arrays
      // This applies when you want to keep an item syncable, but not display it via the individual arrays
      if(!globalOnly) {
        if(item.content_type == "Tag") {
          if(!_.find(this.tags, {uuid: item.uuid})) {
            this.tags.splice(_.sortedIndexBy(this.tags, item, function(item){
              if (item.title) return item.title.toLowerCase();
              else return ''
            }), 0, item);
          }
        } else if(item.content_type == "Note") {
          if(!_.find(this.notes, {uuid: item.uuid})) {
            this.notes.unshift(item);
          }
        } else if(item.content_type == "SN|Component") {
          if(!_.find(this.components, {uuid: item.uuid})) {
            this.components.unshift(item);
          }
        }
      }
    });
  }

  resortTag(tag) {
    _.pull(this.tags, tag);
    this.tags.splice(_.sortedIndexBy(this.tags, tag, function(tag){
      if (tag.title) return tag.title.toLowerCase();
      else return ''
    }), 0, tag);
  }

  setItemToBeDeleted(item) {
    super.setItemToBeDeleted(item);

    // remove from relevant array, but don't remove from all items.
    // This way, it's removed from the display, but still synced via get dirty items
    this.removeItemFromRespectiveArray(item);
  }

  removeItemLocally(item, callback) {
    super.removeItemLocally(item, callback);

    this.removeItemFromRespectiveArray(item);

    this.storageManager.deleteModel(item).then(callback);
  }

  removeItemFromRespectiveArray(item) {
    if(item.content_type == "Tag") {
      _.remove(this.tags, {uuid: item.uuid});
    } else if(item.content_type == "Note") {
      _.remove(this.notes, {uuid: item.uuid});
    } else if(item.content_type == "SN|Component") {
      _.remove(this.components, {uuid: item.uuid});
    }
  }

  notesMatchingPredicate(predicate) {
    let contentTypePredicate = new SFPredicate("content_type", "=", "Note");
    return this.itemsMatchingPredicates([contentTypePredicate, predicate]);
  }

  /*
  Misc
  */

  humanReadableDisplayForContentType(contentType) {
    return {
      "Note" : "note",
      "Tag" : "tag",
      "SN|SmartTag": "smart tag",
      "Extension" : "action-based extension",
      "SN|Component" : "component",
      "SN|Editor" : "editor",
      "SN|Theme" : "theme",
      "SF|Extension" : "server extension",
      "SF|MFA" : "two-factor authentication setting"
    }[contentType];
  }

}

angular.module('app').service('modelManager', ModelManager);
