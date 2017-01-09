class Item {

  constructor(json_obj) {

    this.updateFromJSON(json_obj);

    this.observers = [];

    if(!this.uuid) {
      this.uuid = Neeto.crypto.generateUUID();
    }
  }

  static sortItemsByDate(items) {
    items.sort(function(a,b){
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }

  get contentObject() {
    if(!this.content) {
      return {};
    }

    if(this.content !== null && typeof this.content === 'object') {
      // this is the case when mapping localStorage content, in which case the content is already parsed
      return this.content;
    }

    return JSON.parse(this.content);
  }

  updateFromJSON(json) {
    _.merge(this, json);
    if(this.created_at) {
      this.created_at = new Date(this.created_at);
      this.updated_at = new Date(this.updated_at);
    } else {
      this.created_at = new Date();
      this.updated_at = new Date();
    }

    if(json.content) {
      this.mapContentToLocalProperties(this.contentObject);
    }
  }

  alternateUUID() {
      this.uuid = Neeto.crypto.generateUUID();
  }

  setDirty(dirty) {
    this.dirty = dirty;

    if(dirty) {
      this.notifyObserversOfChange();
    }
  }

  markAllReferencesDirty() {
    this.allReferencedObjects().forEach(function(reference){
      reference.setDirty(true);
    })
  }
  addObserver(observer, callback) {
    if(!_.find(this.observers, observer)) {
      this.observers.push({observer: observer, callback: callback});
    }
  }

  removeObserver(observer) {
    _.remove(this.observers, {observer: observer})
  }

  notifyObserversOfChange() {
    for(var observer of this.observers) {
      observer.callback(this);
    }
  }

  mapContentToLocalProperties(contentObj) {

  }

  createContentJSONFromProperties() {
    return this.structureParams();
  }

  referenceParams() {
    // must override
  }

  structureParams() {
    return {references: this.referenceParams()}
  }

  addItemAsRelationship(item) {
    // must override
  }

  removeItemAsRelationship(item) {
    // must override
  }

  removeAllRelationships() {
    // must override
  }

  mergeMetadataFromItem(item) {
    _.merge(this, _.omit(item, ["content"]));
  }

  allReferencedObjects() {
    // must override
    return [];
  }

  referencesAffectedBySharingChange() {
    // should be overriden to determine which references should be decrypted/encrypted
    return [];
  }

  isPublic() {
    return this.presentation_name;
  }

  isEncrypted() {
    return this.encryptionEnabled() && this.content.substring(0, 3) === '001' ? true : false;
  }

  encryptionEnabled() {
    return this.enc_item_key;
  }

  presentationURL() {
    return this.presentation_url;
  }

}
