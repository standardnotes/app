class Theme extends Item {

  constructor(json_obj) {
    super(json_obj);
  }

  mapContentToLocalProperties(content) {
    super.mapContentToLocalProperties(content)
    this.url = content.url;
    this.name = content.name;
    this.local = content.local;
  }

  structureParams() {
    var params = {
      url: this.url,
      name: this.name,
      local: this.local
    };

    _.merge(params, super.structureParams());
    return params;
  }

  toJSON() {
    return {uuid: this.uuid}
  }

  get content_type() {
    return "SN|Theme";
  }
}
