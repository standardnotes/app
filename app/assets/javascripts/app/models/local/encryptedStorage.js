class EncryptedStorage extends Item {

  constructor(json_obj) {
    super(json_obj);
  }

  mapContentToLocalProperties(content) {
    super.mapContentToLocalProperties(content)
    this.storage = content.storage;
  }

  structureParams() {
    var params = {
      storage: this.storage,
    };

    _.merge(params, super.structureParams());
    return params;
  }

  toJSON() {
    return {uuid: this.uuid}
  }

  get content_type() {
    return "SN|EncryptedStorage";
  }
}
