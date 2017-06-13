class Component extends Item {

  constructor(json_obj) {
    super(json_obj);

    if(!this.componentData) {
      this.componentData = {};
    }

    if(!this.disassociatedItemIds) {
      this.disassociatedItemIds = [];
    }
  }

  mapContentToLocalProperties(contentObject) {
    super.mapContentToLocalProperties(contentObject)
    this.url = contentObject.url;
    this.name = contentObject.name;

    // the location in the view this component is located in. Valid values are currently tags-list, note-tags, and editor-stack`
    this.area = contentObject.area;

    this.permissions = contentObject.permissions;
    this.active = contentObject.active;

    // custom data that a component can store in itself
    this.componentData = contentObject.componentData || {};

    // items that have requested a component to be disabled in its context
    this.disassociatedItemIds = contentObject.disassociatedItemIds || [];
  }

  structureParams() {
    var params = {
      url: this.url,
      name: this.name,
      area: this.area,
      permissions: this.permissions,
      active: this.active,
      componentData: this.componentData,
      disassociatedItemIds: this.disassociatedItemIds
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

  isActiveForItem(item) {
    return this.disassociatedItemIds.indexOf(item.uuid) === -1;
  }
}
