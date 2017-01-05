class Extension extends Item {
  constructor(json) {
      _.merge(this, json);

      this.actions = this.actions.map(function(action){
        return new Action(action);
      })
  }
}

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
