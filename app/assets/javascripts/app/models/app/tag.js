class Tag extends Item {

  constructor(json_obj) {
    super(json_obj);

    if(!this.notes) {
      this.notes = [];
    }
  }

  mapContentToLocalProperties(content) {
    super.mapContentToLocalProperties(content)
    this.title = content.title;
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

  removeAndDirtyAllRelationships() {
    this.notes.forEach(function(note){
      _.pull(note.tags, this);
      note.setDirty(true);
    }.bind(this))

    this.notes = [];
  }

  removeReferencesNotPresentIn(references) {
    var uuids = references.map(function(ref){return ref.uuid});
    this.notes.slice().forEach(function(note){
      if(!uuids.includes(note.uuid)) {
        _.pull(note.tags, this);
        _.pull(this.notes, note);
      }
    }.bind(this))
  }

  isBeingRemovedLocally() {
    this.notes.forEach(function(note){
      _.pull(note.tags, this);
    }.bind(this))
    super.isBeingRemovedLocally();
  }

  informReferencesOfUUIDChange(oldUUID, newUUID) {
    for(var note of this.notes) {
      _.pull(note.tags, {uuid: oldUUID});
      note.tags.push(this);
    }
  }

  get content_type() {
    return "Tag";
  }

  allReferencedObjects() {
    return this.notes;
  }

  static arrayToDisplayString(tags) {
    return tags.sort((a, b) => {return a.title > b.title}).map(function(tag, i){
      return "#" + tag.title;
    }).join(" ");
  }
}
