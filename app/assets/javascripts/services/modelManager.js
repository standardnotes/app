import _ from 'lodash';
import { SFModelManager, SNSmartTag, SFPredicate } from 'snjs';

export class ModelManager extends SFModelManager {
  /* @ngInject */
  constructor(storageManager, $timeout) {
    super($timeout);
    this.notes = [];
    this.tags = [];
    this.components = [];

    this.storageManager = storageManager;

    this.buildSystemSmartTags();
  }

  handleSignout() {
    super.handleSignout();
    this.notes.length = 0;
    this.tags.length = 0;
    this.components.length = 0;
  }

  noteCount() {
    return this.notes.filter((n) => !n.dummy).length;
  }

  removeAllItemsFromMemory() {
    for(var item of this.items) {
      item.deleted = true;
    }
    this.notifySyncObserversOfModels(this.items);
    this.handleSignout();
  }

  findTag(title) {
    return _.find(this.tags, { title: title });
  }

  findOrCreateTagByTitle(title) {
    let tag = this.findTag(title);
    if(!tag) {
      tag = this.createItem({content_type: "Tag", content: {title: title}});
      this.addItem(tag);
      this.setItemDirty(tag, true);
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
              else return '';
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
      else return '';
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

  notesMatchingSmartTag(tag) {
    let contentTypePredicate = new SFPredicate("content_type", "=", "Note");
    let predicates = [contentTypePredicate, tag.content.predicate];
    if(!tag.content.isTrashTag) {
      let notTrashedPredicate = new SFPredicate("content.trashed", "=", false);
      predicates.push(notTrashedPredicate);
    }
    let results = this.itemsMatchingPredicates(predicates);
    return results;
  }

  trashSmartTag() {
    return this.systemSmartTags.find((tag) => tag.content.isTrashTag);
  }

  trashedItems() {
    return this.notesMatchingSmartTag(this.trashSmartTag());
  }

  emptyTrash() {
    let notes = this.trashedItems();
    for(let note of notes) {
      this.setItemToBeDeleted(note);
    }
  }

  buildSystemSmartTags() {
    this.systemSmartTags = SNSmartTag.systemSmartTags();
  }

  getSmartTagWithId(id) {
    return this.getSmartTags().find((candidate) => candidate.uuid == id);
  }

  getSmartTags() {
    let userTags = this.validItemsForContentType("SN|SmartTag").sort((a, b) => {
      return a.content.title < b.content.title ? -1 : 1;
    });
    return this.systemSmartTags.concat(userTags);
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
      "SF|MFA" : "two-factor authentication setting",
      "SN|FileSafe|Credentials": "FileSafe credential",
      "SN|FileSafe|FileMetadata": "FileSafe file",
      "SN|FileSafe|Integration": "FileSafe integration"
    }[contentType];
  }
}
