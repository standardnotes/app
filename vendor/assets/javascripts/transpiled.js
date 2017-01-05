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
          email = _ref.email,
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
      this.generateSymmetricKeyPair(_.merge({ email: email, password: password, pw_salt: pw_salt }, defaults), function (keys) {
        var pw = keys[0];
        var mk = keys[1];

        callback(_.merge({ pw: pw, mk: mk, pw_nonce: pw_nonce }, defaults));
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

angular.module('app.frontend', ['ui.router', 'restangular', 'oc.lazyLoad', 'angularLazyImg', 'ngDialog']).config(function (RestangularProvider, apiControllerProvider) {
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
}).config(['$qProvider', function ($qProvider) {
  // $qProvider.errorOnUnhandledRejections(false);
}]);
;angular.module('app.frontend').config(function ($stateProvider, $urlRouterProvider, $locationProvider) {

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
  })

  // 404 Error
  .state('404', {
    parent: 'base',
    views: {
      'content@': {
        templateUrl: 'frontend/errors/404.html'
      }
    }
  });

  // Default fall back route
  $urlRouterProvider.otherwise(function ($injector, $location) {
    var state = $injector.get('$state');
    state.go('404');
    return $location.path();
  });

  // enable HTML5 Mode for SEO
  $locationProvider.html5Mode(true);
});
;
var BaseCtrl = function BaseCtrl($rootScope, modelManager) {
  // $rootScope.resetPasswordSubmit = function() {
  //   var new_keys = Neeto.crypto.generateEncryptionKeysForUser($rootScope.resetData.password, $rootScope.resetData.email);
  //   var data = _.clone($rootScope.resetData);
  //   data.password = new_keys.pw;
  //   data.password_confirmation = new_keys.pw;
  //   $auth.updatePassword(data);
  //   apiController.setMk(new_keys.mk);
  // }

  _classCallCheck(this, BaseCtrl);
};

angular.module('app.frontend').controller('BaseCtrl', BaseCtrl);
;angular.module('app.frontend').directive("editorSection", function ($timeout) {
  return {
    restrict: 'E',
    scope: {
      save: "&",
      remove: "&",
      note: "=",
      user: "="
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
}).controller('EditorCtrl', function ($sce, $timeout, apiController, markdownRenderer, $rootScope) {

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
    if (this.user.uuid) {
      // signed out users have local autosave, dont need draft saving
      apiController.saveDraftToDisk(this.note);
    }

    if (saveTimeout) $timeout.cancel(saveTimeout);
    if (statusTimeout) $timeout.cancel(statusTimeout);
    saveTimeout = $timeout(function () {
      this.noteStatus = "Saving...";
      this.saveNote();
    }.bind(this), 150);
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
    this.note.dirty = true;

    apiController.sync(function (response) {
      if (!response) {
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
    scope: {
      user: "=",
      logout: "&"
    },
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
}).controller('HeaderCtrl', function ($state, apiController, modelManager, serverSideValidation, $timeout, extensionManager) {

  this.extensionManager = extensionManager;

  this.changePasswordPressed = function () {
    this.showNewPasswordForm = !this.showNewPasswordForm;
  };

  this.accountMenuPressed = function () {
    this.serverData = { url: apiController.getServer() };
    this.showAccountMenu = !this.showAccountMenu;
    this.showFaq = false;
    this.showNewPasswordForm = false;
  };

  this.toggleExtensions = function () {
    this.showExtensionsMenu = !this.showExtensionsMenu;
  };

  this.toggleExtensionForm = function () {
    this.newExtensionData = {};
    this.showNewExtensionForm = !this.showNewExtensionForm;
  };

  this.submitNewExtensionForm = function () {
    extensionManager.addExtension(this.newExtensionData.url);
  };

  this.selectedAction = function (action, extension) {
    extensionManager.executeAction(action, extension, function (response) {
      apiController.sync(null);
    });
  };

  this.changeServer = function () {
    apiController.setServer(this.serverData.url, true);
  };

  this.signOutPressed = function () {
    this.showAccountMenu = false;
    this.logout()();
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

      apiController.changePassword(this.user, this.passwordChangeData.current_password, this.passwordChangeData.new_password, function (response) {});
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
      if (!response) {
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

  this.forgotPasswordSubmit = function () {
    // $auth.requestPasswordReset(this.resetData)
    //   .then(function(resp) {
    //     this.resetData.response = "Success";
    //     // handle success response
    //   }.bind(this))
    //   .catch(function(resp) {
    //     // handle error response
    //     this.resetData.response = "Error";
    //   }.bind(this));
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

  this.downloadDataArchive = function () {
    var link = document.createElement('a');
    link.setAttribute('download', 'notes.json');
    link.href = apiController.itemsDataFile();
    link.click();
  };

  this.importFileSelected = function (files) {
    var file = files[0];
    var reader = new FileReader();
    reader.onload = function (e) {
      apiController.importJSONData(e.target.result, function (success, response) {
        console.log("import response", success, response);
        if (success) {
          // window.location.reload();
        } else {
          alert("There was an error importing your data. Please try again.");
        }
      });
    };
    reader.readAsText(file);
  };

  this.onAuthSuccess = function (user) {
    this.user.uuid = user.uuid;

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

  var onUserSet = function onUserSet() {
    apiController.setUser($scope.defaultUser);
    $scope.allTag = new Tag({ all: true });
    $scope.allTag.title = "All";
    $scope.tags = modelManager.tags;
    $scope.allTag.notes = modelManager.notes;

    apiController.sync(null);
    // refresh every 30s
    setInterval(function () {
      apiController.sync(null);
    }, 30000);
  };

  apiController.getCurrentUser(function (user) {
    if (user) {
      $scope.defaultUser = user;
      $rootScope.title = "Notes — Standard Notes";
      onUserSet();
    } else {
      $scope.defaultUser = new User(apiController.loadLocalItemsAndUser());
      onUserSet();
    }
  });

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
    tag.dirty = true;
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
    note.dirty = true;

    apiController.sync(function () {
      note.hasChanges = false;

      if (callback) {
        callback(true);
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

  /*
  Header Ctrl Callbacks
  */

  $scope.headerLogout = function () {
    $scope.defaultUser = apiController.loadLocalItemsAndUser();
    $scope.tags = $scope.defaultUser.tags;
  };
});
;angular.module('app.frontend').directive("notesSection", function () {
  return {
    scope: {
      addNew: "&",
      selectionMade: "&",
      remove: "&",
      tag: "=",
      user: "=",
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
}).controller('NotesCtrl', function (apiController, $timeout, $rootScope) {

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

    if (!this.user.uuid) {
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
    this.newNote = new Note({ dummy: true, text: "" });
    this.newNote.title = title;
    this.selectNote(this.newNote);
    this.addNew()(this.newNote);
  };

  this.noteFilter = { text: '' };

  this.filterNotes = function (note) {
    if (this.noteFilter.text.length == 0) {
      note.visible = true;
    } else {
      note.visible = note.title.toLowerCase().includes(this.noteFilter.text) || note.text.toLowerCase().includes(this.noteFilter.text);
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
      user: "=",
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
}).controller('TagsCtrl', function () {

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

    this.newTag = new Tag({});
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
;angular.module('app.frontend').controller('UsernameModalCtrl', function ($scope, apiController, Restangular, user, callback, $timeout) {
  $scope.formData = {};

  $scope.saveUsername = function () {
    apiController.setUsername(user, $scope.formData.username, function (response) {
      var username = response.username;
      user.username = username;
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
    key: 'removeFromRelationships',
    value: function removeFromRelationships() {
      // must override
    }
  }, {
    key: 'mergeMetadataFromItem',
    value: function mergeMetadataFromItem(item) {
      _.merge(this, _.omit(item, ["content"]));
    }
  }, {
    key: 'referencesAffectedBySharingChange',
    value: function referencesAffectedBySharingChange() {
      // should be overriden to determine which references should be decrypted/encrypted
      return null;
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
      // console.log("getting content object from content", this.content);
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
var Extension = function (_Item) {
  _inherits(Extension, _Item);

  function Extension(json) {
    _classCallCheck(this, Extension);

    var _this3 = _possibleConstructorReturn(this, (Extension.__proto__ || Object.getPrototypeOf(Extension)).call(this, json));

    _.merge(_this3, json);

    _this3.actions = _this3.actions.map(function (action) {
      return new Action(action);
    });
    return _this3;
  }

  return Extension;
}(Item);

var Action = function Action(json) {
  _classCallCheck(this, Action);

  _.merge(this, json);

  var comps = this.type.split(":");
  if (comps.length > 0) {
    this.repeatable = true;
    this.repeatType = comps[0]; // 'watch' or 'poll'
    this.repeatVerb = comps[1]; // http verb
    this.repeatFrequency = comps[2];
  }
};

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
    key: 'removeFromRelationships',
    value: function removeFromRelationships() {
      this.tags.forEach(function (tag) {
        _.pull(tag.notes, this);
        tag.dirty = true;
      });
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
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.tags[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var tag = _step.value;

          if (tag.isPublic()) {
            return true;
          }
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
    key: 'removeFromRelationships',
    value: function removeFromRelationships() {
      this.notes.forEach(function (note) {
        _.pull(note.tags, this);
        note.dirty = true;
      });
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

;
var User = function User(json_obj) {
  _classCallCheck(this, User);

  _.merge(this, json_obj);
};

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

    this.setUser = function (user) {
      this.user = user;
    };

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
        callback(user);
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
        Neeto.crypto.computeEncryptionKeysForUser(_.merge({ email: email, password: password }, authParams), function (keys) {
          this.setMk(keys.mk);
          var request = Restangular.one("auth/sign_in");
          var params = { password: keys.pw, email: email };
          _.merge(request, params);
          request.post().then(function (response) {
            localStorage.setItem("jwt", response.token);
            callback(response);
          }).catch(function (response) {
            callback(response.data);
          });
        }.bind(this));
      }.bind(this));
    };

    this.register = function (email, password, callback) {
      Neeto.crypto.generateInitialEncryptionKeysForUser({ password: password, email: email }, function (keys) {
        this.setMk(keys.mk);
        keys.mk = null;
        var request = Restangular.one("auth");
        var params = _.merge({ password: keys.pw, email: email }, keys);
        _.merge(request, params);
        request.post().then(function (response) {
          localStorage.setItem("jwt", response.token);
          callback(response);
        }).catch(function (response) {
          callback(response.data);
        });
      }.bind(this));
    };

    this.changePassword = function (user, current_password, new_password) {
      this.getAuthParamsForEmail(email, function (authParams) {
        if (!authParams) {
          callback(null);
          return;
        }
        Neeto.crypto.computeEncryptionKeysForUser(_.merge({ password: current_password, email: user.email }, authParams), function (currentKeys) {
          Neeto.crypto.computeEncryptionKeysForUser(_.merge({ password: new_password, email: user.email }, authParams), function (newKeys) {
            var data = {};
            data.current_password = currentKeys.pw;
            data.password = newKeys.pw;
            data.password_confirmation = newKeys.pw;

            var user = this.user;

            this._performPasswordChange(currentKeys, newKeys, function (response) {
              if (response && !response.error) {
                // this.showNewPasswordForm = false;
                // reencrypt data with new mk
                this.reencryptAllItemsAndSave(user, newKeys.mk, currentKeys.mk, function (success) {
                  if (success) {
                    this.setMk(newKeys.mk);
                    alert("Your password has been changed and your data re-encrypted.");
                  } else {
                    // rollback password
                    this._performPasswordChange(newKeys, currentKeys, function (response) {
                      alert("There was an error changing your password. Your password has been rolled back.");
                      window.location.reload();
                    });
                  }
                }.bind(this));
              } else {
                // this.showNewPasswordForm = false;
                alert("There was an error changing your password. Please try again.");
              }
            }.bind(this));
          }.bind(this));
        }.bind(this));
      }.bind(this));
    };

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

    this.setUsername = function (user, username, callback) {
      var request = Restangular.one("users", user.uuid);
      request.username = username;
      request.patch().then(function (response) {
        callback(response.plain());
      });
    };

    /*
    Ensures that if encryption is disabled, all local items are uncrypted,
    and that if it's enabled, that all local items are encrypted
    */
    this.verifyEncryptionStatusOfAllItems = function (user, callback) {
      var allItems = user.filteredItems();
      var itemsNeedingUpdate = [];
      allItems.forEach(function (item) {
        if (!item.isPublic()) {
          if (item.encryptionEnabled() && !item.isEncrypted()) {
            itemsNeedingUpdate.push(item);
          }
        } else {
          if (item.isEncrypted()) {
            itemsNeedingUpdate.push(item);
          }
        }
      }.bind(this));

      if (itemsNeedingUpdate.length > 0) {
        console.log("verifying encryption, items need updating", itemsNeedingUpdate);
        this.saveBatchItems(user, itemsNeedingUpdate, callback);
      }
    };

    /*
    Items
    */

    this.syncWithOptions = function (callback) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (!this.user.uuid) {
        this.writeItemsToLocalStorage(function (responseItems) {
          this.handleItemsResponse(responseItems);
          modelManager.clearDirtyItems();
          if (callback) {
            callback();
          }
        }.bind(this));
        return;
      }

      var dirtyItems = modelManager.getDirtyItems();
      var request = Restangular.one("items/sync");
      request.items = _.map(dirtyItems, function (item) {
        return this.createRequestParamsForItem(item, options.additionalFields);
      }.bind(this));

      console.log("syncing items", request.items);

      if (this.syncToken) {
        request.sync_token = this.syncToken;
      }

      request.post().then(function (response) {
        modelManager.clearDirtyItems();
        this.syncToken = response.sync_token;
        $rootScope.$broadcast("sync:updated_token", this.syncToken);

        this.handleItemsResponse(response.retrieved_items, null);
        // merge only metadata for saved items
        var omitFields = ["content", "enc_item_key", "auth_hash"];
        this.handleItemsResponse(response.saved_items, omitFields);

        if (callback) {
          callback(response);
        }
      }.bind(this)).catch(function (response) {
        console.log("Sync error: ", response);
        callback(null);
      });
    };

    this.sync = function (callback) {
      this.syncWithOptions(callback, undefined);
    };

    this.handleItemsResponse = function (responseItems, omitFields) {
      this.decryptItems(responseItems);
      return modelManager.mapResponseItemsToLocalModelsOmittingFields(responseItems, omitFields);
    };

    this.createRequestParamsForItem = function (item, additionalFields) {
      return this.paramsForItem(item, !item.isPublic(), additionalFields, false);
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
        params.content = forExportFile ? itemCopy.content : "000" + Neeto.crypto.base64(JSON.stringify(itemCopy.createContentJSONFromProperties()));
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
      if (!this.user.uuid) {
        alert("You must be signed in to share.");
        return;
      }

      var shareFn = function () {
        item.presentation_name = "_auto_";
        var needsUpdate = [item].concat(item.referencesAffectedBySharingChange() || []);
        needsUpdate.forEach(function (needingUpdate) {
          needingUpdate.dirty = true;
        });
        this.sync();
      }.bind(this);

      if (!this.user.username) {
        ngDialog.open({
          template: 'frontend/modals/username.html',
          controller: 'UsernameModalCtrl',
          resolve: {
            user: function () {
              return this.user;
            }.bind(this),
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
        needingUpdate.dirty = true;
      });
      this.sync(null);
    };

    /*
    Import
    */

    this.importJSONData = function (jsonString, callback) {
      var data = JSON.parse(jsonString);
      modelManager.mapResponseItemsToLocalModels(data.items);
      modelManager.items.forEach(function (item) {
        item.dirty = true;
      });
      this.syncWithOptions(callback, { additionalFields: ["created_at", "updated_at"] });
    };

    /*
    Export
    */

    this.itemsDataFile = function () {
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

      var items = _.map(modelManager.items, function (item) {
        return _.omit(this.paramsForItem(item, false, ["created_at", "updated_at"], true), ["deleted"]);
      }.bind(this));

      var data = {
        items: items
      };

      return makeTextFile(JSON.stringify(data, null, 2 /* pretty print */));
    };

    /*
    Merging
    */
    this.mergeLocalDataRemotely = function (user, callback) {
      var request = Restangular.one("users", user.uuid).one("merge");
      var tags = user.tags;
      request.items = user.items;
      request.items.forEach(function (item) {
        if (item.tag_id) {
          var tag = tags.filter(function (tag) {
            return tag.uuid == item.tag_id;
          })[0];
          item.tag_name = tag.title;
        }
      });
      request.post().then(function (response) {
        callback();
        localStorage.removeItem('user');
      });
    };

    this.staticifyObject = function (object) {
      return JSON.parse(JSON.stringify(object));
    };

    this.writeItemsToLocalStorage = function (callback) {
      var items = _.map(modelManager.items, function (item) {
        return this.paramsForItem(item, false, ["created_at", "updated_at"], false);
      }.bind(this));
      console.log("writing items to local", items);
      this.writeToLocalStorage('items', items);
      callback(items);
    };

    this.writeToLocalStorage = function (key, value) {
      localStorage.setItem(key, angular.toJson(value));
    };

    this.loadLocalItemsAndUser = function () {
      var user = {};
      var items = JSON.parse(localStorage.getItem('items')) || [];
      items = this.handleItemsResponse(items);
      Item.sortItemsByDate(items);
      user.items = items;
      user.shouldMerge = true;
      return user;
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
      return new Note(JSON.parse(draftString));
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
      localStorage.removeItem("jwt");
      localStorage.removeItem("mk");
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
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = items[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var item = _step2.value;

          if (item.deleted == true) {
            continue;
          }

          if (item.content.substring(0, 3) == "001" && item.enc_item_key) {
            // is encrypted
            this.decryptSingleItem(item, masterKey);
          } else {
            // is base64 encoded
            item.content = Neeto.crypto.base64Decode(item.content.substring(3, item.content.length));
          }
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
    };

    this.reencryptAllItemsAndSave = function (user, newMasterKey, oldMasterKey, callback) {
      var items = user.filteredItems();
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
;angular.module('app.frontend').directive('note', function ($timeout) {
  return {
    restrict: 'E',
    controller: 'SingleNoteCtrl',
    templateUrl: "frontend/directives/note.html",
    scope: {
      note: "="
    }
  };
}).controller('SingleNoteCtrl', function ($rootScope, $scope, $state, markdownRenderer) {
  $scope.renderedContent = function () {
    return markdownRenderer.renderHtml(markdownRenderer.renderedContentForText($scope.note.text));
  };
});
; /**
  * AngularJS directive that simulates the effect of typing on a text editor - with a blinking cursor.
  * This directive works as an attribute to any HTML element, and it changes the speed/delay of its animation.
  *
  * There's also a simple less file included for basic styling of the dialog, which can be overridden.
  * The config object also lets the user define custom CSS classes for the modal.
  *
  *  How to use:
  *
  *  Just add the desired text to the 'text' attribute of the element and the directive takes care of the rest.
  *  The 'text' attribute can be a single string or an array of string. In case an array is passed, the string
  *  on each index is erased so the next item can be printed. When the last index is reached, that string stays
  *  on the screen. (So if you want to erase the last string, just push an empty string to the end of the array)
  *
  * These are the optional preferences:
  *  - initial delay: set an 'initial-delay' attribute for the element
  *  - type delay: set a 'type-delay' attribute for the element
  *  - erase delay: set a 'erase-delay' attribute for the element
  *  - specify cursor : set a 'cursor' attribute for the element, specifying which cursor to use
  *  - turn off cursor blinking: set the 'blink-cursor' attribute  to "false"
  *  - cursor blinking speed: set a 'blink-delay' attribute for the element
  *  - scope callback: pass the desired scope callback as the 'callback-fn' attribute of the element
  *
  * Note:
  * Each time/delay value should be set either on seconds (1s) or milliseconds (1000)
  *
  * Dependencies:
  * The directive needs the css file provided in order to replicate the cursor blinking effect.
  */

angular.module('app.frontend').directive('typewrite', ['$timeout', function ($timeout) {
  function linkFunction($scope, $element, $attrs) {
    var timer = null,
        initialDelay = $attrs.initialDelay ? getTypeDelay($attrs.initialDelay) : 200,
        typeDelay = $attrs.typeDelay || 200,
        eraseDelay = $attrs.eraseDelay || typeDelay / 2,
        blinkDelay = $attrs.blinkDelay ? getAnimationDelay($attrs.blinkDelay) : false,
        cursor = $attrs.cursor || '|',
        blinkCursor = typeof $attrs.blinkCursor !== 'undefined' ? $attrs.blinkCursor === 'true' : true,
        currentText,
        textArray,
        running,
        auxStyle;

    if ($scope.text) {
      if ($scope.text instanceof Array) {
        textArray = $scope.text;
        currentText = textArray[0];
      } else {
        currentText = $scope.text;
      }
    }
    if (typeof $scope.start === 'undefined' || $scope.start) {
      typewrite();
    }

    function typewrite() {
      timer = $timeout(function () {
        updateIt($element, 0, 0, currentText);
      }, initialDelay);
    }

    function updateIt(element, charIndex, arrIndex, text) {
      if (charIndex <= text.length) {
        updateValue(element, text.substring(0, charIndex) + cursor);
        charIndex++;
        timer = $timeout(function () {
          updateIt(element, charIndex, arrIndex, text);
        }, typeDelay);
        return;
      } else {
        charIndex--;

        if ($scope.iterationCallback) {
          $scope.iterationCallback()(arrIndex);
        }

        // check if it's an array
        if (textArray && arrIndex < textArray.length - 1) {
          timer = $timeout(function () {
            cleanAndRestart(element, charIndex, arrIndex, textArray[arrIndex]);
          }, $scope.iterationDelay);
        } else {
          if ($scope.callbackFn) {
            $scope.callbackFn();
          }
          blinkIt(element, charIndex, currentText);
        }
      }
    }

    function blinkIt(element, charIndex) {
      var text = element.text().substring(0, element.text().length - 1);
      if (blinkCursor) {
        if (blinkDelay) {
          auxStyle = '-webkit-animation:blink-it steps(1) ' + blinkDelay + ' infinite;-moz-animation:blink-it steps(1) ' + blinkDelay + ' infinite ' + '-ms-animation:blink-it steps(1) ' + blinkDelay + ' infinite;-o-animation:blink-it steps(1) ' + blinkDelay + ' infinite; ' + 'animation:blink-it steps(1) ' + blinkDelay + ' infinite;';
          updateValue(element, text.substring(0, charIndex) + '<span class="blink" style="' + auxStyle + '">' + cursor + '</span>');
        } else {
          updateValue(element, text.substring(0, charIndex) + '<span class="blink">' + cursor + '</span>');
        }
      } else {
        updateValue(element, text.substring(0, charIndex));
      }
    }

    function cleanAndRestart(element, charIndex, arrIndex, currentText) {
      if (charIndex == 0) {
        if ($scope.prebeginFn) {
          $scope.prebeginFn()();
        }
      }
      if (charIndex > 0) {
        currentText = currentText.slice(0, -1);
        // element.html(currentText.substring(0, currentText.length - 1) + cursor);
        updateValue(element, currentText + cursor);
        charIndex--;
        timer = $timeout(function () {
          cleanAndRestart(element, charIndex, arrIndex, currentText);
        }, eraseDelay);
        return;
      } else {
        arrIndex++;
        currentText = textArray[arrIndex];
        timer = $timeout(function () {
          updateIt(element, 0, arrIndex, currentText);
        }, typeDelay);
      }
    }

    function getTypeDelay(delay) {
      if (typeof delay === 'string') {
        return delay.charAt(delay.length - 1) === 's' ? parseInt(delay.substring(0, delay.length - 1), 10) * 1000 : +delay;
      } else {
        return false;
      }
    }

    function getAnimationDelay(delay) {
      if (typeof delay === 'string') {
        return delay.charAt(delay.length - 1) === 's' ? delay : parseInt(delay.substring(0, delay.length - 1), 10) / 1000;
      }
    }

    function updateValue(element, value) {
      if (element.prop('nodeName').toUpperCase() === 'INPUT') {
        return element.val(value);
      }
      return element.html(value);
    }

    $scope.$on('$destroy', function () {
      if (timer) {
        $timeout.cancel(timer);
      }
    });

    $scope.$watch('start', function (newVal) {
      if (!running && newVal) {
        running = !running;
        typewrite();
      }
    });

    $scope.$watch('text', function (newVal, oldVal) {
      if (!(newVal instanceof Array)) {
        currentText = newVal;
        typewrite();
      }
    });
  }

  return {
    restrict: 'A',
    link: linkFunction,
    replace: true,
    scope: {
      text: '=',
      callbackFn: '&',
      iterationCallback: '&',
      iterationDelay: '=',
      prebeginFn: '&',
      start: '='
    }
  };
}]);
;
var ExtensionManager = function () {
  function ExtensionManager(Restangular, modelManager) {
    _classCallCheck(this, ExtensionManager);

    this.Restangular = Restangular;
    this.modelManager = modelManager;
    this.extensions = [];
    this.enabledRepeatActions = [];
    this.enabledRepeatActionUrls = localStorage.getItem("enabled_ext_urls") || [];
  }

  _createClass(ExtensionManager, [{
    key: 'addExtension',
    value: function addExtension(url) {
      console.log("Registering URL", url);
      this.Restangular.oneUrl(url, url).get().then(function (response) {
        console.log("get response", response.plain());
        var extension = new Extension(response.plain());
        this.registerExtension(extension);
      }.bind(this)).catch(function (response) {
        console.log("Error registering extension", response);
      });
    }
  }, {
    key: 'registerExtension',
    value: function registerExtension(extension) {
      this.extensions.push(extension);
      console.log("registered extensions", this.extensions);
    }
  }, {
    key: 'executeAction',
    value: function executeAction(action, extension, callback) {
      if (action.type == "get") {
        this.Restangular.oneUrl(action.url, action.url).get().then(function (response) {
          console.log("Execute action response", response);
          var items = response.items;
          this.modelManager.mapResponseItemsToLocalModels(items);
          callback(items);
        }.bind(this));
      }
    }
  }, {
    key: 'isRepeatActionEnabled',
    value: function isRepeatActionEnabled(action) {
      return this.enabledRepeatActionUrls.includes(action.url);
    }
  }, {
    key: 'disableRepeatAction',
    value: function disableRepeatAction(action, extension) {
      console.log("Disabling action", action);
      _.pull(this.enabledRepeatActionUrls, action.url);
      _.pull(this.enabledRepeatActions, action);
      this.modelManager.removeItemObserver(action.url);
      console.assert(this.isRepeatActionEnabled(action) == false);
    }
  }, {
    key: 'enableRepeatAction',
    value: function enableRepeatAction(action, extension) {
      console.log("Enabling repeat action", action);

      this.enabledRepeatActionUrls.push(action.url);
      this.enabledRepeatActions.push(action);

      if (action.repeatType == "watch") {
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = action.structures[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var structure = _step3.value;

            this.modelManager.addItemObserver(action.url, structure.type, function (changedItems) {
              this.triggerWatchAction(action, changedItems);
            }.bind(this));
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
      }
    }
  }, {
    key: 'triggerWatchAction',
    value: function triggerWatchAction(action, changedItems) {
      console.log("Watch action triggered", action, changedItems);
      if (action.repeatFrequency > 0) {
        var lastExecuted = action.lastExecuted;
        var diffInSeconds = (new Date() - lastExecuted) / 1000;
        if (diffInSeconds < action.repeatFrequency) {
          console.log("too frequent, returning");
          return;
        }
      }

      if (action.repeatVerb == "post") {
        var request = this.Restangular.oneUrl(action.url, action.url);
        request.items = changedItems.map(function (item) {
          var params = { uuid: item.uuid, content_type: item.content_type, content: item.content };
          return params;
        });
        request.post().then(function (response) {
          console.log("watch action response", response);
          action.lastExecuted = new Date();
        });
      }
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
;;angular.module('app.frontend').service('markdownRenderer', function ($sce) {

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
    this.changeObservers = [];
    this.items = [];
  }

  _createClass(ModelManager, [{
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
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = items[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var json_obj = _step4.value;

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

          models.push(item);
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

      this.addItems(models);
      this.resolveReferences();
      return models;
    }
  }, {
    key: 'createItem',
    value: function createItem(json_obj) {
      if (json_obj.content_type == "Note") {
        return new Note(json_obj);
      } else if (json_obj.content_type == "Tag") {
        return new Tag(json_obj);
      } else {
        return new Item(json_obj);
      }
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
    key: 'resolveReferences',
    value: function resolveReferences() {
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = this.items[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var item = _step5.value;

          var contentObject = item.contentObject;
          if (!contentObject.references) {
            continue;
          }

          var _iteratorNormalCompletion6 = true;
          var _didIteratorError6 = false;
          var _iteratorError6 = undefined;

          try {
            for (var _iterator6 = contentObject.references[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
              var reference = _step6.value;

              var referencedItem = this.findItem(reference.uuid);
              if (referencedItem) {
                item.addItemAsRelationship(referencedItem);
              } else {
                console.log("Unable to find item:", reference.uuid);
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

      this.notes.push.apply(this.notes, _.difference(this.itemsForContentType("Note"), this.notes));
      Item.sortItemsByDate(this.notes);

      this.tags.push.apply(this.tags, _.difference(this.itemsForContentType("Tag"), this.tags));
      this.tags.forEach(function (tag) {
        Item.sortItemsByDate(tag.notes);
      });
    }
  }, {
    key: 'addItemObserver',
    value: function addItemObserver(id, type, callback) {
      this.changeObservers.push({ id: id, type: type, callback: callback });
    }
  }, {
    key: 'removeItemObserver',
    value: function removeItemObserver(id) {
      _.remove(this.changeObservers, _.find(this.changeObservers, { id: id }));
    }
  }, {
    key: 'notifyObserversOfSyncCompletion',
    value: function notifyObserversOfSyncCompletion() {
      var _iteratorNormalCompletion7 = true;
      var _didIteratorError7 = false;
      var _iteratorError7 = undefined;

      try {
        for (var _iterator7 = this.changeObservers[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
          var observer = _step7.value;

          var changedItems = this.dirtyItems.filter(function (item) {
            return item.content_type == observer.type;
          });
          console.log("observer:", observer, "items", changedItems);
          observer.callback(changedItems);
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
      this.notifyObserversOfSyncCompletion();

      this.getDirtyItems().forEach(function (item) {
        item.dirty = false;
      });
    }
  }, {
    key: 'setItemToBeDeleted',
    value: function setItemToBeDeleted(item) {
      item.deleted = true;
      item.dirty = true;
      item.removeFromRelationships();
    }
  }, {
    key: 'removeItemLocally',
    value: function removeItemLocally(item) {
      _.pull(this.items, item);

      if (item.content_type == "Tag") {
        _.pull(this.tags, item);
      } else if (item.content_type == "Note") {
        _.pull(this.notes, item);
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

      itemOne.dirty = true;
      itemTwo.dirty = true;
    }
  }, {
    key: 'removeRelationshipBetweenItems',
    value: function removeRelationshipBetweenItems(itemOne, itemTwo) {
      itemOne.removeItemAsRelationship(itemTwo);
      itemTwo.removeItemAsRelationship(itemOne);

      itemOne.dirty = true;
      itemTwo.dirty = true;
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
;angular.module('app.frontend').service('serverSideValidation', function ($sce) {
  // Show validation errors in form.
  this.showErrors = function (formErrors, form) {
    angular.forEach(formErrors, function (errors, key) {
      if (typeof form[key] !== 'undefined') {
        form[key].$setDirty();
        form[key].$setValidity('server', false);
        form[key].$error.server = $sce.trustAsHtml(errors.join(', '));
      }
    });
  };

  // Get validation errors from server response and show them in form.
  this.parseErrors = function (response, form) {
    if (response.status === 422) {
      this.showErrors(response.data, form);
    }
  };
});


},{}]},{},[1]);
