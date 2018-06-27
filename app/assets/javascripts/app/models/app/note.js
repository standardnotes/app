export class Note extends SFItem {

  constructor(json_obj) {
    super(json_obj);

    if(!this.text) {
      // Some external editors can't handle a null value for text.
      // Notes created on mobile with no text have a null value for it,
      // so we'll just set a default here.
      this.text = "";
    }

    if(!this.tags) {
      this.tags = [];
    }
  }

  mapContentToLocalProperties(content) {
    super.mapContentToLocalProperties(content)
    this.title = content.title;
    this.text = content.text;
  }

  structureParams() {
    var params = {
      title: this.title,
      text: this.text
    };

    var superParams = super.structureParams();
    Object.assign(superParams, params);
    return superParams;
  }

  addItemAsRelationship(item) {
    this.savedTagsString = null;

    if(item.content_type == "Tag") {
      if(!_.find(this.tags, {uuid: item.uuid})) {
        this.tags.push(item);
        item.notes.push(this);
      }
    }
    super.addItemAsRelationship(item);
  }

  removeItemAsRelationship(item) {
    this.savedTagsString = null;

    if(item.content_type == "Tag") {
      _.remove(this.tags, {uuid: item.uuid});
      _.remove(item.notes, {uuid: this.uuid});
    }
    super.removeItemAsRelationship(item);
  }

  updateLocalRelationships() {
    this.savedTagsString = null;

    var references = this.content.references;

    var uuids = references.map(function(ref){return ref.uuid});
    this.tags.slice().forEach(function(tag){
      if(!uuids.includes(tag.uuid)) {
        _.remove(tag.notes, {uuid: this.uuid});
        _.remove(this.tags, {uuid: tag.uuid});
      }
    }.bind(this))
  }

  isBeingRemovedLocally() {
    this.tags.forEach(function(tag){
      _.remove(tag.notes, {uuid: this.uuid});
    }.bind(this))
    super.isBeingRemovedLocally();
  }

  static filterDummyNotes(notes) {
    var filtered = notes.filter(function(note){return note.dummy == false || note.dummy == null});
    return filtered;
  }

  informReferencesOfUUIDChange(oldUUID, newUUID) {
    super.informReferencesOfUUIDChange();
    for(var tag of this.tags) {
      _.remove(tag.notes, {uuid: oldUUID});
      tag.notes.push(this);
    }
  }

  safeText() {
    return this.text || "";
  }

  safeTitle() {
    return this.title || "";
  }

  toJSON() {
    return {uuid: this.uuid}
  }

  tagsString() {
    this.savedTagsString = Tag.arrayToDisplayString(this.tags);
    return this.savedTagsString;
  }
}
