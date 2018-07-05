SFModelManager.ContentTypeClassMapping = {
  "Note" : Note,
  "Tag" : Tag,
  "SN|SmartTag" : SmartTag,
  "Extension" : Extension,
  "SN|Editor" : Editor,
  "SN|Theme" : Theme,
  "SN|Component" : Component,
  "SF|Extension" : ServerExtension,
  "SF|MFA" : Mfa
};

SFItem.AppDomain = "org.standardnotes.sn";

class ModelManager extends SFModelManager {

  constructor(storageManager) {
    super();
    this.notes = [];
    this.tags = [];
    this._extensions = [];

    this.storageManager = storageManager;
  }

  resetLocalMemory() {
    super.resetLocalMemory();
    this.notes.length = 0;
    this.tags.length = 0;
    this._extensions.length = 0;
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
        } else if(item.content_type == "Extension") {
          if(!_.find(this._extensions, {uuid: item.uuid})) {
            this._extensions.unshift(item);
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

  get filteredNotes() {
    return Note.filterDummyNotes(this.notes);
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
    } else if(item.content_type == "Extension") {
      _.remove(this._extensions, {uuid: item.uuid});
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
