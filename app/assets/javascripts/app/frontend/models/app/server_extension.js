class ServerExtension extends Item {

  constructor(json_obj) {
    super(json_obj);
  }

  mapContentToLocalProperties(contentObject) {
    super.mapContentToLocalProperties(contentObject)
    this.url = contentObject.url;
    this.name = contentObject.name;
  }

  structureParams() {
    var params = {
      url: this.url,
      name: this.name
    };

    _.merge(params, super.structureParams());
    return params;
  }

  toJSON() {
    return {uuid: this.uuid}
  }

  get content_type() {
    return "SF|Extension";
  }

  get encrypt() {
    // server needs to be able to read this
    return false;
  }
}
