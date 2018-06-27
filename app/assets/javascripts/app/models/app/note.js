class Note extends Item {

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

  referenceParams() {
    var references = _.map(this.tags, function(tag){
      return {uuid: tag.uuid, content_type: tag.content_type};
    })

    return references;
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
      if(!_.find(this.tags, item)) {
        this.tags.push(item);
      }
    }
    super.addItemAsRelationship(item);
  }

  removeItemAsRelationship(item) {
    this.savedTagsString = null;

    if(item.content_type == "Tag") {
      _.pull(this.tags, item);
    }
    super.removeItemAsRelationship(item);
  }

  removeAndDirtyAllRelationships() {
    this.savedTagsString = null;

    this.tags.forEach(function(tag){
      _.pull(tag.notes, this);
      tag.setDirty(true);
    }.bind(this))
    this.tags = [];
  }

  removeReferencesNotPresentIn(references) {
    this.savedTagsString = null;

    super.removeReferencesNotPresentIn(references);

    var uuids = references.map(function(ref){return ref.uuid});
    this.tags.slice().forEach(function(tag){
      if(!uuids.includes(tag.uuid)) {
        _.pull(tag.notes, this);
        _.pull(this.tags, tag);
      }
    }.bind(this))
  }

  isBeingRemovedLocally() {
    this.tags.forEach(function(tag){
      _.pull(tag.notes, this);
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
      _.pull(tag.notes, {uuid: oldUUID});
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

  get content_type() {
    return "Note";
  }

  tagsString() {
    this.savedTagsString = Tag.arrayToDisplayString(this.tags);
    return this.savedTagsString;
  }
}
