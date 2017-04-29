class Note extends Item {

  constructor(json_obj) {
    super(json_obj);

    if(!this.tags) {
      this.tags = [];
    }
  }

  mapContentToLocalProperties(contentObject) {
    super.mapContentToLocalProperties(contentObject)
    this.title = contentObject.title;
    this.text = contentObject.text;
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

    _.merge(params, super.structureParams());
    return params;
  }

  addItemAsRelationship(item) {
    if(item.content_type == "Tag") {
      if(!_.find(this.tags, item)) {
        this.tags.push(item);
      }
    }
    super.addItemAsRelationship(item);
  }

  removeItemAsRelationship(item) {
    if(item.content_type == "Tag") {
      _.pull(this.tags, item);
    }
    super.removeItemAsRelationship(item);
  }

  removeAllRelationships() {
    this.tags.forEach(function(tag){
      _.pull(tag.notes, this);
      tag.setDirty(true);
    }.bind(this))
    this.tags = [];
  }

  locallyClearAllReferences() {
    super.locallyClearAllReferences();
    this.tags.forEach(function(tag){
     _.pull(tag.notes, this);
    }.bind(this))
    this.tags = [];
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
    for(var tag of this.tags) {
      _.pull(tag.notes, {uuid: oldUUID});
      tag.notes.push(this);
    }
  }

  allReferencedObjects() {
    return this.tags;
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
}
