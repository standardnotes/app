class UserPreferences extends Item {

  constructor(json_obj) {
    super(json_obj);
  }

  mapContentToLocalProperties(content) {
    super.mapContentToLocalProperties(content)
  }

  toJSON() {
    return {uuid: this.uuid}
  }

  get content_type() {
    return "SN|UserPreferences";
  }

  singleton() {
    return true;
  }
}
