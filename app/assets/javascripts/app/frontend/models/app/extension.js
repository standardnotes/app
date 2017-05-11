class Action {
  constructor(json) {
    _.merge(this, json);
    this.running = false; // in case running=true was synced with server since model is uploaded nondiscriminatory
    this.error = false;
    if(this.lastExecuted) {
      // is string
      this.lastExecuted = new Date(this.lastExecuted);
    }
  }

  permissionsString() {
    if(!this.permissions) {
      return "";
    }

    var permission = this.permissions.charAt(0).toUpperCase() + this.permissions.slice(1); // capitalize first letter
    permission += ": ";
    for(var contentType of this.content_types) {
      if(contentType == "*") {
        permission += "All items";
      } else {
        permission += contentType;
      }

      permission += " ";
    }

    return permission;
  }

  encryptionModeString() {
    if(this.verb != "post") {
      return null;
    }
    var encryptionMode = "This action accepts data ";
    if(this.accepts_encrypted && this.accepts_decrypted) {
      encryptionMode += "encrypted or decrypted.";
    } else {
      if(this.accepts_encrypted) {
        encryptionMode += "encrypted.";
      } else {
        encryptionMode += "decrypted.";
      }
    }
    return encryptionMode;
  }

}

class Extension extends Item {
  constructor(json) {
      super(json);
      _.merge(this, json);

      this.encrypted = true;
      this.content_type = "Extension";

      if(json.actions) {
        this.actions = json.actions.map(function(action){
          return new Action(action);
        })
      }
  }

  actionsInGlobalContext() {
    return this.actions.filter(function(action){
      return action.context == "global";
    })
  }

  actionsWithContextForItem(item) {
    return this.actions.filter(function(action){
      return action.context == item.content_type || action.context == "Item";
    })
  }

  mapContentToLocalProperties(contentObject) {
    super.mapContentToLocalProperties(contentObject)
    this.name = contentObject.name;
    this.description = contentObject.description;
    this.url = contentObject.url;
    this.supported_types = contentObject.supported_types;
    if(contentObject.actions) {
      this.actions = contentObject.actions.map(function(action){
        return new Action(action);
      })
    } else {
      this.actions = [];
    }
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
      description: this.description,
      actions: this.actions,
      supported_types: this.supported_types
    };

    _.merge(params, super.structureParams());
    return params;
  }

}
