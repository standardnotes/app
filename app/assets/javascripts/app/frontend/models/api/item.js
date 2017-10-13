let AppDomain = "org.standardnotes.sn";
var dateFormatter;

class Item {

  constructor(json_obj = {}) {
    this.appData = {};
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

    try {
      return JSON.parse(this.content);
    } catch (e) {
      console.log("Error parsing json", e, this);
      return {};
    }
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
    this.appData = contentObj.appData;
    if(!this.appData) {
      this.appData = {};
    }
  }

  createContentJSONFromProperties() {
    return this.structureParams();
  }

  referenceParams() {
    // must override
  }

  structureParams() {
    return {
      references: this.referenceParams(),
      appData: this.appData
    }
  }

  addItemAsRelationship(item) {
    // must override
  }

  removeItemAsRelationship(item) {
    // must override
  }

  isBeingRemovedLocally() {

  }

  removeAllRelationships() {
    // must override
    this.setDirty(true);
  }

  removeReferencesNotPresentIn(references) {

  }

  mergeMetadataFromItem(item) {
    _.merge(this, _.omit(item, ["content"]));
  }

  informReferencesOfUUIDChange(oldUUID, newUUID) {
    // optional override
  }

  potentialItemOfInterestHasChangedItsUUID(newItem, oldUUID, newUUID) {
    // optional override
  }

  allReferencedObjects() {
    // must override
    return [];
  }

  doNotEncrypt() {
    return false;
  }

  /*
  App Data
  */

  setAppDataItem(key, value) {
    var data = this.appData[AppDomain];
    if(!data) {
      data = {}
    }
    data[key] = value;
    this.appData[AppDomain] = data;
  }

  getAppDataItem(key) {
    var data = this.appData[AppDomain];
    if(data) {
      return data[key];
    } else {
      return null;
    }
  }

  get pinned() {
    return this.getAppDataItem("pinned");
  }

  get archived() {
    return this.getAppDataItem("archived");
  }



  /*
  Dates
  */

  createdAtString() {
    return this.dateToLocalizedString(this.created_at);
  }

  updatedAtString() {
    return this.dateToLocalizedString(this.updated_at);
  }

  dateToLocalizedString(date) {
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      if (!dateFormatter) {
        var locale = (navigator.languages && navigator.languages.length) ? navigator.languages[0] : navigator.language;
        dateFormatter = new Intl.DateTimeFormat(locale, {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          weekday: 'long',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      return dateFormatter.format(date);
    } else {
      // IE < 11, Safari <= 9.0.
      // In English, this generates the string most similar to
      // the toLocaleDateString() result above.
      return date.toDateString() + ' ' + date.toLocaleTimeString();
    }
  }

}
