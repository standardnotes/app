class ItemParams {

  constructor(item, keys, version) {
    this.item = item;
    this.keys = keys;
    this.version = version || SFJS.version();
  }

  async paramsForExportFile(includeDeleted) {
    this.additionalFields = ["updated_at"];
    this.forExportFile = true;
    if(includeDeleted) {
      return this.__params();
    } else {
      var result = await this.__params();
      return _.omit(result, ["deleted"]);
    }
  }

  async paramsForExtension() {
    return this.paramsForExportFile();
  }

  async paramsForLocalStorage() {
    this.additionalFields = ["updated_at", "dirty", "errorDecrypting"];
    this.forExportFile = true;
    return this.__params();
  }

  async paramsForSync() {
    return this.__params();
  }

  async __params() {

    console.assert(!this.item.dummy, "Item is dummy, should not have gotten here.", this.item.dummy)

    var params = {uuid: this.item.uuid, content_type: this.item.content_type, deleted: this.item.deleted, created_at: this.item.created_at};
    if(!this.item.errorDecrypting) {
      // Items should always be encrypted for export files. Only respect item.doNotEncrypt for remote sync params.
      var doNotEncrypt = this.item.doNotEncrypt() && !this.forExportFile;
      if(this.keys && !doNotEncrypt) {
        var encryptedParams = await SFJS.itemTransformer.encryptItem(this.item, this.keys, this.version);
        _.merge(params, encryptedParams);

        if(this.version !== "001") {
          params.auth_hash = null;
        }
      }
      else {
        params.content = this.forExportFile ? this.item.createContentJSONFromProperties() : "000" + await SFJS.crypto.base64(JSON.stringify(this.item.createContentJSONFromProperties()));
        if(!this.forExportFile) {
          params.enc_item_key = null;
          params.auth_hash = null;
        }
      }
    } else {
      // Error decrypting, keep "content" and related fields as is (and do not try to encrypt, otherwise that would be undefined behavior)
      params.content = this.item.content;
      params.enc_item_key = this.item.enc_item_key;
      params.auth_hash = this.item.auth_hash;
    }

    if(this.additionalFields) {
      _.merge(params, _.pick(this.item, this.additionalFields));
    }

    return params;
  }


}
