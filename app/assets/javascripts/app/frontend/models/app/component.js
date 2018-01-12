class Component extends Item {

  constructor(json_obj) {
    super(json_obj);

    if(!this.componentData) {
      this.componentData = {};
    }

    if(!this.disassociatedItemIds) {
      this.disassociatedItemIds = [];
    }

    if(!this.associatedItemIds) {
      this.associatedItemIds = [];
    }
  }

  mapContentToLocalProperties(content) {
    super.mapContentToLocalProperties(content)
    /* Legacy */
    this.url = content.url;
    /* New */
    this.local_url = content.local_url;
    this.hosted_url = content.hosted_url;
    this.offlineOnly = content.offlineOnly;

    this.name = content.name;
    this.autoupdateDisabled = content.autoupdateDisabled;

    this.package_info = content.package_info;

    // the location in the view this component is located in. Valid values are currently tags-list, note-tags, and editor-stack`
    this.area = content.area;

    this.permissions = content.permissions;
    this.active = content.active;

    // custom data that a component can store in itself
    this.componentData = content.componentData || {};

    // items that have requested a component to be disabled in its context
    this.disassociatedItemIds = content.disassociatedItemIds || [];

    // items that have requested a component to be enabled in its context
    this.associatedItemIds = content.associatedItemIds || [];
  }

  structureParams() {
    var params = {
      url: this.url,
      hosted_url: this.hosted_url,
      local_url: this.local_url,
      offlineOnly: this.offlineOnly,
      name: this.name,
      area: this.area,
      package_info: this.package_info,
      permissions: this.permissions,
      active: this.active,
      autoupdateDisabled: this.autoupdateDisabled,
      componentData: this.componentData,
      disassociatedItemIds: this.disassociatedItemIds,
      associatedItemIds: this.associatedItemIds,
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

  isEditor() {
    return this.area == "editor-editor";
  }

  isDefaultEditor() {
    return this.getAppDataItem("defaultEditor") == true;
  }

  setRoomLastSize(size) {
    this.setAppDataItem("lastRoomSize", size);
  }

  getRoomLastSize() {
    return this.getAppDataItem("lastRoomSize");
  }


  /*
    An associative component depends on being explicitly activated for a given item, compared to a dissaciative component,
    which is enabled by default in areas unrelated to a certain item.
   */
   static associativeAreas() {
     return ["editor-editor"];
   }

  isAssociative() {
    return Component.associativeAreas().includes(this.area);
  }

  associateWithItem(item) {
    this.associatedItemIds.push(item.uuid);
  }

  isActiveForItem(item) {
    if(this.isAssociative()) {
      return this.associatedItemIds.indexOf(item.uuid) !== -1;
    } else {
      return this.disassociatedItemIds.indexOf(item.uuid) === -1;
    }
  }
}
