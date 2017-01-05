class Action {
  constructor(json) {
      _.merge(this, json);

      var comps = this.type.split(":");
      if(comps.length > 0) {
        this.repeatable = true;
        this.repeatType = comps[0]; // 'watch' or 'poll'
        this.repeatVerb = comps[1]; // http verb
        this.repeatFrequency = comps[2];
      }
  }
}

class Extension extends Item {
  constructor(json) {
      super(json);
      _.merge(this, json);

      this.content_type = "Extension";
  }

  mapContentToLocalProperties(contentObject) {
    super.mapContentToLocalProperties(contentObject)
    this.name = contentObject.name;
    this.url = contentObject.url;
    this.actions = contentObject.actions.map(function(action){
      return new Action(action);
    })
  }

  updateFromExternalResponseItem(externalResponseItem) {
    _.merge(this, externalResponseItem);
    this.actions = externalResponseItem.actions.map(function(action){
      return new Action(action);
    })
  }

  referenceParams() {
    return null;
  }

  structureParams() {
    var params = {
      name: this.name,
      url: this.url,
      actions: this.actions
    };

    _.merge(params, super.structureParams());
    return params;
  }

}
