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

  static filterDummyNotes(notes) {
    var filtered = notes.filter(function(note){return note.dummy == false || note.dummy == null});
    return filtered;
  }

  referencesAffectedBySharingChange() {
    return super.referencesAffectedBySharingChange();
  }

  get hasOnePublicTag() {
    for (var tag of this.tags) {
      if(tag.isPublic()) {
        return true
      }
    }
    return false;
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

  isSharedIndividually() {
    return this.presentation_name;
  }

  isPublic() {
    return super.isPublic() || this.hasOnePublicTag;
  }

  get content_type() {
    return "Note";
  }
}
