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
}

class Extension extends Component {
  constructor(json) {
      super(json);

      if(json.actions) {
        this.actions = json.actions.map(function(action){
          return new Action(action);
        })
      }

      if(!this.actions) {
        this.actions = [];
      }
  }

  actionsWithContextForItem(item) {
    return this.actions.filter(function(action){
      return action.context == item.content_type || action.context == "Item";
    })
  }

  mapContentToLocalProperties(content) {
    super.mapContentToLocalProperties(content)
    this.description = content.description;

    this.supported_types = content.supported_types;
    if(content.actions) {
      this.actions = content.actions.map(function(action){
        return new Action(action);
      })
    }
  }

  get content_type() {
    return "Extension";
  }

  structureParams() {
    var params = {
      description: this.description,
      actions: this.actions.map((a) => {return _.omit(a, ["subrows", "subactions"])}),
      supported_types: this.supported_types
    };

    _.merge(params, super.structureParams());
    return params;
  }

}
