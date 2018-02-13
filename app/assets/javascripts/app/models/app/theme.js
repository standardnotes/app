class Theme extends Component {

  constructor(json_obj) {
    super(json_obj);

    this.area = "themes";
  }

  get content_type() {
    return "SN|Theme";
  }
}
