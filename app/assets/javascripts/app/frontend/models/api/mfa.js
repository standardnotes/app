class Mfa extends Item {

  constructor(json_obj) {
    super(json_obj);
  }

  mapContentToLocalProperties(content) {
    super.mapContentToLocalProperties(content)
    this.name = content.name;
  }

  structureParams() {
    var params = {
      name: this.name,
    };

    _.merge(params, super.structureParams());
    return params;
  }

  toJSON() {
    return {uuid: this.uuid}
  }

  get content_type() {
    return "SN|MFA";
  }

  doNotEncrypt() {
    return true;
  }

}
