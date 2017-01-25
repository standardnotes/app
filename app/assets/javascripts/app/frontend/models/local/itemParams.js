class ItemParams {

  constructor(item, ek, encryptionHelper) {
    this.item = item;
    this.ek = ek;
    this.encryptionHelper = encryptionHelper;
  }

  paramsForExportFile() {
    this.additionalFields = ["created_at", "updated_at"];
    this.forExportFile = true;
    return _.omit(this.__params(), ["deleted"]);
  }

  paramsForExtension() {
    return this.paramsForExportFile();
  }

  paramsForSync() {
    return __params(null, false);
  }

  __params() {
    var itemCopy = _.cloneDeep(this.item);

    console.assert(!item.dummy, "Item is dummy, should not have gotten here.", item.dummy)

    var params = {uuid: item.uuid, content_type: item.content_type, deleted: item.deleted};

    if(this.ek) {
      this.encryptionHelper.encryptItem(itemCopy, this.ek);
      params.content = itemCopy.content;
      params.enc_item_key = itemCopy.enc_item_key;
      params.auth_hash = itemCopy.auth_hash;
    }
    else {
      params.content = this.forExportFile ? itemCopy.createContentJSONFromProperties() : "000" + Neeto.crypto.base64(JSON.stringify(itemCopy.createContentJSONFromProperties()));
      if(!this.forExportFile) {
        params.enc_item_key = null;
        params.auth_hash = null;
      }
    }

    if(this.additionalFields) {
      _.merge(params, _.pick(item, this.additionalFields));
    }

    return params;
  }


}
