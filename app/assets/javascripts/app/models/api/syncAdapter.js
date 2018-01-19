class SyncAdapter extends Item {

  constructor(json_obj) {
    super(json_obj);
  }

  mapContentToLocalProperties(content) {
    super.mapContentToLocalProperties(content)
    this.url = content.url;
  }

  structureParams() {
    // There was a bug with the way Base64 content was parsed in previous releases related to this item.
    // The bug would not parse the JSON behind the base64 string and thus saved data in an invalid format.
    // This is the line: https://github.com/standardnotes/web/commit/1ad0bf73d8e995b7588854f1b1e4e4a02303a42f#diff-15753bac364782a3a5876032bcdbf99aR76
    // We'll remedy this for affected users by trying to parse the content string
    if(typeof this.content !== 'object') {
      try {
        this.content = JSON.parse(this.content);
      } catch (e) {}
    }
    var params = this.content || {};
    _.merge(params, super.structureParams());
    return params;
  }

  toJSON() {
    return {uuid: this.uuid}
  }

  get content_type() {
    return "SF|Extension";
  }

  doNotEncrypt() {
    return true;
  }
}
