class Tag extends Item {

  constructor(json_obj) {
    super(json_obj);
  }

  get content_type() {
    return "Tag";
  }
}
