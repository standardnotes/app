(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SNCrypto = function () {
  function SNCrypto() {
    _classCallCheck(this, SNCrypto);
  }

  _createClass(SNCrypto, [{
    key: 'generateRandomKey',
    value: function generateRandomKey() {
      return CryptoJS.lib.WordArray.random(512 / 8).toString();
    }
  }, {
    key: 'generateUUID',
    value: function generateUUID() {
      var crypto = window.crypto || window.msCrypto;
      if (crypto) {
        var buf = new Uint32Array(4);
        crypto.getRandomValues(buf);
        var idx = -1;
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          idx++;
          var r = buf[idx >> 3] >> idx % 8 * 4 & 15;
          var v = c == 'x' ? r : r & 0x3 | 0x8;
          return v.toString(16);
        });
      } else {
        var d = new Date().getTime();
        if (window.performance && typeof window.performance.now === "function") {
          d += performance.now(); //use high-precision timer if available
        }
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          var r = (d + Math.random() * 16) % 16 | 0;
          d = Math.floor(d / 16);
          return (c == 'x' ? r : r & 0x3 | 0x8).toString(16);
        });
        return uuid;
      }
    }
  }, {
    key: 'decryptText',
    value: function decryptText(encrypted_content, key) {
      var keyData = CryptoJS.enc.Hex.parse(key);
      var ivData = CryptoJS.enc.Hex.parse("");
      var decrypted = CryptoJS.AES.decrypt(encrypted_content, keyData, { iv: ivData, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
      return decrypted.toString(CryptoJS.enc.Utf8);
    }
  }, {
    key: 'encryptText',
    value: function encryptText(text, key) {
      var keyData = CryptoJS.enc.Hex.parse(key);
      var ivData = CryptoJS.enc.Hex.parse("");
      var encrypted = CryptoJS.AES.encrypt(text, keyData, { iv: ivData, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
      return encrypted.toString();
    }
  }, {
    key: 'generateRandomEncryptionKey',
    value: function generateRandomEncryptionKey() {
      var salt = Neeto.crypto.generateRandomKey();
      var passphrase = Neeto.crypto.generateRandomKey();
      return CryptoJS.PBKDF2(passphrase, salt, { keySize: 512 / 32 }).toString();
    }
  }, {
    key: 'firstHalfOfKey',
    value: function firstHalfOfKey(key) {
      return key.substring(0, key.length / 2);
    }
  }, {
    key: 'secondHalfOfKey',
    value: function secondHalfOfKey(key) {
      return key.substring(key.length / 2, key.length);
    }
  }, {
    key: 'base64',
    value: function base64(text) {
      return CryptoJS.enc.Utf8.parse(text).toString(CryptoJS.enc.Base64);
    }
  }, {
    key: 'base64Decode',
    value: function base64Decode(base64String) {
      return CryptoJS.enc.Base64.parse(base64String).toString(CryptoJS.enc.Utf8);
    }
  }, {
    key: 'sha256',
    value: function sha256(text) {
      return CryptoJS.SHA256(text).toString();
    }
  }, {
    key: 'sha1',
    value: function sha1(text) {
      return CryptoJS.SHA1(text).toString();
    }
  }, {
    key: 'hmac256',
    value: function hmac256(message, key) {
      var keyData = CryptoJS.enc.Hex.parse(key);
      var messageData = CryptoJS.enc.Utf8.parse(message);
      return CryptoJS.HmacSHA256(messageData, keyData).toString();
    }
  }, {
    key: 'computeEncryptionKeysForUser',
    value: function computeEncryptionKeysForUser() {
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          password = _ref.password,
          pw_salt = _ref.pw_salt,
          pw_func = _ref.pw_func,
          pw_alg = _ref.pw_alg,
          pw_cost = _ref.pw_cost,
          pw_key_size = _ref.pw_key_size;

      var callback = arguments[1];

      this.generateSymmetricKeyPair({ password: password, pw_salt: pw_salt,
        pw_func: pw_func, pw_alg: pw_alg, pw_cost: pw_cost, pw_key_size: pw_key_size }, function (keys) {
        var pw = keys[0];
        var mk = keys[1];

        callback({ pw: pw, mk: mk });
      });
    }
  }, {
    key: 'generateInitialEncryptionKeysForUser',
    value: function generateInitialEncryptionKeysForUser() {
      var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          email = _ref2.email,
          password = _ref2.password;

      var callback = arguments[1];

      var defaults = this.defaultPasswordGenerationParams();
      var pw_func = defaults.pw_func,
          pw_alg = defaults.pw_alg,
          pw_key_size = defaults.pw_key_size,
          pw_cost = defaults.pw_cost;

      var pw_nonce = this.generateRandomKey();
      var pw_salt = this.sha1(email + "SN" + pw_nonce);
      _.merge(defaults, { pw_salt: pw_salt, pw_nonce: pw_nonce });
      this.generateSymmetricKeyPair(_.merge({ email: email, password: password, pw_salt: pw_salt }, defaults), function (keys) {
        var pw = keys[0];
        var mk = keys[1];

        callback({ pw: pw, mk: mk }, defaults);
      });
    }
  }]);

  return SNCrypto;
}();

exports.SNCrypto = SNCrypto;

var SNCryptoJS = function (_SNCrypto) {
  _inherits(SNCryptoJS, _SNCrypto);

  function SNCryptoJS() {
    _classCallCheck(this, SNCryptoJS);

    return _possibleConstructorReturn(this, (SNCryptoJS.__proto__ || Object.getPrototypeOf(SNCryptoJS)).apply(this, arguments));
  }

  _createClass(SNCryptoJS, [{
    key: 'generateSymmetricKeyPair',


    /** Generates two deterministic keys based on one input */
    value: function generateSymmetricKeyPair() {
      var _ref3 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          password = _ref3.password,
          pw_salt = _ref3.pw_salt,
          pw_func = _ref3.pw_func,
          pw_alg = _ref3.pw_alg,
          pw_cost = _ref3.pw_cost,
          pw_key_size = _ref3.pw_key_size;

      var callback = arguments[1];

      var algMapping = {
        "sha256": CryptoJS.algo.SHA256,
        "sha512": CryptoJS.algo.SHA512
      };
      var fnMapping = {
        "pbkdf2": CryptoJS.PBKDF2
      };

      var alg = algMapping[pw_alg];
      var kdf = fnMapping[pw_func];
      var output = kdf(password, pw_salt, { keySize: pw_key_size / 32, hasher: alg, iterations: pw_cost }).toString();

      var outputLength = output.length;
      var firstHalf = output.slice(0, outputLength / 2);
      var secondHalf = output.slice(outputLength / 2, outputLength);
      callback([firstHalf, secondHalf]);
    }
  }, {
    key: 'defaultPasswordGenerationParams',
    value: function defaultPasswordGenerationParams() {
      return { pw_func: "pbkdf2", pw_alg: "sha512", pw_key_size: 512, pw_cost: 3000 };
    }
  }]);

  return SNCryptoJS;
}(SNCrypto);

exports.SNCryptoJS = SNCryptoJS;
var subtleCrypto = window.crypto.subtle;

var SNCryptoWeb = function (_SNCrypto2) {
  _inherits(SNCryptoWeb, _SNCrypto2);

  function SNCryptoWeb() {
    _classCallCheck(this, SNCryptoWeb);

    return _possibleConstructorReturn(this, (SNCryptoWeb.__proto__ || Object.getPrototypeOf(SNCryptoWeb)).apply(this, arguments));
  }

  _createClass(SNCryptoWeb, [{
    key: 'defaultPasswordGenerationParams',


    /**
    Overrides
    */
    value: function defaultPasswordGenerationParams() {
      return { pw_func: "pbkdf2", pw_alg: "sha512", pw_key_size: 512, pw_cost: 5000 };
    }

    /** Generates two deterministic keys based on one input */

  }, {
    key: 'generateSymmetricKeyPair',
    value: function generateSymmetricKeyPair() {
      var _ref4 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          password = _ref4.password,
          pw_salt = _ref4.pw_salt,
          pw_func = _ref4.pw_func,
          pw_alg = _ref4.pw_alg,
          pw_cost = _ref4.pw_cost,
          pw_key_size = _ref4.pw_key_size;

      var callback = arguments[1];

      this.stretchPassword({ password: password, pw_func: pw_func, pw_alg: pw_alg, pw_salt: pw_salt, pw_cost: pw_cost, pw_key_size: pw_key_size }, function (output) {
        var outputLength = output.length;
        var firstHalf = output.slice(0, outputLength / 2);
        var secondHalf = output.slice(outputLength / 2, outputLength);
        callback([firstHalf, secondHalf]);
      });
    }

    /**
    Internal
    */

  }, {
    key: 'stretchPassword',
    value: function stretchPassword() {
      var _ref5 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          password = _ref5.password,
          pw_salt = _ref5.pw_salt,
          pw_cost = _ref5.pw_cost,
          pw_func = _ref5.pw_func,
          pw_alg = _ref5.pw_alg,
          pw_key_size = _ref5.pw_key_size;

      var callback = arguments[1];


      this.webCryptoImportKey(password, pw_func, function (key) {

        if (!key) {
          console.log("Key is null, unable to continue");
          callback(null);
          return;
        }

        this.webCryptoDeriveBits({ key: key, pw_func: pw_func, pw_alg: pw_alg, pw_salt: pw_salt, pw_cost: pw_cost, pw_key_size: pw_key_size }, function (key) {
          if (!key) {
            callback(null);
            return;
          }

          callback(key);
        }.bind(this));
      }.bind(this));
    }
  }, {
    key: 'webCryptoImportKey',
    value: function webCryptoImportKey(input, pw_func, callback) {
      subtleCrypto.importKey("raw", this.stringToArrayBuffer(input), { name: pw_func.toUpperCase() }, false, ["deriveBits"]).then(function (key) {
        callback(key);
      }).catch(function (err) {
        console.error(err);
        callback(null);
      });
    }
  }, {
    key: 'webCryptoDeriveBits',
    value: function webCryptoDeriveBits() {
      var _ref6 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          key = _ref6.key,
          pw_func = _ref6.pw_func,
          pw_alg = _ref6.pw_alg,
          pw_salt = _ref6.pw_salt,
          pw_cost = _ref6.pw_cost,
          pw_key_size = _ref6.pw_key_size;

      var callback = arguments[1];

      var algMapping = {
        "sha256": "SHA-256",
        "sha512": "SHA-512"
      };
      var alg = algMapping[pw_alg];
      subtleCrypto.deriveBits({
        "name": pw_func.toUpperCase(),
        salt: this.stringToArrayBuffer(pw_salt),
        iterations: pw_cost,
        hash: { name: alg }
      }, key, pw_key_size).then(function (bits) {
        var key = this.arrayBufferToHexString(new Uint8Array(bits));
        callback(key);
      }.bind(this)).catch(function (err) {
        console.error(err);
        callback(null);
      });
    }
  }, {
    key: 'stringToArrayBuffer',
    value: function stringToArrayBuffer(string) {
      var encoder = new TextEncoder("utf-8");
      return encoder.encode(string);
    }
  }, {
    key: 'arrayBufferToHexString',
    value: function arrayBufferToHexString(arrayBuffer) {
      var byteArray = new Uint8Array(arrayBuffer);
      var hexString = "";
      var nextHexByte;

      for (var i = 0; i < byteArray.byteLength; i++) {
        nextHexByte = byteArray[i].toString(16);
        if (nextHexByte.length < 2) {
          nextHexByte = "0" + nextHexByte;
        }
        hexString += nextHexByte;
      }
      return hexString;
    }
  }]);

  return SNCryptoWeb;
}(SNCrypto);

exports.SNCryptoWeb = SNCryptoWeb;
'use strict';

var Neeto = Neeto || {};

if (window.crypto.subtle) {
  Neeto.crypto = new SNCryptoWeb();
} else {
  Neeto.crypto = new SNCryptoJS();
}

angular.module('app.frontend', ['ui.router', 'restangular', 'ngDialog']).config(function (RestangularProvider, apiControllerProvider) {
  RestangularProvider.setDefaultHeaders({ "Content-Type": "application/json" });

  var url = apiControllerProvider.defaultServerURL();
  RestangularProvider.setBaseUrl(url + "/api");

  RestangularProvider.setFullRequestInterceptor(function (element, operation, route, url, headers, params, httpConfig) {
    var token = localStorage.getItem("jwt");
    if (token) {
      headers = _.extend(headers, { Authorization: "Bearer " + localStorage.getItem("jwt") });
    }

    return {
      element: element,
      params: params,
      headers: headers,
      httpConfig: httpConfig
    };
  });
});angular.module('app.frontend').config(function ($stateProvider, $urlRouterProvider, $locationProvider) {

  $stateProvider.state('base', {
    abstract: true
  }).state('home', {
    url: '/',
    parent: 'base',
    views: {
      'content@': {
        templateUrl: 'frontend/home.html',
        controller: 'HomeCtrl'
      }
    }
  });

  // Default fall back route
  $urlRouterProvider.otherwise(function ($injector, $location) {
    var state = $injector.get('$state');
    state.go('home');
    return $location.path();
  });

  // enable HTML5 Mode for SEO
  $locationProvider.html5Mode(true);
});
;
var BaseCtrl = function BaseCtrl($rootScope, modelManager, apiController) {
  _classCallCheck(this, BaseCtrl);

  apiController.getCurrentUser(function () {});
};

angular.module('app.frontend').controller('BaseCtrl', BaseCtrl);
;angular.module('app.frontend').directive("editorSection", function ($timeout) {
  return {
    restrict: 'E',
    scope: {
      save: "&",
      remove: "&",
      note: "="
    },
    templateUrl: 'frontend/editor.html',
    replace: true,
    controller: 'EditorCtrl',
    controllerAs: 'ctrl',
    bindToController: true,

    link: function link(scope, elem, attrs, ctrl) {

      var handler = function handler(event) {
        if (event.ctrlKey || event.metaKey) {
          switch (String.fromCharCode(event.which).toLowerCase()) {
            case 's':
              event.preventDefault();
              $timeout(function () {
                ctrl.saveNote(event);
              });
              break;
            case 'e':
              event.preventDefault();
              $timeout(function () {
                ctrl.clickedEditNote();
              });
              break;
            case 'm':
              event.preventDefault();
              $timeout(function () {
                ctrl.toggleMarkdown();
              });
              break;
            case 'o':
              event.preventDefault();
              $timeout(function () {
                ctrl.toggleFullScreen();
              });
              break;
          }
        }
      };

      window.addEventListener('keydown', handler);

      scope.$on('$destroy', function () {
        window.removeEventListener('keydown', handler);
      });

      scope.$watch('ctrl.note', function (note, oldNote) {
        if (note) {
          ctrl.setNote(note, oldNote);
        } else {
          ctrl.note = {};
        }
      });
    }
  };
}).controller('EditorCtrl', function ($sce, $timeout, apiController, markdownRenderer, $rootScope, extensionManager) {

  this.setNote = function (note, oldNote) {
    this.editorMode = 'edit';

    if (note.safeText().length == 0 && note.dummy) {
      this.focusTitle(100);
    }

    if (oldNote && oldNote != note) {
      if (oldNote.hasChanges) {
        this.save()(oldNote, null);
      } else if (oldNote.dummy) {
        this.remove()(oldNote);
      }
    }
  };

  this.hasAvailableExtensions = function () {
    return extensionManager.extensionsInContextOfItem(this.note).length > 0;
  };

  this.onPreviewDoubleClick = function () {
    this.editorMode = 'edit';
    this.focusEditor(100);
  };

  this.focusEditor = function (delay) {
    setTimeout(function () {
      var element = document.getElementById("note-text-editor");
      element.focus();
    }, delay);
  };

  this.focusTitle = function (delay) {
    setTimeout(function () {
      document.getElementById("note-title-editor").focus();
    }, delay);
  };

  this.clickedTextArea = function () {
    this.showMenu = false;
  };

  this.renderedContent = function () {
    return markdownRenderer.renderHtml(markdownRenderer.renderedContentForText(this.note.safeText()));
  };

  var statusTimeout;

  this.saveNote = function ($event) {
    var note = this.note;
    note.dummy = false;
    this.save()(note, function (success) {
      if (success) {
        apiController.clearDraft();

        if (statusTimeout) $timeout.cancel(statusTimeout);
        statusTimeout = $timeout(function () {
          this.noteStatus = "All changes saved";
        }.bind(this), 200);
      } else {
        if (statusTimeout) $timeout.cancel(statusTimeout);
        statusTimeout = $timeout(function () {
          this.noteStatus = "(Offline) — All changes saved";
        }.bind(this), 200);
      }
    }.bind(this));
  };

  this.saveTitle = function ($event) {
    $event.target.blur();
    this.saveNote($event);
    this.focusEditor();
  };

  var saveTimeout;
  this.changesMade = function () {
    this.note.hasChanges = true;
    this.note.dummy = false;
    if (apiController.isUserSignedIn()) {
      // signed out users have local autosave, dont need draft saving
      apiController.saveDraftToDisk(this.note);
    }

    if (saveTimeout) $timeout.cancel(saveTimeout);
    if (statusTimeout) $timeout.cancel(statusTimeout);
    saveTimeout = $timeout(function () {
      this.noteStatus = "Saving...";
      this.saveNote();
    }.bind(this), 275);
  };

  this.contentChanged = function () {
    this.changesMade();
  };

  this.nameChanged = function () {
    this.changesMade();
  };

  this.onNameFocus = function () {
    this.editingName = true;
  };

  this.onContentFocus = function () {
    this.showSampler = false;
    $rootScope.$broadcast("editorFocused");
    this.editingUrl = false;
  };

  this.onNameBlur = function () {
    this.editingName = false;
  };

  this.toggleFullScreen = function () {
    this.fullscreen = !this.fullscreen;
    if (this.fullscreen) {
      if (this.editorMode == 'edit') {
        // refocus
        this.focusEditor(0);
      }
    } else {}
  };

  this.selectedMenuItem = function () {
    this.showMenu = false;
  };

  this.toggleMarkdown = function () {
    if (this.editorMode == 'preview') {
      this.editorMode = 'edit';
    } else {
      this.editorMode = 'preview';
    }
  };

  this.editUrlPressed = function () {
    this.showMenu = false;
    var url = this.publicUrlForNote(this.note);
    url = url.replace(this.note.presentation_name, "");
    this.url = { base: url, token: this.note.presentation_name };
    this.editingUrl = true;
  };

  this.saveUrl = function ($event) {
    $event.target.blur();

    var original = this.note.presentation_name;
    this.note.presentation_name = this.url.token;
    this.note.setDirty(true);

    apiController.sync(function (response) {
      if (response && response.error) {
        this.note.presentation_name = original;
        this.url.token = original;
        alert("This URL is not available.");
      } else {
        this.editingUrl = false;
      }
    }.bind(this));
  };

  this.shareNote = function () {

    function openInNewTab(url) {
      var a = document.createElement("a");
      a.target = "_blank";
      a.href = url;
      a.click();
    }

    apiController.shareItem(this.note, function (note) {
      openInNewTab(this.publicUrlForNote(note));
    }.bind(this));
    this.showMenu = false;
  };

  this.unshareNote = function () {
    apiController.unshareItem(this.note, function (note) {});
    this.showMenu = false;
  };

  this.publicUrlForNote = function () {
    return this.note.presentationURL();
  };

  this.clickedMenu = function () {
    if (this.note.locked) {
      alert("This note has been shared without an account, and can therefore not be changed.");
    } else {
      this.showMenu = !this.showMenu;
    }
  };

  this.deleteNote = function () {
    apiController.clearDraft();
    this.remove()(this.note);
    this.showMenu = false;
  };

  this.clickedEditNote = function () {
    this.editorMode = 'edit';
    this.focusEditor(100);
  };
});
;angular.module('app.frontend').directive("header", function (apiController, extensionManager) {
  return {
    restrict: 'E',
    scope: {},
    templateUrl: 'frontend/header.html',
    replace: true,
    controller: 'HeaderCtrl',
    controllerAs: 'ctrl',
    bindToController: true,

    link: function link(scope, elem, attrs, ctrl) {
      scope.$on("sync:updated_token", function () {
        ctrl.syncUpdated();
      });
    }
  };
}).controller('HeaderCtrl', function ($state, apiController, modelManager, $timeout, extensionManager) {

  this.user = apiController.user;
  this.extensionManager = extensionManager;

  this.changePasswordPressed = function () {
    this.showNewPasswordForm = !this.showNewPasswordForm;
  };

  this.accountMenuPressed = function () {
    this.serverData = { url: apiController.getServer() };
    this.showAccountMenu = !this.showAccountMenu;
    this.showFaq = false;
    this.showNewPasswordForm = false;
    this.showExtensionsMenu = false;
  };

  this.toggleExtensions = function () {
    this.showAccountMenu = false;
    this.showExtensionsMenu = !this.showExtensionsMenu;
  };

  this.toggleExtensionForm = function () {
    this.newExtensionData = {};
    this.showNewExtensionForm = !this.showNewExtensionForm;
  };

  this.submitNewExtensionForm = function () {
    if (this.newExtensionData.url) {
      extensionManager.addExtension(this.newExtensionData.url, function (response) {
        if (!response) {
          alert("Unable to register this extension. Make sure the link is valid and try again.");
        } else {
          this.newExtensionData.url = "";
          this.showNewExtensionForm = false;
        }
      }.bind(this));
    }
  };

  this.selectedAction = function (action, extension) {
    action.running = true;
    extensionManager.executeAction(action, extension, null, function (response) {
      action.running = false;
      if (response && response.error) {
        action.error = true;
        alert("There was an error performing this action. Please try again.");
      } else {
        action.error = false;
        apiController.sync(null);
      }
    });
  };

  this.deleteExtension = function (extension) {
    if (confirm("Are you sure you want to delete this extension?")) {
      extensionManager.deleteExtension(extension);
    }
  };

  this.reloadExtensionsPressed = function () {
    if (confirm("For your security, reloading extensions will disable any currently enabled repeat actions.")) {
      extensionManager.refreshExtensionsFromServer();
    }
  };

  this.changeServer = function () {
    apiController.setServer(this.serverData.url, true);
  };

  this.signOutPressed = function () {
    this.showAccountMenu = false;
    apiController.signout();
    window.location.reload();
  };

  this.submitPasswordChange = function () {
    this.passwordChangeData.status = "Generating New Keys...";

    $timeout(function () {
      if (data.password != data.password_confirmation) {
        alert("Your new password does not match its confirmation.");
        return;
      }

      apiController.changePassword(this.passwordChangeData.current_password, this.passwordChangeData.new_password, function (response) {});
    }.bind(this));
  };

  this.hasLocalData = function () {
    return modelManager.filteredNotes.length > 0;
  };

  this.mergeLocalChanged = function () {
    if (!this.user.shouldMerge) {
      if (!confirm("Unchecking this option means any locally stored tags and notes you have now will be deleted. Are you sure you want to continue?")) {
        this.user.shouldMerge = true;
      }
    }
  };

  this.refreshData = function () {
    this.isRefreshing = true;
    apiController.sync(function (response) {
      $timeout(function () {
        this.isRefreshing = false;
      }.bind(this), 200);
      if (response && response.error) {
        alert("There was an error syncing. Please try again. If all else fails, log out and log back in.");
      } else {
        this.syncUpdated();
      }
    }.bind(this));
  };

  this.syncUpdated = function () {
    this.lastSyncDate = new Date();
  };

  this.loginSubmitPressed = function () {
    this.loginData.status = "Generating Login Keys...";
    $timeout(function () {
      apiController.login(this.loginData.email, this.loginData.user_password, function (response) {
        if (!response || response.error) {
          var error = response ? response.error : { message: "An unknown error occured." };
          this.loginData.status = null;
          alert(error.message);
        } else {
          this.onAuthSuccess(response.user);
        }
      }.bind(this));
    }.bind(this));
  };

  this.submitRegistrationForm = function () {
    this.loginData.status = "Generating Account Keys...";

    $timeout(function () {
      apiController.register(this.loginData.email, this.loginData.user_password, function (response) {
        if (!response || response.error) {
          var error = response ? response.error : { message: "An unknown error occured." };
          this.loginData.status = null;
          alert(error.message);
        } else {
          this.onAuthSuccess(response.user);
        }
      }.bind(this));
    }.bind(this));
  };

  this.encryptionStatusForNotes = function () {
    var allNotes = modelManager.filteredNotes;
    var countEncrypted = 0;
    allNotes.forEach(function (note) {
      if (note.encryptionEnabled()) {
        countEncrypted++;
      }
    }.bind(this));

    return countEncrypted + "/" + allNotes.length + " notes encrypted";
  };

  this.archiveEncryptionFormat = { encrypted: true };

  this.downloadDataArchive = function () {
    var link = document.createElement('a');
    link.setAttribute('download', 'notes.json');
    link.href = apiController.itemsDataFile(this.archiveEncryptionFormat.encrypted);
    link.click();
  };

  this.performImport = function (data, password) {
    this.importData.loading = true;
    // allow loading indicator to come up with timeout
    $timeout(function () {
      apiController.importJSONData(data, password, function (success, response) {
        console.log("Import response:", success, response);
        this.importData.loading = false;
        if (success) {
          this.importData = null;
        } else {
          alert("There was an error importing your data. Please try again.");
        }
      }.bind(this));
    }.bind(this));
  };

  this.submitImportPassword = function () {
    this.performImport(this.importData.data, this.importData.password);
  };

  this.importFileSelected = function (files) {
    this.importData = {};

    var file = files[0];
    var reader = new FileReader();
    reader.onload = function (e) {
      var data = JSON.parse(e.target.result);
      $timeout(function () {
        if (data.auth_params) {
          // request password
          this.importData.requestPassword = true;
          this.importData.data = data;
        } else {
          this.performImport(data, null);
        }
      }.bind(this));
    }.bind(this);

    reader.readAsText(file);
  };

  this.onAuthSuccess = function (user) {

    // if(this.user.shouldMerge && this.hasLocalData()) {
    // apiController.mergeLocalDataRemotely(this.user, function(){
    //   window.location.reload();
    // });
    // } else {
    window.location.reload();
    // }

    this.showLogin = false;
    this.showRegistration = false;
  };
});
;angular.module('app.frontend').controller('HomeCtrl', function ($scope, $rootScope, $timeout, apiController, modelManager) {
  $rootScope.bodyClass = "app-body-class";

  apiController.loadLocalItems();
  $scope.allTag = new Tag({ all: true });
  $scope.allTag.title = "All";
  $scope.tags = modelManager.tags;
  $scope.allTag.notes = modelManager.notes;

  apiController.sync(null);
  // refresh every 30s
  setInterval(function () {
    apiController.sync(null);
  }, 30000);

  /*
  Tags Ctrl Callbacks
  */

  $scope.updateAllTag = function () {
    // $scope.allTag.notes = modelManager.notes;
  };

  $scope.tagsWillMakeSelection = function (tag) {
    if (tag.all) {
      $scope.updateAllTag();
    }
  };

  $scope.tagsSelectionMade = function (tag) {
    $scope.selectedTag = tag;

    if ($scope.selectedNote && $scope.selectedNote.dummy) {
      modelManager.removeItemLocally($scope.selectedNote);
    }
  };

  $scope.tagsAddNew = function (tag) {
    modelManager.addItem(tag);
  };

  $scope.tagsSave = function (tag, callback) {
    tag.setDirty(true);
    apiController.sync(callback);
  };

  /*
  Called to update the tag of a note after drag and drop change
  The note object is a copy of the original
  */
  $scope.tagsUpdateNoteTag = function (noteCopy, newTag, oldTag) {

    var originalNote = _.find(modelManager.notes, { uuid: noteCopy.uuid });
    if (!newTag.all) {
      modelManager.createRelationshipBetweenItems(newTag, originalNote);
    }

    apiController.sync(function () {});
  };

  /*
  Notes Ctrl Callbacks
  */

  $scope.notesRemoveTag = function (tag) {
    var validNotes = Note.filterDummyNotes(tag.notes);
    if (validNotes == 0) {
      modelManager.setItemToBeDeleted(tag);
      // if no more notes, delete tag
      apiController.sync(function () {
        // force scope tags to update on sub directives
        $scope.tags = [];
        $timeout(function () {
          $scope.tags = modelManager.tags;
        });
      });
    } else {
      alert("To delete this tag, remove all its notes first.");
    }
  };

  $scope.notesSelectionMade = function (note) {
    $scope.selectedNote = note;
  };

  $scope.notesAddNew = function (note) {
    modelManager.addItem(note);

    if (!$scope.selectedTag.all) {
      modelManager.createRelationshipBetweenItems($scope.selectedTag, note);
      $scope.updateAllTag();
    }
  };

  /*
  Shared Callbacks
  */

  $scope.saveNote = function (note, callback) {
    note.setDirty(true);

    apiController.sync(function (response) {
      if (response && response.error) {
        if (!$scope.didShowErrorAlert) {
          $scope.didShowErrorAlert = true;
          alert("There was an error saving your note. Please try again.");
        }
        callback(false);
      } else {
        note.hasChanges = false;
        if (callback) {
          callback(true);
        }
      }
    });
  };

  $scope.deleteNote = function (note) {

    modelManager.setItemToBeDeleted(note);

    if (note == $scope.selectedNote) {
      $scope.selectedNote = null;
    }

    if (note.dummy) {
      modelManager.removeItemLocally(note);
      return;
    }

    apiController.sync(null);
  };
});
;angular.module('app.frontend').directive("notesSection", function () {
  return {
    scope: {
      addNew: "&",
      selectionMade: "&",
      remove: "&",
      tag: "=",
      removeTag: "&"
    },

    templateUrl: 'frontend/notes.html',
    replace: true,
    controller: 'NotesCtrl',
    controllerAs: 'ctrl',
    bindToController: true,

    link: function link(scope, elem, attrs, ctrl) {
      scope.$watch('ctrl.tag', function (tag, oldTag) {
        if (tag) {
          ctrl.tagDidChange(tag, oldTag);
        }
      });
    }
  };
}).controller('NotesCtrl', function (apiController, $timeout, $rootScope, modelManager) {

  $rootScope.$on("editorFocused", function () {
    this.showMenu = false;
  }.bind(this));

  var isFirstLoad = true;

  this.tagDidChange = function (tag, oldTag) {
    this.showMenu = false;

    if (this.selectedNote && this.selectedNote.dummy) {
      _.remove(oldTag.notes, this.selectedNote);
    }

    this.noteFilter.text = "";

    tag.notes.forEach(function (note) {
      note.visible = true;
    });
    this.selectFirstNote(false);

    if (isFirstLoad) {
      $timeout(function () {
        var draft = apiController.getDraft();
        if (draft) {
          var note = draft;
          this.selectNote(note);
        } else {
          this.createNewNote();
          isFirstLoad = false;
        }
      }.bind(this));
    } else if (tag.notes.length == 0) {
      this.createNewNote();
    }
  };

  this.selectedTagDelete = function () {
    this.showMenu = false;
    this.removeTag()(this.tag);
  };

  this.selectedTagShare = function () {
    this.showMenu = false;

    if (!apiController.isUserSignedIn()) {
      alert("You must be signed in to share a tag.");
      return;
    }

    if (this.tag.all) {
      alert("You cannot share the 'All' tag.");
      return;
    }

    apiController.shareItem(this.tag, function (response) {});
  };

  this.selectedTagUnshare = function () {
    this.showMenu = false;
    apiController.unshareItem(this.tag, function (response) {});
  };

  this.selectFirstNote = function (createNew) {
    var visibleNotes = this.tag.notes.filter(function (note) {
      return note.visible;
    });

    if (visibleNotes.length > 0) {
      this.selectNote(visibleNotes[0]);
    } else if (createNew) {
      this.createNewNote();
    }
  };

  this.selectNote = function (note) {
    this.selectedNote = note;
    this.selectionMade()(note);
  };

  this.createNewNote = function () {
    var title = "New Note" + (this.tag.notes ? " " + (this.tag.notes.length + 1) : "");
    this.newNote = modelManager.createItem({ content_type: "Note", dummy: true, text: "" });
    this.newNote.title = title;
    this.selectNote(this.newNote);
    this.addNew()(this.newNote);
  };

  this.noteFilter = { text: '' };

  this.filterNotes = function (note) {
    var filterText = this.noteFilter.text.toLowerCase();
    if (filterText.length == 0) {
      note.visible = true;
    } else {
      note.visible = note.safeTitle().toLowerCase().includes(filterText) || note.safeText().toLowerCase().includes(filterText);
    }
    return note.visible;
  }.bind(this);

  this.filterTextChanged = function () {
    $timeout(function () {
      if (!this.selectedNote.visible) {
        this.selectFirstNote(false);
      }
    }.bind(this), 100);
  };
});
;angular.module('app.frontend').directive("tagsSection", function () {
  return {
    restrict: 'E',
    scope: {
      addNew: "&",
      selectionMade: "&",
      willSelect: "&",
      save: "&",
      tags: "=",
      allTag: "=",
      updateNoteTag: "&"
    },
    templateUrl: 'frontend/tags.html',
    replace: true,
    controller: 'TagsCtrl',
    controllerAs: 'ctrl',
    bindToController: true,

    link: function link(scope, elem, attrs, ctrl) {
      scope.$watch('ctrl.tags', function (newTags) {
        if (newTags) {
          ctrl.setTags(newTags);
        }
      });

      scope.$watch('ctrl.allTag', function (allTag) {
        if (allTag) {
          ctrl.setAllTag(allTag);
        }
      });
    }
  };
}).controller('TagsCtrl', function (modelManager) {

  var initialLoad = true;

  this.setAllTag = function (allTag) {
    this.selectTag(this.allTag);
  };

  this.setTags = function (tags) {
    if (initialLoad) {
      initialLoad = false;
      this.selectTag(this.allTag);
    } else {
      if (tags && tags.length > 0) {
        this.selectTag(tags[0]);
      }
    }
  };

  this.selectTag = function (tag) {
    this.willSelect()(tag);
    this.selectedTag = tag;
    this.selectionMade()(tag);
  };

  this.clickedAddNewTag = function () {
    if (this.editingTag) {
      return;
    }

    this.newTag = modelManager.createItem({ content_type: "Tag" });
    this.selectedTag = this.newTag;
    this.editingTag = this.newTag;
    this.addNew()(this.newTag);
  };

  var originalTagName = "";
  this.onTagTitleFocus = function (tag) {
    originalTagName = tag.title;
  };

  this.tagTitleDidChange = function (tag) {
    this.editingTag = tag;
  };

  this.saveTag = function ($event, tag) {
    this.editingTag = null;
    if (tag.title.length == 0) {
      tag.title = originalTagName;
      originalTagName = "";
      return;
    }

    $event.target.blur();
    if (!tag.title || tag.title.length == 0) {
      return;
    }

    this.save()(tag, function (savedTag) {
      // _.merge(tag, savedTag);
      this.selectTag(tag);
      this.newTag = null;
    }.bind(this));
  };

  this.noteCount = function (tag) {
    var validNotes = Note.filterDummyNotes(tag.notes);
    return validNotes.length;
  };

  this.handleDrop = function (e, newTag, note) {
    this.updateNoteTag()(note, newTag, this.selectedTag);
  }.bind(this);
});
;angular.module('app.frontend').controller('UsernameModalCtrl', function ($scope, apiController, Restangular, callback, $timeout) {
  $scope.formData = {};

  $scope.saveUsername = function () {
    apiController.setUsername($scope.formData.username, function (response) {
      var username = response.username;
      callback(username);
      $scope.closeThisDialog();
    });
  };
});
;
var Item = function () {
  function Item(json_obj) {
    _classCallCheck(this, Item);

    this.updateFromJSON(json_obj);

    this.observers = [];

    if (!this.uuid) {
      this.uuid = Neeto.crypto.generateUUID();
    }
  }

  _createClass(Item, [{
    key: 'updateFromJSON',
    value: function updateFromJSON(json) {
      _.merge(this, json);
      if (this.created_at) {
        this.created_at = new Date(this.created_at);
        this.updated_at = new Date(this.updated_at);
      } else {
        this.created_at = new Date();
        this.updated_at = new Date();
      }

      if (json.content) {
        this.mapContentToLocalProperties(this.contentObject);
      }
    }
  }, {
    key: 'alternateUUID',
    value: function alternateUUID() {
      this.uuid = Neeto.crypto.generateUUID();
    }
  }, {
    key: 'setDirty',
    value: function setDirty(dirty) {
      this.dirty = dirty;

      if (dirty) {
        this.notifyObserversOfChange();
      }
    }
  }, {
    key: 'markAllReferencesDirty',
    value: function markAllReferencesDirty() {
      this.allReferencedObjects().forEach(function (reference) {
        reference.setDirty(true);
      });
    }
  }, {
    key: 'addObserver',
    value: function addObserver(observer, callback) {
      if (!_.find(this.observers, observer)) {
        this.observers.push({ observer: observer, callback: callback });
      }
    }
  }, {
    key: 'removeObserver',
    value: function removeObserver(observer) {
      _.remove(this.observers, { observer: observer });
    }
  }, {
    key: 'notifyObserversOfChange',
    value: function notifyObserversOfChange() {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.observers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var observer = _step.value;

          observer.callback(this);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }, {
    key: 'mapContentToLocalProperties',
    value: function mapContentToLocalProperties(contentObj) {}
  }, {
    key: 'createContentJSONFromProperties',
    value: function createContentJSONFromProperties() {
      return this.structureParams();
    }
  }, {
    key: 'referenceParams',
    value: function referenceParams() {
      // must override
    }
  }, {
    key: 'structureParams',
    value: function structureParams() {
      return { references: this.referenceParams() };
    }
  }, {
    key: 'addItemAsRelationship',
    value: function addItemAsRelationship(item) {
      // must override
    }
  }, {
    key: 'removeItemAsRelationship',
    value: function removeItemAsRelationship(item) {
      // must override
    }
  }, {
    key: 'removeAllRelationships',
    value: function removeAllRelationships() {
      // must override
    }
  }, {
    key: 'mergeMetadataFromItem',
    value: function mergeMetadataFromItem(item) {
      _.merge(this, _.omit(item, ["content"]));
    }
  }, {
    key: 'allReferencedObjects',
    value: function allReferencedObjects() {
      // must override
      return [];
    }
  }, {
    key: 'referencesAffectedBySharingChange',
    value: function referencesAffectedBySharingChange() {
      // should be overriden to determine which references should be decrypted/encrypted
      return [];
    }
  }, {
    key: 'isPublic',
    value: function isPublic() {
      return this.presentation_name;
    }
  }, {
    key: 'isEncrypted',
    value: function isEncrypted() {
      return this.encryptionEnabled() && this.content.substring(0, 3) === '001' ? true : false;
    }
  }, {
    key: 'encryptionEnabled',
    value: function encryptionEnabled() {
      return this.enc_item_key;
    }
  }, {
    key: 'presentationURL',
    value: function presentationURL() {
      return this.presentation_url;
    }
  }, {
    key: 'contentObject',
    get: function get() {
      if (!this.content) {
        return {};
      }

      if (this.content !== null && _typeof(this.content) === 'object') {
        // this is the case when mapping localStorage content, in which case the content is already parsed
        return this.content;
      }

      return JSON.parse(this.content);
    }
  }], [{
    key: 'sortItemsByDate',
    value: function sortItemsByDate(items) {
      items.sort(function (a, b) {
        return new Date(b.created_at) - new Date(a.created_at);
      });
    }
  }]);

  return Item;
}();

;
var Action = function () {
  function Action(json) {
    _classCallCheck(this, Action);

    _.merge(this, json);
    this.running = false; // in case running=true was synced with server since model is uploaded nondiscriminatory
    this.error = false;
    if (this.lastExecuted) {
      // is string
      this.lastExecuted = new Date(this.lastExecuted);
    }
  }

  _createClass(Action, [{
    key: 'permissionsString',
    get: function get() {
      if (!this.permissions) {
        return "";
      }
      var permission = this.permissions.charAt(0).toUpperCase() + this.permissions.slice(1); // capitalize first letter
      permission += ": ";
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = this.content_types[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var contentType = _step2.value;

          if (contentType == "*") {
            permission += "All items";
          } else {
            permission += contentType;
          }

          permission += " ";
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      return permission;
    }
  }, {
    key: 'encryptionModeString',
    get: function get() {
      if (this.verb != "post") {
        return null;
      }
      var encryptionMode = "This action accepts data ";
      if (this.accepts_encrypted && this.accepts_decrypted) {
        encryptionMode += "encrypted or decrypted.";
      } else {
        if (this.accepts_encrypted) {
          encryptionMode += "encrypted.";
        } else {
          encryptionMode += "decrypted.";
        }
      }
      return encryptionMode;
    }
  }]);

  return Action;
}();

var Extension = function (_Item) {
  _inherits(Extension, _Item);

  function Extension(json) {
    _classCallCheck(this, Extension);

    var _this3 = _possibleConstructorReturn(this, (Extension.__proto__ || Object.getPrototypeOf(Extension)).call(this, json));

    _.merge(_this3, json);

    _this3.encrypted = true;
    _this3.content_type = "Extension";
    return _this3;
  }

  _createClass(Extension, [{
    key: 'actionsInGlobalContext',
    value: function actionsInGlobalContext() {
      return this.actions.filter(function (action) {
        return action.context == "global";
      });
    }
  }, {
    key: 'actionsWithContextForItem',
    value: function actionsWithContextForItem(item) {
      return this.actions.filter(function (action) {
        return action.context == item.content_type || action.context == "Item";
      });
    }
  }, {
    key: 'mapContentToLocalProperties',
    value: function mapContentToLocalProperties(contentObject) {
      _get(Extension.prototype.__proto__ || Object.getPrototypeOf(Extension.prototype), 'mapContentToLocalProperties', this).call(this, contentObject);
      this.name = contentObject.name;
      this.url = contentObject.url;
      this.actions = contentObject.actions.map(function (action) {
        return new Action(action);
      });
    }
  }, {
    key: 'updateFromExternalResponseItem',
    value: function updateFromExternalResponseItem(externalResponseItem) {
      _.merge(this, externalResponseItem);
      this.actions = externalResponseItem.actions.map(function (action) {
        return new Action(action);
      });
    }
  }, {
    key: 'referenceParams',
    value: function referenceParams() {
      return null;
    }
  }, {
    key: 'structureParams',
    value: function structureParams() {
      var params = {
        name: this.name,
        url: this.url,
        actions: this.actions
      };

      _.merge(params, _get(Extension.prototype.__proto__ || Object.getPrototypeOf(Extension.prototype), 'structureParams', this).call(this));
      return params;
    }
  }]);

  return Extension;
}(Item);

;
var Note = function (_Item2) {
  _inherits(Note, _Item2);

  function Note(json_obj) {
    _classCallCheck(this, Note);

    var _this4 = _possibleConstructorReturn(this, (Note.__proto__ || Object.getPrototypeOf(Note)).call(this, json_obj));

    if (!_this4.tags) {
      _this4.tags = [];
    }
    return _this4;
  }

  _createClass(Note, [{
    key: 'mapContentToLocalProperties',
    value: function mapContentToLocalProperties(contentObject) {
      _get(Note.prototype.__proto__ || Object.getPrototypeOf(Note.prototype), 'mapContentToLocalProperties', this).call(this, contentObject);
      this.title = contentObject.title;
      this.text = contentObject.text;
    }
  }, {
    key: 'referenceParams',
    value: function referenceParams() {
      var references = _.map(this.tags, function (tag) {
        return { uuid: tag.uuid, content_type: tag.content_type };
      });

      return references;
    }
  }, {
    key: 'structureParams',
    value: function structureParams() {
      var params = {
        title: this.title,
        text: this.text
      };

      _.merge(params, _get(Note.prototype.__proto__ || Object.getPrototypeOf(Note.prototype), 'structureParams', this).call(this));
      return params;
    }
  }, {
    key: 'addItemAsRelationship',
    value: function addItemAsRelationship(item) {
      if (item.content_type == "Tag") {
        if (!_.find(this.tags, item)) {
          this.tags.push(item);
        }
      }
      _get(Note.prototype.__proto__ || Object.getPrototypeOf(Note.prototype), 'addItemAsRelationship', this).call(this, item);
    }
  }, {
    key: 'removeItemAsRelationship',
    value: function removeItemAsRelationship(item) {
      if (item.content_type == "Tag") {
        _.pull(this.tags, item);
      }
      _get(Note.prototype.__proto__ || Object.getPrototypeOf(Note.prototype), 'removeItemAsRelationship', this).call(this, item);
    }
  }, {
    key: 'removeAllRelationships',
    value: function removeAllRelationships() {
      this.tags.forEach(function (tag) {
        _.pull(tag.notes, this);
        tag.setDirty(true);
      }.bind(this));
      this.tags = [];
    }
  }, {
    key: 'allReferencedObjects',
    value: function allReferencedObjects() {
      return this.tags;
    }
  }, {
    key: 'referencesAffectedBySharingChange',
    value: function referencesAffectedBySharingChange() {
      return _get(Note.prototype.__proto__ || Object.getPrototypeOf(Note.prototype), 'referencesAffectedBySharingChange', this).call(this);
    }
  }, {
    key: 'safeText',
    value: function safeText() {
      return this.text || "";
    }
  }, {
    key: 'safeTitle',
    value: function safeTitle() {
      return this.title || "";
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      return { uuid: this.uuid };
    }
  }, {
    key: 'isSharedIndividually',
    value: function isSharedIndividually() {
      return this.presentation_name;
    }
  }, {
    key: 'isPublic',
    value: function isPublic() {
      return _get(Note.prototype.__proto__ || Object.getPrototypeOf(Note.prototype), 'isPublic', this).call(this) || this.hasOnePublicTag;
    }
  }, {
    key: 'hasOnePublicTag',
    get: function get() {
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = this.tags[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var tag = _step3.value;

          if (tag.isPublic()) {
            return true;
          }
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      return false;
    }
  }, {
    key: 'content_type',
    get: function get() {
      return "Note";
    }
  }], [{
    key: 'filterDummyNotes',
    value: function filterDummyNotes(notes) {
      var filtered = notes.filter(function (note) {
        return note.dummy == false || note.dummy == null;
      });
      return filtered;
    }
  }]);

  return Note;
}(Item);

;
var Tag = function (_Item3) {
  _inherits(Tag, _Item3);

  function Tag(json_obj) {
    _classCallCheck(this, Tag);

    var _this5 = _possibleConstructorReturn(this, (Tag.__proto__ || Object.getPrototypeOf(Tag)).call(this, json_obj));

    if (!_this5.notes) {
      _this5.notes = [];
    }
    return _this5;
  }

  _createClass(Tag, [{
    key: 'mapContentToLocalProperties',
    value: function mapContentToLocalProperties(contentObject) {
      _get(Tag.prototype.__proto__ || Object.getPrototypeOf(Tag.prototype), 'mapContentToLocalProperties', this).call(this, contentObject);
      this.title = contentObject.title;
    }
  }, {
    key: 'referenceParams',
    value: function referenceParams() {
      var references = _.map(this.notes, function (note) {
        return { uuid: note.uuid, content_type: note.content_type };
      });

      return references;
    }
  }, {
    key: 'structureParams',
    value: function structureParams() {
      var params = {
        title: this.title
      };

      _.merge(params, _get(Tag.prototype.__proto__ || Object.getPrototypeOf(Tag.prototype), 'structureParams', this).call(this));
      return params;
    }
  }, {
    key: 'addItemAsRelationship',
    value: function addItemAsRelationship(item) {
      if (item.content_type == "Note") {
        if (!_.find(this.notes, item)) {
          this.notes.unshift(item);
        }
      }
      _get(Tag.prototype.__proto__ || Object.getPrototypeOf(Tag.prototype), 'addItemAsRelationship', this).call(this, item);
    }
  }, {
    key: 'removeItemAsRelationship',
    value: function removeItemAsRelationship(item) {
      if (item.content_type == "Note") {
        _.pull(this.notes, item);
      }
      _get(Tag.prototype.__proto__ || Object.getPrototypeOf(Tag.prototype), 'removeItemAsRelationship', this).call(this, item);
    }
  }, {
    key: 'removeAllRelationships',
    value: function removeAllRelationships() {
      this.notes.forEach(function (note) {
        _.pull(note.tags, this);
        note.setDirty(true);
      }.bind(this));

      this.notes = [];
    }
  }, {
    key: 'allReferencedObjects',
    value: function allReferencedObjects() {
      return this.notes;
    }
  }, {
    key: 'referencesAffectedBySharingChange',
    value: function referencesAffectedBySharingChange() {
      return this.notes;
    }
  }, {
    key: 'content_type',
    get: function get() {
      return "Tag";
    }
  }]);

  return Tag;
}(Item);

;angular.module('app.frontend').provider('apiController', function () {

  function domainName() {
    var domain_comps = location.hostname.split(".");
    var domain = domain_comps[domain_comps.length - 2] + "." + domain_comps[domain_comps.length - 1];
    return domain;
  }

  var url;

  this.defaultServerURL = function () {
    if (!url) {
      url = localStorage.getItem("server");
      if (!url) {
        url = "https://n3.standardnotes.org";
      }
    }
    return url;
  };

  this.$get = function ($rootScope, Restangular, modelManager, ngDialog) {
    return new ApiController($rootScope, Restangular, modelManager, ngDialog);
  };

  function ApiController($rootScope, Restangular, modelManager, ngDialog) {

    this.user = {};
    this.syncToken = localStorage.getItem("syncToken");

    /*
    Config
    */

    this.getServer = function () {
      if (!url) {
        url = localStorage.getItem("server");
        if (!url) {
          url = "https://n3.standardnotes.org";
          this.setServer(url);
        }
      }
      return url;
    };

    this.setServer = function (url, refresh) {
      localStorage.setItem("server", url);
      if (refresh) {
        window.location.reload();
      }
    };

    /*
    Auth
    */

    this.getAuthParams = function () {
      return JSON.parse(localStorage.getItem("auth_params"));
    };

    this.isUserSignedIn = function () {
      return localStorage.getItem("jwt");
    };

    this.userId = function () {
      return localStorage.getItem("uuid");
    };

    this.getAuthParamsForEmail = function (email, callback) {
      var request = Restangular.one("auth", "params");
      request.get({ email: email }).then(function (response) {
        callback(response.plain());
      }).catch(function (response) {
        console.log("Error getting current user", response);
        callback(response.data);
      });
    };

    this.getCurrentUser = function (callback) {
      if (!localStorage.getItem("jwt")) {
        callback(null);
        return;
      }
      Restangular.one("users/current").get().then(function (response) {
        var user = response.plain();
        _.merge(this.user, user);
        callback();
      }.bind(this)).catch(function (response) {
        console.log("Error getting current user", response);
        callback(response.data);
      });
    };

    this.login = function (email, password, callback) {
      this.getAuthParamsForEmail(email, function (authParams) {
        if (!authParams) {
          callback(null);
          return;
        }
        Neeto.crypto.computeEncryptionKeysForUser(_.merge({ password: password }, authParams), function (keys) {
          this.setMk(keys.mk);
          var request = Restangular.one("auth/sign_in");
          var params = { password: keys.pw, email: email };
          _.merge(request, params);
          request.post().then(function (response) {
            localStorage.setItem("jwt", response.token);
            localStorage.setItem("uuid", response.uuid);
            localStorage.setItem("auth_params", JSON.stringify(authParams));
            callback(response);
          }).catch(function (response) {
            callback(response.data);
          });
        }.bind(this));
      }.bind(this));
    };

    this.register = function (email, password, callback) {
      Neeto.crypto.generateInitialEncryptionKeysForUser({ password: password, email: email }, function (keys, authParams) {
        this.setMk(keys.mk);
        keys.mk = null;
        var request = Restangular.one("auth");
        var params = _.merge({ password: keys.pw, email: email }, authParams);
        _.merge(request, params);
        request.post().then(function (response) {
          localStorage.setItem("jwt", response.token);
          localStorage.setItem("uuid", response.uuid);
          localStorage.setItem("auth_params", JSON.stringify(_.omit(authParams, ["pw_nonce"])));
          callback(response);
        }).catch(function (response) {
          callback(response.data);
        });
      }.bind(this));
    };

    // this.changePassword = function(current_password, new_password) {
    //     this.getAuthParamsForEmail(email, function(authParams){
    //       if(!authParams) {
    //         callback(null);
    //         return;
    //       }
    //       Neeto.crypto.computeEncryptionKeysForUser(_.merge({password: current_password, email: user.email}, authParams), function(currentKeys) {
    //         Neeto.crypto.computeEncryptionKeysForUser(_.merge({password: new_password, email: user.email}, authParams), function(newKeys){
    //           var data = {};
    //           data.current_password = currentKeys.pw;
    //           data.password = newKeys.pw;
    //           data.password_confirmation = newKeys.pw;
    //
    //           var user = this.user;
    //
    //           this._performPasswordChange(currentKeys, newKeys, function(response){
    //             if(response && !response.error) {
    //               // this.showNewPasswordForm = false;
    //               // reencrypt data with new mk
    //               this.reencryptAllItemsAndSave(user, newKeys.mk, currentKeys.mk, function(success){
    //                 if(success) {
    //                   this.setMk(newKeys.mk);
    //                   alert("Your password has been changed and your data re-encrypted.");
    //                 } else {
    //                   // rollback password
    //                   this._performPasswordChange(newKeys, currentKeys, function(response){
    //                     alert("There was an error changing your password. Your password has been rolled back.");
    //                     window.location.reload();
    //                   })
    //                 }
    //               }.bind(this));
    //             } else {
    //               // this.showNewPasswordForm = false;
    //               alert("There was an error changing your password. Please try again.");
    //             }
    //           }.bind(this))
    //         }.bind(this));
    //       }.bind(this));
    //     }.bind(this));
    // }

    this._performPasswordChange = function (email, current_keys, new_keys, callback) {
      var request = Restangular.one("auth");
      var params = { password: new_keys.pw, password_confirmation: new_keys.pw, current_password: current_keys.pw, email: email };
      _.merge(request, params);
      request.patch().then(function (response) {
        callback(response);
      });
    };

    /*
    User
    */

    this.setUsername = function (username, callback) {
      var request = Restangular.one("users", this.userId());
      request.username = username;
      request.patch().then(function (response) {
        this.user.username = response.username;
        callback(response.plain());
      }.bind(this));
    };

    /*
    Items
    */

    this.setSyncToken = function (syncToken) {
      this.syncToken = syncToken;
      localStorage.setItem("syncToken", this.syncToken);
    };

    this.syncWithOptions = function (callback) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var dirtyItems = modelManager.getDirtyItems();

      this.writeItemsToLocalStorage(dirtyItems, function (responseItems) {
        if (!this.isUserSignedIn()) {
          // delete anything needing to be deleted
          dirtyItems.forEach(function (item) {
            if (item.deleted) {
              modelManager.removeItemLocally(item);
            }
          }.bind(this));
          modelManager.clearDirtyItems();
          if (callback) {
            callback();
          }
        }
      }.bind(this));

      if (!this.isUserSignedIn()) {
        return;
      }

      var request = Restangular.one("items/sync");
      request.items = _.map(dirtyItems, function (item) {
        return this.createRequestParamsForItem(item, options.additionalFields);
      }.bind(this));

      // console.log("syncing items", request.items);

      if (this.syncToken) {
        request.sync_token = this.syncToken;
      }

      request.post().then(function (response) {
        modelManager.clearDirtyItems();
        this.setSyncToken(response.sync_token);
        $rootScope.$broadcast("sync:updated_token", this.syncToken);

        var retrieved = this.handleItemsResponse(response.retrieved_items, null);
        // merge only metadata for saved items
        var omitFields = ["content", "enc_item_key", "auth_hash"];
        var saved = this.handleItemsResponse(response.saved_items, omitFields);

        this.handleUnsavedItemsResponse(response.unsaved);

        this.writeItemsToLocalStorage(saved, null);
        this.writeItemsToLocalStorage(retrieved, null);

        if (callback) {
          callback(response);
        }
      }.bind(this)).catch(function (response) {
        console.log("Sync error: ", response);
        if (callback) {
          callback({ error: "Sync error" });
        }
      });
    };

    this.sync = function (callback) {
      this.syncWithOptions(callback, undefined);
    };

    this.handleUnsavedItemsResponse = function (unsaved) {
      if (unsaved.length == 0) {
        return;
      }

      console.log("Handle unsaved", unsaved);
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = unsaved[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var mapping = _step4.value;

          var itemResponse = mapping.item;
          var item = modelManager.findItem(itemResponse.uuid);
          var error = mapping.error;
          if (error.tag == "uuid_conflict") {
            item.alternateUUID();
            item.setDirty(true);
            item.markAllReferencesDirty();
          }
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }

      this.syncWithOptions(null, { additionalFields: ["created_at", "updated_at"] });
    };

    this.handleItemsResponse = function (responseItems, omitFields) {
      this.decryptItems(responseItems);
      return modelManager.mapResponseItemsToLocalModelsOmittingFields(responseItems, omitFields);
    };

    this.createRequestParamsForItem = function (item, additionalFields) {
      return this.paramsForItem(item, !item.isPublic(), additionalFields, false);
    };

    this.paramsForExportFile = function (item, encrypted) {
      return _.omit(this.paramsForItem(item, encrypted, ["created_at", "updated_at"], true), ["deleted"]);
    };

    this.paramsForExtension = function (item, encrypted) {
      return _.omit(this.paramsForItem(item, encrypted, ["created_at", "updated_at"], true), ["deleted"]);
    };

    this.paramsForItem = function (item, encrypted, additionalFields, forExportFile) {
      var itemCopy = _.cloneDeep(item);

      console.assert(!item.dummy, "Item is dummy, should not have gotten here.", item.dummy);

      var params = { uuid: item.uuid, content_type: item.content_type,
        presentation_name: item.presentation_name, deleted: item.deleted };

      if (encrypted) {
        this.encryptSingleItem(itemCopy, this.retrieveMk());
        params.content = itemCopy.content;
        params.enc_item_key = itemCopy.enc_item_key;
        params.auth_hash = itemCopy.auth_hash;
      } else {
        params.content = forExportFile ? itemCopy.createContentJSONFromProperties() : "000" + Neeto.crypto.base64(JSON.stringify(itemCopy.createContentJSONFromProperties()));
        if (!forExportFile) {
          params.enc_item_key = null;
          params.auth_hash = null;
        }
      }

      if (additionalFields) {
        _.merge(params, _.pick(item, additionalFields));
      }

      return params;
    };

    this.shareItem = function (item, callback) {
      if (!this.isUserSignedIn()) {
        alert("You must be signed in to share.");
        return;
      }

      var shareFn = function () {
        item.presentation_name = "_auto_";
        var needsUpdate = [item].concat(item.referencesAffectedBySharingChange() || []);
        needsUpdate.forEach(function (needingUpdate) {
          needingUpdate.setDirty(true);
        });
        this.sync();
      }.bind(this);

      if (!this.user.username) {
        ngDialog.open({
          template: 'frontend/modals/username.html',
          controller: 'UsernameModalCtrl',
          resolve: {
            callback: function callback() {
              return shareFn;
            }
          },
          className: 'ngdialog-theme-default',
          disableAnimation: true
        });
      } else {
        shareFn();
      }
    };

    this.unshareItem = function (item, callback) {
      item.presentation_name = null;
      var needsUpdate = [item].concat(item.referencesAffectedBySharingChange() || []);
      needsUpdate.forEach(function (needingUpdate) {
        needingUpdate.setDirty(true);
      });
      this.sync(null);
    };

    /*
    Import
    */

    this.importJSONData = function (data, password, callback) {
      console.log("Importing data", data);

      var onDataReady = function () {
        var items = modelManager.mapResponseItemsToLocalModels(data.items);
        items.forEach(function (item) {
          item.setDirty(true);
          item.markAllReferencesDirty();
        });
        this.syncWithOptions(callback, { additionalFields: ["created_at", "updated_at"] });
      }.bind(this);

      if (data.auth_params) {
        Neeto.crypto.computeEncryptionKeysForUser(_.merge({ password: password }, data.auth_params), function (keys) {
          var mk = keys.mk;
          try {
            this.decryptItemsWithKey(data.items, mk);
            // delete items enc_item_key since the user's actually key will do the encrypting once its passed off
            data.items.forEach(function (item) {
              item.enc_item_key = null;
              item.auth_hash = null;
            });
            onDataReady();
          } catch (e) {
            console.log("Error decrypting", e);
            alert("There was an error decrypting your items. Make sure the password you entered is correct and try again.");
            callback(false, null);
            return;
          }
        }.bind(this));
      } else {
        onDataReady();
      }
    };

    /*
    Export
    */

    this.itemsDataFile = function (encrypted) {
      var textFile = null;
      var makeTextFile = function (text) {
        var data = new Blob([text], { type: 'text/json' });

        // If we are replacing a previously generated file we need to
        // manually revoke the object URL to avoid memory leaks.
        if (textFile !== null) {
          window.URL.revokeObjectURL(textFile);
        }

        textFile = window.URL.createObjectURL(data);

        // returns a URL you can use as a href
        return textFile;
      }.bind(this);

      var items = _.map(modelManager.allItemsMatchingTypes(["Tag", "Note"]), function (item) {
        return this.paramsForExportFile(item, encrypted);
      }.bind(this));

      var data = {
        items: items
      };

      if (encrypted) {
        data["auth_params"] = this.getAuthParams();
      }

      return makeTextFile(JSON.stringify(data, null, 2 /* pretty print */));
    };

    /*
    Merging
    */
    // this.mergeLocalDataRemotely = function(user, callback) {
    //   var request = Restangular.one("users", this.userId()).one("merge");
    //   var tags = user.tags;
    //   request.items = user.items;
    //   request.items.forEach(function(item){
    //     if(item.tag_id) {
    //       var tag = tags.filter(function(tag){return tag.uuid == item.tag_id})[0];
    //       item.tag_name = tag.title;
    //     }
    //   })
    //   request.post().then(function(response){
    //     callback();
    //     localStorage.removeItem('user');
    //   })
    // }


    this.staticifyObject = function (object) {
      return JSON.parse(JSON.stringify(object));
    };

    this.writeItemsToLocalStorage = function (items, callback) {
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = items[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var item = _step5.value;

          var params = this.paramsForItem(item, this.isUserSignedIn(), ["created_at", "updated_at", "presentation_url"], false);
          localStorage.setItem("item-" + item.uuid, JSON.stringify(params));
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }

      if (callback) {
        callback(items);
      }
    };

    this.loadLocalItems = function () {
      var itemsParams = [];
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key.startsWith("item-")) {
          var item = localStorage.getItem(key);
          itemsParams.push(JSON.parse(item));
        }
      }

      var items = this.handleItemsResponse(itemsParams, null);
      Item.sortItemsByDate(items);
    };

    /*
    Drafts
    */

    this.saveDraftToDisk = function (draft) {
      localStorage.setItem("draft", JSON.stringify(draft));
    };

    this.clearDraft = function () {
      localStorage.removeItem("draft");
    };

    this.getDraft = function () {
      var draftString = localStorage.getItem("draft");
      if (!draftString || draftString == 'undefined') {
        return null;
      }
      var jsonObj = _.merge({ content_type: "Note" }, JSON.parse(draftString));
      return modelManager.createItem(jsonObj);
    };

    /*
    Encrpytion
    */

    this.retrieveMk = function () {
      if (!this.mk) {
        this.mk = localStorage.getItem("mk");
      }
      return this.mk;
    };

    this.setMk = function (mk) {
      localStorage.setItem('mk', mk);
    };

    this.signout = function () {
      localStorage.clear();
    };

    this.encryptSingleItem = function (item, masterKey) {
      var item_key = null;
      if (item.enc_item_key) {
        item_key = Neeto.crypto.decryptText(item.enc_item_key, masterKey);
      } else {
        item_key = Neeto.crypto.generateRandomEncryptionKey();
        item.enc_item_key = Neeto.crypto.encryptText(item_key, masterKey);
      }

      var ek = Neeto.crypto.firstHalfOfKey(item_key);
      var ak = Neeto.crypto.secondHalfOfKey(item_key);
      var encryptedContent = "001" + Neeto.crypto.encryptText(JSON.stringify(item.createContentJSONFromProperties()), ek);
      var authHash = Neeto.crypto.hmac256(encryptedContent, ak);

      item.content = encryptedContent;
      item.auth_hash = authHash;
      item.local_encryption_scheme = "1.0";
    };

    this.decryptSingleItem = function (item, masterKey) {
      var item_key = Neeto.crypto.decryptText(item.enc_item_key, masterKey);

      var ek = Neeto.crypto.firstHalfOfKey(item_key);
      var ak = Neeto.crypto.secondHalfOfKey(item_key);
      var authHash = Neeto.crypto.hmac256(item.content, ak);
      if (authHash !== item.auth_hash || !item.auth_hash) {
        console.log("Authentication hash does not match.");
        return;
      }

      var content = Neeto.crypto.decryptText(item.content.substring(3, item.content.length), ek);
      item.content = content;
    };

    this.decryptItems = function (items) {
      var masterKey = this.retrieveMk();
      this.decryptItemsWithKey(items, masterKey);
    };

    this.decryptItemsWithKey = function (items, key) {
      var _iteratorNormalCompletion6 = true;
      var _didIteratorError6 = false;
      var _iteratorError6 = undefined;

      try {
        for (var _iterator6 = items[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
          var item = _step6.value;

          if (item.deleted == true) {
            continue;
          }
          var isString = typeof item.content === 'string' || item.content instanceof String;
          if (isString) {
            if (item.content.substring(0, 3) == "001" && item.enc_item_key) {
              // is encrypted
              this.decryptSingleItem(item, key);
            } else {
              // is base64 encoded
              item.content = Neeto.crypto.base64Decode(item.content.substring(3, item.content.length));
            }
          }
        }
      } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion6 && _iterator6.return) {
            _iterator6.return();
          }
        } finally {
          if (_didIteratorError6) {
            throw _iteratorError6;
          }
        }
      }
    };

    this.reencryptAllItemsAndSave = function (user, newMasterKey, oldMasterKey, callback) {
      var items = modelManager.allItems();
      items.forEach(function (item) {
        if (item.content.substring(0, 3) == "001" && item.enc_item_key) {
          // first decrypt item_key with old key
          var item_key = Neeto.crypto.decryptText(item.enc_item_key, oldMasterKey);
          // now encrypt item_key with new key
          item.enc_item_key = Neeto.crypto.encryptText(item_key, newMasterKey);
        }
      });

      this.saveBatchItems(user, items, function (success) {
        callback(success);
      }.bind(this));
    };
  }
});
;angular.module('app.frontend').directive('mbAutofocus', ['$timeout', function ($timeout) {
  return {
    restrict: 'A',
    scope: {
      shouldFocus: "="
    },
    link: function link($scope, $element) {
      $timeout(function () {
        if ($scope.shouldFocus) {
          $element[0].focus();
        }
      });
    }
  };
}]);
;
var ContextualExtensionsMenu = function () {
  function ContextualExtensionsMenu() {
    _classCallCheck(this, ContextualExtensionsMenu);

    this.restrict = "E";
    this.templateUrl = "frontend/directives/contextual-menu.html";
    this.scope = {
      item: "="
    };
  }

  _createClass(ContextualExtensionsMenu, [{
    key: 'controller',
    value: function controller($scope, modelManager, extensionManager) {
      'ngInject';

      $scope.extensions = extensionManager.extensionsInContextOfItem($scope.item);

      $scope.executeAction = function (action, extension) {
        action.running = true;
        extensionManager.executeAction(action, extension, $scope.item, function (response) {
          action.running = false;
        });
      };

      $scope.accessTypeForExtension = function (extension) {
        return extensionManager.extensionUsesEncryptedData(extension) ? "encrypted" : "decrypted";
      };
    }
  }]);

  return ContextualExtensionsMenu;
}();

angular.module('app.frontend').directive('contextualExtensionsMenu', function () {
  return new ContextualExtensionsMenu();
});
;angular.module('app.frontend').directive('draggable', function () {
  return {
    scope: {
      note: "="
    },
    link: function link(scope, element) {
      // this gives us the native JS object
      var el = element[0];

      el.draggable = true;

      el.addEventListener('dragstart', function (e) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('Note', JSON.stringify(scope.note));
        this.classList.add('drag');
        return false;
      }, false);

      el.addEventListener('dragend', function (e) {
        this.classList.remove('drag');
        return false;
      }, false);
    }
  };
});

angular.module('app.frontend').directive('droppable', function () {
  return {
    scope: {
      drop: '&',
      bin: '=',
      tag: "="
    },
    link: function link(scope, element) {
      // again we need the native object
      var el = element[0];

      el.addEventListener('dragover', function (e) {
        e.dataTransfer.dropEffect = 'move';
        // allows us to drop
        if (e.preventDefault) e.preventDefault();
        this.classList.add('over');
        return false;
      }, false);

      var counter = 0;

      el.addEventListener('dragenter', function (e) {
        counter++;
        this.classList.add('over');
        return false;
      }, false);

      el.addEventListener('dragleave', function (e) {
        counter--;
        if (counter === 0) {
          this.classList.remove('over');
        }
        return false;
      }, false);

      el.addEventListener('drop', function (e) {
        // Stops some browsers from redirecting.
        if (e.stopPropagation) e.stopPropagation();

        this.classList.remove('over');

        var binId = this.uuid;
        var note = new Note(JSON.parse(e.dataTransfer.getData('Note')));
        scope.$apply(function (scope) {
          var fn = scope.drop();
          if ('undefined' !== typeof fn) {
            fn(e, scope.tag, note);
          }
        });

        return false;
      }, false);
    }
  };
});
;angular.module('app.frontend').directive('fileChange', function () {
  return {
    restrict: 'A',
    scope: {
      handler: '&'
    },
    link: function link(scope, element) {
      element.on('change', function (event) {
        scope.$apply(function () {
          scope.handler({ files: event.target.files });
        });
      });
    }
  };
});
;angular.module('app.frontend').directive('lowercase', function () {
  return {
    require: 'ngModel',
    link: function link(scope, element, attrs, modelCtrl) {
      var lowercase = function lowercase(inputValue) {
        if (inputValue == undefined) inputValue = '';
        var lowercased = inputValue.toLowerCase();
        if (lowercased !== inputValue) {
          modelCtrl.$setViewValue(lowercased);
          modelCtrl.$render();
        }
        return lowercased;
      };
      modelCtrl.$parsers.push(lowercase);
      lowercase(scope[attrs.ngModel]);
    }
  };
});
;angular.module('app.frontend').directive('selectOnClick', ['$window', function ($window) {
  return {
    restrict: 'A',
    link: function link(scope, element, attrs) {
      element.on('focus', function () {
        if (!$window.getSelection().toString()) {
          // Required for mobile Safari
          this.setSelectionRange(0, this.value.length);
        }
      });
    }
  };
}]);
;
var ExtensionManager = function () {
  function ExtensionManager(Restangular, modelManager, apiController) {
    _classCallCheck(this, ExtensionManager);

    this.Restangular = Restangular;
    this.modelManager = modelManager;
    this.apiController = apiController;
    this.enabledRepeatActionUrls = JSON.parse(localStorage.getItem("enabledRepeatActionUrls")) || [];
    this.decryptedExtensions = JSON.parse(localStorage.getItem("decryptedExtensions")) || [];

    modelManager.addItemSyncObserver("extensionManager", "Extension", function (items) {
      var _iteratorNormalCompletion7 = true;
      var _didIteratorError7 = false;
      var _iteratorError7 = undefined;

      try {
        for (var _iterator7 = items[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
          var ext = _step7.value;


          ext.encrypted = this.extensionUsesEncryptedData(ext);

          var _iteratorNormalCompletion8 = true;
          var _didIteratorError8 = false;
          var _iteratorError8 = undefined;

          try {
            for (var _iterator8 = ext.actions[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
              var action = _step8.value;

              if (this.enabledRepeatActionUrls.includes(action.url)) {
                this.enableRepeatAction(action, ext);
              }
            }
          } catch (err) {
            _didIteratorError8 = true;
            _iteratorError8 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion8 && _iterator8.return) {
                _iterator8.return();
              }
            } finally {
              if (_didIteratorError8) {
                throw _iteratorError8;
              }
            }
          }
        }
      } catch (err) {
        _didIteratorError7 = true;
        _iteratorError7 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion7 && _iterator7.return) {
            _iterator7.return();
          }
        } finally {
          if (_didIteratorError7) {
            throw _iteratorError7;
          }
        }
      }
    }.bind(this));
  }

  _createClass(ExtensionManager, [{
    key: 'extensionsInContextOfItem',
    value: function extensionsInContextOfItem(item) {
      return this.extensions.filter(function (ext) {
        return ext.actionsWithContextForItem(item).length > 0;
      });
    }
  }, {
    key: 'actionWithURL',
    value: function actionWithURL(url) {
      var _iteratorNormalCompletion9 = true;
      var _didIteratorError9 = false;
      var _iteratorError9 = undefined;

      try {
        for (var _iterator9 = this.extensions[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
          var extension = _step9.value;

          return _.find(extension.actions, { url: url });
        }
      } catch (err) {
        _didIteratorError9 = true;
        _iteratorError9 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion9 && _iterator9.return) {
            _iterator9.return();
          }
        } finally {
          if (_didIteratorError9) {
            throw _iteratorError9;
          }
        }
      }
    }
  }, {
    key: 'extensionUsesEncryptedData',
    value: function extensionUsesEncryptedData(extension) {
      return !this.decryptedExtensions.includes(extension.url);
    }
  }, {
    key: 'changeExtensionEncryptionFormat',
    value: function changeExtensionEncryptionFormat(encrypted, extension) {
      if (encrypted) {
        _.pull(this.decryptedExtensions, extension.url);
      } else {
        this.decryptedExtensions.push(extension.url);
      }

      localStorage.setItem("decryptedExtensions", JSON.stringify(this.decryptedExtensions));

      extension.encrypted = this.extensionUsesEncryptedData(extension);
    }
  }, {
    key: 'addExtension',
    value: function addExtension(url, callback) {
      this.retrieveExtensionFromServer(url, callback);
    }
  }, {
    key: 'deleteExtension',
    value: function deleteExtension(extension) {
      var _iteratorNormalCompletion10 = true;
      var _didIteratorError10 = false;
      var _iteratorError10 = undefined;

      try {
        for (var _iterator10 = extension.actions[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
          var action = _step10.value;

          _.pull(this.decryptedExtensions, extension);
          if (action.repeat_mode) {
            if (this.isRepeatActionEnabled(action)) {
              this.disableRepeatAction(action);
            }
          }
        }
      } catch (err) {
        _didIteratorError10 = true;
        _iteratorError10 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion10 && _iterator10.return) {
            _iterator10.return();
          }
        } finally {
          if (_didIteratorError10) {
            throw _iteratorError10;
          }
        }
      }

      this.modelManager.setItemToBeDeleted(extension);
      this.apiController.sync(null);
    }
  }, {
    key: 'retrieveExtensionFromServer',
    value: function retrieveExtensionFromServer(url, callback) {
      this.Restangular.oneUrl(url, url).get().then(function (response) {
        var ext = this.handleExtensionLoadExternalResponseItem(url, response.plain());
        if (callback) {
          callback(ext);
        }
      }.bind(this)).catch(function (response) {
        console.log("Error registering extension", response);
        callback(null);
      });
    }
  }, {
    key: 'handleExtensionLoadExternalResponseItem',
    value: function handleExtensionLoadExternalResponseItem(url, externalResponseItem) {
      var extension = _.find(this.extensions, { url: url });
      if (extension) {
        extension.updateFromExternalResponseItem(externalResponseItem);
      } else {
        extension = new Extension(externalResponseItem);
        extension.url = url;
        extension.setDirty(true);
        this.modelManager.addItem(extension);
        this.apiController.sync(null);
      }

      return extension;
    }
  }, {
    key: 'refreshExtensionsFromServer',
    value: function refreshExtensionsFromServer() {
      var _iteratorNormalCompletion11 = true;
      var _didIteratorError11 = false;
      var _iteratorError11 = undefined;

      try {
        for (var _iterator11 = this.enabledRepeatActionUrls[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
          var url = _step11.value;

          var action = this.actionWithURL(url);
          if (action) {
            this.disableRepeatAction(action);
          }
        }
      } catch (err) {
        _didIteratorError11 = true;
        _iteratorError11 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion11 && _iterator11.return) {
            _iterator11.return();
          }
        } finally {
          if (_didIteratorError11) {
            throw _iteratorError11;
          }
        }
      }

      var _iteratorNormalCompletion12 = true;
      var _didIteratorError12 = false;
      var _iteratorError12 = undefined;

      try {
        for (var _iterator12 = this.extensions[Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
          var ext = _step12.value;

          this.retrieveExtensionFromServer(ext.url, function (extension) {
            extension.setDirty(true);
          });
        }
      } catch (err) {
        _didIteratorError12 = true;
        _iteratorError12 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion12 && _iterator12.return) {
            _iterator12.return();
          }
        } finally {
          if (_didIteratorError12) {
            throw _iteratorError12;
          }
        }
      }
    }
  }, {
    key: 'executeAction',
    value: function executeAction(action, extension, item, callback) {

      if (this.extensionUsesEncryptedData(extension) && !this.apiController.isUserSignedIn()) {
        alert("To send data encrypted, you must have an encryption key, and must therefore be signed in.");
        callback(null);
        return;
      }

      switch (action.verb) {
        case "get":
          {
            this.Restangular.oneUrl(action.url, action.url).get().then(function (response) {
              action.error = false;
              var items = response.items;
              this.modelManager.mapResponseItemsToLocalModels(items);
              callback(items);
            }.bind(this)).catch(function (response) {
              action.error = true;
            });

            break;
          }

        case "show":
          {
            var win = window.open(action.url, '_blank');
            win.focus();
            callback();
            break;
          }

        case "post":
          {
            var params = {};

            if (action.all) {
              var items = this.modelManager.allItemsMatchingTypes(action.content_types);
              params.items = items.map(function (item) {
                var params = this.outgoingParamsForItem(item, extension);
                return params;
              }.bind(this));
            } else {
              params.item = this.outgoingParamsForItem(item, extension);
            }

            this.performPost(action, extension, params, function (response) {
              callback(response);
            });

            break;
          }

        default:
          {}
      }

      action.lastExecuted = new Date();
    }
  }, {
    key: 'isRepeatActionEnabled',
    value: function isRepeatActionEnabled(action) {
      return this.enabledRepeatActionUrls.includes(action.url);
    }
  }, {
    key: 'disableRepeatAction',
    value: function disableRepeatAction(action, extension) {
      _.pull(this.enabledRepeatActionUrls, action.url);
      localStorage.setItem("enabledRepeatActionUrls", JSON.stringify(this.enabledRepeatActionUrls));
      this.modelManager.removeItemChangeObserver(action.url);

      console.assert(this.isRepeatActionEnabled(action) == false);
    }
  }, {
    key: 'enableRepeatAction',
    value: function enableRepeatAction(action, extension) {
      if (!_.find(this.enabledRepeatActionUrls, action.url)) {
        this.enabledRepeatActionUrls.push(action.url);
        localStorage.setItem("enabledRepeatActionUrls", JSON.stringify(this.enabledRepeatActionUrls));
      }

      if (action.repeat_mode) {

        if (action.repeat_mode == "watch") {
          this.modelManager.addItemChangeObserver(action.url, action.content_types, function (changedItems) {
            this.triggerWatchAction(action, extension, changedItems);
          }.bind(this));
        }

        if (action.repeat_mode == "loop") {
          // todo
        }
      }
    }
  }, {
    key: 'queueAction',
    value: function queueAction(action, extension, delay, changedItems) {
      this.actionQueue = this.actionQueue || [];
      if (_.find(this.actionQueue, { url: action.url })) {
        return;
      }

      // console.log("Successfully queued", action, this.actionQueue.length);
      this.actionQueue.push(action);

      setTimeout(function () {
        // console.log("Performing queued action", action);
        this.triggerWatchAction(action, extension, changedItems);
        _.pull(this.actionQueue, action);
      }.bind(this), delay * 1000);
    }
  }, {
    key: 'triggerWatchAction',
    value: function triggerWatchAction(action, extension, changedItems) {
      if (action.repeat_timeout > 0) {
        var lastExecuted = action.lastExecuted;
        var diffInSeconds = (new Date() - lastExecuted) / 1000;
        if (diffInSeconds < action.repeat_timeout) {
          var delay = action.repeat_timeout - diffInSeconds;
          this.queueAction(action, extension, delay, changedItems);
          return;
        }
      }

      action.lastExecuted = new Date();

      console.log("Performing action.");

      if (action.verb == "post") {
        var params = {};
        params.items = changedItems.map(function (item) {
          var params = this.outgoingParamsForItem(item, extension);
          return params;
        }.bind(this));
        this.performPost(action, extension, params, null);
      } else {
        // todo
      }
    }
  }, {
    key: 'outgoingParamsForItem',
    value: function outgoingParamsForItem(item, extension) {
      return this.apiController.paramsForExtension(item, this.extensionUsesEncryptedData(extension));
    }
  }, {
    key: 'performPost',
    value: function performPost(action, extension, params, callback) {
      var request = this.Restangular.oneUrl(action.url, action.url);
      if (this.extensionUsesEncryptedData(extension)) {
        request.auth_params = this.apiController.getAuthParams();
      }
      _.merge(request, params);

      request.post().then(function (response) {
        action.error = false;
        if (callback) {
          callback(response.plain());
        }
      }).catch(function (response) {
        action.error = true;
        console.log("Action error response:", response);
        if (callback) {
          callback({ error: "Request error" });
        }
      });
    }
  }, {
    key: 'extensions',
    get: function get() {
      return this.modelManager.extensions;
    }
  }]);

  return ExtensionManager;
}();

angular.module('app.frontend').service('extensionManager', ExtensionManager);
;angular.module('app.frontend').filter('appDate', function ($filter) {
  return function (input) {
    return input ? $filter('date')(new Date(input), 'MM/dd/yyyy', 'UTC') : '';
  };
}).filter('appDateTime', function ($filter) {
  return function (input) {
    return input ? $filter('date')(new Date(input), 'MM/dd/yyyy h:mm a') : '';
  };
});
;angular.module('app.frontend').service('markdownRenderer', function ($sce) {

  marked.setOptions({
    breaks: true,
    sanitize: true
  });

  this.renderedContentForText = function (text) {
    if (!text || text.length == 0) {
      return "";
    }
    return marked(text);
  };

  this.renderHtml = function (html_code) {
    return $sce.trustAsHtml(html_code);
  };
});
;
var ModelManager = function () {
  function ModelManager() {
    _classCallCheck(this, ModelManager);

    this.notes = [];
    this.tags = [];
    this.itemSyncObservers = [];
    this.itemChangeObservers = [];
    this.items = [];
    this._extensions = [];
  }

  _createClass(ModelManager, [{
    key: 'allItemsMatchingTypes',
    value: function allItemsMatchingTypes(contentTypes) {
      return this.items.filter(function (item) {
        return (contentTypes.includes(item.content_type) || contentTypes.includes("*")) && !item.dummy;
      });
    }
  }, {
    key: 'findItem',
    value: function findItem(itemId) {
      return _.find(this.items, { uuid: itemId });
    }
  }, {
    key: 'mapResponseItemsToLocalModels',
    value: function mapResponseItemsToLocalModels(items) {
      return this.mapResponseItemsToLocalModelsOmittingFields(items, null);
    }
  }, {
    key: 'mapResponseItemsToLocalModelsOmittingFields',
    value: function mapResponseItemsToLocalModelsOmittingFields(items, omitFields) {
      var models = [];
      var _iteratorNormalCompletion13 = true;
      var _didIteratorError13 = false;
      var _iteratorError13 = undefined;

      try {
        for (var _iterator13 = items[Symbol.iterator](), _step13; !(_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done); _iteratorNormalCompletion13 = true) {
          var json_obj = _step13.value;

          json_obj = _.omit(json_obj, omitFields || []);
          var item = this.findItem(json_obj["uuid"]);
          if (json_obj["deleted"] == true) {
            if (item) {
              this.removeItemLocally(item);
            }
            continue;
          }

          _.omit(json_obj, omitFields);

          if (!item) {
            item = this.createItem(json_obj);
          } else {
            item.updateFromJSON(json_obj);
          }

          this.addItem(item);

          if (json_obj.content) {
            this.resolveReferencesForItem(item);
          }

          models.push(item);
        }
      } catch (err) {
        _didIteratorError13 = true;
        _iteratorError13 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion13 && _iterator13.return) {
            _iterator13.return();
          }
        } finally {
          if (_didIteratorError13) {
            throw _iteratorError13;
          }
        }
      }

      this.notifySyncObserversOfModels(models);

      this.sortItems();
      return models;
    }
  }, {
    key: 'notifySyncObserversOfModels',
    value: function notifySyncObserversOfModels(models) {
      var _iteratorNormalCompletion14 = true;
      var _didIteratorError14 = false;
      var _iteratorError14 = undefined;

      try {
        for (var _iterator14 = this.itemSyncObservers[Symbol.iterator](), _step14; !(_iteratorNormalCompletion14 = (_step14 = _iterator14.next()).done); _iteratorNormalCompletion14 = true) {
          var observer = _step14.value;

          var relevantItems = models.filter(function (item) {
            return item.content_type == observer.type;
          });
          if (relevantItems.length > 0) {
            observer.callback(relevantItems);
          }
        }
      } catch (err) {
        _didIteratorError14 = true;
        _iteratorError14 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion14 && _iterator14.return) {
            _iterator14.return();
          }
        } finally {
          if (_didIteratorError14) {
            throw _iteratorError14;
          }
        }
      }
    }
  }, {
    key: 'notifyItemChangeObserversOfModels',
    value: function notifyItemChangeObserversOfModels(models) {
      var _iteratorNormalCompletion15 = true;
      var _didIteratorError15 = false;
      var _iteratorError15 = undefined;

      try {
        for (var _iterator15 = this.itemChangeObservers[Symbol.iterator](), _step15; !(_iteratorNormalCompletion15 = (_step15 = _iterator15.next()).done); _iteratorNormalCompletion15 = true) {
          var observer = _step15.value;

          var relevantItems = models.filter(function (item) {
            return observer.content_types.includes(item.content_type) || observer.content_types.includes("*");
          });

          if (relevantItems.length > 0) {
            observer.callback(relevantItems);
          }
        }
      } catch (err) {
        _didIteratorError15 = true;
        _iteratorError15 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion15 && _iterator15.return) {
            _iterator15.return();
          }
        } finally {
          if (_didIteratorError15) {
            throw _iteratorError15;
          }
        }
      }
    }
  }, {
    key: 'createItem',
    value: function createItem(json_obj) {
      var item;
      if (json_obj.content_type == "Note") {
        item = new Note(json_obj);
      } else if (json_obj.content_type == "Tag") {
        item = new Tag(json_obj);
      } else if (json_obj.content_type == "Extension") {
        item = new Extension(json_obj);
      } else {
        item = new Item(json_obj);
      }

      item.addObserver(this, function (changedItem) {
        this.notifyItemChangeObserversOfModels([changedItem]);
      }.bind(this));

      return item;
    }
  }, {
    key: 'addItems',
    value: function addItems(items) {
      this.items = _.uniq(this.items.concat(items));

      items.forEach(function (item) {
        if (item.content_type == "Tag") {
          if (!_.find(this.tags, { uuid: item.uuid })) {
            this.tags.unshift(item);
          }
        } else if (item.content_type == "Note") {
          if (!_.find(this.notes, { uuid: item.uuid })) {
            this.notes.unshift(item);
          }
        } else if (item.content_type == "Extension") {
          if (!_.find(this._extensions, { uuid: item.uuid })) {
            this._extensions.unshift(item);
          }
        }
      }.bind(this));
    }
  }, {
    key: 'addItem',
    value: function addItem(item) {
      this.addItems([item]);
    }
  }, {
    key: 'itemsForContentType',
    value: function itemsForContentType(contentType) {
      return this.items.filter(function (item) {
        return item.content_type == contentType;
      });
    }
  }, {
    key: 'resolveReferencesForItem',
    value: function resolveReferencesForItem(item) {
      var contentObject = item.contentObject;
      if (!contentObject.references) {
        return;
      }

      var _iteratorNormalCompletion16 = true;
      var _didIteratorError16 = false;
      var _iteratorError16 = undefined;

      try {
        for (var _iterator16 = contentObject.references[Symbol.iterator](), _step16; !(_iteratorNormalCompletion16 = (_step16 = _iterator16.next()).done); _iteratorNormalCompletion16 = true) {
          var reference = _step16.value;

          var referencedItem = this.findItem(reference.uuid);
          if (referencedItem) {
            item.addItemAsRelationship(referencedItem);
            referencedItem.addItemAsRelationship(item);
          } else {
            // console.log("Unable to find item:", reference.uuid);
          }
        }
      } catch (err) {
        _didIteratorError16 = true;
        _iteratorError16 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion16 && _iterator16.return) {
            _iterator16.return();
          }
        } finally {
          if (_didIteratorError16) {
            throw _iteratorError16;
          }
        }
      }
    }
  }, {
    key: 'sortItems',
    value: function sortItems() {
      Item.sortItemsByDate(this.notes);

      this.tags.forEach(function (tag) {
        Item.sortItemsByDate(tag.notes);
      });
    }
  }, {
    key: 'addItemSyncObserver',
    value: function addItemSyncObserver(id, type, callback) {
      this.itemSyncObservers.push({ id: id, type: type, callback: callback });
    }
  }, {
    key: 'removeItemSyncObserver',
    value: function removeItemSyncObserver(id) {
      _.remove(this.itemSyncObservers, _.find(this.itemSyncObservers, { id: id }));
    }
  }, {
    key: 'addItemChangeObserver',
    value: function addItemChangeObserver(id, content_types, callback) {
      this.itemChangeObservers.push({ id: id, content_types: content_types, callback: callback });
    }
  }, {
    key: 'removeItemChangeObserver',
    value: function removeItemChangeObserver(id) {
      _.remove(this.itemChangeObservers, _.find(this.itemChangeObservers, { id: id }));
    }
  }, {
    key: 'getDirtyItems',
    value: function getDirtyItems() {
      return this.items.filter(function (item) {
        return item.dirty == true && !item.dummy;
      });
    }
  }, {
    key: 'clearDirtyItems',
    value: function clearDirtyItems() {
      this.getDirtyItems().forEach(function (item) {
        item.setDirty(false);
      });
    }
  }, {
    key: 'setItemToBeDeleted',
    value: function setItemToBeDeleted(item) {
      item.deleted = true;
      if (!item.dummy) {
        item.setDirty(true);
      }
      item.removeAllRelationships();
    }
  }, {
    key: 'removeItemLocally',
    value: function removeItemLocally(item) {
      _.pull(this.items, item);

      if (item.content_type == "Tag") {
        _.pull(this.tags, item);
      } else if (item.content_type == "Note") {
        _.pull(this.notes, item);
      } else if (item.content_type == "Extension") {
        _.pull(this._extensions, item);
      }
    }

    /*
    Relationships
    */

  }, {
    key: 'createRelationshipBetweenItems',
    value: function createRelationshipBetweenItems(itemOne, itemTwo) {
      itemOne.addItemAsRelationship(itemTwo);
      itemTwo.addItemAsRelationship(itemOne);

      itemOne.setDirty(true);
      itemTwo.setDirty(true);
    }
  }, {
    key: 'removeRelationshipBetweenItems',
    value: function removeRelationshipBetweenItems(itemOne, itemTwo) {
      itemOne.removeItemAsRelationship(itemTwo);
      itemTwo.removeItemAsRelationship(itemOne);

      itemOne.setDirty(true);
      itemTwo.setDirty(true);
    }
  }, {
    key: 'allItems',
    get: function get() {
      return this.items.filter(function (item) {
        return !item.dummy;
      });
    }
  }, {
    key: 'extensions',
    get: function get() {
      return this._extensions.filter(function (ext) {
        return !ext.deleted;
      });
    }
  }, {
    key: 'filteredNotes',
    get: function get() {
      return Note.filterDummyNotes(this.notes);
    }
  }]);

  return ModelManager;
}();

angular.module('app.frontend').service('modelManager', ModelManager);


},{}]},{},[1]);
