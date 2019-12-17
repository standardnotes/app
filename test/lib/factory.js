import '../../../dist/javascripts/compiled.js';
import '../../../node_modules/chai/chai.js';
import '../vendor/chai-as-promised-built.js';
import '../../../vendor/assets/javascripts/lodash/lodash.custom.js';

import LocalStorageManager from './localStorageManager.js';
const sf_default = new SNCryptoManager();
SFItem.AppDomain = "org.standardnotes.sn";

var _globalStorageManager = null;
var _globalHttpManager = null;
var _globalAuthManager = null;
var _globalModelManager = null;
var _globalCryptoManager = null;

export default class Factory {

  static initialize() {
    this.globalStorageManager();
    this.globalHttpManager();
    this.globalAuthManager();
    this.globalModelManager();
  }

  static globalStorageManager() {
    if(_globalStorageManager == null) { _globalStorageManager = new LocalStorageManager(); }
    return _globalStorageManager;
  }

  static globalHttpManager() {
    if(_globalHttpManager == null) {
      _globalHttpManager = new SFHttpManager();
      _globalHttpManager.setJWTRequestHandler(async () => {
        return this.globalStorageManager().getItem("jwt");;
      })
    }
    return _globalHttpManager;
  }

  static globalAuthManager() {
    if(_globalAuthManager == null) { _globalAuthManager = new SFAuthManager(_globalStorageManager, _globalHttpManager); }
    return _globalAuthManager;
  }

  static globalModelManager() {
    if(_globalModelManager == null) { _globalModelManager = new SFModelManager(); }
    return _globalModelManager;
  }

  static globalCryptoManager() {
    if(_globalCryptoManager == null) { _globalCryptoManager = new SNCryptoManager(); }
    return _globalCryptoManager;
  }

  static createModelManager() {
    return new SFModelManager();
  }

  static yesterday() {
    return new Date(new Date().setDate(new Date().getDate() - 1));
  }

  static createItemParams() {
    var params = {
      uuid: cryptoManager.crypto.generateUUIDSync(),
      content_type: "Note",
      content: {
        title: "hello",
        text: "world"
      }
    };
    return params;
  }

  static createItem() {
    return new SFItem(this.createItemParams());
  }

  static serverURL() {
    return "http://localhost:3000";
  }

  static async newRegisteredUser(email, password) {
    let url = this.serverURL();
    if(!email) email = sf_default.crypto.generateUUIDSync();
    if(!password) password = sf_default.crypto.generateUUIDSync();
    return this.globalAuthManager().register(url, email, password, false);
  }
}

Factory.initialize();
