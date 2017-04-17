class EditorManager {


  constructor($rootScope, modelManager, syncManager) {
      this.syncManager = syncManager;
      this.modelManager = modelManager;

      this.editorType = "SN|Editor";
      this._systemEditor = {
        systemEditor: true,
        name: "Plain"
      }

      $rootScope.$on("sync:completed", function(){
        // we want to wait for sync completion before creating a syncable system editor
        // we need to sync the system editor so that we can assign note preferences to it
        // that is, when a user selects Plain for a note, we need to remember that
        if(this.systemEditor.uuid) {
          return;
        }

        var liveSysEditor = _.find(this.allEditors, {systemEditor: true});
        if(liveSysEditor) {
          this._systemEditor = liveSysEditor;
        } else {
          this._systemEditor = modelManager.createItem({
            content_type: this.editorType,
            systemEditor: true,
            name: "Plain"
          })
          modelManager.addItem(this._systemEditor);
          this._systemEditor.setDirty(true);
          syncManager.sync();
        }
      }.bind(this))
  }

  get allEditors() {
    return this.modelManager.itemsForContentType(this.editorType);
  }

  get externalEditors() {
    return this.allEditors.filter(function(editor){
      return !editor.systemEditor;
    })
  }

  get systemEditors() {
    return [this.systemEditor];
  }

  get systemEditor() {
    return this._systemEditor;
  }

  get defaultEditor() {
    return _.find(this.externalEditors, {default: true});
  }

  editorForUrl(url) {
    return this.externalEditors.filter(function(editor){return editor.url == url})[0];
  }

  setDefaultEditor(editor) {
    var defaultEditor = this.defaultEditor;
    if(defaultEditor) {
      defaultEditor.default = false;
      defaultEditor.setDirty(true);
    }
    editor.default = true;
    editor.setDirty(true);
    this.syncManager.sync();
  }

  removeDefaultEditor(editor) {
    editor.default = false;
    editor.setDirty(true);
    this.syncManager.sync();
  }

  addNewEditorFromURL(url) {
    var name = this.getParameterByName("name", url);
    var editor = this.modelManager.createItem({
      content_type: this.editorType,
      url: url,
      name: name
    })

    this.modelManager.addItem(editor);
    editor.setDirty(true);
    this.syncManager.sync();
  }

  deleteEditor(editor) {
    this.modelManager.setItemToBeDeleted(editor);
    this.syncManager.sync();
  }

  getParameterByName(name, url) {
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

}

angular.module('app.frontend').service('editorManager', EditorManager);
