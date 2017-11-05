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

  mapContentToLocalProperties(content) {
    super.mapContentToLocalProperties(content)
    this.url = content.url;
    this.name = content.name;

    // the location in the view this component is located in. Valid values are currently tags-list, note-tags, and editor-stack`
    this.area = content.area;

    this.permissions = content.permissions;
    this.active = content.active;

    // custom data that a component can store in itself
    this.componentData = content.componentData || {};

    // items that have requested a component to be disabled in its context
    this.disassociatedItemIds = content.disassociatedItemIds || [];
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
