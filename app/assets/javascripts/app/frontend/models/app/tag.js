class Tag extends Item {

  constructor(json_obj) {
    super(json_obj);

    if(!this.notes) {
      this.notes = [];
    }
  }

  mapContentToLocalProperties(contentObject) {
    super.mapContentToLocalProperties(contentObject)
    this.title = contentObject.title;
  }

  referenceParams() {
    var references = _.map(this.notes, function(note){
      return {uuid: note.uuid, content_type: note.content_type};
    })
    return references;
  }

  structureParams() {
    var params = {
      title: this.title
    };

    _.merge(params, super.structureParams());
    return params;
  }

  addItemAsRelationship(item) {
    if(item.content_type == "Note") {
      if(!_.find(this.notes, item)) {
        this.notes.unshift(item);
      }
    }
    super.addItemAsRelationship(item);
  }

  removeItemAsRelationship(item) {
    if(item.content_type == "Note") {
      _.pull(this.notes, item);
    }
    super.removeItemAsRelationship(item);
  }

  removeFromRelationships() {
    this.notes.forEach(function(note){
      _.pull(note.tags, this);
      note.dirty = true;
    })
  }

  get content_type() {
    return "Tag";
  }

  referencesAffectedBySharingChange() {
    return this.notes;
  }
}
