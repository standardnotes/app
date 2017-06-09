class Component extends Item {

  constructor(json_obj) {
    super(json_obj);
  }

  mapContentToLocalProperties(contentObject) {
    super.mapContentToLocalProperties(contentObject)
    this.url = contentObject.url;
    this.name = contentObject.name;
    this.area = contentObject.area;
    this.permissions = contentObject.permissions;
    this.active = contentObject.active;
  }

  structureParams() {
    var params = {
      url: this.url,
      name: this.name,
      area: this.area,
      permissions: this.permissions,
      active: this.active,
    };

    _.merge(params, super.structureParams());
    return params;
  }

  toJSON() {
    return {uuid: this.uuid}
  }

  get content_type() {
    return "SN|Component";
  }
}
