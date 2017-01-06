class Action {
  constructor(json) {
      _.merge(this, json);

      this.running = false; // in case running=true was synced with server since model is uploaded nondiscriminatory
      this.actionVerb = this.type;

      var comps = this.type.split(":");
      if(comps.length > 1) {

        this.actionType = comps[0]; // 'watch', 'poll', or 'all'
        this.repeatable = this.actionType == "watch" || this.actionType == "poll";
        this.actionVerb = comps[1]; // http verb : "get", "post", "show"
        this.repeatFrequency = comps[2];
      }
  }

  structureContentTypes() {
    return this.structures.map(function(structure){
      return structure.type;
    })
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
