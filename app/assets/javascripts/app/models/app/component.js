class Component extends SFItem {

  constructor(json_obj) {
    // If making a copy of an existing component (usually during sign in if you have a component active in the session),
    // which may have window set, you may get a cross-origin exception since you'll be trying to copy the window. So we clear it here.
    json_obj.window = null;

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
    this.url = content.url || content.hosted_url;

    /* New */
    this.local_url = content.local_url;
    this.hosted_url = content.hosted_url || content.url;
    this.offlineOnly = content.offlineOnly;

    if(content.valid_until) {
      this.valid_until = new Date(content.valid_until);
    }

    this.name = content.name;
    this.autoupdateDisabled = content.autoupdateDisabled;

    this.package_info = content.package_info;

    // the location in the view this component is located in. Valid values are currently tags-list, note-tags, and editor-stack`
    this.area = content.area;

    this.permissions = content.permissions;
    if(!this.permissions) {
      this.permissions = [];
    }

    this.active = content.active;

    // custom data that a component can store in itself
    this.componentData = content.componentData || {};

    // items that have requested a component to be disabled in its context
    this.disassociatedItemIds = content.disassociatedItemIds || [];

    // items that have requested a component to be enabled in its context
    this.associatedItemIds = content.associatedItemIds || [];
  }

  handleDeletedContent() {
    super.handleDeletedContent();

    this.active = false;
  }

  structureParams() {
    var params = {
      url: this.url,
      hosted_url: this.hosted_url,
      local_url: this.local_url,
      valid_until: this.valid_until,
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

    var superParams = super.structureParams();
    Object.assign(superParams, params);
    return superParams;
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

  isTheme() {
    return this.content_type == "SN|Theme" || this.area == "themes";
  }

  isDefaultEditor() {
    return this.getAppDataItem("defaultEditor") == true;
  }

  setLastSize(size) {
    this.setAppDataItem("lastSize", size);
  }

  getLastSize() {
    return this.getAppDataItem("lastSize");
  }

  keysToIgnoreWhenCheckingContentEquality() {
    return ["active"].concat(super.keysToIgnoreWhenCheckingContentEquality());
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

  isExplicitlyEnabledForItem(item) {
    return this.associatedItemIds.indexOf(item.uuid) !== -1;
  }

  isExplicitlyDisabledForItem(item) {
    return this.disassociatedItemIds.indexOf(item.uuid) !== -1;
  }
}
