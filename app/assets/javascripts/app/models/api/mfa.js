class Mfa extends SFItem {

  constructor(json_obj) {
    super(json_obj);
  }

  // mapContentToLocalProperties(content) {
  //   super.mapContentToLocalProperties(content)
  //   this.serverContent = content;
  // }
  //
  // structureParams() {
  //   return _.merge(this.serverContent, super.structureParams());
  // }

  toJSON() {
    return {uuid: this.uuid}
  }

  get content_type() {
    return "SF|MFA";
  }

  doNotEncrypt() {
    return true;
  }

}
