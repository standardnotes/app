(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

var _createClass2 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck2(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SNTheme = exports.SNSmartTag = exports.SNServerExtension = exports.SNMfa = exports.SNEncryptedStorage = exports.SNTag = exports.SNNote = exports.SNExtension = exports.Action = exports.SNEditor = exports.SNComponent = undefined;

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _get = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;var desc = Object.getOwnPropertyDescriptor(object, property);if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;if (getter === undefined) {
      return undefined;
    }return getter.call(receiver);
  }
};

var _standardFileJs = require("standard-file-js");

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var SNComponent = exports.SNComponent = function (_SFItem) {
  _inherits(SNComponent, _SFItem);

  function SNComponent(json_obj) {
    _classCallCheck(this, SNComponent);

    // If making a copy of an existing component (usually during sign in if you have a component active in the session),
    // which may have window set, you may get a cross-origin exception since you'll be trying to copy the window. So we clear it here.
    json_obj.window = null;

    var _this = _possibleConstructorReturn(this, (SNComponent.__proto__ || Object.getPrototypeOf(SNComponent)).call(this, json_obj));

    if (!_this.componentData) {
      _this.componentData = {};
    }

    if (!_this.disassociatedItemIds) {
      _this.disassociatedItemIds = [];
    }

    if (!_this.associatedItemIds) {
      _this.associatedItemIds = [];
    }
    return _this;
  }

  _createClass(SNComponent, [{
    key: "mapContentToLocalProperties",
    value: function mapContentToLocalProperties(content) {
      _get(SNComponent.prototype.__proto__ || Object.getPrototypeOf(SNComponent.prototype), "mapContentToLocalProperties", this).call(this, content);
      /* Legacy */
      // We don't want to set the url directly, as we'd like to phase it out.
      // If the content.url exists, we'll transfer it to legacy_url
      // We'll only need to set this if content.hosted_url is blank, otherwise, hosted_url is the url replacement.
      if (!content.hosted_url) {
        this.legacy_url = content.url;
      }

      /* New */
      this.local_url = content.local_url;
      this.hosted_url = content.hosted_url || content.url;
      this.offlineOnly = content.offlineOnly;

      if (content.valid_until) {
        this.valid_until = new Date(content.valid_until);
      }

      this.name = content.name;
      this.autoupdateDisabled = content.autoupdateDisabled;

      this.package_info = content.package_info;

      // the location in the view this component is located in. Valid values are currently tags-list, note-tags, and editor-stack`
      this.area = content.area;

      this.permissions = content.permissions;
      if (!this.permissions) {
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
  }, {
    key: "handleDeletedContent",
    value: function handleDeletedContent() {
      _get(SNComponent.prototype.__proto__ || Object.getPrototypeOf(SNComponent.prototype), "handleDeletedContent", this).call(this);

      this.active = false;
    }
  }, {
    key: "structureParams",
    value: function structureParams() {
      var params = {
        legacy_url: this.legacy_url,
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
        associatedItemIds: this.associatedItemIds
      };

      var superParams = _get(SNComponent.prototype.__proto__ || Object.getPrototypeOf(SNComponent.prototype), "structureParams", this).call(this);
      Object.assign(superParams, params);
      return superParams;
    }
  }, {
    key: "isEditor",
    value: function isEditor() {
      return this.area == "editor-editor";
    }
  }, {
    key: "isTheme",
    value: function isTheme() {
      return this.content_type == "SN|Theme" || this.area == "themes";
    }
  }, {
    key: "isDefaultEditor",
    value: function isDefaultEditor() {
      return this.getAppDataItem("defaultEditor") == true;
    }
  }, {
    key: "setLastSize",
    value: function setLastSize(size) {
      this.setAppDataItem("lastSize", size);
    }
  }, {
    key: "getLastSize",
    value: function getLastSize() {
      return this.getAppDataItem("lastSize");
    }
  }, {
    key: "acceptsThemes",
    value: function acceptsThemes() {
      if (this.content.package_info && "acceptsThemes" in this.content.package_info) {
        return this.content.package_info.acceptsThemes;
      }
      return true;
    }

    /*
      The key used to look up data that this component may have saved to an item.
      This key will be look up on the item, and not on itself.
     */

  }, {
    key: "getClientDataKey",
    value: function getClientDataKey() {
      if (this.legacy_url) {
        return this.legacy_url;
      } else {
        return this.uuid;
      }
    }
  }, {
    key: "hasValidHostedUrl",
    value: function hasValidHostedUrl() {
      return this.hosted_url || this.legacy_url;
    }
  }, {
    key: "keysToIgnoreWhenCheckingContentEquality",
    value: function keysToIgnoreWhenCheckingContentEquality() {
      return ["active", "disassociatedItemIds", "associatedItemIds"].concat(_get(SNComponent.prototype.__proto__ || Object.getPrototypeOf(SNComponent.prototype), "keysToIgnoreWhenCheckingContentEquality", this).call(this));
    }

    /*
      An associative component depends on being explicitly activated for a given item, compared to a dissaciative component,
      which is enabled by default in areas unrelated to a certain item.
     */

  }, {
    key: "isAssociative",
    value: function isAssociative() {
      return Component.associativeAreas().includes(this.area);
    }
  }, {
    key: "associateWithItem",
    value: function associateWithItem(item) {
      this.associatedItemIds.push(item.uuid);
    }
  }, {
    key: "isExplicitlyEnabledForItem",
    value: function isExplicitlyEnabledForItem(item) {
      return this.associatedItemIds.indexOf(item.uuid) !== -1;
    }
  }, {
    key: "isExplicitlyDisabledForItem",
    value: function isExplicitlyDisabledForItem(item) {
      return this.disassociatedItemIds.indexOf(item.uuid) !== -1;
    }
  }, {
    key: "content_type",
    get: function get() {
      return "SN|Component";
    }
  }], [{
    key: "associativeAreas",
    value: function associativeAreas() {
      return ["editor-editor"];
    }
  }]);

  return SNComponent;
}(_standardFileJs.SFItem);

;
var SNEditor = exports.SNEditor = function (_SFItem2) {
  _inherits(SNEditor, _SFItem2);

  function SNEditor(json_obj) {
    _classCallCheck(this, SNEditor);

    var _this2 = _possibleConstructorReturn(this, (SNEditor.__proto__ || Object.getPrototypeOf(SNEditor)).call(this, json_obj));

    if (!_this2.notes) {
      _this2.notes = [];
    }
    if (!_this2.data) {
      _this2.data = {};
    }
    return _this2;
  }

  _createClass(SNEditor, [{
    key: "mapContentToLocalProperties",
    value: function mapContentToLocalProperties(content) {
      _get(SNEditor.prototype.__proto__ || Object.getPrototypeOf(SNEditor.prototype), "mapContentToLocalProperties", this).call(this, content);
      this.url = content.url;
      this.name = content.name;
      this.data = content.data || {};
      this.default = content.default;
      this.systemEditor = content.systemEditor;
    }
  }, {
    key: "structureParams",
    value: function structureParams() {
      var params = {
        url: this.url,
        name: this.name,
        data: this.data,
        default: this.default,
        systemEditor: this.systemEditor
      };

      var superParams = _get(SNEditor.prototype.__proto__ || Object.getPrototypeOf(SNEditor.prototype), "structureParams", this).call(this);
      Object.assign(superParams, params);
      return superParams;
    }
  }, {
    key: "referenceParams",
    value: function referenceParams() {
      var references = _.map(this.notes, function (note) {
        return { uuid: note.uuid, content_type: note.content_type };
      });

      return references;
    }
  }, {
    key: "addItemAsRelationship",
    value: function addItemAsRelationship(item) {
      if (item.content_type == "Note") {
        if (!_.find(this.notes, item)) {
          this.notes.push(item);
        }
      }
      _get(SNEditor.prototype.__proto__ || Object.getPrototypeOf(SNEditor.prototype), "addItemAsRelationship", this).call(this, item);
    }
  }, {
    key: "removeItemAsRelationship",
    value: function removeItemAsRelationship(item) {
      if (item.content_type == "Note") {
        _.pull(this.notes, item);
      }
      _get(SNEditor.prototype.__proto__ || Object.getPrototypeOf(SNEditor.prototype), "removeItemAsRelationship", this).call(this, item);
    }
  }, {
    key: "removeAndDirtyAllRelationships",
    value: function removeAndDirtyAllRelationships() {
      _get(SNEditor.prototype.__proto__ || Object.getPrototypeOf(SNEditor.prototype), "removeAndDirtyAllRelationships", this).call(this);
      this.notes = [];
    }
  }, {
    key: "removeReferencesNotPresentIn",
    value: function removeReferencesNotPresentIn(references) {
      _get(SNEditor.prototype.__proto__ || Object.getPrototypeOf(SNEditor.prototype), "removeReferencesNotPresentIn", this).call(this, references);

      var uuids = references.map(function (ref) {
        return ref.uuid;
      });
      this.notes.forEach(function (note) {
        if (!uuids.includes(note.uuid)) {
          _.remove(this.notes, { uuid: note.uuid });
        }
      }.bind(this));
    }
  }, {
    key: "potentialItemOfInterestHasChangedItsUUID",
    value: function potentialItemOfInterestHasChangedItsUUID(newItem, oldUUID, newUUID) {
      if (newItem.content_type === "Note" && _.find(this.notes, { uuid: oldUUID })) {
        _.remove(this.notes, { uuid: oldUUID });
        this.notes.push(newItem);
      }
    }
  }, {
    key: "setData",
    value: function setData(key, value) {
      var dataHasChanged = JSON.stringify(this.data[key]) !== JSON.stringify(value);
      if (dataHasChanged) {
        this.data[key] = value;
        return true;
      }
      return false;
    }
  }, {
    key: "dataForKey",
    value: function dataForKey(key) {
      return this.data[key] || {};
    }
  }, {
    key: "content_type",
    get: function get() {
      return "SN|Editor";
    }
  }]);

  return SNEditor;
}(_standardFileJs.SFItem);

;
var Action = exports.Action = function Action(json) {
  _classCallCheck(this, Action);

  _.merge(this, json);
  this.running = false; // in case running=true was synced with server since model is uploaded nondiscriminatory
  this.error = false;
  if (this.lastExecuted) {
    // is string
    this.lastExecuted = new Date(this.lastExecuted);
  }
};

var SNExtension = exports.SNExtension = function (_SFItem3) {
  _inherits(SNExtension, _SFItem3);

  function SNExtension(json) {
    _classCallCheck(this, SNExtension);

    var _this3 = _possibleConstructorReturn(this, (SNExtension.__proto__ || Object.getPrototypeOf(SNExtension)).call(this, json));

    if (json.actions) {
      _this3.actions = json.actions.map(function (action) {
        return new Action(action);
      });
    }

    if (!_this3.actions) {
      _this3.actions = [];
    }
    return _this3;
  }

  _createClass(SNExtension, [{
    key: "actionsWithContextForItem",
    value: function actionsWithContextForItem(item) {
      return this.actions.filter(function (action) {
        return action.context == item.content_type || action.context == "Item";
      });
    }
  }, {
    key: "mapContentToLocalProperties",
    value: function mapContentToLocalProperties(content) {
      _get(SNExtension.prototype.__proto__ || Object.getPrototypeOf(SNExtension.prototype), "mapContentToLocalProperties", this).call(this, content);
      this.description = content.description;
      this.url = content.url;
      this.name = content.name;
      this.package_info = content.package_info;
      this.supported_types = content.supported_types;
      if (content.actions) {
        this.actions = content.actions.map(function (action) {
          return new Action(action);
        });
      }
    }
  }, {
    key: "structureParams",
    value: function structureParams() {
      var params = {
        name: this.name,
        url: this.url,
        package_info: this.package_info,
        description: this.description,
        actions: this.actions.map(function (a) {
          return _.omit(a, ["subrows", "subactions"]);
        }),
        supported_types: this.supported_types
      };

      var superParams = _get(SNExtension.prototype.__proto__ || Object.getPrototypeOf(SNExtension.prototype), "structureParams", this).call(this);
      Object.assign(superParams, params);
      return superParams;
    }
  }, {
    key: "content_type",
    get: function get() {
      return "Extension";
    }
  }]);

  return SNExtension;
}(_standardFileJs.SFItem);

;
var SNNote = exports.SNNote = function (_SFItem4) {
  _inherits(SNNote, _SFItem4);

  function SNNote(json_obj) {
    _classCallCheck(this, SNNote);

    var _this4 = _possibleConstructorReturn(this, (SNNote.__proto__ || Object.getPrototypeOf(SNNote)).call(this, json_obj));

    if (!_this4.text) {
      // Some external editors can't handle a null value for text.
      // Notes created on mobile with no text have a null value for it,
      // so we'll just set a default here.
      _this4.text = "";
    }

    if (!_this4.tags) {
      _this4.tags = [];
    }
    return _this4;
  }

  _createClass(SNNote, [{
    key: "mapContentToLocalProperties",
    value: function mapContentToLocalProperties(content) {
      _get(SNNote.prototype.__proto__ || Object.getPrototypeOf(SNNote.prototype), "mapContentToLocalProperties", this).call(this, content);
      this.title = content.title;
      this.text = content.text;
    }
  }, {
    key: "structureParams",
    value: function structureParams() {
      var params = {
        title: this.title,
        text: this.text
      };

      var superParams = _get(SNNote.prototype.__proto__ || Object.getPrototypeOf(SNNote.prototype), "structureParams", this).call(this);
      Object.assign(superParams, params);
      return superParams;
    }
  }, {
    key: "addItemAsRelationship",
    value: function addItemAsRelationship(item) {
      /*
      Legacy.
      Previously, note/tag relationships were bidirectional, however in some cases there
      may be broken links such that a note has references to a tag and not vice versa.
      Now, only tags contain references to notes. For old notes that may have references to tags,
      we want to transfer them over to the tag.
       */
      if (item.content_type == "Tag") {
        item.addItemAsRelationship(this);
      }
      _get(SNNote.prototype.__proto__ || Object.getPrototypeOf(SNNote.prototype), "addItemAsRelationship", this).call(this, item);
    }
  }, {
    key: "setIsBeingReferencedBy",
    value: function setIsBeingReferencedBy(item) {
      _get(SNNote.prototype.__proto__ || Object.getPrototypeOf(SNNote.prototype), "setIsBeingReferencedBy", this).call(this, item);
      this.clearSavedTagsString();
    }
  }, {
    key: "setIsNoLongerBeingReferencedBy",
    value: function setIsNoLongerBeingReferencedBy(item) {
      _get(SNNote.prototype.__proto__ || Object.getPrototypeOf(SNNote.prototype), "setIsNoLongerBeingReferencedBy", this).call(this, item);
      this.clearSavedTagsString();
    }
  }, {
    key: "isBeingRemovedLocally",
    value: function isBeingRemovedLocally() {
      this.tags.forEach(function (tag) {
        _.remove(tag.notes, { uuid: this.uuid });
      }.bind(this));
      _get(SNNote.prototype.__proto__ || Object.getPrototypeOf(SNNote.prototype), "isBeingRemovedLocally", this).call(this);
    }
  }, {
    key: "informReferencesOfUUIDChange",
    value: function informReferencesOfUUIDChange(oldUUID, newUUID) {
      _get(SNNote.prototype.__proto__ || Object.getPrototypeOf(SNNote.prototype), "informReferencesOfUUIDChange", this).call(this);
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.tags[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var tag = _step.value;

          _.remove(tag.notes, { uuid: oldUUID });
          tag.notes.push(this);
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
    key: "tagDidFinishSyncing",
    value: function tagDidFinishSyncing(tag) {
      this.clearSavedTagsString();
    }
  }, {
    key: "safeText",
    value: function safeText() {
      return this.text || "";
    }
  }, {
    key: "safeTitle",
    value: function safeTitle() {
      return this.title || "";
    }
  }, {
    key: "clearSavedTagsString",
    value: function clearSavedTagsString() {
      this.savedTagsString = null;
    }
  }, {
    key: "tagsString",
    value: function tagsString() {
      this.savedTagsString = SNTag.arrayToDisplayString(this.tags);
      return this.savedTagsString;
    }
  }, {
    key: "content_type",
    get: function get() {
      return "Note";
    }
  }, {
    key: "displayName",
    get: function get() {
      return "Note";
    }
  }], [{
    key: "filterDummyNotes",
    value: function filterDummyNotes(notes) {
      var filtered = notes.filter(function (note) {
        return note.dummy == false || note.dummy == null;
      });
      return filtered;
    }
  }]);

  return SNNote;
}(_standardFileJs.SFItem);

;
var SNTag = exports.SNTag = function (_SFItem5) {
  _inherits(SNTag, _SFItem5);

  function SNTag(json_obj) {
    _classCallCheck(this, SNTag);

    var _this5 = _possibleConstructorReturn(this, (SNTag.__proto__ || Object.getPrototypeOf(SNTag)).call(this, json_obj));

    if (!_this5.content_type) {
      _this5.content_type = "Tag";
    }

    if (!_this5.notes) {
      _this5.notes = [];
    }
    return _this5;
  }

  _createClass(SNTag, [{
    key: "mapContentToLocalProperties",
    value: function mapContentToLocalProperties(content) {
      _get(SNTag.prototype.__proto__ || Object.getPrototypeOf(SNTag.prototype), "mapContentToLocalProperties", this).call(this, content);
      this.title = content.title;
    }
  }, {
    key: "structureParams",
    value: function structureParams() {
      var params = {
        title: this.title
      };

      var superParams = _get(SNTag.prototype.__proto__ || Object.getPrototypeOf(SNTag.prototype), "structureParams", this).call(this);
      Object.assign(superParams, params);
      return superParams;
    }
  }, {
    key: "addItemAsRelationship",
    value: function addItemAsRelationship(item) {
      if (item.content_type == "Note") {
        if (!_.find(this.notes, { uuid: item.uuid })) {
          this.notes.push(item);
          item.tags.push(this);
        }
      }
      _get(SNTag.prototype.__proto__ || Object.getPrototypeOf(SNTag.prototype), "addItemAsRelationship", this).call(this, item);
    }
  }, {
    key: "removeItemAsRelationship",
    value: function removeItemAsRelationship(item) {
      if (item.content_type == "Note") {
        _.remove(this.notes, { uuid: item.uuid });
        _.remove(item.tags, { uuid: this.uuid });
      }
      _get(SNTag.prototype.__proto__ || Object.getPrototypeOf(SNTag.prototype), "removeItemAsRelationship", this).call(this, item);
    }
  }, {
    key: "updateLocalRelationships",
    value: function updateLocalRelationships() {
      var references = this.content.references;

      var uuids = references.map(function (ref) {
        return ref.uuid;
      });
      this.notes.slice().forEach(function (note) {
        if (!uuids.includes(note.uuid)) {
          _.remove(note.tags, { uuid: this.uuid });
          _.remove(this.notes, { uuid: note.uuid });

          note.setIsNoLongerBeingReferencedBy(this);
        }
      }.bind(this));
    }
  }, {
    key: "isBeingRemovedLocally",
    value: function isBeingRemovedLocally() {
      var _this6 = this;

      this.notes.forEach(function (note) {
        _.remove(note.tags, { uuid: _this6.uuid });
        note.setIsNoLongerBeingReferencedBy(_this6);
      });

      this.notes.length = 0;

      _get(SNTag.prototype.__proto__ || Object.getPrototypeOf(SNTag.prototype), "isBeingRemovedLocally", this).call(this);
    }
  }, {
    key: "informReferencesOfUUIDChange",
    value: function informReferencesOfUUIDChange(oldUUID, newUUID) {
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = this.notes[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var note = _step2.value;

          _.remove(note.tags, { uuid: oldUUID });
          note.tags.push(this);
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
    }
  }, {
    key: "didFinishSyncing",
    value: function didFinishSyncing() {
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = this.notes[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var note = _step3.value;

          note.tagDidFinishSyncing(this);
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
  }, {
    key: "isSmartTag",
    value: function isSmartTag() {
      return this.content_type == "SN|SmartTag";
    }
  }, {
    key: "displayName",
    get: function get() {
      return "Tag";
    }
  }], [{
    key: "arrayToDisplayString",
    value: function arrayToDisplayString(tags) {
      return tags.sort(function (a, b) {
        return a.title > b.title;
      }).map(function (tag, i) {
        return "#" + tag.title;
      }).join(" ");
    }
  }]);

  return SNTag;
}(_standardFileJs.SFItem);

;
var SNEncryptedStorage = exports.SNEncryptedStorage = function (_SFItem6) {
  _inherits(SNEncryptedStorage, _SFItem6);

  function SNEncryptedStorage() {
    _classCallCheck(this, SNEncryptedStorage);

    return _possibleConstructorReturn(this, (SNEncryptedStorage.__proto__ || Object.getPrototypeOf(SNEncryptedStorage)).apply(this, arguments));
  }

  _createClass(SNEncryptedStorage, [{
    key: "mapContentToLocalProperties",
    value: function mapContentToLocalProperties(content) {
      _get(SNEncryptedStorage.prototype.__proto__ || Object.getPrototypeOf(SNEncryptedStorage.prototype), "mapContentToLocalProperties", this).call(this, content);
      this.storage = content.storage;
    }
  }, {
    key: "content_type",
    get: function get() {
      return "SN|EncryptedStorage";
    }
  }]);

  return SNEncryptedStorage;
}(_standardFileJs.SFItem);

;
var SNMfa = exports.SNMfa = function (_SFItem7) {
  _inherits(SNMfa, _SFItem7);

  function SNMfa(json_obj) {
    _classCallCheck(this, SNMfa);

    return _possibleConstructorReturn(this, (SNMfa.__proto__ || Object.getPrototypeOf(SNMfa)).call(this, json_obj));
  }

  // mapContentToLocalProperties(content) {
  //   super.mapContentToLocalProperties(content)
  //   this.serverContent = content;
  // }
  //
  // structureParams() {
  //   return _.merge(this.serverContent, super.structureParams());
  // }

  _createClass(SNMfa, [{
    key: "doNotEncrypt",
    value: function doNotEncrypt() {
      return true;
    }
  }, {
    key: "content_type",
    get: function get() {
      return "SF|MFA";
    }
  }]);

  return SNMfa;
}(_standardFileJs.SFItem);

;
var SNServerExtension = exports.SNServerExtension = function (_SFItem8) {
  _inherits(SNServerExtension, _SFItem8);

  function SNServerExtension() {
    _classCallCheck(this, SNServerExtension);

    return _possibleConstructorReturn(this, (SNServerExtension.__proto__ || Object.getPrototypeOf(SNServerExtension)).apply(this, arguments));
  }

  _createClass(SNServerExtension, [{
    key: "mapContentToLocalProperties",
    value: function mapContentToLocalProperties(content) {
      _get(SNServerExtension.prototype.__proto__ || Object.getPrototypeOf(SNServerExtension.prototype), "mapContentToLocalProperties", this).call(this, content);
      this.url = content.url;
    }
  }, {
    key: "doNotEncrypt",
    value: function doNotEncrypt() {
      return true;
    }
  }, {
    key: "content_type",
    get: function get() {
      return "SF|Extension";
    }
  }]);

  return SNServerExtension;
}(_standardFileJs.SFItem);

;
var SNSmartTag = exports.SNSmartTag = function (_SNTag) {
  _inherits(SNSmartTag, _SNTag);

  function SNSmartTag(json_ob) {
    _classCallCheck(this, SNSmartTag);

    var _this10 = _possibleConstructorReturn(this, (SNSmartTag.__proto__ || Object.getPrototypeOf(SNSmartTag)).call(this, json_ob));

    _this10.content_type = "SN|SmartTag";
    return _this10;
  }

  _createClass(SNSmartTag, null, [{
    key: "systemSmartTags",
    value: function systemSmartTags() {
      return [new SNSmartTag({
        uuid: SNSmartTag.SystemSmartTagIdAllNotes,
        content: {
          title: "All notes",
          isSystemTag: true,
          isAllTag: true,
          predicate: new SFPredicate.fromArray(["content_type", "=", "Note"])
        }
      }), new SNSmartTag({
        uuid: SNSmartTag.SystemSmartTagIdArchivedNotes,
        content: {
          title: "Archived",
          isSystemTag: true,
          isArchiveTag: true,
          predicate: new SFPredicate.fromArray(["archived", "=", true])
        }
      }), new SNSmartTag({
        uuid: SNSmartTag.SystemSmartTagIdTrashedNotes,
        content: {
          title: "Trash",
          isSystemTag: true,
          isTrashTag: true,
          predicate: new SFPredicate.fromArray(["content.trashed", "=", true])
        }
      })];
    }
  }]);

  return SNSmartTag;
}(SNTag);

SNSmartTag.SystemSmartTagIdAllNotes = "all-notes";
SNSmartTag.SystemSmartTagIdArchivedNotes = "archived-notes";
SNSmartTag.SystemSmartTagIdTrashedNotes = "trashed-notes";
;
var SNTheme = exports.SNTheme = function (_SNComponent) {
  _inherits(SNTheme, _SNComponent);

  function SNTheme(json_obj) {
    _classCallCheck(this, SNTheme);

    var _this11 = _possibleConstructorReturn(this, (SNTheme.__proto__ || Object.getPrototypeOf(SNTheme)).call(this, json_obj));

    _this11.area = "themes";
    return _this11;
  }

  _createClass(SNTheme, [{
    key: "isLayerable",
    value: function isLayerable() {
      return this.package_info && this.package_info.layerable;
    }
  }, {
    key: "setMobileRules",
    value: function setMobileRules(rules) {
      this.setAppDataItem("mobileRules", rules);
    }
  }, {
    key: "getMobileRules",
    value: function getMobileRules() {
      return this.getAppDataItem("mobileRules") || { constants: {}, rules: {} };
    }

    // Same as getMobileRules but without default value

  }, {
    key: "hasMobileRules",
    value: function hasMobileRules() {
      return this.getAppDataItem("mobileRules");
    }
  }, {
    key: "setNotAvailOnMobile",
    value: function setNotAvailOnMobile(na) {
      this.setAppDataItem("notAvailableOnMobile", na);
    }
  }, {
    key: "getNotAvailOnMobile",
    value: function getNotAvailOnMobile() {
      return this.getAppDataItem("notAvailableOnMobile");
    }

    /* We must not use .active because if you set that to true, it will also activate that theme on desktop/web */

  }, {
    key: "setMobileActive",
    value: function setMobileActive(active) {
      this.setAppDataItem("mobileActive", active);
    }
  }, {
    key: "isMobileActive",
    value: function isMobileActive() {
      return this.getAppDataItem("mobileActive");
    }
  }, {
    key: "content_type",
    get: function get() {
      return "SN|Theme";
    }
  }, {
    key: "displayName",
    get: function get() {
      return "Theme";
    }
  }]);

  return SNTheme;
}(SNComponent);

;

if (typeof window !== 'undefined' && window !== null) {
  // window is for some reason defined in React Native, but throws an exception when you try to set to it
  try {
    window.SNNote = SNNote;
    window.SNTag = SNTag;
    window.SNSmartTag = SNSmartTag;
    window.SNMfa = SNMfa;
    window.SNServerExtension = SNServerExtension;
    window.SNComponent = SNComponent;
    window.SNEditor = SNEditor;
    window.SNExtension = SNExtension;
    window.SNTheme = SNTheme;
    window.SNEncryptedStorage = SNEncryptedStorage;
  } catch (e) {
    console.log("Exception while exporting sn-models window variables", e);
  }
}

;'use strict';

angular.module('app', []);
var HomeCtrl = function HomeCtrl($rootScope, $scope, $timeout) {
  _classCallCheck2(this, HomeCtrl);

  var smartTagContentType = "SN|SmartTag";

  var componentRelay = new ComponentRelay({
    targetWindow: window,
    onReady: function onReady() {
      $rootScope.platform = componentRelay.platform;
    }
  });

  var delimiter = ".";

  $scope.resolveRawTags = function (masterTag) {
    var sortTags = function sortTags(tags) {
      return tags.sort(function (a, b) {
        var aTitle = a.content.title.toLowerCase(),
            bTitle = b.content.title.toLowerCase();
        return (aTitle > bTitle) - (aTitle < bTitle);
      });
    };
    var resolved = masterTag.rawTags.slice();

    var findResolvedTag = function findResolvedTag(title) {
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = masterTag.rawTags[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var tag = _step4.value;

          if (tag.content.title === title) {
            return tag;
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

      return null;
    };

    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
      for (var _iterator5 = masterTag.rawTags[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
        var tag = _step5.value;

        var pendingDummy = tag.children && tag.children.find(function (c) {
          return c.dummy;
        });
        tag.children = [];
        tag.parent = null;

        if (pendingDummy) {
          tag.children.unshift(pendingDummy);
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

    ;

    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
      for (var _iterator6 = masterTag.rawTags[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
        var tag = _step6.value;

        var name = tag.content.title;
        var comps = name.split(delimiter);
        tag.displayTitle = comps[comps.length - 1];
        if (comps.length == 1) {
          tag.parent = masterTag;
          continue;
        }

        var getParent = function getParent() {
          var depth = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

          var parentTitle = comps.slice(0, comps.length - depth).join(delimiter);
          if (parentTitle.length == 0) {
            return null;
          }
          var parent = findResolvedTag(parentTitle);

          // didn't find parent, try again.
          // just make sure we're not deeper in search than we can go
          if (!parent && depth < comps.length - 1) {
            return getParent(depth + 1);
          }

          // remove parent from name and keep this full tag name to display
          var tagTitle = tag.content.title.slice(parentTitle.length + 1);
          tag.displayTitle = tagTitle;

          return parent;
        };

        var parent = getParent();

        // no parent at all up the tree, fall back to root with full name
        if (!parent) {
          tag.displayTitle = tag.content.title;
          tag.parent = masterTag;
          continue;
        }

        parent.children.push(tag);
        parent.children = sortTags(parent.children);
        tag.parent = parent;

        // remove chid from master list
        var index = resolved.indexOf(tag);
        resolved.splice(index, 1);

        if ($scope.selectedTag && $scope.selectedTag.uuid == tag.uuid) {
          $scope.selectedTag = tag;
          $scope.setSelectedForTag(tag, true);
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

    var pendingDummy = masterTag.children && masterTag.children.find(function (c) {
      return c.dummy;
    });
    masterTag.children = sortTags(resolved);
    if (pendingDummy) {
      masterTag.children.unshift(pendingDummy);
    }
  };

  $scope.changeParent = function (sourceId, targetId) {
    var source = $scope.masterTag.rawTags.filter(function (tag) {
      return tag.uuid === sourceId;
    })[0];

    var target = targetId === "0" ? $scope.masterTag : $scope.masterTag.rawTags.filter(function (tag) {
      return tag.uuid === targetId;
    })[0];

    if (target.parent === source) {
      return;
    }

    var needsSave = [source];

    var adjustChildren = function adjustChildren(source) {
      var _iteratorNormalCompletion7 = true;
      var _didIteratorError7 = false;
      var _iteratorError7 = undefined;

      try {
        for (var _iterator7 = source.children[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
          var child = _step7.value;

          var newTitle = source.content.title + delimiter + child.content.title.split(delimiter).slice(-1)[0];
          child.content.title = newTitle;
          needsSave.push(child);
          adjustChildren(child);
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
    };

    var newTitle;
    if (target.master) {
      newTitle = source.content.title.split(delimiter).slice(-1)[0];
    } else {
      newTitle = target.content.title + delimiter + source.content.title.split(delimiter).slice(-1)[0];
    }
    source.content.title = newTitle;
    adjustChildren(source);
    $scope.resolveRawTags($scope.masterTag);

    componentRelay.saveItems(needsSave);
  };

  $scope.createTag = function (tag) {
    var title = tag.content.title;
    if (title.startsWith("![")) {
      /*
      Create smart tag. Examples:
      !["Not Pinned", "pinned", "=", false]
      !["Last Day", "updated_at", ">", "1.days.ago"]
      !["Long", "text.length", ">", 500]
      */
      try {
        var components = JSON.parse(title.substring(1, title.length));
      } catch (e) {
        alert("There was an error parsing your smart tag syntax. Please ensure the value after the exclamation mark is valid JSON, and try again.");
        return;
      }
      var smartTag = {
        content_type: smartTagContentType,
        content: {
          title: components[0],
          predicate: {
            keypath: components[1],
            operator: components[2],
            value: components[3]
          }
        }
      };
      componentRelay.createItem(smartTag, function (createdTag) {
        // We don't want to select the tag right away because it hasn't been added yet.
        // If you do $scope.selectTag(createdTag), an issue occurs where selecting another tag
        // after that will not dehighlight this one.
        $scope.selectOnLoad = createdTag;
      });
    } else {
      tag.content_type = "Tag";
      var title;
      if (tag.parent.master) {
        title = tag.content.title;
      } else {
        title = tag.parent.content.title + delimiter + tag.content.title;
      }
      tag.content.title = title;
      tag.dummy = false;
      componentRelay.createItem(tag, function (createdTag) {
        $scope.selectOnLoad = createdTag;
      });
    }
  };

  $scope.selectTag = function (tag, multiSelect) {
    var isSmartTag = tag.content_type == smartTagContentType;
    // Multi selection for smart tags is not possible.
    if (isSmartTag) {
      multiSelect = false;
    }

    var clearMultipleTagsSelection = function clearMultipleTagsSelection() {
      if ($scope.multipleTags) {
        var _iteratorNormalCompletion8 = true;
        var _didIteratorError8 = false;
        var _iteratorError8 = undefined;

        try {
          for (var _iterator8 = $scope.multipleTags[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
            var selectedTag = _step8.value;

            $scope.setSelectedForTag(selectedTag, false);
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
    };

    if (tag.master || tag.smartMaster) {
      clearMultipleTagsSelection();
      $scope.multipleTags = [];
      componentRelay.clearSelection();
    } else {
      if (!$scope.multipleTags) {
        $scope.multipleTags = [];
      }
      if (!isSmartTag) {
        $scope.multipleTags.push(tag);
      }
      if (multiSelect && $scope.multipleTags.length > 1) {
        var smartTag = $scope.createEphemeralSmartTagForMultiTags();
        componentRelay.selectItem(smartTag);
      } else {
        clearMultipleTagsSelection();
        $scope.multipleTags = isSmartTag ? [] : [tag];
        componentRelay.selectItem(tag);
      }
    }

    // if multiselect, we don't want to clear selected tag. But if master is selected,
    // and multi select other tag, we do want to clear master. Rather than creating a large if
    // statement, we'll just an if else.

    if (!multiSelect && $scope.selectedTag && $scope.selectedTag != tag) {
      $scope.setSelectedForTag($scope.selectedTag, false);
      $scope.selectedTag.editing = false;
    } else if ($scope.selectedTag.master || $scope.selectedTag.smartMaster || $scope.selectedTag.content_type == smartTagContentType) {
      $scope.setSelectedForTag($scope.selectedTag, false);
    }

    if ($scope.selectedTag === tag && !tag.master && !tag.content.isSystemTag) {
      tag.editing = true;
    }

    $scope.selectedTag = tag;
    $scope.setSelectedForTag(tag, true);
  };

  $scope.createEphemeralSmartTagForMultiTags = function () {
    var smartTag = {
      uuid: Math.random(),
      content_type: "SN|SmartTag",
      content: {
        title: "Multiple tags"
      }
    };

    var tagNames = $scope.multipleTags.map(function (tag) {
      return tag.content.title;
    });
    var predicate = ["tags", "includes", ["title", "in", tagNames]];
    smartTag.content.predicate = predicate;
    return smartTag;
  };

  $scope.toggleCollapse = function (tag) {
    tag.clientData.collapsed = !tag.clientData.collapsed;
    if (!tag.master) {
      componentRelay.saveItem(tag);
    }
  };

  $scope.saveTags = function (tags) {
    componentRelay.saveItems(tags);
  };

  $scope.setSelectedForTag = function (tag, selected) {
    tag.selected = selected;
  };

  componentRelay.streamItems(["Tag", smartTagContentType], function (newTags) {
    $timeout(function () {
      var allTags = $scope.masterTag ? $scope.masterTag.rawTags : [];
      var smartTags = $scope.smartMasterTag ? $scope.smartMasterTag.rawTags : SNSmartTag.systemSmartTags();
      var _iteratorNormalCompletion9 = true;
      var _didIteratorError9 = false;
      var _iteratorError9 = undefined;

      try {
        for (var _iterator9 = newTags[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
          var tag = _step9.value;

          var isSmartTag = tag.content_type == smartTagContentType;
          var arrayToUse = isSmartTag ? smartTags : allTags;

          var existing = arrayToUse.filter(function (tagCandidate) {
            return tagCandidate.uuid === tag.uuid;
          })[0];

          if (existing) {
            Object.assign(existing, tag);
          } else if (tag.content.title) {
            arrayToUse.push(tag);
          }

          if (tag.deleted) {
            var index = arrayToUse.indexOf(existing || tag);
            arrayToUse.splice(index, 1);
          } else {
            if ($scope.selectOnLoad && $scope.selectOnLoad.uuid == tag.uuid) {
              $scope.selectOnLoad = null;
              $scope.selectTag(tag);
            } else if (existing && $scope.selectedTag && $scope.selectedTag.uuid == existing.uuid) {
              // Don't call $scope.selectTag(existing) as this will double select a tag, which will enable editing for it.
              $scope.setSelectedForTag(existing, true);
            }
          }
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

      if (!$scope.masterTag) {
        $scope.masterTag = {
          master: true,
          content: {
            title: ""
          },
          displayTitle: "All",
          uuid: "0",
          clientData: {}
        };
      }

      if (!$scope.smartMasterTag) {
        $scope.smartMasterTag = {
          master: true,
          smartMaster: true,
          content: {
            title: ""
          },
          displayTitle: "Views",
          uuid: "1",
          clientData: {}
        };
      }

      $scope.masterTag.rawTags = allTags;
      $scope.smartMasterTag.rawTags = smartTags;

      if (!$scope.selectedTag || $scope.selectedTag && $scope.selectedTag.master) {
        if ($scope.selectedTag && $scope.selectedTag.smartMaster) {
          $scope.selectedTag = $scope.smartMasterTag;
          $scope.setSelectedForTag($scope.masterTag, false);
        } else {
          $scope.selectedTag = $scope.masterTag;
          $scope.setSelectedForTag($scope.smartMasterTag, false);
        }
        $scope.setSelectedForTag($scope.selectedTag, true);
      }

      if ($scope.selectedTag.deleted) {
        $scope.selectTag($scope.masterTag);
      }

      $scope.resolveRawTags($scope.masterTag);
      $scope.resolveRawTags($scope.smartMasterTag);
    });
  });

  $scope.deleteTag = function (tag) {
    var isSmartTag = tag.content_type == smartTagContentType;
    var arrayToUse = isSmartTag ? $scope.smartMasterTag.rawTags : $scope.masterTag.rawTags;

    var tag = arrayToUse.filter(function (tagCandidate) {
      return tagCandidate.uuid === tag.uuid;
    })[0];

    var deleteChain = [];

    function addChildren(tag) {
      deleteChain.push(tag);
      if (tag.children) {
        var _iteratorNormalCompletion10 = true;
        var _didIteratorError10 = false;
        var _iteratorError10 = undefined;

        try {
          for (var _iterator10 = tag.children[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
            var child = _step10.value;

            addChildren(child);
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
      }
    }

    addChildren(tag);

    componentRelay.deleteItems(deleteChain);
  };
};

// required for firefox


HomeCtrl.$$ngIsClass = true;

angular.module('app').controller('HomeCtrl', HomeCtrl);
;angular.module('app').directive('mbAutofocus', ['$timeout', function ($timeout) {
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
;angular.module('app').directive('draggable', function () {
  return {
    scope: {
      tagId: "=",
      drop: '&',
      isDraggable: "=",
      isDroppable: "="
    },
    link: function link(scope, element, attrs) {
      // 'ngInject';
      var el = element[0];

      el.draggable = scope.isDraggable;

      var counter = 0;

      el.addEventListener('dragstart', function (e) {
        counter = 0;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('TagId', JSON.stringify(scope.tagId));
        this.classList.add('drag');
        return false;
      }, false);

      el.addEventListener('dragend', function (e) {
        this.classList.remove('drag');
        this.classList.remove('over');
        return false;
      }, false);

      el.addEventListener('dragover', function (e) {
        e.dataTransfer.dropEffect = 'move';
        // allows us to drop
        if (e.preventDefault) e.preventDefault();
        if (scope.isDroppable) {
          this.classList.add('over');
        }
        return false;
      }, false);

      el.addEventListener('dragenter', function (e) {
        counter++;
        if (scope.isDroppable) {
          this.classList.add('over');
        }
        return false;
      }, false);

      el.addEventListener('dragleave', function (e) {
        counter--;
        if (counter === 0) {
          this.classList.remove('over');
        }
        return false;
      }, false);

      el.addEventListener('dragexit', function (e) {
        // counter--;
        //  if (counter === 0) {
        this.classList.remove('over');
        //  }
        return false;
      }, false);

      el.addEventListener('drop', function (e) {

        // Stops some browsers from redirecting.
        counter = 0;
        if (e.stopPropagation) e.stopPropagation();

        this.classList.remove('over');

        var targetId = JSON.parse(e.dataTransfer.getData('TagId'));
        if (targetId === scope.tagId) {
          return;
        }
        scope.$apply(function (scope) {
          scope.drop()(targetId, scope.tagId);
        });

        return false;
      }, false);
    }
  };
});
;
var TagTree = function () {
  function TagTree() {
    _classCallCheck2(this, TagTree);

    this.restrict = "C";
    this.templateUrl = "directives/tag_tree.html";
    this.scope = {
      tag: "=",
      changeParent: "&",
      onSelect: "&",
      createTag: "&",
      saveTags: "&",
      deleteTag: "&",
      onToggleCollapse: "&"
    };
  }

  _createClass2(TagTree, [{
    key: "controller",
    value: function controller($scope, $timeout) {
      'ngInject';

      $scope.isDraggable = function () {
        return !$scope.tag.master && $scope.tag.content_type != 'SN|SmartTag';
      };

      $scope.isDroppable = function () {
        return !$scope.tag.smartMaster && $scope.tag.content_type != 'SN|SmartTag';
      };

      $scope.onDrop = function (sourceId, targetId) {
        $scope.changeParent()(sourceId, targetId);
      };

      $scope.onDragOver = function (event) {};

      $scope.onDragStart = function (event) {};

      $scope.selectTag = function (event) {
        var multiSelect = event.ctrlKey || event.metaKey;
        $scope.onSelect()($scope.tag, multiSelect);
      };

      $scope.addChild = function ($event, parent) {
        $event.stopPropagation();
        var addingTag = { dummy: true, parent: parent, content: { title: "" } };
        parent.children.unshift(addingTag);
      };

      $scope.saveNewTag = function (tag) {
        if (tag.content.title && tag.content.title.length > 0) {
          $scope.createTag()(tag);
        }
        tag.parent.children.splice(tag.parent.children.indexOf(tag), 1);
      };

      $scope.removeTag = function (tag) {
        $scope.deleteTag()(tag);
      };

      $scope.innerCollapse = function (tag) {
        if ($scope.onToggleCollapse()) {
          $scope.onToggleCollapse()(tag);
        }
      };

      $scope.saveTagRename = function (tag) {
        if (!tag.displayTitle || tag.displayTitle.length == 0) {
          // Delete
          $scope.deleteTag()(tag);
          return;
        }
        var delimiter = ".";
        var tags = [tag];
        var title;
        if (tag.parent.master) {
          title = tag.displayTitle;
        } else {
          title = tag.parent.content.title + delimiter + tag.displayTitle;
        }

        tag.content.title = title;

        function renameChildren(tag) {
          var _iteratorNormalCompletion11 = true;
          var _didIteratorError11 = false;
          var _iteratorError11 = undefined;

          try {
            for (var _iterator11 = tag.children[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
              var child = _step11.value;

              child.content.title = child.parent.content.title + delimiter + child.displayTitle;
              tags.push(child);
              renameChildren(child);
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
        }

        renameChildren(tag);

        tag.editing = false;

        $scope.saveTags()(tags);
      };

      $scope.generationForTag = function (tag) {
        var generation = 0;
        var parent = tag.parent;
        while (parent) {
          generation++;
          parent = parent.parent;
        }

        return generation;
      };

      $scope.circleClassForTag = function (tag) {
        if (tag.content_type == "SN|SmartTag") {
          return "success";
        }

        // is newly creating tag
        if (!tag.uuid) {
          return "neutral";
        }

        var gen = $scope.generationForTag(tag);
        var circleClass = {
          0: "info",
          1: "info",
          2: "success",
          3: "danger",
          4: "warning"
        }[gen];

        if (!circleClass) {
          circleClass = "neutral";
        }

        // Newly creating tags don't have client data
        if (tag.clientData && tag.clientData.collapsed) {
          circleClass += " no-bg";
        }

        return circleClass;
      };
    }
  }]);

  return TagTree;
}();

TagTree.$$ngIsClass = true;

angular.module('app').directive('tagTree', function () {
  return new TagTree();
});


},{"standard-file-js":2}],2:[function(require,module,exports){
(function (global){(function (){
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.SF = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){
/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
var CryptoJS=CryptoJS||function(u,p){var d={},l=d.lib={},s=function(){},t=l.Base={extend:function(a){s.prototype=this;var c=new s;a&&c.mixIn(a);c.hasOwnProperty("init")||(c.init=function(){c.$super.init.apply(this,arguments)});c.init.prototype=c;c.$super=this;return c},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var c in a)a.hasOwnProperty(c)&&(this[c]=a[c]);a.hasOwnProperty("toString")&&(this.toString=a.toString)},clone:function(){return this.init.prototype.extend(this)}},
r=l.WordArray=t.extend({init:function(a,c){a=this.words=a||[];this.sigBytes=c!=p?c:4*a.length},toString:function(a){return(a||v).stringify(this)},concat:function(a){var c=this.words,e=a.words,j=this.sigBytes;a=a.sigBytes;this.clamp();if(j%4)for(var k=0;k<a;k++)c[j+k>>>2]|=(e[k>>>2]>>>24-8*(k%4)&255)<<24-8*((j+k)%4);else if(65535<e.length)for(k=0;k<a;k+=4)c[j+k>>>2]=e[k>>>2];else c.push.apply(c,e);this.sigBytes+=a;return this},clamp:function(){var a=this.words,c=this.sigBytes;a[c>>>2]&=4294967295<<
32-8*(c%4);a.length=u.ceil(c/4)},clone:function(){var a=t.clone.call(this);a.words=this.words.slice(0);return a},random:function(a){for(var c=[],e=0;e<a;e+=4)c.push(4294967296*u.random()|0);return new r.init(c,a)}}),w=d.enc={},v=w.Hex={stringify:function(a){var c=a.words;a=a.sigBytes;for(var e=[],j=0;j<a;j++){var k=c[j>>>2]>>>24-8*(j%4)&255;e.push((k>>>4).toString(16));e.push((k&15).toString(16))}return e.join("")},parse:function(a){for(var c=a.length,e=[],j=0;j<c;j+=2)e[j>>>3]|=parseInt(a.substr(j,
2),16)<<24-4*(j%8);return new r.init(e,c/2)}},b=w.Latin1={stringify:function(a){var c=a.words;a=a.sigBytes;for(var e=[],j=0;j<a;j++)e.push(String.fromCharCode(c[j>>>2]>>>24-8*(j%4)&255));return e.join("")},parse:function(a){for(var c=a.length,e=[],j=0;j<c;j++)e[j>>>2]|=(a.charCodeAt(j)&255)<<24-8*(j%4);return new r.init(e,c)}},x=w.Utf8={stringify:function(a){try{return decodeURIComponent(escape(b.stringify(a)))}catch(c){throw Error("Malformed UTF-8 data");}},parse:function(a){return b.parse(unescape(encodeURIComponent(a)))}},
q=l.BufferedBlockAlgorithm=t.extend({reset:function(){this._data=new r.init;this._nDataBytes=0},_append:function(a){"string"==typeof a&&(a=x.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(a){var c=this._data,e=c.words,j=c.sigBytes,k=this.blockSize,b=j/(4*k),b=a?u.ceil(b):u.max((b|0)-this._minBufferSize,0);a=b*k;j=u.min(4*a,j);if(a){for(var q=0;q<a;q+=k)this._doProcessBlock(e,q);q=e.splice(0,a);c.sigBytes-=j}return new r.init(q,j)},clone:function(){var a=t.clone.call(this);
a._data=this._data.clone();return a},_minBufferSize:0});l.Hasher=q.extend({cfg:t.extend(),init:function(a){this.cfg=this.cfg.extend(a);this.reset()},reset:function(){q.reset.call(this);this._doReset()},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);return this._doFinalize()},blockSize:16,_createHelper:function(a){return function(b,e){return(new a.init(e)).finalize(b)}},_createHmacHelper:function(a){return function(b,e){return(new n.HMAC.init(a,
e)).finalize(b)}}});var n=d.algo={};return d}(Math);
(function(){var u=CryptoJS,p=u.lib.WordArray;u.enc.Base64={stringify:function(d){var l=d.words,p=d.sigBytes,t=this._map;d.clamp();d=[];for(var r=0;r<p;r+=3)for(var w=(l[r>>>2]>>>24-8*(r%4)&255)<<16|(l[r+1>>>2]>>>24-8*((r+1)%4)&255)<<8|l[r+2>>>2]>>>24-8*((r+2)%4)&255,v=0;4>v&&r+0.75*v<p;v++)d.push(t.charAt(w>>>6*(3-v)&63));if(l=t.charAt(64))for(;d.length%4;)d.push(l);return d.join("")},parse:function(d){var l=d.length,s=this._map,t=s.charAt(64);t&&(t=d.indexOf(t),-1!=t&&(l=t));for(var t=[],r=0,w=0;w<
l;w++)if(w%4){var v=s.indexOf(d.charAt(w-1))<<2*(w%4),b=s.indexOf(d.charAt(w))>>>6-2*(w%4);t[r>>>2]|=(v|b)<<24-8*(r%4);r++}return p.create(t,r)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="}})();
(function(u){function p(b,n,a,c,e,j,k){b=b+(n&a|~n&c)+e+k;return(b<<j|b>>>32-j)+n}function d(b,n,a,c,e,j,k){b=b+(n&c|a&~c)+e+k;return(b<<j|b>>>32-j)+n}function l(b,n,a,c,e,j,k){b=b+(n^a^c)+e+k;return(b<<j|b>>>32-j)+n}function s(b,n,a,c,e,j,k){b=b+(a^(n|~c))+e+k;return(b<<j|b>>>32-j)+n}for(var t=CryptoJS,r=t.lib,w=r.WordArray,v=r.Hasher,r=t.algo,b=[],x=0;64>x;x++)b[x]=4294967296*u.abs(u.sin(x+1))|0;r=r.MD5=v.extend({_doReset:function(){this._hash=new w.init([1732584193,4023233417,2562383102,271733878])},
_doProcessBlock:function(q,n){for(var a=0;16>a;a++){var c=n+a,e=q[c];q[c]=(e<<8|e>>>24)&16711935|(e<<24|e>>>8)&4278255360}var a=this._hash.words,c=q[n+0],e=q[n+1],j=q[n+2],k=q[n+3],z=q[n+4],r=q[n+5],t=q[n+6],w=q[n+7],v=q[n+8],A=q[n+9],B=q[n+10],C=q[n+11],u=q[n+12],D=q[n+13],E=q[n+14],x=q[n+15],f=a[0],m=a[1],g=a[2],h=a[3],f=p(f,m,g,h,c,7,b[0]),h=p(h,f,m,g,e,12,b[1]),g=p(g,h,f,m,j,17,b[2]),m=p(m,g,h,f,k,22,b[3]),f=p(f,m,g,h,z,7,b[4]),h=p(h,f,m,g,r,12,b[5]),g=p(g,h,f,m,t,17,b[6]),m=p(m,g,h,f,w,22,b[7]),
f=p(f,m,g,h,v,7,b[8]),h=p(h,f,m,g,A,12,b[9]),g=p(g,h,f,m,B,17,b[10]),m=p(m,g,h,f,C,22,b[11]),f=p(f,m,g,h,u,7,b[12]),h=p(h,f,m,g,D,12,b[13]),g=p(g,h,f,m,E,17,b[14]),m=p(m,g,h,f,x,22,b[15]),f=d(f,m,g,h,e,5,b[16]),h=d(h,f,m,g,t,9,b[17]),g=d(g,h,f,m,C,14,b[18]),m=d(m,g,h,f,c,20,b[19]),f=d(f,m,g,h,r,5,b[20]),h=d(h,f,m,g,B,9,b[21]),g=d(g,h,f,m,x,14,b[22]),m=d(m,g,h,f,z,20,b[23]),f=d(f,m,g,h,A,5,b[24]),h=d(h,f,m,g,E,9,b[25]),g=d(g,h,f,m,k,14,b[26]),m=d(m,g,h,f,v,20,b[27]),f=d(f,m,g,h,D,5,b[28]),h=d(h,f,
m,g,j,9,b[29]),g=d(g,h,f,m,w,14,b[30]),m=d(m,g,h,f,u,20,b[31]),f=l(f,m,g,h,r,4,b[32]),h=l(h,f,m,g,v,11,b[33]),g=l(g,h,f,m,C,16,b[34]),m=l(m,g,h,f,E,23,b[35]),f=l(f,m,g,h,e,4,b[36]),h=l(h,f,m,g,z,11,b[37]),g=l(g,h,f,m,w,16,b[38]),m=l(m,g,h,f,B,23,b[39]),f=l(f,m,g,h,D,4,b[40]),h=l(h,f,m,g,c,11,b[41]),g=l(g,h,f,m,k,16,b[42]),m=l(m,g,h,f,t,23,b[43]),f=l(f,m,g,h,A,4,b[44]),h=l(h,f,m,g,u,11,b[45]),g=l(g,h,f,m,x,16,b[46]),m=l(m,g,h,f,j,23,b[47]),f=s(f,m,g,h,c,6,b[48]),h=s(h,f,m,g,w,10,b[49]),g=s(g,h,f,m,
E,15,b[50]),m=s(m,g,h,f,r,21,b[51]),f=s(f,m,g,h,u,6,b[52]),h=s(h,f,m,g,k,10,b[53]),g=s(g,h,f,m,B,15,b[54]),m=s(m,g,h,f,e,21,b[55]),f=s(f,m,g,h,v,6,b[56]),h=s(h,f,m,g,x,10,b[57]),g=s(g,h,f,m,t,15,b[58]),m=s(m,g,h,f,D,21,b[59]),f=s(f,m,g,h,z,6,b[60]),h=s(h,f,m,g,C,10,b[61]),g=s(g,h,f,m,j,15,b[62]),m=s(m,g,h,f,A,21,b[63]);a[0]=a[0]+f|0;a[1]=a[1]+m|0;a[2]=a[2]+g|0;a[3]=a[3]+h|0},_doFinalize:function(){var b=this._data,n=b.words,a=8*this._nDataBytes,c=8*b.sigBytes;n[c>>>5]|=128<<24-c%32;var e=u.floor(a/
4294967296);n[(c+64>>>9<<4)+15]=(e<<8|e>>>24)&16711935|(e<<24|e>>>8)&4278255360;n[(c+64>>>9<<4)+14]=(a<<8|a>>>24)&16711935|(a<<24|a>>>8)&4278255360;b.sigBytes=4*(n.length+1);this._process();b=this._hash;n=b.words;for(a=0;4>a;a++)c=n[a],n[a]=(c<<8|c>>>24)&16711935|(c<<24|c>>>8)&4278255360;return b},clone:function(){var b=v.clone.call(this);b._hash=this._hash.clone();return b}});t.MD5=v._createHelper(r);t.HmacMD5=v._createHmacHelper(r)})(Math);
(function(){var u=CryptoJS,p=u.lib,d=p.Base,l=p.WordArray,p=u.algo,s=p.EvpKDF=d.extend({cfg:d.extend({keySize:4,hasher:p.MD5,iterations:1}),init:function(d){this.cfg=this.cfg.extend(d)},compute:function(d,r){for(var p=this.cfg,s=p.hasher.create(),b=l.create(),u=b.words,q=p.keySize,p=p.iterations;u.length<q;){n&&s.update(n);var n=s.update(d).finalize(r);s.reset();for(var a=1;a<p;a++)n=s.finalize(n),s.reset();b.concat(n)}b.sigBytes=4*q;return b}});u.EvpKDF=function(d,l,p){return s.create(p).compute(d,
l)}})();
CryptoJS.lib.Cipher||function(u){var p=CryptoJS,d=p.lib,l=d.Base,s=d.WordArray,t=d.BufferedBlockAlgorithm,r=p.enc.Base64,w=p.algo.EvpKDF,v=d.Cipher=t.extend({cfg:l.extend(),createEncryptor:function(e,a){return this.create(this._ENC_XFORM_MODE,e,a)},createDecryptor:function(e,a){return this.create(this._DEC_XFORM_MODE,e,a)},init:function(e,a,b){this.cfg=this.cfg.extend(b);this._xformMode=e;this._key=a;this.reset()},reset:function(){t.reset.call(this);this._doReset()},process:function(e){this._append(e);return this._process()},
finalize:function(e){e&&this._append(e);return this._doFinalize()},keySize:4,ivSize:4,_ENC_XFORM_MODE:1,_DEC_XFORM_MODE:2,_createHelper:function(e){return{encrypt:function(b,k,d){return("string"==typeof k?c:a).encrypt(e,b,k,d)},decrypt:function(b,k,d){return("string"==typeof k?c:a).decrypt(e,b,k,d)}}}});d.StreamCipher=v.extend({_doFinalize:function(){return this._process(!0)},blockSize:1});var b=p.mode={},x=function(e,a,b){var c=this._iv;c?this._iv=u:c=this._prevBlock;for(var d=0;d<b;d++)e[a+d]^=
c[d]},q=(d.BlockCipherMode=l.extend({createEncryptor:function(e,a){return this.Encryptor.create(e,a)},createDecryptor:function(e,a){return this.Decryptor.create(e,a)},init:function(e,a){this._cipher=e;this._iv=a}})).extend();q.Encryptor=q.extend({processBlock:function(e,a){var b=this._cipher,c=b.blockSize;x.call(this,e,a,c);b.encryptBlock(e,a);this._prevBlock=e.slice(a,a+c)}});q.Decryptor=q.extend({processBlock:function(e,a){var b=this._cipher,c=b.blockSize,d=e.slice(a,a+c);b.decryptBlock(e,a);x.call(this,
e,a,c);this._prevBlock=d}});b=b.CBC=q;q=(p.pad={}).Pkcs7={pad:function(a,b){for(var c=4*b,c=c-a.sigBytes%c,d=c<<24|c<<16|c<<8|c,l=[],n=0;n<c;n+=4)l.push(d);c=s.create(l,c);a.concat(c)},unpad:function(a){a.sigBytes-=a.words[a.sigBytes-1>>>2]&255}};d.BlockCipher=v.extend({cfg:v.cfg.extend({mode:b,padding:q}),reset:function(){v.reset.call(this);var a=this.cfg,b=a.iv,a=a.mode;if(this._xformMode==this._ENC_XFORM_MODE)var c=a.createEncryptor;else c=a.createDecryptor,this._minBufferSize=1;this._mode=c.call(a,
this,b&&b.words)},_doProcessBlock:function(a,b){this._mode.processBlock(a,b)},_doFinalize:function(){var a=this.cfg.padding;if(this._xformMode==this._ENC_XFORM_MODE){a.pad(this._data,this.blockSize);var b=this._process(!0)}else b=this._process(!0),a.unpad(b);return b},blockSize:4});var n=d.CipherParams=l.extend({init:function(a){this.mixIn(a)},toString:function(a){return(a||this.formatter).stringify(this)}}),b=(p.format={}).OpenSSL={stringify:function(a){var b=a.ciphertext;a=a.salt;return(a?s.create([1398893684,
1701076831]).concat(a).concat(b):b).toString(r)},parse:function(a){a=r.parse(a);var b=a.words;if(1398893684==b[0]&&1701076831==b[1]){var c=s.create(b.slice(2,4));b.splice(0,4);a.sigBytes-=16}return n.create({ciphertext:a,salt:c})}},a=d.SerializableCipher=l.extend({cfg:l.extend({format:b}),encrypt:function(a,b,c,d){d=this.cfg.extend(d);var l=a.createEncryptor(c,d);b=l.finalize(b);l=l.cfg;return n.create({ciphertext:b,key:c,iv:l.iv,algorithm:a,mode:l.mode,padding:l.padding,blockSize:a.blockSize,formatter:d.format})},
decrypt:function(a,b,c,d){d=this.cfg.extend(d);b=this._parse(b,d.format);return a.createDecryptor(c,d).finalize(b.ciphertext)},_parse:function(a,b){return"string"==typeof a?b.parse(a,this):a}}),p=(p.kdf={}).OpenSSL={execute:function(a,b,c,d){d||(d=s.random(8));a=w.create({keySize:b+c}).compute(a,d);c=s.create(a.words.slice(b),4*c);a.sigBytes=4*b;return n.create({key:a,iv:c,salt:d})}},c=d.PasswordBasedCipher=a.extend({cfg:a.cfg.extend({kdf:p}),encrypt:function(b,c,d,l){l=this.cfg.extend(l);d=l.kdf.execute(d,
b.keySize,b.ivSize);l.iv=d.iv;b=a.encrypt.call(this,b,c,d.key,l);b.mixIn(d);return b},decrypt:function(b,c,d,l){l=this.cfg.extend(l);c=this._parse(c,l.format);d=l.kdf.execute(d,b.keySize,b.ivSize,c.salt);l.iv=d.iv;return a.decrypt.call(this,b,c,d.key,l)}})}();
(function(){for(var u=CryptoJS,p=u.lib.BlockCipher,d=u.algo,l=[],s=[],t=[],r=[],w=[],v=[],b=[],x=[],q=[],n=[],a=[],c=0;256>c;c++)a[c]=128>c?c<<1:c<<1^283;for(var e=0,j=0,c=0;256>c;c++){var k=j^j<<1^j<<2^j<<3^j<<4,k=k>>>8^k&255^99;l[e]=k;s[k]=e;var z=a[e],F=a[z],G=a[F],y=257*a[k]^16843008*k;t[e]=y<<24|y>>>8;r[e]=y<<16|y>>>16;w[e]=y<<8|y>>>24;v[e]=y;y=16843009*G^65537*F^257*z^16843008*e;b[k]=y<<24|y>>>8;x[k]=y<<16|y>>>16;q[k]=y<<8|y>>>24;n[k]=y;e?(e=z^a[a[a[G^z]]],j^=a[a[j]]):e=j=1}var H=[0,1,2,4,8,
16,32,64,128,27,54],d=d.AES=p.extend({_doReset:function(){for(var a=this._key,c=a.words,d=a.sigBytes/4,a=4*((this._nRounds=d+6)+1),e=this._keySchedule=[],j=0;j<a;j++)if(j<d)e[j]=c[j];else{var k=e[j-1];j%d?6<d&&4==j%d&&(k=l[k>>>24]<<24|l[k>>>16&255]<<16|l[k>>>8&255]<<8|l[k&255]):(k=k<<8|k>>>24,k=l[k>>>24]<<24|l[k>>>16&255]<<16|l[k>>>8&255]<<8|l[k&255],k^=H[j/d|0]<<24);e[j]=e[j-d]^k}c=this._invKeySchedule=[];for(d=0;d<a;d++)j=a-d,k=d%4?e[j]:e[j-4],c[d]=4>d||4>=j?k:b[l[k>>>24]]^x[l[k>>>16&255]]^q[l[k>>>
8&255]]^n[l[k&255]]},encryptBlock:function(a,b){this._doCryptBlock(a,b,this._keySchedule,t,r,w,v,l)},decryptBlock:function(a,c){var d=a[c+1];a[c+1]=a[c+3];a[c+3]=d;this._doCryptBlock(a,c,this._invKeySchedule,b,x,q,n,s);d=a[c+1];a[c+1]=a[c+3];a[c+3]=d},_doCryptBlock:function(a,b,c,d,e,j,l,f){for(var m=this._nRounds,g=a[b]^c[0],h=a[b+1]^c[1],k=a[b+2]^c[2],n=a[b+3]^c[3],p=4,r=1;r<m;r++)var q=d[g>>>24]^e[h>>>16&255]^j[k>>>8&255]^l[n&255]^c[p++],s=d[h>>>24]^e[k>>>16&255]^j[n>>>8&255]^l[g&255]^c[p++],t=
d[k>>>24]^e[n>>>16&255]^j[g>>>8&255]^l[h&255]^c[p++],n=d[n>>>24]^e[g>>>16&255]^j[h>>>8&255]^l[k&255]^c[p++],g=q,h=s,k=t;q=(f[g>>>24]<<24|f[h>>>16&255]<<16|f[k>>>8&255]<<8|f[n&255])^c[p++];s=(f[h>>>24]<<24|f[k>>>16&255]<<16|f[n>>>8&255]<<8|f[g&255])^c[p++];t=(f[k>>>24]<<24|f[n>>>16&255]<<16|f[g>>>8&255]<<8|f[h&255])^c[p++];n=(f[n>>>24]<<24|f[g>>>16&255]<<16|f[h>>>8&255]<<8|f[k&255])^c[p++];a[b]=q;a[b+1]=s;a[b+2]=t;a[b+3]=n},keySize:8});u.AES=p._createHelper(d)})();
;/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
var CryptoJS=CryptoJS||function(h,s){var f={},g=f.lib={},q=function(){},m=g.Base={extend:function(a){q.prototype=this;var c=new q;a&&c.mixIn(a);c.hasOwnProperty("init")||(c.init=function(){c.$super.init.apply(this,arguments)});c.init.prototype=c;c.$super=this;return c},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var c in a)a.hasOwnProperty(c)&&(this[c]=a[c]);a.hasOwnProperty("toString")&&(this.toString=a.toString)},clone:function(){return this.init.prototype.extend(this)}},
r=g.WordArray=m.extend({init:function(a,c){a=this.words=a||[];this.sigBytes=c!=s?c:4*a.length},toString:function(a){return(a||k).stringify(this)},concat:function(a){var c=this.words,d=a.words,b=this.sigBytes;a=a.sigBytes;this.clamp();if(b%4)for(var e=0;e<a;e++)c[b+e>>>2]|=(d[e>>>2]>>>24-8*(e%4)&255)<<24-8*((b+e)%4);else if(65535<d.length)for(e=0;e<a;e+=4)c[b+e>>>2]=d[e>>>2];else c.push.apply(c,d);this.sigBytes+=a;return this},clamp:function(){var a=this.words,c=this.sigBytes;a[c>>>2]&=4294967295<<
32-8*(c%4);a.length=h.ceil(c/4)},clone:function(){var a=m.clone.call(this);a.words=this.words.slice(0);return a},random:function(a){for(var c=[],d=0;d<a;d+=4)c.push(4294967296*h.random()|0);return new r.init(c,a)}}),l=f.enc={},k=l.Hex={stringify:function(a){var c=a.words;a=a.sigBytes;for(var d=[],b=0;b<a;b++){var e=c[b>>>2]>>>24-8*(b%4)&255;d.push((e>>>4).toString(16));d.push((e&15).toString(16))}return d.join("")},parse:function(a){for(var c=a.length,d=[],b=0;b<c;b+=2)d[b>>>3]|=parseInt(a.substr(b,
2),16)<<24-4*(b%8);return new r.init(d,c/2)}},n=l.Latin1={stringify:function(a){var c=a.words;a=a.sigBytes;for(var d=[],b=0;b<a;b++)d.push(String.fromCharCode(c[b>>>2]>>>24-8*(b%4)&255));return d.join("")},parse:function(a){for(var c=a.length,d=[],b=0;b<c;b++)d[b>>>2]|=(a.charCodeAt(b)&255)<<24-8*(b%4);return new r.init(d,c)}},j=l.Utf8={stringify:function(a){try{return decodeURIComponent(escape(n.stringify(a)))}catch(c){throw Error("Malformed UTF-8 data");}},parse:function(a){return n.parse(unescape(encodeURIComponent(a)))}},
u=g.BufferedBlockAlgorithm=m.extend({reset:function(){this._data=new r.init;this._nDataBytes=0},_append:function(a){"string"==typeof a&&(a=j.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(a){var c=this._data,d=c.words,b=c.sigBytes,e=this.blockSize,f=b/(4*e),f=a?h.ceil(f):h.max((f|0)-this._minBufferSize,0);a=f*e;b=h.min(4*a,b);if(a){for(var g=0;g<a;g+=e)this._doProcessBlock(d,g);g=d.splice(0,a);c.sigBytes-=b}return new r.init(g,b)},clone:function(){var a=m.clone.call(this);
a._data=this._data.clone();return a},_minBufferSize:0});g.Hasher=u.extend({cfg:m.extend(),init:function(a){this.cfg=this.cfg.extend(a);this.reset()},reset:function(){u.reset.call(this);this._doReset()},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);return this._doFinalize()},blockSize:16,_createHelper:function(a){return function(c,d){return(new a.init(d)).finalize(c)}},_createHmacHelper:function(a){return function(c,d){return(new t.HMAC.init(a,
d)).finalize(c)}}});var t=f.algo={};return f}(Math);
(function(h){for(var s=CryptoJS,f=s.lib,g=f.WordArray,q=f.Hasher,f=s.algo,m=[],r=[],l=function(a){return 4294967296*(a-(a|0))|0},k=2,n=0;64>n;){var j;a:{j=k;for(var u=h.sqrt(j),t=2;t<=u;t++)if(!(j%t)){j=!1;break a}j=!0}j&&(8>n&&(m[n]=l(h.pow(k,0.5))),r[n]=l(h.pow(k,1/3)),n++);k++}var a=[],f=f.SHA256=q.extend({_doReset:function(){this._hash=new g.init(m.slice(0))},_doProcessBlock:function(c,d){for(var b=this._hash.words,e=b[0],f=b[1],g=b[2],j=b[3],h=b[4],m=b[5],n=b[6],q=b[7],p=0;64>p;p++){if(16>p)a[p]=
c[d+p]|0;else{var k=a[p-15],l=a[p-2];a[p]=((k<<25|k>>>7)^(k<<14|k>>>18)^k>>>3)+a[p-7]+((l<<15|l>>>17)^(l<<13|l>>>19)^l>>>10)+a[p-16]}k=q+((h<<26|h>>>6)^(h<<21|h>>>11)^(h<<7|h>>>25))+(h&m^~h&n)+r[p]+a[p];l=((e<<30|e>>>2)^(e<<19|e>>>13)^(e<<10|e>>>22))+(e&f^e&g^f&g);q=n;n=m;m=h;h=j+k|0;j=g;g=f;f=e;e=k+l|0}b[0]=b[0]+e|0;b[1]=b[1]+f|0;b[2]=b[2]+g|0;b[3]=b[3]+j|0;b[4]=b[4]+h|0;b[5]=b[5]+m|0;b[6]=b[6]+n|0;b[7]=b[7]+q|0},_doFinalize:function(){var a=this._data,d=a.words,b=8*this._nDataBytes,e=8*a.sigBytes;
d[e>>>5]|=128<<24-e%32;d[(e+64>>>9<<4)+14]=h.floor(b/4294967296);d[(e+64>>>9<<4)+15]=b;a.sigBytes=4*d.length;this._process();return this._hash},clone:function(){var a=q.clone.call(this);a._hash=this._hash.clone();return a}});s.SHA256=q._createHelper(f);s.HmacSHA256=q._createHmacHelper(f)})(Math);
(function(){var h=CryptoJS,s=h.enc.Utf8;h.algo.HMAC=h.lib.Base.extend({init:function(f,g){f=this._hasher=new f.init;"string"==typeof g&&(g=s.parse(g));var h=f.blockSize,m=4*h;g.sigBytes>m&&(g=f.finalize(g));g.clamp();for(var r=this._oKey=g.clone(),l=this._iKey=g.clone(),k=r.words,n=l.words,j=0;j<h;j++)k[j]^=1549556828,n[j]^=909522486;r.sigBytes=l.sigBytes=m;this.reset()},reset:function(){var f=this._hasher;f.reset();f.update(this._iKey)},update:function(f){this._hasher.update(f);return this},finalize:function(f){var g=
this._hasher;f=g.finalize(f);g.reset();return g.finalize(this._oKey.clone().concat(f))}})})();
;/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
var CryptoJS=CryptoJS||function(a,j){var c={},b=c.lib={},f=function(){},l=b.Base={extend:function(a){f.prototype=this;var d=new f;a&&d.mixIn(a);d.hasOwnProperty("init")||(d.init=function(){d.$super.init.apply(this,arguments)});d.init.prototype=d;d.$super=this;return d},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var d in a)a.hasOwnProperty(d)&&(this[d]=a[d]);a.hasOwnProperty("toString")&&(this.toString=a.toString)},clone:function(){return this.init.prototype.extend(this)}},
u=b.WordArray=l.extend({init:function(a,d){a=this.words=a||[];this.sigBytes=d!=j?d:4*a.length},toString:function(a){return(a||m).stringify(this)},concat:function(a){var d=this.words,M=a.words,e=this.sigBytes;a=a.sigBytes;this.clamp();if(e%4)for(var b=0;b<a;b++)d[e+b>>>2]|=(M[b>>>2]>>>24-8*(b%4)&255)<<24-8*((e+b)%4);else if(65535<M.length)for(b=0;b<a;b+=4)d[e+b>>>2]=M[b>>>2];else d.push.apply(d,M);this.sigBytes+=a;return this},clamp:function(){var D=this.words,d=this.sigBytes;D[d>>>2]&=4294967295<<
32-8*(d%4);D.length=a.ceil(d/4)},clone:function(){var a=l.clone.call(this);a.words=this.words.slice(0);return a},random:function(D){for(var d=[],b=0;b<D;b+=4)d.push(4294967296*a.random()|0);return new u.init(d,D)}}),k=c.enc={},m=k.Hex={stringify:function(a){var d=a.words;a=a.sigBytes;for(var b=[],e=0;e<a;e++){var c=d[e>>>2]>>>24-8*(e%4)&255;b.push((c>>>4).toString(16));b.push((c&15).toString(16))}return b.join("")},parse:function(a){for(var d=a.length,b=[],e=0;e<d;e+=2)b[e>>>3]|=parseInt(a.substr(e,
2),16)<<24-4*(e%8);return new u.init(b,d/2)}},y=k.Latin1={stringify:function(a){var b=a.words;a=a.sigBytes;for(var c=[],e=0;e<a;e++)c.push(String.fromCharCode(b[e>>>2]>>>24-8*(e%4)&255));return c.join("")},parse:function(a){for(var b=a.length,c=[],e=0;e<b;e++)c[e>>>2]|=(a.charCodeAt(e)&255)<<24-8*(e%4);return new u.init(c,b)}},z=k.Utf8={stringify:function(a){try{return decodeURIComponent(escape(y.stringify(a)))}catch(b){throw Error("Malformed UTF-8 data");}},parse:function(a){return y.parse(unescape(encodeURIComponent(a)))}},
x=b.BufferedBlockAlgorithm=l.extend({reset:function(){this._data=new u.init;this._nDataBytes=0},_append:function(a){"string"==typeof a&&(a=z.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(b){var d=this._data,c=d.words,e=d.sigBytes,l=this.blockSize,k=e/(4*l),k=b?a.ceil(k):a.max((k|0)-this._minBufferSize,0);b=k*l;e=a.min(4*b,e);if(b){for(var x=0;x<b;x+=l)this._doProcessBlock(c,x);x=c.splice(0,b);d.sigBytes-=e}return new u.init(x,e)},clone:function(){var a=l.clone.call(this);
a._data=this._data.clone();return a},_minBufferSize:0});b.Hasher=x.extend({cfg:l.extend(),init:function(a){this.cfg=this.cfg.extend(a);this.reset()},reset:function(){x.reset.call(this);this._doReset()},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);return this._doFinalize()},blockSize:16,_createHelper:function(a){return function(b,c){return(new a.init(c)).finalize(b)}},_createHmacHelper:function(a){return function(b,c){return(new ja.HMAC.init(a,
c)).finalize(b)}}});var ja=c.algo={};return c}(Math);
(function(a){var j=CryptoJS,c=j.lib,b=c.Base,f=c.WordArray,j=j.x64={};j.Word=b.extend({init:function(a,b){this.high=a;this.low=b}});j.WordArray=b.extend({init:function(b,c){b=this.words=b||[];this.sigBytes=c!=a?c:8*b.length},toX32:function(){for(var a=this.words,b=a.length,c=[],m=0;m<b;m++){var y=a[m];c.push(y.high);c.push(y.low)}return f.create(c,this.sigBytes)},clone:function(){for(var a=b.clone.call(this),c=a.words=this.words.slice(0),k=c.length,f=0;f<k;f++)c[f]=c[f].clone();return a}})})();
(function(){function a(){return f.create.apply(f,arguments)}for(var j=CryptoJS,c=j.lib.Hasher,b=j.x64,f=b.Word,l=b.WordArray,b=j.algo,u=[a(1116352408,3609767458),a(1899447441,602891725),a(3049323471,3964484399),a(3921009573,2173295548),a(961987163,4081628472),a(1508970993,3053834265),a(2453635748,2937671579),a(2870763221,3664609560),a(3624381080,2734883394),a(310598401,1164996542),a(607225278,1323610764),a(1426881987,3590304994),a(1925078388,4068182383),a(2162078206,991336113),a(2614888103,633803317),
a(3248222580,3479774868),a(3835390401,2666613458),a(4022224774,944711139),a(264347078,2341262773),a(604807628,2007800933),a(770255983,1495990901),a(1249150122,1856431235),a(1555081692,3175218132),a(1996064986,2198950837),a(2554220882,3999719339),a(2821834349,766784016),a(2952996808,2566594879),a(3210313671,3203337956),a(3336571891,1034457026),a(3584528711,2466948901),a(113926993,3758326383),a(338241895,168717936),a(666307205,1188179964),a(773529912,1546045734),a(1294757372,1522805485),a(1396182291,
2643833823),a(1695183700,2343527390),a(1986661051,1014477480),a(2177026350,1206759142),a(2456956037,344077627),a(2730485921,1290863460),a(2820302411,3158454273),a(3259730800,3505952657),a(3345764771,106217008),a(3516065817,3606008344),a(3600352804,1432725776),a(4094571909,1467031594),a(275423344,851169720),a(430227734,3100823752),a(506948616,1363258195),a(659060556,3750685593),a(883997877,3785050280),a(958139571,3318307427),a(1322822218,3812723403),a(1537002063,2003034995),a(1747873779,3602036899),
a(1955562222,1575990012),a(2024104815,1125592928),a(2227730452,2716904306),a(2361852424,442776044),a(2428436474,593698344),a(2756734187,3733110249),a(3204031479,2999351573),a(3329325298,3815920427),a(3391569614,3928383900),a(3515267271,566280711),a(3940187606,3454069534),a(4118630271,4000239992),a(116418474,1914138554),a(174292421,2731055270),a(289380356,3203993006),a(460393269,320620315),a(685471733,587496836),a(852142971,1086792851),a(1017036298,365543100),a(1126000580,2618297676),a(1288033470,
3409855158),a(1501505948,4234509866),a(1607167915,987167468),a(1816402316,1246189591)],k=[],m=0;80>m;m++)k[m]=a();b=b.SHA512=c.extend({_doReset:function(){this._hash=new l.init([new f.init(1779033703,4089235720),new f.init(3144134277,2227873595),new f.init(1013904242,4271175723),new f.init(2773480762,1595750129),new f.init(1359893119,2917565137),new f.init(2600822924,725511199),new f.init(528734635,4215389547),new f.init(1541459225,327033209)])},_doProcessBlock:function(a,b){for(var c=this._hash.words,
f=c[0],j=c[1],d=c[2],l=c[3],e=c[4],m=c[5],N=c[6],c=c[7],aa=f.high,O=f.low,ba=j.high,P=j.low,ca=d.high,Q=d.low,da=l.high,R=l.low,ea=e.high,S=e.low,fa=m.high,T=m.low,ga=N.high,U=N.low,ha=c.high,V=c.low,r=aa,n=O,G=ba,E=P,H=ca,F=Q,Y=da,I=R,s=ea,p=S,W=fa,J=T,X=ga,K=U,Z=ha,L=V,t=0;80>t;t++){var A=k[t];if(16>t)var q=A.high=a[b+2*t]|0,g=A.low=a[b+2*t+1]|0;else{var q=k[t-15],g=q.high,v=q.low,q=(g>>>1|v<<31)^(g>>>8|v<<24)^g>>>7,v=(v>>>1|g<<31)^(v>>>8|g<<24)^(v>>>7|g<<25),C=k[t-2],g=C.high,h=C.low,C=(g>>>19|
h<<13)^(g<<3|h>>>29)^g>>>6,h=(h>>>19|g<<13)^(h<<3|g>>>29)^(h>>>6|g<<26),g=k[t-7],$=g.high,B=k[t-16],w=B.high,B=B.low,g=v+g.low,q=q+$+(g>>>0<v>>>0?1:0),g=g+h,q=q+C+(g>>>0<h>>>0?1:0),g=g+B,q=q+w+(g>>>0<B>>>0?1:0);A.high=q;A.low=g}var $=s&W^~s&X,B=p&J^~p&K,A=r&G^r&H^G&H,ka=n&E^n&F^E&F,v=(r>>>28|n<<4)^(r<<30|n>>>2)^(r<<25|n>>>7),C=(n>>>28|r<<4)^(n<<30|r>>>2)^(n<<25|r>>>7),h=u[t],la=h.high,ia=h.low,h=L+((p>>>14|s<<18)^(p>>>18|s<<14)^(p<<23|s>>>9)),w=Z+((s>>>14|p<<18)^(s>>>18|p<<14)^(s<<23|p>>>9))+(h>>>
0<L>>>0?1:0),h=h+B,w=w+$+(h>>>0<B>>>0?1:0),h=h+ia,w=w+la+(h>>>0<ia>>>0?1:0),h=h+g,w=w+q+(h>>>0<g>>>0?1:0),g=C+ka,A=v+A+(g>>>0<C>>>0?1:0),Z=X,L=K,X=W,K=J,W=s,J=p,p=I+h|0,s=Y+w+(p>>>0<I>>>0?1:0)|0,Y=H,I=F,H=G,F=E,G=r,E=n,n=h+g|0,r=w+A+(n>>>0<h>>>0?1:0)|0}O=f.low=O+n;f.high=aa+r+(O>>>0<n>>>0?1:0);P=j.low=P+E;j.high=ba+G+(P>>>0<E>>>0?1:0);Q=d.low=Q+F;d.high=ca+H+(Q>>>0<F>>>0?1:0);R=l.low=R+I;l.high=da+Y+(R>>>0<I>>>0?1:0);S=e.low=S+p;e.high=ea+s+(S>>>0<p>>>0?1:0);T=m.low=T+J;m.high=fa+W+(T>>>0<J>>>0?1:
0);U=N.low=U+K;N.high=ga+X+(U>>>0<K>>>0?1:0);V=c.low=V+L;c.high=ha+Z+(V>>>0<L>>>0?1:0)},_doFinalize:function(){var a=this._data,b=a.words,c=8*this._nDataBytes,f=8*a.sigBytes;b[f>>>5]|=128<<24-f%32;b[(f+128>>>10<<5)+30]=Math.floor(c/4294967296);b[(f+128>>>10<<5)+31]=c;a.sigBytes=4*b.length;this._process();return this._hash.toX32()},clone:function(){var a=c.clone.call(this);a._hash=this._hash.clone();return a},blockSize:32});j.SHA512=c._createHelper(b);j.HmacSHA512=c._createHmacHelper(b)})();
(function(){var a=CryptoJS,j=a.enc.Utf8;a.algo.HMAC=a.lib.Base.extend({init:function(a,b){a=this._hasher=new a.init;"string"==typeof b&&(b=j.parse(b));var f=a.blockSize,l=4*f;b.sigBytes>l&&(b=a.finalize(b));b.clamp();for(var u=this._oKey=b.clone(),k=this._iKey=b.clone(),m=u.words,y=k.words,z=0;z<f;z++)m[z]^=1549556828,y[z]^=909522486;u.sigBytes=k.sigBytes=l;this.reset()},reset:function(){var a=this._hasher;a.reset();a.update(this._iKey)},update:function(a){this._hasher.update(a);return this},finalize:function(a){var b=
this._hasher;a=b.finalize(a);b.reset();return b.finalize(this._oKey.clone().concat(a))}})})();
;/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
var CryptoJS=CryptoJS||function(g,j){var e={},d=e.lib={},m=function(){},n=d.Base={extend:function(a){m.prototype=this;var c=new m;a&&c.mixIn(a);c.hasOwnProperty("init")||(c.init=function(){c.$super.init.apply(this,arguments)});c.init.prototype=c;c.$super=this;return c},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var c in a)a.hasOwnProperty(c)&&(this[c]=a[c]);a.hasOwnProperty("toString")&&(this.toString=a.toString)},clone:function(){return this.init.prototype.extend(this)}},
q=d.WordArray=n.extend({init:function(a,c){a=this.words=a||[];this.sigBytes=c!=j?c:4*a.length},toString:function(a){return(a||l).stringify(this)},concat:function(a){var c=this.words,p=a.words,f=this.sigBytes;a=a.sigBytes;this.clamp();if(f%4)for(var b=0;b<a;b++)c[f+b>>>2]|=(p[b>>>2]>>>24-8*(b%4)&255)<<24-8*((f+b)%4);else if(65535<p.length)for(b=0;b<a;b+=4)c[f+b>>>2]=p[b>>>2];else c.push.apply(c,p);this.sigBytes+=a;return this},clamp:function(){var a=this.words,c=this.sigBytes;a[c>>>2]&=4294967295<<
32-8*(c%4);a.length=g.ceil(c/4)},clone:function(){var a=n.clone.call(this);a.words=this.words.slice(0);return a},random:function(a){for(var c=[],b=0;b<a;b+=4)c.push(4294967296*g.random()|0);return new q.init(c,a)}}),b=e.enc={},l=b.Hex={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],f=0;f<a;f++){var d=c[f>>>2]>>>24-8*(f%4)&255;b.push((d>>>4).toString(16));b.push((d&15).toString(16))}return b.join("")},parse:function(a){for(var c=a.length,b=[],f=0;f<c;f+=2)b[f>>>3]|=parseInt(a.substr(f,
2),16)<<24-4*(f%8);return new q.init(b,c/2)}},k=b.Latin1={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],f=0;f<a;f++)b.push(String.fromCharCode(c[f>>>2]>>>24-8*(f%4)&255));return b.join("")},parse:function(a){for(var c=a.length,b=[],f=0;f<c;f++)b[f>>>2]|=(a.charCodeAt(f)&255)<<24-8*(f%4);return new q.init(b,c)}},h=b.Utf8={stringify:function(a){try{return decodeURIComponent(escape(k.stringify(a)))}catch(b){throw Error("Malformed UTF-8 data");}},parse:function(a){return k.parse(unescape(encodeURIComponent(a)))}},
u=d.BufferedBlockAlgorithm=n.extend({reset:function(){this._data=new q.init;this._nDataBytes=0},_append:function(a){"string"==typeof a&&(a=h.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(a){var b=this._data,d=b.words,f=b.sigBytes,l=this.blockSize,e=f/(4*l),e=a?g.ceil(e):g.max((e|0)-this._minBufferSize,0);a=e*l;f=g.min(4*a,f);if(a){for(var h=0;h<a;h+=l)this._doProcessBlock(d,h);h=d.splice(0,a);b.sigBytes-=f}return new q.init(h,f)},clone:function(){var a=n.clone.call(this);
a._data=this._data.clone();return a},_minBufferSize:0});d.Hasher=u.extend({cfg:n.extend(),init:function(a){this.cfg=this.cfg.extend(a);this.reset()},reset:function(){u.reset.call(this);this._doReset()},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);return this._doFinalize()},blockSize:16,_createHelper:function(a){return function(b,d){return(new a.init(d)).finalize(b)}},_createHmacHelper:function(a){return function(b,d){return(new w.HMAC.init(a,
d)).finalize(b)}}});var w=e.algo={};return e}(Math);
(function(){var g=CryptoJS,j=g.lib,e=j.WordArray,d=j.Hasher,m=[],j=g.algo.SHA1=d.extend({_doReset:function(){this._hash=new e.init([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(d,e){for(var b=this._hash.words,l=b[0],k=b[1],h=b[2],g=b[3],j=b[4],a=0;80>a;a++){if(16>a)m[a]=d[e+a]|0;else{var c=m[a-3]^m[a-8]^m[a-14]^m[a-16];m[a]=c<<1|c>>>31}c=(l<<5|l>>>27)+j+m[a];c=20>a?c+((k&h|~k&g)+1518500249):40>a?c+((k^h^g)+1859775393):60>a?c+((k&h|k&g|h&g)-1894007588):c+((k^h^
g)-899497514);j=g;g=h;h=k<<30|k>>>2;k=l;l=c}b[0]=b[0]+l|0;b[1]=b[1]+k|0;b[2]=b[2]+h|0;b[3]=b[3]+g|0;b[4]=b[4]+j|0},_doFinalize:function(){var d=this._data,e=d.words,b=8*this._nDataBytes,l=8*d.sigBytes;e[l>>>5]|=128<<24-l%32;e[(l+64>>>9<<4)+14]=Math.floor(b/4294967296);e[(l+64>>>9<<4)+15]=b;d.sigBytes=4*e.length;this._process();return this._hash},clone:function(){var e=d.clone.call(this);e._hash=this._hash.clone();return e}});g.SHA1=d._createHelper(j);g.HmacSHA1=d._createHmacHelper(j)})();
(function(){var g=CryptoJS,j=g.enc.Utf8;g.algo.HMAC=g.lib.Base.extend({init:function(e,d){e=this._hasher=new e.init;"string"==typeof d&&(d=j.parse(d));var g=e.blockSize,n=4*g;d.sigBytes>n&&(d=e.finalize(d));d.clamp();for(var q=this._oKey=d.clone(),b=this._iKey=d.clone(),l=q.words,k=b.words,h=0;h<g;h++)l[h]^=1549556828,k[h]^=909522486;q.sigBytes=b.sigBytes=n;this.reset()},reset:function(){var e=this._hasher;e.reset();e.update(this._iKey)},update:function(e){this._hasher.update(e);return this},finalize:function(e){var d=
this._hasher;e=d.finalize(e);d.reset();return d.finalize(this._oKey.clone().concat(e))}})})();
(function(){var g=CryptoJS,j=g.lib,e=j.Base,d=j.WordArray,j=g.algo,m=j.HMAC,n=j.PBKDF2=e.extend({cfg:e.extend({keySize:4,hasher:j.SHA1,iterations:1}),init:function(d){this.cfg=this.cfg.extend(d)},compute:function(e,b){for(var g=this.cfg,k=m.create(g.hasher,e),h=d.create(),j=d.create([1]),n=h.words,a=j.words,c=g.keySize,g=g.iterations;n.length<c;){var p=k.update(b).finalize(j);k.reset();for(var f=p.words,v=f.length,s=p,t=1;t<g;t++){s=k.finalize(s);k.reset();for(var x=s.words,r=0;r<v;r++)f[r]^=x[r]}h.concat(p);
a[0]++}h.sigBytes=4*c;return h}});g.PBKDF2=function(d,b,e){return n.create(e).compute(d,b)}})();
;/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
var CryptoJS=CryptoJS||function(e,m){var p={},j=p.lib={},l=function(){},f=j.Base={extend:function(a){l.prototype=this;var c=new l;a&&c.mixIn(a);c.hasOwnProperty("init")||(c.init=function(){c.$super.init.apply(this,arguments)});c.init.prototype=c;c.$super=this;return c},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var c in a)a.hasOwnProperty(c)&&(this[c]=a[c]);a.hasOwnProperty("toString")&&(this.toString=a.toString)},clone:function(){return this.init.prototype.extend(this)}},
n=j.WordArray=f.extend({init:function(a,c){a=this.words=a||[];this.sigBytes=c!=m?c:4*a.length},toString:function(a){return(a||h).stringify(this)},concat:function(a){var c=this.words,q=a.words,d=this.sigBytes;a=a.sigBytes;this.clamp();if(d%4)for(var b=0;b<a;b++)c[d+b>>>2]|=(q[b>>>2]>>>24-8*(b%4)&255)<<24-8*((d+b)%4);else if(65535<q.length)for(b=0;b<a;b+=4)c[d+b>>>2]=q[b>>>2];else c.push.apply(c,q);this.sigBytes+=a;return this},clamp:function(){var a=this.words,c=this.sigBytes;a[c>>>2]&=4294967295<<
32-8*(c%4);a.length=e.ceil(c/4)},clone:function(){var a=f.clone.call(this);a.words=this.words.slice(0);return a},random:function(a){for(var c=[],b=0;b<a;b+=4)c.push(4294967296*e.random()|0);return new n.init(c,a)}}),b=p.enc={},h=b.Hex={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],d=0;d<a;d++){var f=c[d>>>2]>>>24-8*(d%4)&255;b.push((f>>>4).toString(16));b.push((f&15).toString(16))}return b.join("")},parse:function(a){for(var c=a.length,b=[],d=0;d<c;d+=2)b[d>>>3]|=parseInt(a.substr(d,
2),16)<<24-4*(d%8);return new n.init(b,c/2)}},g=b.Latin1={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],d=0;d<a;d++)b.push(String.fromCharCode(c[d>>>2]>>>24-8*(d%4)&255));return b.join("")},parse:function(a){for(var c=a.length,b=[],d=0;d<c;d++)b[d>>>2]|=(a.charCodeAt(d)&255)<<24-8*(d%4);return new n.init(b,c)}},r=b.Utf8={stringify:function(a){try{return decodeURIComponent(escape(g.stringify(a)))}catch(c){throw Error("Malformed UTF-8 data");}},parse:function(a){return g.parse(unescape(encodeURIComponent(a)))}},
k=j.BufferedBlockAlgorithm=f.extend({reset:function(){this._data=new n.init;this._nDataBytes=0},_append:function(a){"string"==typeof a&&(a=r.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(a){var c=this._data,b=c.words,d=c.sigBytes,f=this.blockSize,h=d/(4*f),h=a?e.ceil(h):e.max((h|0)-this._minBufferSize,0);a=h*f;d=e.min(4*a,d);if(a){for(var g=0;g<a;g+=f)this._doProcessBlock(b,g);g=b.splice(0,a);c.sigBytes-=d}return new n.init(g,d)},clone:function(){var a=f.clone.call(this);
a._data=this._data.clone();return a},_minBufferSize:0});j.Hasher=k.extend({cfg:f.extend(),init:function(a){this.cfg=this.cfg.extend(a);this.reset()},reset:function(){k.reset.call(this);this._doReset()},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);return this._doFinalize()},blockSize:16,_createHelper:function(a){return function(c,b){return(new a.init(b)).finalize(c)}},_createHmacHelper:function(a){return function(b,f){return(new s.HMAC.init(a,
f)).finalize(b)}}});var s=p.algo={};return p}(Math);
(function(){var e=CryptoJS,m=e.lib,p=m.WordArray,j=m.Hasher,l=[],m=e.algo.SHA1=j.extend({_doReset:function(){this._hash=new p.init([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(f,n){for(var b=this._hash.words,h=b[0],g=b[1],e=b[2],k=b[3],j=b[4],a=0;80>a;a++){if(16>a)l[a]=f[n+a]|0;else{var c=l[a-3]^l[a-8]^l[a-14]^l[a-16];l[a]=c<<1|c>>>31}c=(h<<5|h>>>27)+j+l[a];c=20>a?c+((g&e|~g&k)+1518500249):40>a?c+((g^e^k)+1859775393):60>a?c+((g&e|g&k|e&k)-1894007588):c+((g^e^
k)-899497514);j=k;k=e;e=g<<30|g>>>2;g=h;h=c}b[0]=b[0]+h|0;b[1]=b[1]+g|0;b[2]=b[2]+e|0;b[3]=b[3]+k|0;b[4]=b[4]+j|0},_doFinalize:function(){var f=this._data,e=f.words,b=8*this._nDataBytes,h=8*f.sigBytes;e[h>>>5]|=128<<24-h%32;e[(h+64>>>9<<4)+14]=Math.floor(b/4294967296);e[(h+64>>>9<<4)+15]=b;f.sigBytes=4*e.length;this._process();return this._hash},clone:function(){var e=j.clone.call(this);e._hash=this._hash.clone();return e}});e.SHA1=j._createHelper(m);e.HmacSHA1=j._createHmacHelper(m)})();
;"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StandardFile = exports.SFItemTransformer = exports.SFCryptoWeb = exports.SFCryptoJS = exports.SFAbstractCrypto = exports.SFItemHistoryEntry = exports.SFItemHistory = exports.SFHistorySession = exports.SFPrivileges = exports.SFPredicate = exports.SFItemParams = exports.SFItem = exports.SFSyncManager = exports.SFStorageManager = exports.SFSingletonManager = exports.SFSessionHistoryManager = exports.SFPrivilegesManager = exports.SFModelManager = exports.SFMigrationManager = exports.SFHttpManager = exports.SFAuthManager = exports.SFAlertManager = void 0;

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var SFAlertManager =
/*#__PURE__*/
function () {
  function SFAlertManager() {
    _classCallCheck(this, SFAlertManager);
  }

  _createClass(SFAlertManager, [{
    key: "alert",
    value: function () {
      var _alert = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee(params) {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                return _context.abrupt("return", new Promise(function (resolve, reject) {
                  window.alert(params.text);
                  resolve();
                }));

              case 1:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      function alert(_x) {
        return _alert.apply(this, arguments);
      }

      return alert;
    }()
  }, {
    key: "confirm",
    value: function () {
      var _confirm = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee2(params) {
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                return _context2.abrupt("return", new Promise(function (resolve, reject) {
                  if (window.confirm(params.text)) {
                    resolve();
                  } else {
                    reject();
                  }
                }));

              case 1:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }));

      function confirm(_x2) {
        return _confirm.apply(this, arguments);
      }

      return confirm;
    }()
  }]);

  return SFAlertManager;
}();

exports.SFAlertManager = SFAlertManager;
;

var SFAuthManager =
/*#__PURE__*/
function () {
  function SFAuthManager(storageManager, httpManager, alertManager, timeout) {
    _classCallCheck(this, SFAuthManager);

    SFAuthManager.DidSignOutEvent = "DidSignOutEvent";
    SFAuthManager.WillSignInEvent = "WillSignInEvent";
    SFAuthManager.DidSignInEvent = "DidSignInEvent";
    this.httpManager = httpManager;
    this.storageManager = storageManager;
    this.alertManager = alertManager || new SFAlertManager();
    this.$timeout = timeout || setTimeout.bind(window);
    this.eventHandlers = [];
  }

  _createClass(SFAuthManager, [{
    key: "addEventHandler",
    value: function addEventHandler(handler) {
      this.eventHandlers.push(handler);
      return handler;
    }
  }, {
    key: "removeEventHandler",
    value: function removeEventHandler(handler) {
      _.pull(this.eventHandlers, handler);
    }
  }, {
    key: "notifyEvent",
    value: function notifyEvent(event, data) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.eventHandlers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var handler = _step.value;
          handler(event, data || {});
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }, {
    key: "saveKeys",
    value: function () {
      var _saveKeys = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee3(keys) {
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                this._keys = keys;
                _context3.next = 3;
                return this.storageManager.setItem("mk", keys.mk);

              case 3:
                _context3.next = 5;
                return this.storageManager.setItem("ak", keys.ak);

              case 5:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function saveKeys(_x3) {
        return _saveKeys.apply(this, arguments);
      }

      return saveKeys;
    }()
  }, {
    key: "signout",
    value: function () {
      var _signout = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee4(clearAllData) {
        var _this = this;

        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                this._keys = null;
                this._authParams = null;

                if (!clearAllData) {
                  _context4.next = 6;
                  break;
                }

                return _context4.abrupt("return", this.storageManager.clearAllData().then(function () {
                  _this.notifyEvent(SFAuthManager.DidSignOutEvent);
                }));

              case 6:
                this.notifyEvent(SFAuthManager.DidSignOutEvent);

              case 7:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function signout(_x4) {
        return _signout.apply(this, arguments);
      }

      return signout;
    }()
  }, {
    key: "keys",
    value: function () {
      var _keys = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee5() {
        var mk;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                if (this._keys) {
                  _context5.next = 11;
                  break;
                }

                _context5.next = 3;
                return this.storageManager.getItem("mk");

              case 3:
                mk = _context5.sent;

                if (mk) {
                  _context5.next = 6;
                  break;
                }

                return _context5.abrupt("return", null);

              case 6:
                _context5.t0 = mk;
                _context5.next = 9;
                return this.storageManager.getItem("ak");

              case 9:
                _context5.t1 = _context5.sent;
                this._keys = {
                  mk: _context5.t0,
                  ak: _context5.t1
                };

              case 11:
                return _context5.abrupt("return", this._keys);

              case 12:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function keys() {
        return _keys.apply(this, arguments);
      }

      return keys;
    }()
  }, {
    key: "getAuthParams",
    value: function () {
      var _getAuthParams = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee6() {
        var data;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                if (this._authParams) {
                  _context6.next = 5;
                  break;
                }

                _context6.next = 3;
                return this.storageManager.getItem("auth_params");

              case 3:
                data = _context6.sent;
                this._authParams = JSON.parse(data);

              case 5:
                if (!(this._authParams && !this._authParams.version)) {
                  _context6.next = 9;
                  break;
                }

                _context6.next = 8;
                return this.defaultProtocolVersion();

              case 8:
                this._authParams.version = _context6.sent;

              case 9:
                return _context6.abrupt("return", this._authParams);

              case 10:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function getAuthParams() {
        return _getAuthParams.apply(this, arguments);
      }

      return getAuthParams;
    }()
  }, {
    key: "defaultProtocolVersion",
    value: function () {
      var _defaultProtocolVersion = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee7() {
        var keys;
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                _context7.next = 2;
                return this.keys();

              case 2:
                keys = _context7.sent;

                if (!(keys && keys.ak)) {
                  _context7.next = 7;
                  break;
                }

                return _context7.abrupt("return", "002");

              case 7:
                return _context7.abrupt("return", "001");

              case 8:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function defaultProtocolVersion() {
        return _defaultProtocolVersion.apply(this, arguments);
      }

      return defaultProtocolVersion;
    }()
  }, {
    key: "protocolVersion",
    value: function () {
      var _protocolVersion = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee8() {
        var authParams;
        return regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                _context8.next = 2;
                return this.getAuthParams();

              case 2:
                authParams = _context8.sent;

                if (!(authParams && authParams.version)) {
                  _context8.next = 5;
                  break;
                }

                return _context8.abrupt("return", authParams.version);

              case 5:
                return _context8.abrupt("return", this.defaultProtocolVersion());

              case 6:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function protocolVersion() {
        return _protocolVersion.apply(this, arguments);
      }

      return protocolVersion;
    }()
  }, {
    key: "getAuthParamsForEmail",
    value: function () {
      var _getAuthParamsForEmail = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee9(url, email, extraParams) {
        var _this2 = this;

        var params;
        return regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                params = _.merge({
                  email: email
                }, extraParams);
                params['api'] = SFHttpManager.getApiVersion();
                return _context9.abrupt("return", new Promise(function (resolve, reject) {
                  var requestUrl = url + "/auth/params";

                  _this2.httpManager.getAbsolute(requestUrl, params, function (response) {
                    resolve(response);
                  }, function (response) {
                    console.error("Error getting auth params", response);

                    if (_typeof(response) !== 'object') {
                      response = {
                        error: {
                          message: "A server error occurred while trying to sign in. Please try again."
                        }
                      };
                    }

                    resolve(response);
                  });
                }));

              case 3:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee9);
      }));

      function getAuthParamsForEmail(_x5, _x6, _x7) {
        return _getAuthParamsForEmail.apply(this, arguments);
      }

      return getAuthParamsForEmail;
    }()
  }, {
    key: "lock",
    value: function lock() {
      this.locked = true;
    }
  }, {
    key: "unlock",
    value: function unlock() {
      this.locked = false;
    }
  }, {
    key: "isLocked",
    value: function isLocked() {
      return this.locked == true;
    }
  }, {
    key: "unlockAndResolve",
    value: function unlockAndResolve(resolve, param) {
      this.unlock();
      resolve(param);
    }
  }, {
    key: "login",
    value: function () {
      var _login = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee12(url, email, password, strictSignin, extraParams) {
        var _this3 = this;

        return regeneratorRuntime.wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                return _context12.abrupt("return", new Promise(
                /*#__PURE__*/
                function () {
                  var _ref = _asyncToGenerator(
                  /*#__PURE__*/
                  regeneratorRuntime.mark(function _callee11(resolve, reject) {
                    var existingKeys, authParams, message, _message, abort, _message2, minimum, _message3, latestVersion, _message4, keys, requestUrl, params;

                    return regeneratorRuntime.wrap(function _callee11$(_context11) {
                      while (1) {
                        switch (_context11.prev = _context11.next) {
                          case 0:
                            _context11.next = 2;
                            return _this3.keys();

                          case 2:
                            existingKeys = _context11.sent;

                            if (!(existingKeys != null)) {
                              _context11.next = 6;
                              break;
                            }

                            resolve({
                              error: {
                                message: "Cannot log in because already signed in."
                              }
                            });
                            return _context11.abrupt("return");

                          case 6:
                            if (!_this3.isLocked()) {
                              _context11.next = 9;
                              break;
                            }

                            resolve({
                              error: {
                                message: "Login already in progress."
                              }
                            });
                            return _context11.abrupt("return");

                          case 9:
                            _this3.lock();

                            _this3.notifyEvent(SFAuthManager.WillSignInEvent);

                            _context11.next = 13;
                            return _this3.getAuthParamsForEmail(url, email, extraParams);

                          case 13:
                            authParams = _context11.sent;
                            // SF3 requires a unique identifier in the auth params
                            authParams.identifier = email;

                            if (!authParams.error) {
                              _context11.next = 18;
                              break;
                            }

                            _this3.unlockAndResolve(resolve, authParams);

                            return _context11.abrupt("return");

                          case 18:
                            if (!(!authParams || !authParams.pw_cost)) {
                              _context11.next = 21;
                              break;
                            }

                            _this3.unlockAndResolve(resolve, {
                              error: {
                                message: "Invalid email or password."
                              }
                            });

                            return _context11.abrupt("return");

                          case 21:
                            if (SFJS.supportedVersions().includes(authParams.version)) {
                              _context11.next = 25;
                              break;
                            }

                            if (SFJS.isVersionNewerThanLibraryVersion(authParams.version)) {
                              // The user has a new account type, but is signing in to an older client.
                              message = "This version of the application does not support your newer account type. Please upgrade to the latest version of Standard Notes to sign in.";
                            } else {
                              // The user has a very old account type, which is no longer supported by this client
                              message = "The protocol version associated with your account is outdated and no longer supported by this application. Please visit standardnotes.org/help/security for more information.";
                            }

                            _this3.unlockAndResolve(resolve, {
                              error: {
                                message: message
                              }
                            });

                            return _context11.abrupt("return");

                          case 25:
                            if (!SFJS.isProtocolVersionOutdated(authParams.version)) {
                              _context11.next = 32;
                              break;
                            }

                            _message = "The encryption version for your account, ".concat(authParams.version, ", is outdated and requires upgrade. You may proceed with login, but are advised to perform a security update using the web or desktop application. Please visit standardnotes.org/help/security for more information.");
                            abort = false;
                            _context11.next = 30;
                            return _this3.alertManager.confirm({
                              title: "Update Needed",
                              text: _message,
                              confirmButtonText: "Sign In"
                            })["catch"](function () {
                              _this3.unlockAndResolve(resolve, {
                                error: {}
                              });

                              abort = true;
                            });

                          case 30:
                            if (!abort) {
                              _context11.next = 32;
                              break;
                            }

                            return _context11.abrupt("return");

                          case 32:
                            if (SFJS.supportsPasswordDerivationCost(authParams.pw_cost)) {
                              _context11.next = 36;
                              break;
                            }

                            _message2 = "Your account was created on a platform with higher security capabilities than this browser supports. " + "If we attempted to generate your login keys here, it would take hours. " + "Please use a browser with more up to date security capabilities, like Google Chrome or Firefox, to log in.";

                            _this3.unlockAndResolve(resolve, {
                              error: {
                                message: _message2
                              }
                            });

                            return _context11.abrupt("return");

                          case 36:
                            minimum = SFJS.costMinimumForVersion(authParams.version);

                            if (!(authParams.pw_cost < minimum)) {
                              _context11.next = 41;
                              break;
                            }

                            _message3 = "Unable to login due to insecure password parameters. Please visit standardnotes.org/help/security for more information.";

                            _this3.unlockAndResolve(resolve, {
                              error: {
                                message: _message3
                              }
                            });

                            return _context11.abrupt("return");

                          case 41:
                            if (!strictSignin) {
                              _context11.next = 47;
                              break;
                            }

                            // Refuse sign in if authParams.version is anything but the latest version
                            latestVersion = SFJS.version();

                            if (!(authParams.version !== latestVersion)) {
                              _context11.next = 47;
                              break;
                            }

                            _message4 = "Strict sign in refused server sign in parameters. The latest security version is ".concat(latestVersion, ", but your account is reported to have version ").concat(authParams.version, ". If you'd like to proceed with sign in anyway, please disable strict sign in and try again.");

                            _this3.unlockAndResolve(resolve, {
                              error: {
                                message: _message4
                              }
                            });

                            return _context11.abrupt("return");

                          case 47:
                            _context11.next = 49;
                            return SFJS.crypto.computeEncryptionKeysForUser(password, authParams);

                          case 49:
                            keys = _context11.sent;
                            requestUrl = url + "/auth/sign_in";
                            params = _.merge({
                              password: keys.pw,
                              email: email
                            }, extraParams);
                            params['api'] = SFHttpManager.getApiVersion();

                            _this3.httpManager.postAbsolute(requestUrl, params,
                            /*#__PURE__*/
                            function () {
                              var _ref2 = _asyncToGenerator(
                              /*#__PURE__*/
                              regeneratorRuntime.mark(function _callee10(response) {
                                return regeneratorRuntime.wrap(function _callee10$(_context10) {
                                  while (1) {
                                    switch (_context10.prev = _context10.next) {
                                      case 0:
                                        _context10.next = 2;
                                        return _this3.handleAuthResponse(response, email, url, authParams, keys);

                                      case 2:
                                        _this3.notifyEvent(SFAuthManager.DidSignInEvent);

                                        _this3.$timeout(function () {
                                          return _this3.unlockAndResolve(resolve, response);
                                        });

                                      case 4:
                                      case "end":
                                        return _context10.stop();
                                    }
                                  }
                                }, _callee10);
                              }));

                              return function (_x15) {
                                return _ref2.apply(this, arguments);
                              };
                            }(), function (response) {
                              console.error("Error logging in", response);

                              if (_typeof(response) !== 'object') {
                                response = {
                                  error: {
                                    message: "A server error occurred while trying to sign in. Please try again."
                                  }
                                };
                              }

                              _this3.$timeout(function () {
                                return _this3.unlockAndResolve(resolve, response);
                              });
                            });

                          case 54:
                          case "end":
                            return _context11.stop();
                        }
                      }
                    }, _callee11);
                  }));

                  return function (_x13, _x14) {
                    return _ref.apply(this, arguments);
                  };
                }()));

              case 1:
              case "end":
                return _context12.stop();
            }
          }
        }, _callee12);
      }));

      function login(_x8, _x9, _x10, _x11, _x12) {
        return _login.apply(this, arguments);
      }

      return login;
    }()
  }, {
    key: "register",
    value: function register(url, email, password) {
      var _this4 = this;

      return new Promise(
      /*#__PURE__*/
      function () {
        var _ref3 = _asyncToGenerator(
        /*#__PURE__*/
        regeneratorRuntime.mark(function _callee14(resolve, reject) {
          var MinPasswordLength, message, results, keys, authParams, requestUrl, params;
          return regeneratorRuntime.wrap(function _callee14$(_context14) {
            while (1) {
              switch (_context14.prev = _context14.next) {
                case 0:
                  if (!_this4.isLocked()) {
                    _context14.next = 3;
                    break;
                  }

                  resolve({
                    error: {
                      message: "Register already in progress."
                    }
                  });
                  return _context14.abrupt("return");

                case 3:
                  MinPasswordLength = 8;

                  if (!(password.length < MinPasswordLength)) {
                    _context14.next = 8;
                    break;
                  }

                  message = "Your password must be at least ".concat(MinPasswordLength, " characters in length. For your security, please choose a longer password or, ideally, a passphrase, and try again.");
                  resolve({
                    error: {
                      message: message
                    }
                  });
                  return _context14.abrupt("return");

                case 8:
                  _this4.lock();

                  _context14.next = 11;
                  return SFJS.crypto.generateInitialKeysAndAuthParamsForUser(email, password);

                case 11:
                  results = _context14.sent;
                  keys = results.keys;
                  authParams = results.authParams;
                  requestUrl = url + "/auth";
                  params = _.merge({
                    password: keys.pw,
                    email: email
                  }, authParams);
                  params['api'] = SFHttpManager.getApiVersion();

                  _this4.httpManager.postAbsolute(requestUrl, params,
                  /*#__PURE__*/
                  function () {
                    var _ref4 = _asyncToGenerator(
                    /*#__PURE__*/
                    regeneratorRuntime.mark(function _callee13(response) {
                      return regeneratorRuntime.wrap(function _callee13$(_context13) {
                        while (1) {
                          switch (_context13.prev = _context13.next) {
                            case 0:
                              _context13.next = 2;
                              return _this4.handleAuthResponse(response, email, url, authParams, keys);

                            case 2:
                              _this4.unlockAndResolve(resolve, response);

                            case 3:
                            case "end":
                              return _context13.stop();
                          }
                        }
                      }, _callee13);
                    }));

                    return function (_x18) {
                      return _ref4.apply(this, arguments);
                    };
                  }(), function (response) {
                    console.error("Registration error", response);

                    if (_typeof(response) !== 'object') {
                      response = {
                        error: {
                          message: "A server error occurred while trying to register. Please try again."
                        }
                      };
                    }

                    _this4.unlockAndResolve(resolve, response);
                  });

                case 18:
                case "end":
                  return _context14.stop();
              }
            }
          }, _callee14);
        }));

        return function (_x16, _x17) {
          return _ref3.apply(this, arguments);
        };
      }());
    }
  }, {
    key: "changePassword",
    value: function () {
      var _changePassword = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee17(url, email, current_server_pw, newKeys, newAuthParams) {
        var _this5 = this;

        return regeneratorRuntime.wrap(function _callee17$(_context17) {
          while (1) {
            switch (_context17.prev = _context17.next) {
              case 0:
                return _context17.abrupt("return", new Promise(
                /*#__PURE__*/
                function () {
                  var _ref5 = _asyncToGenerator(
                  /*#__PURE__*/
                  regeneratorRuntime.mark(function _callee16(resolve, reject) {
                    var newServerPw, requestUrl, params;
                    return regeneratorRuntime.wrap(function _callee16$(_context16) {
                      while (1) {
                        switch (_context16.prev = _context16.next) {
                          case 0:
                            if (!_this5.isLocked()) {
                              _context16.next = 3;
                              break;
                            }

                            resolve({
                              error: {
                                message: "Change password already in progress."
                              }
                            });
                            return _context16.abrupt("return");

                          case 3:
                            _this5.lock();

                            newServerPw = newKeys.pw;
                            requestUrl = url + "/auth/change_pw";
                            params = _.merge({
                              new_password: newServerPw,
                              current_password: current_server_pw
                            }, newAuthParams);
                            params['api'] = SFHttpManager.getApiVersion();

                            _this5.httpManager.postAuthenticatedAbsolute(requestUrl, params,
                            /*#__PURE__*/
                            function () {
                              var _ref6 = _asyncToGenerator(
                              /*#__PURE__*/
                              regeneratorRuntime.mark(function _callee15(response) {
                                return regeneratorRuntime.wrap(function _callee15$(_context15) {
                                  while (1) {
                                    switch (_context15.prev = _context15.next) {
                                      case 0:
                                        _context15.next = 2;
                                        return _this5.handleAuthResponse(response, email, null, newAuthParams, newKeys);

                                      case 2:
                                        _this5.unlockAndResolve(resolve, response);

                                      case 3:
                                      case "end":
                                        return _context15.stop();
                                    }
                                  }
                                }, _callee15);
                              }));

                              return function (_x26) {
                                return _ref6.apply(this, arguments);
                              };
                            }(), function (response) {
                              if (_typeof(response) !== 'object') {
                                response = {
                                  error: {
                                    message: "Something went wrong while changing your password. Your password was not changed. Please try again."
                                  }
                                };
                              }

                              _this5.unlockAndResolve(resolve, response);
                            });

                          case 9:
                          case "end":
                            return _context16.stop();
                        }
                      }
                    }, _callee16);
                  }));

                  return function (_x24, _x25) {
                    return _ref5.apply(this, arguments);
                  };
                }()));

              case 1:
              case "end":
                return _context17.stop();
            }
          }
        }, _callee17);
      }));

      function changePassword(_x19, _x20, _x21, _x22, _x23) {
        return _changePassword.apply(this, arguments);
      }

      return changePassword;
    }()
  }, {
    key: "handleAuthResponse",
    value: function () {
      var _handleAuthResponse = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee18(response, email, url, authParams, keys) {
        return regeneratorRuntime.wrap(function _callee18$(_context18) {
          while (1) {
            switch (_context18.prev = _context18.next) {
              case 0:
                if (!url) {
                  _context18.next = 3;
                  break;
                }

                _context18.next = 3;
                return this.storageManager.setItem("server", url);

              case 3:
                this._authParams = authParams;
                _context18.next = 6;
                return this.storageManager.setItem("auth_params", JSON.stringify(authParams));

              case 6:
                _context18.next = 8;
                return this.storageManager.setItem("jwt", response.token);

              case 8:
                return _context18.abrupt("return", this.saveKeys(keys));

              case 9:
              case "end":
                return _context18.stop();
            }
          }
        }, _callee18, this);
      }));

      function handleAuthResponse(_x27, _x28, _x29, _x30, _x31) {
        return _handleAuthResponse.apply(this, arguments);
      }

      return handleAuthResponse;
    }()
  }]);

  return SFAuthManager;
}();

exports.SFAuthManager = SFAuthManager;
;
var globalScope = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : null;

var SFHttpManager =
/*#__PURE__*/
function () {
  _createClass(SFHttpManager, null, [{
    key: "getApiVersion",
    value: function getApiVersion() {
      // Applicable only to Standard File requests. Requests to external acitons should not use this.
      // syncManager and authManager must include this API version as part of its request params.
      return "20190520";
    }
  }]);

  function SFHttpManager(timeout, apiVersion) {
    _classCallCheck(this, SFHttpManager);

    // calling callbacks in a $timeout allows UI to update
    this.$timeout = timeout || setTimeout.bind(globalScope);
  }

  _createClass(SFHttpManager, [{
    key: "setJWTRequestHandler",
    value: function setJWTRequestHandler(handler) {
      this.jwtRequestHandler = handler;
    }
  }, {
    key: "setAuthHeadersForRequest",
    value: function () {
      var _setAuthHeadersForRequest = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee19(request) {
        var token;
        return regeneratorRuntime.wrap(function _callee19$(_context19) {
          while (1) {
            switch (_context19.prev = _context19.next) {
              case 0:
                _context19.next = 2;
                return this.jwtRequestHandler();

              case 2:
                token = _context19.sent;

                if (token) {
                  request.setRequestHeader('Authorization', 'Bearer ' + token);
                }

              case 4:
              case "end":
                return _context19.stop();
            }
          }
        }, _callee19, this);
      }));

      function setAuthHeadersForRequest(_x32) {
        return _setAuthHeadersForRequest.apply(this, arguments);
      }

      return setAuthHeadersForRequest;
    }()
  }, {
    key: "postAbsolute",
    value: function () {
      var _postAbsolute = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee20(url, params, onsuccess, onerror) {
        return regeneratorRuntime.wrap(function _callee20$(_context20) {
          while (1) {
            switch (_context20.prev = _context20.next) {
              case 0:
                return _context20.abrupt("return", this.httpRequest("post", url, params, onsuccess, onerror));

              case 1:
              case "end":
                return _context20.stop();
            }
          }
        }, _callee20, this);
      }));

      function postAbsolute(_x33, _x34, _x35, _x36) {
        return _postAbsolute.apply(this, arguments);
      }

      return postAbsolute;
    }()
  }, {
    key: "postAuthenticatedAbsolute",
    value: function () {
      var _postAuthenticatedAbsolute = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee21(url, params, onsuccess, onerror) {
        return regeneratorRuntime.wrap(function _callee21$(_context21) {
          while (1) {
            switch (_context21.prev = _context21.next) {
              case 0:
                return _context21.abrupt("return", this.httpRequest("post", url, params, onsuccess, onerror, true));

              case 1:
              case "end":
                return _context21.stop();
            }
          }
        }, _callee21, this);
      }));

      function postAuthenticatedAbsolute(_x37, _x38, _x39, _x40) {
        return _postAuthenticatedAbsolute.apply(this, arguments);
      }

      return postAuthenticatedAbsolute;
    }()
  }, {
    key: "patchAbsolute",
    value: function () {
      var _patchAbsolute = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee22(url, params, onsuccess, onerror) {
        return regeneratorRuntime.wrap(function _callee22$(_context22) {
          while (1) {
            switch (_context22.prev = _context22.next) {
              case 0:
                return _context22.abrupt("return", this.httpRequest("patch", url, params, onsuccess, onerror));

              case 1:
              case "end":
                return _context22.stop();
            }
          }
        }, _callee22, this);
      }));

      function patchAbsolute(_x41, _x42, _x43, _x44) {
        return _patchAbsolute.apply(this, arguments);
      }

      return patchAbsolute;
    }()
  }, {
    key: "getAbsolute",
    value: function () {
      var _getAbsolute = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee23(url, params, onsuccess, onerror) {
        return regeneratorRuntime.wrap(function _callee23$(_context23) {
          while (1) {
            switch (_context23.prev = _context23.next) {
              case 0:
                return _context23.abrupt("return", this.httpRequest("get", url, params, onsuccess, onerror));

              case 1:
              case "end":
                return _context23.stop();
            }
          }
        }, _callee23, this);
      }));

      function getAbsolute(_x45, _x46, _x47, _x48) {
        return _getAbsolute.apply(this, arguments);
      }

      return getAbsolute;
    }()
  }, {
    key: "httpRequest",
    value: function () {
      var _httpRequest = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee25(verb, url, params, onsuccess, onerror) {
        var _this6 = this;

        var authenticated,
            _args25 = arguments;
        return regeneratorRuntime.wrap(function _callee25$(_context25) {
          while (1) {
            switch (_context25.prev = _context25.next) {
              case 0:
                authenticated = _args25.length > 5 && _args25[5] !== undefined ? _args25[5] : false;
                return _context25.abrupt("return", new Promise(
                /*#__PURE__*/
                function () {
                  var _ref7 = _asyncToGenerator(
                  /*#__PURE__*/
                  regeneratorRuntime.mark(function _callee24(resolve, reject) {
                    var xmlhttp;
                    return regeneratorRuntime.wrap(function _callee24$(_context24) {
                      while (1) {
                        switch (_context24.prev = _context24.next) {
                          case 0:
                            xmlhttp = new XMLHttpRequest();

                            xmlhttp.onreadystatechange = function () {
                              if (xmlhttp.readyState == 4) {
                                var response = xmlhttp.responseText;

                                if (response) {
                                  try {
                                    response = JSON.parse(response);
                                  } catch (e) {}
                                }

                                if (xmlhttp.status >= 200 && xmlhttp.status <= 299) {
                                  _this6.$timeout(function () {
                                    onsuccess(response);
                                    resolve(response);
                                  });
                                } else {
                                  console.error("Request error:", response);

                                  _this6.$timeout(function () {
                                    onerror(response, xmlhttp.status);
                                    reject(response);
                                  });
                                }
                              }
                            };

                            if (verb == "get" && Object.keys(params).length > 0) {
                              url = _this6.urlForUrlAndParams(url, params);
                            }

                            xmlhttp.open(verb, url, true);
                            xmlhttp.setRequestHeader('Content-type', 'application/json');

                            if (!authenticated) {
                              _context24.next = 8;
                              break;
                            }

                            _context24.next = 8;
                            return _this6.setAuthHeadersForRequest(xmlhttp);

                          case 8:
                            if (verb == "post" || verb == "patch") {
                              xmlhttp.send(JSON.stringify(params));
                            } else {
                              xmlhttp.send();
                            }

                          case 9:
                          case "end":
                            return _context24.stop();
                        }
                      }
                    }, _callee24);
                  }));

                  return function (_x54, _x55) {
                    return _ref7.apply(this, arguments);
                  };
                }()));

              case 2:
              case "end":
                return _context25.stop();
            }
          }
        }, _callee25);
      }));

      function httpRequest(_x49, _x50, _x51, _x52, _x53) {
        return _httpRequest.apply(this, arguments);
      }

      return httpRequest;
    }()
  }, {
    key: "urlForUrlAndParams",
    value: function urlForUrlAndParams(url, params) {
      var keyValueString = Object.keys(params).map(function (key) {
        return key + "=" + encodeURIComponent(params[key]);
      }).join("&");

      if (url.includes("?")) {
        return url + "&" + keyValueString;
      } else {
        return url + "?" + keyValueString;
      }
    }
  }]);

  return SFHttpManager;
}();

exports.SFHttpManager = SFHttpManager;
;

var SFMigrationManager =
/*#__PURE__*/
function () {
  function SFMigrationManager(modelManager, syncManager, storageManager, authManager) {
    var _this7 = this;

    _classCallCheck(this, SFMigrationManager);

    this.modelManager = modelManager;
    this.syncManager = syncManager;
    this.storageManager = storageManager;
    this.completionHandlers = [];
    this.loadMigrations(); // The syncManager used to dispatch a param called 'initialSync' in the 'sync:completed' event
    // to let us know of the first sync completion after login.
    // however it was removed as it was deemed to be unreliable (returned wrong value when a single sync request repeats on completion for pagination)
    // We'll now use authManager's events instead

    var didReceiveSignInEvent = false;
    var signInHandler = authManager.addEventHandler(function (event) {
      if (event == SFAuthManager.DidSignInEvent) {
        didReceiveSignInEvent = true;
      }
    });
    this.receivedLocalDataEvent = syncManager.initialDataLoaded();
    this.syncManager.addEventHandler(
    /*#__PURE__*/
    function () {
      var _ref8 = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee26(event, data) {
        var dataLoadedEvent, syncCompleteEvent, completedList, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, migrationName, migration;

        return regeneratorRuntime.wrap(function _callee26$(_context26) {
          while (1) {
            switch (_context26.prev = _context26.next) {
              case 0:
                dataLoadedEvent = event == "local-data-loaded";
                syncCompleteEvent = event == "sync:completed";

                if (!(dataLoadedEvent || syncCompleteEvent)) {
                  _context26.next = 40;
                  break;
                }

                if (dataLoadedEvent) {
                  _this7.receivedLocalDataEvent = true;
                } else if (syncCompleteEvent) {
                  _this7.receivedSyncCompletedEvent = true;
                } // We want to run pending migrations only after local data has been loaded, and a sync has been completed.


                if (!(_this7.receivedLocalDataEvent && _this7.receivedSyncCompletedEvent)) {
                  _context26.next = 40;
                  break;
                }

                if (!didReceiveSignInEvent) {
                  _context26.next = 39;
                  break;
                }

                // Reset our collected state about sign in
                didReceiveSignInEvent = false;
                authManager.removeEventHandler(signInHandler); // If initial online sync, clear any completed migrations that occurred while offline,
                // so they can run again now that we have updated user items. Only clear migrations that
                // don't have `runOnlyOnce` set

                _context26.next = 10;
                return _this7.getCompletedMigrations();

              case 10:
                completedList = _context26.sent.slice();
                _iteratorNormalCompletion2 = true;
                _didIteratorError2 = false;
                _iteratorError2 = undefined;
                _context26.prev = 14;
                _iterator2 = completedList[Symbol.iterator]();

              case 16:
                if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
                  _context26.next = 25;
                  break;
                }

                migrationName = _step2.value;
                _context26.next = 20;
                return _this7.migrationForEncodedName(migrationName);

              case 20:
                migration = _context26.sent;

                if (!migration.runOnlyOnce) {
                  _.pull(_this7._completed, migrationName);
                }

              case 22:
                _iteratorNormalCompletion2 = true;
                _context26.next = 16;
                break;

              case 25:
                _context26.next = 31;
                break;

              case 27:
                _context26.prev = 27;
                _context26.t0 = _context26["catch"](14);
                _didIteratorError2 = true;
                _iteratorError2 = _context26.t0;

              case 31:
                _context26.prev = 31;
                _context26.prev = 32;

                if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
                  _iterator2["return"]();
                }

              case 34:
                _context26.prev = 34;

                if (!_didIteratorError2) {
                  _context26.next = 37;
                  break;
                }

                throw _iteratorError2;

              case 37:
                return _context26.finish(34);

              case 38:
                return _context26.finish(31);

              case 39:
                _this7.runPendingMigrations();

              case 40:
              case "end":
                return _context26.stop();
            }
          }
        }, _callee26, null, [[14, 27, 31, 39], [32,, 34, 38]]);
      }));

      return function (_x56, _x57) {
        return _ref8.apply(this, arguments);
      };
    }());
  }

  _createClass(SFMigrationManager, [{
    key: "addCompletionHandler",
    value: function addCompletionHandler(handler) {
      this.completionHandlers.push(handler);
    }
  }, {
    key: "removeCompletionHandler",
    value: function removeCompletionHandler(handler) {
      _.pull(this.completionHandlers, handler);
    }
  }, {
    key: "migrationForEncodedName",
    value: function () {
      var _migrationForEncodedName = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee27(name) {
        var decoded;
        return regeneratorRuntime.wrap(function _callee27$(_context27) {
          while (1) {
            switch (_context27.prev = _context27.next) {
              case 0:
                _context27.next = 2;
                return this.decode(name);

              case 2:
                decoded = _context27.sent;
                return _context27.abrupt("return", this.migrations.find(function (migration) {
                  return migration.name == decoded;
                }));

              case 4:
              case "end":
                return _context27.stop();
            }
          }
        }, _callee27, this);
      }));

      function migrationForEncodedName(_x58) {
        return _migrationForEncodedName.apply(this, arguments);
      }

      return migrationForEncodedName;
    }()
  }, {
    key: "loadMigrations",
    value: function loadMigrations() {
      this.migrations = this.registeredMigrations();
    }
  }, {
    key: "registeredMigrations",
    value: function registeredMigrations() {// Subclasses should return an array of migrations here.
      // Migrations should have a unique `name`, `content_type`,
      // and `handler`, which is a function that accepts an array of matching items to migration.
    }
  }, {
    key: "runPendingMigrations",
    value: function () {
      var _runPendingMigrations = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee28() {
        var pending, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, migration, _iteratorNormalCompletion4, _didIteratorError4, _iteratorError4, _iterator4, _step4, item, _iteratorNormalCompletion7, _didIteratorError7, _iteratorError7, _iterator7, _step7, _iteratorNormalCompletion5, _didIteratorError5, _iteratorError5, _iterator5, _step5, _iteratorNormalCompletion6, _didIteratorError6, _iteratorError6, _iterator6, _step6, handler;

        return regeneratorRuntime.wrap(function _callee28$(_context28) {
          while (1) {
            switch (_context28.prev = _context28.next) {
              case 0:
                _context28.next = 2;
                return this.getPendingMigrations();

              case 2:
                pending = _context28.sent;
                // run in pre loop, keeping in mind that a migration may be run twice: when offline then again when signing in.
                // we need to reset the items to a new array.
                _iteratorNormalCompletion3 = true;
                _didIteratorError3 = false;
                _iteratorError3 = undefined;
                _context28.prev = 6;

                for (_iterator3 = pending[Symbol.iterator](); !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                  migration = _step3.value;
                  migration.items = [];
                }

                _context28.next = 14;
                break;

              case 10:
                _context28.prev = 10;
                _context28.t0 = _context28["catch"](6);
                _didIteratorError3 = true;
                _iteratorError3 = _context28.t0;

              case 14:
                _context28.prev = 14;
                _context28.prev = 15;

                if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
                  _iterator3["return"]();
                }

              case 17:
                _context28.prev = 17;

                if (!_didIteratorError3) {
                  _context28.next = 20;
                  break;
                }

                throw _iteratorError3;

              case 20:
                return _context28.finish(17);

              case 21:
                return _context28.finish(14);

              case 22:
                _iteratorNormalCompletion4 = true;
                _didIteratorError4 = false;
                _iteratorError4 = undefined;
                _context28.prev = 25;
                _iterator4 = this.modelManager.allNondummyItems[Symbol.iterator]();

              case 27:
                if (_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done) {
                  _context28.next = 51;
                  break;
                }

                item = _step4.value;
                _iteratorNormalCompletion7 = true;
                _didIteratorError7 = false;
                _iteratorError7 = undefined;
                _context28.prev = 32;

                for (_iterator7 = pending[Symbol.iterator](); !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                  migration = _step7.value;

                  if (item.content_type == migration.content_type) {
                    migration.items.push(item);
                  }
                }

                _context28.next = 40;
                break;

              case 36:
                _context28.prev = 36;
                _context28.t1 = _context28["catch"](32);
                _didIteratorError7 = true;
                _iteratorError7 = _context28.t1;

              case 40:
                _context28.prev = 40;
                _context28.prev = 41;

                if (!_iteratorNormalCompletion7 && _iterator7["return"] != null) {
                  _iterator7["return"]();
                }

              case 43:
                _context28.prev = 43;

                if (!_didIteratorError7) {
                  _context28.next = 46;
                  break;
                }

                throw _iteratorError7;

              case 46:
                return _context28.finish(43);

              case 47:
                return _context28.finish(40);

              case 48:
                _iteratorNormalCompletion4 = true;
                _context28.next = 27;
                break;

              case 51:
                _context28.next = 57;
                break;

              case 53:
                _context28.prev = 53;
                _context28.t2 = _context28["catch"](25);
                _didIteratorError4 = true;
                _iteratorError4 = _context28.t2;

              case 57:
                _context28.prev = 57;
                _context28.prev = 58;

                if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {
                  _iterator4["return"]();
                }

              case 60:
                _context28.prev = 60;

                if (!_didIteratorError4) {
                  _context28.next = 63;
                  break;
                }

                throw _iteratorError4;

              case 63:
                return _context28.finish(60);

              case 64:
                return _context28.finish(57);

              case 65:
                _iteratorNormalCompletion5 = true;
                _didIteratorError5 = false;
                _iteratorError5 = undefined;
                _context28.prev = 68;
                _iterator5 = pending[Symbol.iterator]();

              case 70:
                if (_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done) {
                  _context28.next = 81;
                  break;
                }

                migration = _step5.value;

                if (!(migration.items && migration.items.length > 0 || migration.customHandler)) {
                  _context28.next = 77;
                  break;
                }

                _context28.next = 75;
                return this.runMigration(migration, migration.items);

              case 75:
                _context28.next = 78;
                break;

              case 77:
                this.markMigrationCompleted(migration);

              case 78:
                _iteratorNormalCompletion5 = true;
                _context28.next = 70;
                break;

              case 81:
                _context28.next = 87;
                break;

              case 83:
                _context28.prev = 83;
                _context28.t3 = _context28["catch"](68);
                _didIteratorError5 = true;
                _iteratorError5 = _context28.t3;

              case 87:
                _context28.prev = 87;
                _context28.prev = 88;

                if (!_iteratorNormalCompletion5 && _iterator5["return"] != null) {
                  _iterator5["return"]();
                }

              case 90:
                _context28.prev = 90;

                if (!_didIteratorError5) {
                  _context28.next = 93;
                  break;
                }

                throw _iteratorError5;

              case 93:
                return _context28.finish(90);

              case 94:
                return _context28.finish(87);

              case 95:
                _iteratorNormalCompletion6 = true;
                _didIteratorError6 = false;
                _iteratorError6 = undefined;
                _context28.prev = 98;

                for (_iterator6 = this.completionHandlers[Symbol.iterator](); !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                  handler = _step6.value;
                  handler();
                }

                _context28.next = 106;
                break;

              case 102:
                _context28.prev = 102;
                _context28.t4 = _context28["catch"](98);
                _didIteratorError6 = true;
                _iteratorError6 = _context28.t4;

              case 106:
                _context28.prev = 106;
                _context28.prev = 107;

                if (!_iteratorNormalCompletion6 && _iterator6["return"] != null) {
                  _iterator6["return"]();
                }

              case 109:
                _context28.prev = 109;

                if (!_didIteratorError6) {
                  _context28.next = 112;
                  break;
                }

                throw _iteratorError6;

              case 112:
                return _context28.finish(109);

              case 113:
                return _context28.finish(106);

              case 114:
              case "end":
                return _context28.stop();
            }
          }
        }, _callee28, this, [[6, 10, 14, 22], [15,, 17, 21], [25, 53, 57, 65], [32, 36, 40, 48], [41,, 43, 47], [58,, 60, 64], [68, 83, 87, 95], [88,, 90, 94], [98, 102, 106, 114], [107,, 109, 113]]);
      }));

      function runPendingMigrations() {
        return _runPendingMigrations.apply(this, arguments);
      }

      return runPendingMigrations;
    }()
  }, {
    key: "encode",
    value: function () {
      var _encode = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee29(text) {
        return regeneratorRuntime.wrap(function _callee29$(_context29) {
          while (1) {
            switch (_context29.prev = _context29.next) {
              case 0:
                return _context29.abrupt("return", window.btoa(text));

              case 1:
              case "end":
                return _context29.stop();
            }
          }
        }, _callee29);
      }));

      function encode(_x59) {
        return _encode.apply(this, arguments);
      }

      return encode;
    }()
  }, {
    key: "decode",
    value: function () {
      var _decode = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee30(text) {
        return regeneratorRuntime.wrap(function _callee30$(_context30) {
          while (1) {
            switch (_context30.prev = _context30.next) {
              case 0:
                return _context30.abrupt("return", window.atob(text));

              case 1:
              case "end":
                return _context30.stop();
            }
          }
        }, _callee30);
      }));

      function decode(_x60) {
        return _decode.apply(this, arguments);
      }

      return decode;
    }()
  }, {
    key: "getCompletedMigrations",
    value: function () {
      var _getCompletedMigrations = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee31() {
        var rawCompleted;
        return regeneratorRuntime.wrap(function _callee31$(_context31) {
          while (1) {
            switch (_context31.prev = _context31.next) {
              case 0:
                if (this._completed) {
                  _context31.next = 5;
                  break;
                }

                _context31.next = 3;
                return this.storageManager.getItem("migrations");

              case 3:
                rawCompleted = _context31.sent;

                if (rawCompleted) {
                  this._completed = JSON.parse(rawCompleted);
                } else {
                  this._completed = [];
                }

              case 5:
                return _context31.abrupt("return", this._completed);

              case 6:
              case "end":
                return _context31.stop();
            }
          }
        }, _callee31, this);
      }));

      function getCompletedMigrations() {
        return _getCompletedMigrations.apply(this, arguments);
      }

      return getCompletedMigrations;
    }()
  }, {
    key: "getPendingMigrations",
    value: function () {
      var _getPendingMigrations = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee32() {
        var completed, pending, _iteratorNormalCompletion8, _didIteratorError8, _iteratorError8, _iterator8, _step8, migration;

        return regeneratorRuntime.wrap(function _callee32$(_context32) {
          while (1) {
            switch (_context32.prev = _context32.next) {
              case 0:
                _context32.next = 2;
                return this.getCompletedMigrations();

              case 2:
                completed = _context32.sent;
                pending = [];
                _iteratorNormalCompletion8 = true;
                _didIteratorError8 = false;
                _iteratorError8 = undefined;
                _context32.prev = 7;
                _iterator8 = this.migrations[Symbol.iterator]();

              case 9:
                if (_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done) {
                  _context32.next = 22;
                  break;
                }

                migration = _step8.value;
                _context32.t0 = completed;
                _context32.next = 14;
                return this.encode(migration.name);

              case 14:
                _context32.t1 = _context32.sent;
                _context32.t2 = _context32.t0.indexOf.call(_context32.t0, _context32.t1);
                _context32.t3 = -1;

                if (!(_context32.t2 == _context32.t3)) {
                  _context32.next = 19;
                  break;
                }

                pending.push(migration);

              case 19:
                _iteratorNormalCompletion8 = true;
                _context32.next = 9;
                break;

              case 22:
                _context32.next = 28;
                break;

              case 24:
                _context32.prev = 24;
                _context32.t4 = _context32["catch"](7);
                _didIteratorError8 = true;
                _iteratorError8 = _context32.t4;

              case 28:
                _context32.prev = 28;
                _context32.prev = 29;

                if (!_iteratorNormalCompletion8 && _iterator8["return"] != null) {
                  _iterator8["return"]();
                }

              case 31:
                _context32.prev = 31;

                if (!_didIteratorError8) {
                  _context32.next = 34;
                  break;
                }

                throw _iteratorError8;

              case 34:
                return _context32.finish(31);

              case 35:
                return _context32.finish(28);

              case 36:
                return _context32.abrupt("return", pending);

              case 37:
              case "end":
                return _context32.stop();
            }
          }
        }, _callee32, this, [[7, 24, 28, 36], [29,, 31, 35]]);
      }));

      function getPendingMigrations() {
        return _getPendingMigrations.apply(this, arguments);
      }

      return getPendingMigrations;
    }()
  }, {
    key: "markMigrationCompleted",
    value: function () {
      var _markMigrationCompleted = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee33(migration) {
        var completed;
        return regeneratorRuntime.wrap(function _callee33$(_context33) {
          while (1) {
            switch (_context33.prev = _context33.next) {
              case 0:
                _context33.next = 2;
                return this.getCompletedMigrations();

              case 2:
                completed = _context33.sent;
                _context33.t0 = completed;
                _context33.next = 6;
                return this.encode(migration.name);

              case 6:
                _context33.t1 = _context33.sent;

                _context33.t0.push.call(_context33.t0, _context33.t1);

                this.storageManager.setItem("migrations", JSON.stringify(completed));
                migration.running = false;

              case 10:
              case "end":
                return _context33.stop();
            }
          }
        }, _callee33, this);
      }));

      function markMigrationCompleted(_x61) {
        return _markMigrationCompleted.apply(this, arguments);
      }

      return markMigrationCompleted;
    }()
  }, {
    key: "runMigration",
    value: function () {
      var _runMigration = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee34(migration, items) {
        var _this8 = this;

        return regeneratorRuntime.wrap(function _callee34$(_context34) {
          while (1) {
            switch (_context34.prev = _context34.next) {
              case 0:
                if (!migration.running) {
                  _context34.next = 2;
                  break;
                }

                return _context34.abrupt("return");

              case 2:
                console.log("Running migration:", migration.name);
                migration.running = true;

                if (!migration.customHandler) {
                  _context34.next = 8;
                  break;
                }

                return _context34.abrupt("return", migration.customHandler().then(function () {
                  _this8.markMigrationCompleted(migration);
                }));

              case 8:
                return _context34.abrupt("return", migration.handler(items).then(function () {
                  _this8.markMigrationCompleted(migration);
                }));

              case 9:
              case "end":
                return _context34.stop();
            }
          }
        }, _callee34);
      }));

      function runMigration(_x62, _x63) {
        return _runMigration.apply(this, arguments);
      }

      return runMigration;
    }()
  }]);

  return SFMigrationManager;
}();

exports.SFMigrationManager = SFMigrationManager;
;

var SFModelManager =
/*#__PURE__*/
function () {
  function SFModelManager(timeout) {
    _classCallCheck(this, SFModelManager);

    SFModelManager.MappingSourceRemoteRetrieved = "MappingSourceRemoteRetrieved";
    SFModelManager.MappingSourceRemoteSaved = "MappingSourceRemoteSaved";
    SFModelManager.MappingSourceLocalSaved = "MappingSourceLocalSaved";
    SFModelManager.MappingSourceLocalRetrieved = "MappingSourceLocalRetrieved";
    SFModelManager.MappingSourceLocalDirtied = "MappingSourceLocalDirtied";
    SFModelManager.MappingSourceComponentRetrieved = "MappingSourceComponentRetrieved";
    SFModelManager.MappingSourceDesktopInstalled = "MappingSourceDesktopInstalled"; // When a component is installed by the desktop and some of its values change

    SFModelManager.MappingSourceRemoteActionRetrieved = "MappingSourceRemoteActionRetrieved";
    /* aciton-based Extensions like note history */

    SFModelManager.MappingSourceFileImport = "MappingSourceFileImport";

    SFModelManager.isMappingSourceRetrieved = function (source) {
      return [SFModelManager.MappingSourceRemoteRetrieved, SFModelManager.MappingSourceComponentRetrieved, SFModelManager.MappingSourceRemoteActionRetrieved].includes(source);
    };

    this.$timeout = timeout || setTimeout.bind(window);
    this.itemSyncObservers = [];
    this.items = [];
    this.itemsHash = {};
    this.missedReferences = {};
    this.uuidChangeObservers = [];
  }

  _createClass(SFModelManager, [{
    key: "handleSignout",
    value: function handleSignout() {
      this.items.length = 0;
      this.itemsHash = {};
      this.missedReferences = {};
    }
  }, {
    key: "addModelUuidChangeObserver",
    value: function addModelUuidChangeObserver(id, callback) {
      this.uuidChangeObservers.push({
        id: id,
        callback: callback
      });
    }
  }, {
    key: "notifyObserversOfUuidChange",
    value: function notifyObserversOfUuidChange(oldItem, newItem) {
      var _iteratorNormalCompletion9 = true;
      var _didIteratorError9 = false;
      var _iteratorError9 = undefined;

      try {
        for (var _iterator9 = this.uuidChangeObservers[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
          var observer = _step9.value;

          try {
            observer.callback(oldItem, newItem);
          } catch (e) {
            console.error("Notify observers of uuid change exception:", e);
          }
        }
      } catch (err) {
        _didIteratorError9 = true;
        _iteratorError9 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion9 && _iterator9["return"] != null) {
            _iterator9["return"]();
          }
        } finally {
          if (_didIteratorError9) {
            throw _iteratorError9;
          }
        }
      }
    }
  }, {
    key: "alternateUUIDForItem",
    value: function () {
      var _alternateUUIDForItem = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee35(item) {
        var newItem, _iteratorNormalCompletion10, _didIteratorError10, _iteratorError10, _iterator10, _step10, referencingObject;

        return regeneratorRuntime.wrap(function _callee35$(_context35) {
          while (1) {
            switch (_context35.prev = _context35.next) {
              case 0:
                // We need to clone this item and give it a new uuid, then delete item with old uuid from db (you can't modify uuid's in our indexeddb setup)
                newItem = this.createItem(item);
                _context35.next = 3;
                return SFJS.crypto.generateUUID();

              case 3:
                newItem.uuid = _context35.sent;
                // Update uuids of relationships
                newItem.informReferencesOfUUIDChange(item.uuid, newItem.uuid);
                this.informModelsOfUUIDChangeForItem(newItem, item.uuid, newItem.uuid); // the new item should inherit the original's relationships

                _iteratorNormalCompletion10 = true;
                _didIteratorError10 = false;
                _iteratorError10 = undefined;
                _context35.prev = 9;

                for (_iterator10 = item.referencingObjects[Symbol.iterator](); !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
                  referencingObject = _step10.value;
                  referencingObject.setIsNoLongerBeingReferencedBy(item);
                  item.setIsNoLongerBeingReferencedBy(referencingObject);
                  referencingObject.addItemAsRelationship(newItem);
                }

                _context35.next = 17;
                break;

              case 13:
                _context35.prev = 13;
                _context35.t0 = _context35["catch"](9);
                _didIteratorError10 = true;
                _iteratorError10 = _context35.t0;

              case 17:
                _context35.prev = 17;
                _context35.prev = 18;

                if (!_iteratorNormalCompletion10 && _iterator10["return"] != null) {
                  _iterator10["return"]();
                }

              case 20:
                _context35.prev = 20;

                if (!_didIteratorError10) {
                  _context35.next = 23;
                  break;
                }

                throw _iteratorError10;

              case 23:
                return _context35.finish(20);

              case 24:
                return _context35.finish(17);

              case 25:
                this.setItemsDirty(item.referencingObjects, true); // Used to set up referencingObjects for new item (so that other items can now properly reference this new item)

                this.resolveReferencesForItem(newItem);

                if (this.loggingEnabled) {
                  console.log(item.uuid, "-->", newItem.uuid);
                } // Set to deleted, then run through mapping function so that observers can be notified


                item.deleted = true;
                item.content.references = []; // Don't set dirty, because we don't need to sync old item. alternating uuid only occurs in two cases:
                // signing in and merging offline data, or when a uuid-conflict occurs. In both cases, the original item never
                // saves to a server, so doesn't need to be synced.
                // informModelsOfUUIDChangeForItem may set this object to dirty, but we want to undo that here, so that the item gets deleted
                // right away through the mapping function.

                this.setItemDirty(item, false, false, SFModelManager.MappingSourceLocalSaved);
                _context35.next = 33;
                return this.mapResponseItemsToLocalModels([item], SFModelManager.MappingSourceLocalSaved);

              case 33:
                // add new item
                this.addItem(newItem);
                this.setItemDirty(newItem, true, true, SFModelManager.MappingSourceLocalSaved);
                this.notifyObserversOfUuidChange(item, newItem);
                return _context35.abrupt("return", newItem);

              case 37:
              case "end":
                return _context35.stop();
            }
          }
        }, _callee35, this, [[9, 13, 17, 25], [18,, 20, 24]]);
      }));

      function alternateUUIDForItem(_x64) {
        return _alternateUUIDForItem.apply(this, arguments);
      }

      return alternateUUIDForItem;
    }()
  }, {
    key: "informModelsOfUUIDChangeForItem",
    value: function informModelsOfUUIDChangeForItem(newItem, oldUUID, newUUID) {
      // some models that only have one-way relationships might be interested to hear that an item has changed its uuid
      // for example, editors have a one way relationship with notes. When a note changes its UUID, it has no way to inform the editor
      // to update its relationships
      var _iteratorNormalCompletion11 = true;
      var _didIteratorError11 = false;
      var _iteratorError11 = undefined;

      try {
        for (var _iterator11 = this.items[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
          var model = _step11.value;
          model.potentialItemOfInterestHasChangedItsUUID(newItem, oldUUID, newUUID);
        }
      } catch (err) {
        _didIteratorError11 = true;
        _iteratorError11 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion11 && _iterator11["return"] != null) {
            _iterator11["return"]();
          }
        } finally {
          if (_didIteratorError11) {
            throw _iteratorError11;
          }
        }
      }
    }
  }, {
    key: "didSyncModelsOffline",
    value: function didSyncModelsOffline(items) {
      this.notifySyncObserversOfModels(items, SFModelManager.MappingSourceLocalSaved);
    }
  }, {
    key: "mapResponseItemsToLocalModels",
    value: function () {
      var _mapResponseItemsToLocalModels = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee36(items, source, sourceKey) {
        return regeneratorRuntime.wrap(function _callee36$(_context36) {
          while (1) {
            switch (_context36.prev = _context36.next) {
              case 0:
                return _context36.abrupt("return", this.mapResponseItemsToLocalModelsWithOptions({
                  items: items,
                  source: source,
                  sourceKey: sourceKey
                }));

              case 1:
              case "end":
                return _context36.stop();
            }
          }
        }, _callee36, this);
      }));

      function mapResponseItemsToLocalModels(_x65, _x66, _x67) {
        return _mapResponseItemsToLocalModels.apply(this, arguments);
      }

      return mapResponseItemsToLocalModels;
    }()
  }, {
    key: "mapResponseItemsToLocalModelsOmittingFields",
    value: function () {
      var _mapResponseItemsToLocalModelsOmittingFields = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee37(items, omitFields, source, sourceKey) {
        return regeneratorRuntime.wrap(function _callee37$(_context37) {
          while (1) {
            switch (_context37.prev = _context37.next) {
              case 0:
                return _context37.abrupt("return", this.mapResponseItemsToLocalModelsWithOptions({
                  items: items,
                  omitFields: omitFields,
                  source: source,
                  sourceKey: sourceKey
                }));

              case 1:
              case "end":
                return _context37.stop();
            }
          }
        }, _callee37, this);
      }));

      function mapResponseItemsToLocalModelsOmittingFields(_x68, _x69, _x70, _x71) {
        return _mapResponseItemsToLocalModelsOmittingFields.apply(this, arguments);
      }

      return mapResponseItemsToLocalModelsOmittingFields;
    }()
  }, {
    key: "mapResponseItemsToLocalModelsWithOptions",
    value: function () {
      var _mapResponseItemsToLocalModelsWithOptions = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee38(_ref9) {
        var items, omitFields, source, sourceKey, options, models, processedObjects, modelsToNotifyObserversOf, _iteratorNormalCompletion12, _didIteratorError12, _iteratorError12, _iterator12, _step12, json_obj, isMissingContent, isCorrupt, _iteratorNormalCompletion15, _didIteratorError15, _iteratorError15, _iterator15, _step15, key, item, contentType, unknownContentType, isDirtyItemPendingDelete, _iteratorNormalCompletion13, _didIteratorError13, _iteratorError13, _iterator13, _step13, _step13$value, index, _json_obj, model, missedRefs, _iteratorNormalCompletion14, _didIteratorError14, _iteratorError14, _loop, _iterator14, _step14;

        return regeneratorRuntime.wrap(function _callee38$(_context38) {
          while (1) {
            switch (_context38.prev = _context38.next) {
              case 0:
                items = _ref9.items, omitFields = _ref9.omitFields, source = _ref9.source, sourceKey = _ref9.sourceKey, options = _ref9.options;
                models = [], processedObjects = [], modelsToNotifyObserversOf = []; // first loop should add and process items

                _iteratorNormalCompletion12 = true;
                _didIteratorError12 = false;
                _iteratorError12 = undefined;
                _context38.prev = 5;
                _iterator12 = items[Symbol.iterator]();

              case 7:
                if (_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done) {
                  _context38.next = 58;
                  break;
                }

                json_obj = _step12.value;

                if (json_obj) {
                  _context38.next = 11;
                  break;
                }

                return _context38.abrupt("continue", 55);

              case 11:
                // content is missing if it has been sucessfullly decrypted but no content
                isMissingContent = !json_obj.content && !json_obj.errorDecrypting;
                isCorrupt = !json_obj.content_type || !json_obj.uuid;

                if (!((isCorrupt || isMissingContent) && !json_obj.deleted)) {
                  _context38.next = 16;
                  break;
                }

                // An item that is not deleted should never have empty content
                console.error("Server response item is corrupt:", json_obj);
                return _context38.abrupt("continue", 55);

              case 16:
                if (!Array.isArray(omitFields)) {
                  _context38.next = 36;
                  break;
                }

                _iteratorNormalCompletion15 = true;
                _didIteratorError15 = false;
                _iteratorError15 = undefined;
                _context38.prev = 20;

                for (_iterator15 = omitFields[Symbol.iterator](); !(_iteratorNormalCompletion15 = (_step15 = _iterator15.next()).done); _iteratorNormalCompletion15 = true) {
                  key = _step15.value;
                  delete json_obj[key];
                }

                _context38.next = 28;
                break;

              case 24:
                _context38.prev = 24;
                _context38.t0 = _context38["catch"](20);
                _didIteratorError15 = true;
                _iteratorError15 = _context38.t0;

              case 28:
                _context38.prev = 28;
                _context38.prev = 29;

                if (!_iteratorNormalCompletion15 && _iterator15["return"] != null) {
                  _iterator15["return"]();
                }

              case 31:
                _context38.prev = 31;

                if (!_didIteratorError15) {
                  _context38.next = 34;
                  break;
                }

                throw _iteratorError15;

              case 34:
                return _context38.finish(31);

              case 35:
                return _context38.finish(28);

              case 36:
                item = this.findItem(json_obj.uuid);

                if (item) {
                  item.updateFromJSON(json_obj); // If an item goes through mapping, it can no longer be a dummy.

                  item.dummy = false;
                }

                contentType = json_obj["content_type"] || item && item.content_type;
                unknownContentType = this.acceptableContentTypes && !this.acceptableContentTypes.includes(contentType);

                if (!unknownContentType) {
                  _context38.next = 42;
                  break;
                }

                return _context38.abrupt("continue", 55);

              case 42:
                isDirtyItemPendingDelete = false;

                if (!(json_obj.deleted == true)) {
                  _context38.next = 50;
                  break;
                }

                if (!json_obj.dirty) {
                  _context38.next = 48;
                  break;
                }

                // Item was marked as deleted but not yet synced (in offline scenario)
                // We need to create this item as usual, but just not add it to individual arrays
                // i.e add to this.items but not this.notes (so that it can be retrieved with getDirtyItems)
                isDirtyItemPendingDelete = true;
                _context38.next = 50;
                break;

              case 48:
                if (item) {
                  // We still want to return this item to the caller so they know it was handled.
                  models.push(item);
                  modelsToNotifyObserversOf.push(item);
                  this.removeItemLocally(item);
                }

                return _context38.abrupt("continue", 55);

              case 50:
                if (!item) {
                  item = this.createItem(json_obj);
                }

                this.addItem(item, isDirtyItemPendingDelete); // Observers do not need to handle items that errored while decrypting.

                if (!item.errorDecrypting) {
                  modelsToNotifyObserversOf.push(item);
                }

                models.push(item);
                processedObjects.push(json_obj);

              case 55:
                _iteratorNormalCompletion12 = true;
                _context38.next = 7;
                break;

              case 58:
                _context38.next = 64;
                break;

              case 60:
                _context38.prev = 60;
                _context38.t1 = _context38["catch"](5);
                _didIteratorError12 = true;
                _iteratorError12 = _context38.t1;

              case 64:
                _context38.prev = 64;
                _context38.prev = 65;

                if (!_iteratorNormalCompletion12 && _iterator12["return"] != null) {
                  _iterator12["return"]();
                }

              case 67:
                _context38.prev = 67;

                if (!_didIteratorError12) {
                  _context38.next = 70;
                  break;
                }

                throw _iteratorError12;

              case 70:
                return _context38.finish(67);

              case 71:
                return _context38.finish(64);

              case 72:
                // second loop should process references
                _iteratorNormalCompletion13 = true;
                _didIteratorError13 = false;
                _iteratorError13 = undefined;
                _context38.prev = 75;

                for (_iterator13 = processedObjects.entries()[Symbol.iterator](); !(_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done); _iteratorNormalCompletion13 = true) {
                  _step13$value = _slicedToArray(_step13.value, 2), index = _step13$value[0], _json_obj = _step13$value[1];
                  model = models[index];

                  if (_json_obj.content) {
                    this.resolveReferencesForItem(model);
                  }

                  model.didFinishSyncing();
                }

                _context38.next = 83;
                break;

              case 79:
                _context38.prev = 79;
                _context38.t2 = _context38["catch"](75);
                _didIteratorError13 = true;
                _iteratorError13 = _context38.t2;

              case 83:
                _context38.prev = 83;
                _context38.prev = 84;

                if (!_iteratorNormalCompletion13 && _iterator13["return"] != null) {
                  _iterator13["return"]();
                }

              case 86:
                _context38.prev = 86;

                if (!_didIteratorError13) {
                  _context38.next = 89;
                  break;
                }

                throw _iteratorError13;

              case 89:
                return _context38.finish(86);

              case 90:
                return _context38.finish(83);

              case 91:
                missedRefs = this.popMissedReferenceStructsForObjects(processedObjects);
                _iteratorNormalCompletion14 = true;
                _didIteratorError14 = false;
                _iteratorError14 = undefined;
                _context38.prev = 95;

                _loop = function _loop() {
                  var ref = _step14.value;
                  var model = models.find(function (candidate) {
                    return candidate.uuid == ref.reference_uuid;
                  }); // Model should 100% be defined here, but let's not be too overconfident

                  if (model) {
                    var itemWaitingForTheValueInThisCurrentLoop = ref.for_item;
                    itemWaitingForTheValueInThisCurrentLoop.addItemAsRelationship(model);
                  }
                };

                for (_iterator14 = missedRefs[Symbol.iterator](); !(_iteratorNormalCompletion14 = (_step14 = _iterator14.next()).done); _iteratorNormalCompletion14 = true) {
                  _loop();
                }

                _context38.next = 104;
                break;

              case 100:
                _context38.prev = 100;
                _context38.t3 = _context38["catch"](95);
                _didIteratorError14 = true;
                _iteratorError14 = _context38.t3;

              case 104:
                _context38.prev = 104;
                _context38.prev = 105;

                if (!_iteratorNormalCompletion14 && _iterator14["return"] != null) {
                  _iterator14["return"]();
                }

              case 107:
                _context38.prev = 107;

                if (!_didIteratorError14) {
                  _context38.next = 110;
                  break;
                }

                throw _iteratorError14;

              case 110:
                return _context38.finish(107);

              case 111:
                return _context38.finish(104);

              case 112:
                _context38.next = 114;
                return this.notifySyncObserversOfModels(modelsToNotifyObserversOf, source, sourceKey);

              case 114:
                return _context38.abrupt("return", models);

              case 115:
              case "end":
                return _context38.stop();
            }
          }
        }, _callee38, this, [[5, 60, 64, 72], [20, 24, 28, 36], [29,, 31, 35], [65,, 67, 71], [75, 79, 83, 91], [84,, 86, 90], [95, 100, 104, 112], [105,, 107, 111]]);
      }));

      function mapResponseItemsToLocalModelsWithOptions(_x72) {
        return _mapResponseItemsToLocalModelsWithOptions.apply(this, arguments);
      }

      return mapResponseItemsToLocalModelsWithOptions;
    }()
  }, {
    key: "missedReferenceBuildKey",
    value: function missedReferenceBuildKey(referenceId, objectId) {
      return "".concat(referenceId, ":").concat(objectId);
    }
  }, {
    key: "popMissedReferenceStructsForObjects",
    value: function popMissedReferenceStructsForObjects(objects) {
      if (!objects || objects.length == 0) {
        return [];
      }

      var results = [];
      var toDelete = [];
      var uuids = objects.map(function (item) {
        return item.uuid;
      });
      var genericUuidLength = uuids[0].length;
      var keys = Object.keys(this.missedReferences);

      for (var _i2 = 0, _keys2 = keys; _i2 < _keys2.length; _i2++) {
        var candidateKey = _keys2[_i2];

        /*
        We used to do string.split to get at the UUID, but surprisingly,
        the performance of this was about 20x worse then just getting the substring.
         let matches = candidateKey.split(":")[0] == object.uuid;
        */
        var matches = uuids.includes(candidateKey.substring(0, genericUuidLength));

        if (matches) {
          results.push(this.missedReferences[candidateKey]);
          toDelete.push(candidateKey);
        }
      } // remove from hash


      for (var _i3 = 0, _toDelete = toDelete; _i3 < _toDelete.length; _i3++) {
        var key = _toDelete[_i3];
        delete this.missedReferences[key];
      }

      return results;
    }
  }, {
    key: "resolveReferencesForItem",
    value: function resolveReferencesForItem(item) {
      var markReferencesDirty = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      if (item.errorDecrypting) {
        return;
      }

      var contentObject = item.contentObject; // If another client removes an item's references, this client won't pick up the removal unless
      // we remove everything not present in the current list of references

      item.updateLocalRelationships();

      if (!contentObject.references) {
        return;
      }

      var references = contentObject.references.slice(); // make copy, references will be modified in array

      var referencesIds = references.map(function (ref) {
        return ref.uuid;
      });
      var includeBlanks = true;
      var referencesObjectResults = this.findItems(referencesIds, includeBlanks);
      var _iteratorNormalCompletion16 = true;
      var _didIteratorError16 = false;
      var _iteratorError16 = undefined;

      try {
        for (var _iterator16 = referencesObjectResults.entries()[Symbol.iterator](), _step16; !(_iteratorNormalCompletion16 = (_step16 = _iterator16.next()).done); _iteratorNormalCompletion16 = true) {
          var _step16$value = _slicedToArray(_step16.value, 2),
              index = _step16$value[0],
              referencedItem = _step16$value[1];

          if (referencedItem) {
            item.addItemAsRelationship(referencedItem);

            if (markReferencesDirty) {
              this.setItemDirty(referencedItem, true);
            }
          } else {
            var missingRefId = referencesIds[index]; // Allows mapper to check when missing reference makes it through the loop,
            // and then runs resolveReferencesForItem again for the original item.

            var mappingKey = this.missedReferenceBuildKey(missingRefId, item.uuid);

            if (!this.missedReferences[mappingKey]) {
              var missedRef = {
                reference_uuid: missingRefId,
                for_item: item
              };
              this.missedReferences[mappingKey] = missedRef;
            }
          }
        }
      } catch (err) {
        _didIteratorError16 = true;
        _iteratorError16 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion16 && _iterator16["return"] != null) {
            _iterator16["return"]();
          }
        } finally {
          if (_didIteratorError16) {
            throw _iteratorError16;
          }
        }
      }
    }
    /* Note that this function is public, and can also be called manually (desktopManager uses it) */

  }, {
    key: "notifySyncObserversOfModels",
    value: function () {
      var _notifySyncObserversOfModels = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee39(models, source, sourceKey) {
        var _this9 = this;

        var observers, _iteratorNormalCompletion17, _didIteratorError17, _iteratorError17, _loop2, _iterator17, _step17;

        return regeneratorRuntime.wrap(function _callee39$(_context40) {
          while (1) {
            switch (_context40.prev = _context40.next) {
              case 0:
                // Make sure `let` is used in the for loops instead of `var`, as we will be using a timeout below.
                observers = this.itemSyncObservers.sort(function (a, b) {
                  // sort by priority
                  return a.priority < b.priority ? -1 : 1;
                });
                _iteratorNormalCompletion17 = true;
                _didIteratorError17 = false;
                _iteratorError17 = undefined;
                _context40.prev = 4;
                _loop2 =
                /*#__PURE__*/
                regeneratorRuntime.mark(function _loop2() {
                  var observer, allRelevantItems, validItems, deletedItems, _iteratorNormalCompletion18, _didIteratorError18, _iteratorError18, _iterator18, _step18, item;

                  return regeneratorRuntime.wrap(function _loop2$(_context39) {
                    while (1) {
                      switch (_context39.prev = _context39.next) {
                        case 0:
                          observer = _step17.value;
                          allRelevantItems = observer.types.includes("*") ? models : models.filter(function (item) {
                            return observer.types.includes(item.content_type);
                          });
                          validItems = [], deletedItems = [];
                          _iteratorNormalCompletion18 = true;
                          _didIteratorError18 = false;
                          _iteratorError18 = undefined;
                          _context39.prev = 6;

                          for (_iterator18 = allRelevantItems[Symbol.iterator](); !(_iteratorNormalCompletion18 = (_step18 = _iterator18.next()).done); _iteratorNormalCompletion18 = true) {
                            item = _step18.value;

                            if (item.deleted) {
                              deletedItems.push(item);
                            } else {
                              validItems.push(item);
                            }
                          }

                          _context39.next = 14;
                          break;

                        case 10:
                          _context39.prev = 10;
                          _context39.t0 = _context39["catch"](6);
                          _didIteratorError18 = true;
                          _iteratorError18 = _context39.t0;

                        case 14:
                          _context39.prev = 14;
                          _context39.prev = 15;

                          if (!_iteratorNormalCompletion18 && _iterator18["return"] != null) {
                            _iterator18["return"]();
                          }

                        case 17:
                          _context39.prev = 17;

                          if (!_didIteratorError18) {
                            _context39.next = 20;
                            break;
                          }

                          throw _iteratorError18;

                        case 20:
                          return _context39.finish(17);

                        case 21:
                          return _context39.finish(14);

                        case 22:
                          if (!(allRelevantItems.length > 0)) {
                            _context39.next = 25;
                            break;
                          }

                          _context39.next = 25;
                          return _this9._callSyncObserverCallbackWithTimeout(observer, allRelevantItems, validItems, deletedItems, source, sourceKey);

                        case 25:
                        case "end":
                          return _context39.stop();
                      }
                    }
                  }, _loop2, null, [[6, 10, 14, 22], [15,, 17, 21]]);
                });
                _iterator17 = observers[Symbol.iterator]();

              case 7:
                if (_iteratorNormalCompletion17 = (_step17 = _iterator17.next()).done) {
                  _context40.next = 12;
                  break;
                }

                return _context40.delegateYield(_loop2(), "t0", 9);

              case 9:
                _iteratorNormalCompletion17 = true;
                _context40.next = 7;
                break;

              case 12:
                _context40.next = 18;
                break;

              case 14:
                _context40.prev = 14;
                _context40.t1 = _context40["catch"](4);
                _didIteratorError17 = true;
                _iteratorError17 = _context40.t1;

              case 18:
                _context40.prev = 18;
                _context40.prev = 19;

                if (!_iteratorNormalCompletion17 && _iterator17["return"] != null) {
                  _iterator17["return"]();
                }

              case 21:
                _context40.prev = 21;

                if (!_didIteratorError17) {
                  _context40.next = 24;
                  break;
                }

                throw _iteratorError17;

              case 24:
                return _context40.finish(21);

              case 25:
                return _context40.finish(18);

              case 26:
              case "end":
                return _context40.stop();
            }
          }
        }, _callee39, this, [[4, 14, 18, 26], [19,, 21, 25]]);
      }));

      function notifySyncObserversOfModels(_x73, _x74, _x75) {
        return _notifySyncObserversOfModels.apply(this, arguments);
      }

      return notifySyncObserversOfModels;
    }()
    /*
      Rather than running this inline in a for loop, which causes problems and requires all variables to be declared with `let`,
      we'll do it here so it's more explicit and less confusing.
     */

  }, {
    key: "_callSyncObserverCallbackWithTimeout",
    value: function () {
      var _callSyncObserverCallbackWithTimeout2 = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee40(observer, allRelevantItems, validItems, deletedItems, source, sourceKey) {
        var _this10 = this;

        return regeneratorRuntime.wrap(function _callee40$(_context41) {
          while (1) {
            switch (_context41.prev = _context41.next) {
              case 0:
                return _context41.abrupt("return", new Promise(function (resolve, reject) {
                  _this10.$timeout(function () {
                    try {
                      observer.callback(allRelevantItems, validItems, deletedItems, source, sourceKey);
                    } catch (e) {
                      console.error("Sync observer exception", e);
                    } finally {
                      resolve();
                    }
                  });
                }));

              case 1:
              case "end":
                return _context41.stop();
            }
          }
        }, _callee40);
      }));

      function _callSyncObserverCallbackWithTimeout(_x76, _x77, _x78, _x79, _x80, _x81) {
        return _callSyncObserverCallbackWithTimeout2.apply(this, arguments);
      }

      return _callSyncObserverCallbackWithTimeout;
    }() // When a client sets an item as dirty, it means its values has changed, and everyone should know about it.
    // Particularly extensions. For example, if you edit the title of a note, extensions won't be notified until the save sync completes.
    // With this, they'll be notified immediately.

  }, {
    key: "setItemDirty",
    value: function setItemDirty(item) {
      var dirty = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var updateClientDate = arguments.length > 2 ? arguments[2] : undefined;
      var source = arguments.length > 3 ? arguments[3] : undefined;
      var sourceKey = arguments.length > 4 ? arguments[4] : undefined;
      this.setItemsDirty([item], dirty, updateClientDate, source, sourceKey);
    }
  }, {
    key: "setItemsDirty",
    value: function setItemsDirty(items) {
      var dirty = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var updateClientDate = arguments.length > 2 ? arguments[2] : undefined;
      var source = arguments.length > 3 ? arguments[3] : undefined;
      var sourceKey = arguments.length > 4 ? arguments[4] : undefined;
      var _iteratorNormalCompletion19 = true;
      var _didIteratorError19 = false;
      var _iteratorError19 = undefined;

      try {
        for (var _iterator19 = items[Symbol.iterator](), _step19; !(_iteratorNormalCompletion19 = (_step19 = _iterator19.next()).done); _iteratorNormalCompletion19 = true) {
          var item = _step19.value;
          item.setDirty(dirty, updateClientDate);
        }
      } catch (err) {
        _didIteratorError19 = true;
        _iteratorError19 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion19 && _iterator19["return"] != null) {
            _iterator19["return"]();
          }
        } finally {
          if (_didIteratorError19) {
            throw _iteratorError19;
          }
        }
      }

      this.notifySyncObserversOfModels(items, source || SFModelManager.MappingSourceLocalDirtied, sourceKey);
    }
  }, {
    key: "createItem",
    value: function createItem(json_obj) {
      var itemClass = SFModelManager.ContentTypeClassMapping && SFModelManager.ContentTypeClassMapping[json_obj.content_type];

      if (!itemClass) {
        itemClass = SFItem;
      }

      var item = new itemClass(json_obj);
      return item;
    }
    /*
      Be sure itemResponse is a generic Javascript object, and not an Item.
      An Item needs to collapse its properties into its content object before it can be duplicated.
      Note: the reason we need this function is specificallty for the call to resolveReferencesForItem.
      This method creates but does not add the item to the global inventory. It's used by syncManager
      to check if this prospective duplicate item is identical to another item, including the references.
     */

  }, {
    key: "createDuplicateItemFromResponseItem",
    value: function () {
      var _createDuplicateItemFromResponseItem = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee41(itemResponse) {
        var itemResponseCopy, duplicate;
        return regeneratorRuntime.wrap(function _callee41$(_context42) {
          while (1) {
            switch (_context42.prev = _context42.next) {
              case 0:
                if (!(typeof itemResponse.setDirty === 'function')) {
                  _context42.next = 3;
                  break;
                }

                // You should never pass in objects here, as we will modify the itemResponse's uuid below (update: we now make a copy of input value).
                console.error("Attempting to create conflicted copy of non-response item.");
                return _context42.abrupt("return", null);

              case 3:
                // Make a copy so we don't modify input value.
                itemResponseCopy = JSON.parse(JSON.stringify(itemResponse));
                _context42.next = 6;
                return SFJS.crypto.generateUUID();

              case 6:
                itemResponseCopy.uuid = _context42.sent;
                duplicate = this.createItem(itemResponseCopy);
                return _context42.abrupt("return", duplicate);

              case 9:
              case "end":
                return _context42.stop();
            }
          }
        }, _callee41, this);
      }));

      function createDuplicateItemFromResponseItem(_x82) {
        return _createDuplicateItemFromResponseItem.apply(this, arguments);
      }

      return createDuplicateItemFromResponseItem;
    }()
  }, {
    key: "duplicateItemAndAddAsConflict",
    value: function duplicateItemAndAddAsConflict(duplicateOf) {
      return this.duplicateItemWithCustomContentAndAddAsConflict({
        content: duplicateOf.content,
        duplicateOf: duplicateOf
      });
    }
  }, {
    key: "duplicateItemWithCustomContentAndAddAsConflict",
    value: function duplicateItemWithCustomContentAndAddAsConflict(_ref10) {
      var content = _ref10.content,
          duplicateOf = _ref10.duplicateOf;
      var copy = this.duplicateItemWithCustomContent({
        content: content,
        duplicateOf: duplicateOf
      });
      this.addDuplicatedItemAsConflict({
        duplicate: copy,
        duplicateOf: duplicateOf
      });
      return copy;
    }
  }, {
    key: "addDuplicatedItemAsConflict",
    value: function addDuplicatedItemAsConflict(_ref11) {
      var duplicate = _ref11.duplicate,
          duplicateOf = _ref11.duplicateOf;
      this.addDuplicatedItem(duplicate, duplicateOf);
      duplicate.content.conflict_of = duplicateOf.uuid;
    }
  }, {
    key: "duplicateItemWithCustomContent",
    value: function duplicateItemWithCustomContent(_ref12) {
      var content = _ref12.content,
          duplicateOf = _ref12.duplicateOf;
      var copy = new duplicateOf.constructor({
        content: content
      });
      copy.created_at = duplicateOf.created_at;

      if (!copy.content_type) {
        copy.content_type = duplicateOf.content_type;
      }

      return copy;
    }
  }, {
    key: "duplicateItemAndAdd",
    value: function duplicateItemAndAdd(item) {
      var copy = this.duplicateItemWithoutAdding(item);
      this.addDuplicatedItem(copy, item);
      return copy;
    }
  }, {
    key: "duplicateItemWithoutAdding",
    value: function duplicateItemWithoutAdding(item) {
      var copy = new item.constructor({
        content: item.content
      });
      copy.created_at = item.created_at;

      if (!copy.content_type) {
        copy.content_type = item.content_type;
      }

      return copy;
    }
  }, {
    key: "addDuplicatedItem",
    value: function addDuplicatedItem(duplicate, original) {
      this.addItem(duplicate); // the duplicate should inherit the original's relationships

      var _iteratorNormalCompletion20 = true;
      var _didIteratorError20 = false;
      var _iteratorError20 = undefined;

      try {
        for (var _iterator20 = original.referencingObjects[Symbol.iterator](), _step20; !(_iteratorNormalCompletion20 = (_step20 = _iterator20.next()).done); _iteratorNormalCompletion20 = true) {
          var referencingObject = _step20.value;
          referencingObject.addItemAsRelationship(duplicate);
          this.setItemDirty(referencingObject, true);
        }
      } catch (err) {
        _didIteratorError20 = true;
        _iteratorError20 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion20 && _iterator20["return"] != null) {
            _iterator20["return"]();
          }
        } finally {
          if (_didIteratorError20) {
            throw _iteratorError20;
          }
        }
      }

      this.resolveReferencesForItem(duplicate);
      this.setItemDirty(duplicate, true);
    }
  }, {
    key: "addItem",
    value: function addItem(item) {
      var globalOnly = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      this.addItems([item], globalOnly);
    }
  }, {
    key: "addItems",
    value: function addItems(items) {
      var _this11 = this;

      var globalOnly = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      items.forEach(function (item) {
        if (!_this11.itemsHash[item.uuid]) {
          _this11.itemsHash[item.uuid] = item;

          _this11.items.push(item);
        }
      });
    }
    /* Notifies observers when an item has been synced or mapped from a remote response */

  }, {
    key: "addItemSyncObserver",
    value: function addItemSyncObserver(id, types, callback) {
      this.addItemSyncObserverWithPriority({
        id: id,
        types: types,
        callback: callback,
        priority: 1
      });
    }
  }, {
    key: "addItemSyncObserverWithPriority",
    value: function addItemSyncObserverWithPriority(_ref13) {
      var id = _ref13.id,
          priority = _ref13.priority,
          types = _ref13.types,
          callback = _ref13.callback;

      if (!Array.isArray(types)) {
        types = [types];
      }

      this.itemSyncObservers.push({
        id: id,
        types: types,
        priority: priority,
        callback: callback
      });
    }
  }, {
    key: "removeItemSyncObserver",
    value: function removeItemSyncObserver(id) {
      _.remove(this.itemSyncObservers, _.find(this.itemSyncObservers, {
        id: id
      }));
    }
  }, {
    key: "getDirtyItems",
    value: function getDirtyItems() {
      return this.items.filter(function (item) {
        // An item that has an error decrypting can be synced only if it is being deleted.
        // Otherwise, we don't want to send corrupt content up to the server.
        return item.dirty == true && !item.dummy && (!item.errorDecrypting || item.deleted);
      });
    }
  }, {
    key: "clearDirtyItems",
    value: function clearDirtyItems(items) {
      var _iteratorNormalCompletion21 = true;
      var _didIteratorError21 = false;
      var _iteratorError21 = undefined;

      try {
        for (var _iterator21 = items[Symbol.iterator](), _step21; !(_iteratorNormalCompletion21 = (_step21 = _iterator21.next()).done); _iteratorNormalCompletion21 = true) {
          var item = _step21.value;
          item.setDirty(false);
        }
      } catch (err) {
        _didIteratorError21 = true;
        _iteratorError21 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion21 && _iterator21["return"] != null) {
            _iterator21["return"]();
          }
        } finally {
          if (_didIteratorError21) {
            throw _iteratorError21;
          }
        }
      }
    }
  }, {
    key: "removeAndDirtyAllRelationshipsForItem",
    value: function removeAndDirtyAllRelationshipsForItem(item) {
      // Handle direct relationships
      // An item with errorDecrypting will not have valid content field
      if (!item.errorDecrypting) {
        var _iteratorNormalCompletion22 = true;
        var _didIteratorError22 = false;
        var _iteratorError22 = undefined;

        try {
          for (var _iterator22 = item.content.references[Symbol.iterator](), _step22; !(_iteratorNormalCompletion22 = (_step22 = _iterator22.next()).done); _iteratorNormalCompletion22 = true) {
            var reference = _step22.value;
            var relationship = this.findItem(reference.uuid);

            if (relationship) {
              item.removeItemAsRelationship(relationship);

              if (relationship.hasRelationshipWithItem(item)) {
                relationship.removeItemAsRelationship(item);
                this.setItemDirty(relationship, true);
              }
            }
          }
        } catch (err) {
          _didIteratorError22 = true;
          _iteratorError22 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion22 && _iterator22["return"] != null) {
              _iterator22["return"]();
            }
          } finally {
            if (_didIteratorError22) {
              throw _iteratorError22;
            }
          }
        }
      } // Handle indirect relationships


      var _iteratorNormalCompletion23 = true;
      var _didIteratorError23 = false;
      var _iteratorError23 = undefined;

      try {
        for (var _iterator23 = item.referencingObjects[Symbol.iterator](), _step23; !(_iteratorNormalCompletion23 = (_step23 = _iterator23.next()).done); _iteratorNormalCompletion23 = true) {
          var object = _step23.value;
          object.removeItemAsRelationship(item);
          this.setItemDirty(object, true);
        }
      } catch (err) {
        _didIteratorError23 = true;
        _iteratorError23 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion23 && _iterator23["return"] != null) {
            _iterator23["return"]();
          }
        } finally {
          if (_didIteratorError23) {
            throw _iteratorError23;
          }
        }
      }

      item.referencingObjects = [];
    }
    /* Used when changing encryption key */

  }, {
    key: "setAllItemsDirty",
    value: function setAllItemsDirty() {
      var relevantItems = this.allItems;
      this.setItemsDirty(relevantItems, true);
    }
  }, {
    key: "setItemToBeDeleted",
    value: function setItemToBeDeleted(item) {
      item.deleted = true;

      if (!item.dummy) {
        this.setItemDirty(item, true);
      }

      this.removeAndDirtyAllRelationshipsForItem(item);
    }
  }, {
    key: "removeItemLocally",
    value: function () {
      var _removeItemLocally = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee42(item) {
        return regeneratorRuntime.wrap(function _callee42$(_context43) {
          while (1) {
            switch (_context43.prev = _context43.next) {
              case 0:
                _.remove(this.items, {
                  uuid: item.uuid
                });

                delete this.itemsHash[item.uuid];
                item.isBeingRemovedLocally();

              case 3:
              case "end":
                return _context43.stop();
            }
          }
        }, _callee42, this);
      }));

      function removeItemLocally(_x83) {
        return _removeItemLocally.apply(this, arguments);
      }

      return removeItemLocally;
    }()
    /* Searching */

  }, {
    key: "allItemsMatchingTypes",
    value: function allItemsMatchingTypes(contentTypes) {
      return this.allItems.filter(function (item) {
        return (_.includes(contentTypes, item.content_type) || _.includes(contentTypes, "*")) && !item.dummy;
      });
    }
  }, {
    key: "invalidItems",
    value: function invalidItems() {
      return this.allItems.filter(function (item) {
        return item.errorDecrypting;
      });
    }
  }, {
    key: "validItemsForContentType",
    value: function validItemsForContentType(contentType) {
      return this.allItems.filter(function (item) {
        return item.content_type == contentType && !item.errorDecrypting;
      });
    }
  }, {
    key: "findItem",
    value: function findItem(itemId) {
      return this.itemsHash[itemId];
    }
  }, {
    key: "findItems",
    value: function findItems(ids) {
      var includeBlanks = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var results = [];
      var _iteratorNormalCompletion24 = true;
      var _didIteratorError24 = false;
      var _iteratorError24 = undefined;

      try {
        for (var _iterator24 = ids[Symbol.iterator](), _step24; !(_iteratorNormalCompletion24 = (_step24 = _iterator24.next()).done); _iteratorNormalCompletion24 = true) {
          var id = _step24.value;
          var item = this.itemsHash[id];

          if (item || includeBlanks) {
            results.push(item);
          }
        }
      } catch (err) {
        _didIteratorError24 = true;
        _iteratorError24 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion24 && _iterator24["return"] != null) {
            _iterator24["return"]();
          }
        } finally {
          if (_didIteratorError24) {
            throw _iteratorError24;
          }
        }
      }

      return results;
    }
  }, {
    key: "itemsMatchingPredicate",
    value: function itemsMatchingPredicate(predicate) {
      return this.itemsMatchingPredicates([predicate]);
    }
  }, {
    key: "itemsMatchingPredicates",
    value: function itemsMatchingPredicates(predicates) {
      return this.filterItemsWithPredicates(this.allItems, predicates);
    }
  }, {
    key: "filterItemsWithPredicates",
    value: function filterItemsWithPredicates(items, predicates) {
      var results = items.filter(function (item) {
        var _iteratorNormalCompletion25 = true;
        var _didIteratorError25 = false;
        var _iteratorError25 = undefined;

        try {
          for (var _iterator25 = predicates[Symbol.iterator](), _step25; !(_iteratorNormalCompletion25 = (_step25 = _iterator25.next()).done); _iteratorNormalCompletion25 = true) {
            var predicate = _step25.value;

            if (!item.satisfiesPredicate(predicate)) {
              return false;
            }
          }
        } catch (err) {
          _didIteratorError25 = true;
          _iteratorError25 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion25 && _iterator25["return"] != null) {
              _iterator25["return"]();
            }
          } finally {
            if (_didIteratorError25) {
              throw _iteratorError25;
            }
          }
        }

        return true;
      });
      return results;
    }
    /*
    Archives
    */

  }, {
    key: "importItems",
    value: function () {
      var _importItems = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee43(externalItems) {
        var itemsToBeMapped, localValues, _iteratorNormalCompletion26, _didIteratorError26, _iteratorError26, _iterator26, _step26, itemData, localItem, frozenValue, _iteratorNormalCompletion27, _didIteratorError27, _iteratorError27, _iterator27, _step27, _itemData, _localValues$_itemDat, _frozenValue, itemRef, duplicate, items, _iteratorNormalCompletion28, _didIteratorError28, _iteratorError28, _iterator28, _step28, item;

        return regeneratorRuntime.wrap(function _callee43$(_context44) {
          while (1) {
            switch (_context44.prev = _context44.next) {
              case 0:
                itemsToBeMapped = []; // Get local values before doing any processing. This way, if a note change below modifies a tag,
                // and the tag is going to be iterated on in the same loop, then we don't want this change to be compared
                // to the local value.

                localValues = {};
                _iteratorNormalCompletion26 = true;
                _didIteratorError26 = false;
                _iteratorError26 = undefined;
                _context44.prev = 5;
                _iterator26 = externalItems[Symbol.iterator]();

              case 7:
                if (_iteratorNormalCompletion26 = (_step26 = _iterator26.next()).done) {
                  _context44.next = 18;
                  break;
                }

                itemData = _step26.value;
                localItem = this.findItem(itemData.uuid);

                if (localItem) {
                  _context44.next = 13;
                  break;
                }

                localValues[itemData.uuid] = {};
                return _context44.abrupt("continue", 15);

              case 13:
                frozenValue = this.duplicateItemWithoutAdding(localItem);
                localValues[itemData.uuid] = {
                  frozenValue: frozenValue,
                  itemRef: localItem
                };

              case 15:
                _iteratorNormalCompletion26 = true;
                _context44.next = 7;
                break;

              case 18:
                _context44.next = 24;
                break;

              case 20:
                _context44.prev = 20;
                _context44.t0 = _context44["catch"](5);
                _didIteratorError26 = true;
                _iteratorError26 = _context44.t0;

              case 24:
                _context44.prev = 24;
                _context44.prev = 25;

                if (!_iteratorNormalCompletion26 && _iterator26["return"] != null) {
                  _iterator26["return"]();
                }

              case 27:
                _context44.prev = 27;

                if (!_didIteratorError26) {
                  _context44.next = 30;
                  break;
                }

                throw _iteratorError26;

              case 30:
                return _context44.finish(27);

              case 31:
                return _context44.finish(24);

              case 32:
                _iteratorNormalCompletion27 = true;
                _didIteratorError27 = false;
                _iteratorError27 = undefined;
                _context44.prev = 35;
                _iterator27 = externalItems[Symbol.iterator]();

              case 37:
                if (_iteratorNormalCompletion27 = (_step27 = _iterator27.next()).done) {
                  _context44.next = 52;
                  break;
                }

                _itemData = _step27.value;
                _localValues$_itemDat = localValues[_itemData.uuid], _frozenValue = _localValues$_itemDat.frozenValue, itemRef = _localValues$_itemDat.itemRef;

                if (!(_frozenValue && !itemRef.errorDecrypting)) {
                  _context44.next = 47;
                  break;
                }

                _context44.next = 43;
                return this.createDuplicateItemFromResponseItem(_itemData);

              case 43:
                duplicate = _context44.sent;

                if (!_itemData.deleted && !_frozenValue.isItemContentEqualWith(duplicate)) {
                  // Data differs
                  this.addDuplicatedItemAsConflict({
                    duplicate: duplicate,
                    duplicateOf: itemRef
                  });
                  itemsToBeMapped.push(duplicate);
                }

                _context44.next = 49;
                break;

              case 47:
                // it doesn't exist, push it into items to be mapped
                itemsToBeMapped.push(_itemData);

                if (itemRef && itemRef.errorDecrypting) {
                  itemRef.errorDecrypting = false;
                }

              case 49:
                _iteratorNormalCompletion27 = true;
                _context44.next = 37;
                break;

              case 52:
                _context44.next = 58;
                break;

              case 54:
                _context44.prev = 54;
                _context44.t1 = _context44["catch"](35);
                _didIteratorError27 = true;
                _iteratorError27 = _context44.t1;

              case 58:
                _context44.prev = 58;
                _context44.prev = 59;

                if (!_iteratorNormalCompletion27 && _iterator27["return"] != null) {
                  _iterator27["return"]();
                }

              case 61:
                _context44.prev = 61;

                if (!_didIteratorError27) {
                  _context44.next = 64;
                  break;
                }

                throw _iteratorError27;

              case 64:
                return _context44.finish(61);

              case 65:
                return _context44.finish(58);

              case 66:
                _context44.next = 68;
                return this.mapResponseItemsToLocalModels(itemsToBeMapped, SFModelManager.MappingSourceFileImport);

              case 68:
                items = _context44.sent;
                _iteratorNormalCompletion28 = true;
                _didIteratorError28 = false;
                _iteratorError28 = undefined;
                _context44.prev = 72;

                for (_iterator28 = items[Symbol.iterator](); !(_iteratorNormalCompletion28 = (_step28 = _iterator28.next()).done); _iteratorNormalCompletion28 = true) {
                  item = _step28.value;
                  this.setItemDirty(item, true, false);
                  item.deleted = false;
                }

                _context44.next = 80;
                break;

              case 76:
                _context44.prev = 76;
                _context44.t2 = _context44["catch"](72);
                _didIteratorError28 = true;
                _iteratorError28 = _context44.t2;

              case 80:
                _context44.prev = 80;
                _context44.prev = 81;

                if (!_iteratorNormalCompletion28 && _iterator28["return"] != null) {
                  _iterator28["return"]();
                }

              case 83:
                _context44.prev = 83;

                if (!_didIteratorError28) {
                  _context44.next = 86;
                  break;
                }

                throw _iteratorError28;

              case 86:
                return _context44.finish(83);

              case 87:
                return _context44.finish(80);

              case 88:
                return _context44.abrupt("return", items);

              case 89:
              case "end":
                return _context44.stop();
            }
          }
        }, _callee43, this, [[5, 20, 24, 32], [25,, 27, 31], [35, 54, 58, 66], [59,, 61, 65], [72, 76, 80, 88], [81,, 83, 87]]);
      }));

      function importItems(_x84) {
        return _importItems.apply(this, arguments);
      }

      return importItems;
    }()
  }, {
    key: "getAllItemsJSONData",
    value: function () {
      var _getAllItemsJSONData = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee44(keys, authParams, returnNullIfEmpty) {
        return regeneratorRuntime.wrap(function _callee44$(_context45) {
          while (1) {
            switch (_context45.prev = _context45.next) {
              case 0:
                return _context45.abrupt("return", this.getJSONDataForItems(this.allItems, keys, authParams, returnNullIfEmpty));

              case 1:
              case "end":
                return _context45.stop();
            }
          }
        }, _callee44, this);
      }));

      function getAllItemsJSONData(_x85, _x86, _x87) {
        return _getAllItemsJSONData.apply(this, arguments);
      }

      return getAllItemsJSONData;
    }()
  }, {
    key: "getJSONDataForItems",
    value: function () {
      var _getJSONDataForItems = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee45(items, keys, authParams, returnNullIfEmpty) {
        return regeneratorRuntime.wrap(function _callee45$(_context46) {
          while (1) {
            switch (_context46.prev = _context46.next) {
              case 0:
                return _context46.abrupt("return", Promise.all(items.map(function (item) {
                  var itemParams = new SFItemParams(item, keys, authParams);
                  return itemParams.paramsForExportFile();
                })).then(function (items) {
                  if (returnNullIfEmpty && items.length == 0) {
                    return null;
                  }

                  var data = {
                    items: items
                  };

                  if (keys) {
                    // auth params are only needed when encrypted with a standard file key
                    data["auth_params"] = authParams;
                  }

                  return JSON.stringify(data, null, 2
                  /* pretty print */
                  );
                }));

              case 1:
              case "end":
                return _context46.stop();
            }
          }
        }, _callee45);
      }));

      function getJSONDataForItems(_x88, _x89, _x90, _x91) {
        return _getJSONDataForItems.apply(this, arguments);
      }

      return getJSONDataForItems;
    }()
  }, {
    key: "computeDataIntegrityHash",
    value: function () {
      var _computeDataIntegrityHash = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee46() {
        var items, dates, string, hash;
        return regeneratorRuntime.wrap(function _callee46$(_context47) {
          while (1) {
            switch (_context47.prev = _context47.next) {
              case 0:
                _context47.prev = 0;
                items = this.allNondummyItems.sort(function (a, b) {
                  return b.updated_at - a.updated_at;
                });
                dates = items.map(function (item) {
                  return item.updatedAtTimestamp();
                });
                string = dates.join(",");
                _context47.next = 6;
                return SFJS.crypto.sha256(string);

              case 6:
                hash = _context47.sent;
                return _context47.abrupt("return", hash);

              case 10:
                _context47.prev = 10;
                _context47.t0 = _context47["catch"](0);
                console.error("Error computing data integrity hash", _context47.t0);
                return _context47.abrupt("return", null);

              case 14:
              case "end":
                return _context47.stop();
            }
          }
        }, _callee46, this, [[0, 10]]);
      }));

      function computeDataIntegrityHash() {
        return _computeDataIntegrityHash.apply(this, arguments);
      }

      return computeDataIntegrityHash;
    }()
  }, {
    key: "allItems",
    get: function get() {
      return this.items.slice();
    }
  }, {
    key: "allNondummyItems",
    get: function get() {
      return this.items.filter(function (item) {
        return !item.dummy;
      });
    }
  }]);

  return SFModelManager;
}();

exports.SFModelManager = SFModelManager;
;

var SFPrivilegesManager =
/*#__PURE__*/
function () {
  function SFPrivilegesManager(modelManager, syncManager, singletonManager) {
    _classCallCheck(this, SFPrivilegesManager);

    this.modelManager = modelManager;
    this.syncManager = syncManager;
    this.singletonManager = singletonManager;
    this.loadPrivileges();
    SFPrivilegesManager.CredentialAccountPassword = "CredentialAccountPassword";
    SFPrivilegesManager.CredentialLocalPasscode = "CredentialLocalPasscode";
    SFPrivilegesManager.ActionManageExtensions = "ActionManageExtensions";
    SFPrivilegesManager.ActionManageBackups = "ActionManageBackups";
    SFPrivilegesManager.ActionViewProtectedNotes = "ActionViewProtectedNotes";
    SFPrivilegesManager.ActionManagePrivileges = "ActionManagePrivileges";
    SFPrivilegesManager.ActionManagePasscode = "ActionManagePasscode";
    SFPrivilegesManager.ActionDeleteNote = "ActionDeleteNote";
    SFPrivilegesManager.SessionExpiresAtKey = "SessionExpiresAtKey";
    SFPrivilegesManager.SessionLengthKey = "SessionLengthKey";
    SFPrivilegesManager.SessionLengthNone = 0;
    SFPrivilegesManager.SessionLengthFiveMinutes = 300;
    SFPrivilegesManager.SessionLengthOneHour = 3600;
    SFPrivilegesManager.SessionLengthOneWeek = 604800;
    this.availableActions = [SFPrivilegesManager.ActionViewProtectedNotes, SFPrivilegesManager.ActionDeleteNote, SFPrivilegesManager.ActionManagePasscode, SFPrivilegesManager.ActionManageBackups, SFPrivilegesManager.ActionManageExtensions, SFPrivilegesManager.ActionManagePrivileges];
    this.availableCredentials = [SFPrivilegesManager.CredentialAccountPassword, SFPrivilegesManager.CredentialLocalPasscode];
    this.sessionLengths = [SFPrivilegesManager.SessionLengthNone, SFPrivilegesManager.SessionLengthFiveMinutes, SFPrivilegesManager.SessionLengthOneHour, SFPrivilegesManager.SessionLengthOneWeek, SFPrivilegesManager.SessionLengthIndefinite];
  }
  /*
  async delegate.isOffline()
  async delegate.hasLocalPasscode()
  async delegate.saveToStorage(key, value)
  async delegate.getFromStorage(key)
  async delegate.verifyAccountPassword
  async delegate.verifyLocalPasscode
  */


  _createClass(SFPrivilegesManager, [{
    key: "setDelegate",
    value: function setDelegate(delegate) {
      this.delegate = delegate;
    }
  }, {
    key: "getAvailableActions",
    value: function getAvailableActions() {
      return this.availableActions;
    }
  }, {
    key: "getAvailableCredentials",
    value: function getAvailableCredentials() {
      return this.availableCredentials;
    }
  }, {
    key: "netCredentialsForAction",
    value: function () {
      var _netCredentialsForAction = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee47(action) {
        var credentials, netCredentials, _iteratorNormalCompletion29, _didIteratorError29, _iteratorError29, _iterator29, _step29, cred, isOffline, hasLocalPasscode;

        return regeneratorRuntime.wrap(function _callee47$(_context48) {
          while (1) {
            switch (_context48.prev = _context48.next) {
              case 0:
                _context48.next = 2;
                return this.getPrivileges();

              case 2:
                _context48.t0 = action;
                credentials = _context48.sent.getCredentialsForAction(_context48.t0);
                netCredentials = [];
                _iteratorNormalCompletion29 = true;
                _didIteratorError29 = false;
                _iteratorError29 = undefined;
                _context48.prev = 8;
                _iterator29 = credentials[Symbol.iterator]();

              case 10:
                if (_iteratorNormalCompletion29 = (_step29 = _iterator29.next()).done) {
                  _context48.next = 27;
                  break;
                }

                cred = _step29.value;

                if (!(cred == SFPrivilegesManager.CredentialAccountPassword)) {
                  _context48.next = 19;
                  break;
                }

                _context48.next = 15;
                return this.delegate.isOffline();

              case 15:
                isOffline = _context48.sent;

                if (!isOffline) {
                  netCredentials.push(cred);
                }

                _context48.next = 24;
                break;

              case 19:
                if (!(cred == SFPrivilegesManager.CredentialLocalPasscode)) {
                  _context48.next = 24;
                  break;
                }

                _context48.next = 22;
                return this.delegate.hasLocalPasscode();

              case 22:
                hasLocalPasscode = _context48.sent;

                if (hasLocalPasscode) {
                  netCredentials.push(cred);
                }

              case 24:
                _iteratorNormalCompletion29 = true;
                _context48.next = 10;
                break;

              case 27:
                _context48.next = 33;
                break;

              case 29:
                _context48.prev = 29;
                _context48.t1 = _context48["catch"](8);
                _didIteratorError29 = true;
                _iteratorError29 = _context48.t1;

              case 33:
                _context48.prev = 33;
                _context48.prev = 34;

                if (!_iteratorNormalCompletion29 && _iterator29["return"] != null) {
                  _iterator29["return"]();
                }

              case 36:
                _context48.prev = 36;

                if (!_didIteratorError29) {
                  _context48.next = 39;
                  break;
                }

                throw _iteratorError29;

              case 39:
                return _context48.finish(36);

              case 40:
                return _context48.finish(33);

              case 41:
                return _context48.abrupt("return", netCredentials);

              case 42:
              case "end":
                return _context48.stop();
            }
          }
        }, _callee47, this, [[8, 29, 33, 41], [34,, 36, 40]]);
      }));

      function netCredentialsForAction(_x92) {
        return _netCredentialsForAction.apply(this, arguments);
      }

      return netCredentialsForAction;
    }()
  }, {
    key: "loadPrivileges",
    value: function () {
      var _loadPrivileges = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee49() {
        var _this12 = this;

        return regeneratorRuntime.wrap(function _callee49$(_context50) {
          while (1) {
            switch (_context50.prev = _context50.next) {
              case 0:
                if (!this.loadPromise) {
                  _context50.next = 2;
                  break;
                }

                return _context50.abrupt("return", this.loadPromise);

              case 2:
                this.loadPromise = new Promise(function (resolve, reject) {
                  var privsContentType = SFPrivileges.contentType();
                  var contentTypePredicate = new SFPredicate("content_type", "=", privsContentType);

                  _this12.singletonManager.registerSingleton([contentTypePredicate], function (resolvedSingleton) {
                    _this12.privileges = resolvedSingleton;
                    resolve(resolvedSingleton);
                  },
                  /*#__PURE__*/
                  function () {
                    var _ref14 = _asyncToGenerator(
                    /*#__PURE__*/
                    regeneratorRuntime.mark(function _callee48(valueCallback) {
                      var privs;
                      return regeneratorRuntime.wrap(function _callee48$(_context49) {
                        while (1) {
                          switch (_context49.prev = _context49.next) {
                            case 0:
                              // Safe to create. Create and return object.
                              privs = new SFPrivileges({
                                content_type: privsContentType
                              });

                              if (SFJS.crypto.generateUUIDSync) {
                                _context49.next = 4;
                                break;
                              }

                              _context49.next = 4;
                              return privs.initUUID();

                            case 4:
                              _this12.modelManager.addItem(privs);

                              _this12.modelManager.setItemDirty(privs, true);

                              _this12.syncManager.sync();

                              valueCallback(privs);
                              resolve(privs);

                            case 9:
                            case "end":
                              return _context49.stop();
                          }
                        }
                      }, _callee48);
                    }));

                    return function (_x93) {
                      return _ref14.apply(this, arguments);
                    };
                  }());
                });
                return _context50.abrupt("return", this.loadPromise);

              case 4:
              case "end":
                return _context50.stop();
            }
          }
        }, _callee49, this);
      }));

      function loadPrivileges() {
        return _loadPrivileges.apply(this, arguments);
      }

      return loadPrivileges;
    }()
  }, {
    key: "getPrivileges",
    value: function () {
      var _getPrivileges = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee50() {
        return regeneratorRuntime.wrap(function _callee50$(_context51) {
          while (1) {
            switch (_context51.prev = _context51.next) {
              case 0:
                if (!this.privileges) {
                  _context51.next = 4;
                  break;
                }

                return _context51.abrupt("return", this.privileges);

              case 4:
                return _context51.abrupt("return", this.loadPrivileges());

              case 5:
              case "end":
                return _context51.stop();
            }
          }
        }, _callee50, this);
      }));

      function getPrivileges() {
        return _getPrivileges.apply(this, arguments);
      }

      return getPrivileges;
    }()
  }, {
    key: "displayInfoForCredential",
    value: function displayInfoForCredential(credential) {
      var metadata = {};
      metadata[SFPrivilegesManager.CredentialAccountPassword] = {
        label: "Account Password",
        prompt: "Please enter your account password."
      };
      metadata[SFPrivilegesManager.CredentialLocalPasscode] = {
        label: "Local Passcode",
        prompt: "Please enter your local passcode."
      };
      return metadata[credential];
    }
  }, {
    key: "displayInfoForAction",
    value: function displayInfoForAction(action) {
      var metadata = {};
      metadata[SFPrivilegesManager.ActionManageExtensions] = {
        label: "Manage Extensions"
      };
      metadata[SFPrivilegesManager.ActionManageBackups] = {
        label: "Download/Import Backups"
      };
      metadata[SFPrivilegesManager.ActionViewProtectedNotes] = {
        label: "View Protected Notes"
      };
      metadata[SFPrivilegesManager.ActionManagePrivileges] = {
        label: "Manage Privileges"
      };
      metadata[SFPrivilegesManager.ActionManagePasscode] = {
        label: "Manage Passcode"
      };
      metadata[SFPrivilegesManager.ActionDeleteNote] = {
        label: "Delete Notes"
      };
      return metadata[action];
    }
  }, {
    key: "getSessionLengthOptions",
    value: function getSessionLengthOptions() {
      return [{
        value: SFPrivilegesManager.SessionLengthNone,
        label: "Don't Remember"
      }, {
        value: SFPrivilegesManager.SessionLengthFiveMinutes,
        label: "5 Minutes"
      }, {
        value: SFPrivilegesManager.SessionLengthOneHour,
        label: "1 Hour"
      }, {
        value: SFPrivilegesManager.SessionLengthOneWeek,
        label: "1 Week"
      }];
    }
  }, {
    key: "setSessionLength",
    value: function () {
      var _setSessionLength = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee51(length) {
        var addToNow, expiresAt;
        return regeneratorRuntime.wrap(function _callee51$(_context52) {
          while (1) {
            switch (_context52.prev = _context52.next) {
              case 0:
                addToNow = function addToNow(seconds) {
                  var date = new Date();
                  date.setSeconds(date.getSeconds() + seconds);
                  return date;
                };

                expiresAt = addToNow(length);
                return _context52.abrupt("return", Promise.all([this.delegate.saveToStorage(SFPrivilegesManager.SessionExpiresAtKey, JSON.stringify(expiresAt)), this.delegate.saveToStorage(SFPrivilegesManager.SessionLengthKey, JSON.stringify(length))]));

              case 3:
              case "end":
                return _context52.stop();
            }
          }
        }, _callee51, this);
      }));

      function setSessionLength(_x94) {
        return _setSessionLength.apply(this, arguments);
      }

      return setSessionLength;
    }()
  }, {
    key: "clearSession",
    value: function () {
      var _clearSession = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee52() {
        return regeneratorRuntime.wrap(function _callee52$(_context53) {
          while (1) {
            switch (_context53.prev = _context53.next) {
              case 0:
                return _context53.abrupt("return", this.setSessionLength(SFPrivilegesManager.SessionLengthNone));

              case 1:
              case "end":
                return _context53.stop();
            }
          }
        }, _callee52, this);
      }));

      function clearSession() {
        return _clearSession.apply(this, arguments);
      }

      return clearSession;
    }()
  }, {
    key: "getSelectedSessionLength",
    value: function () {
      var _getSelectedSessionLength = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee53() {
        var length;
        return regeneratorRuntime.wrap(function _callee53$(_context54) {
          while (1) {
            switch (_context54.prev = _context54.next) {
              case 0:
                _context54.next = 2;
                return this.delegate.getFromStorage(SFPrivilegesManager.SessionLengthKey);

              case 2:
                length = _context54.sent;

                if (!length) {
                  _context54.next = 7;
                  break;
                }

                return _context54.abrupt("return", JSON.parse(length));

              case 7:
                return _context54.abrupt("return", SFPrivilegesManager.SessionLengthNone);

              case 8:
              case "end":
                return _context54.stop();
            }
          }
        }, _callee53, this);
      }));

      function getSelectedSessionLength() {
        return _getSelectedSessionLength.apply(this, arguments);
      }

      return getSelectedSessionLength;
    }()
  }, {
    key: "getSessionExpirey",
    value: function () {
      var _getSessionExpirey = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee54() {
        var expiresAt;
        return regeneratorRuntime.wrap(function _callee54$(_context55) {
          while (1) {
            switch (_context55.prev = _context55.next) {
              case 0:
                _context55.next = 2;
                return this.delegate.getFromStorage(SFPrivilegesManager.SessionExpiresAtKey);

              case 2:
                expiresAt = _context55.sent;

                if (!expiresAt) {
                  _context55.next = 7;
                  break;
                }

                return _context55.abrupt("return", new Date(JSON.parse(expiresAt)));

              case 7:
                return _context55.abrupt("return", new Date());

              case 8:
              case "end":
                return _context55.stop();
            }
          }
        }, _callee54, this);
      }));

      function getSessionExpirey() {
        return _getSessionExpirey.apply(this, arguments);
      }

      return getSessionExpirey;
    }()
  }, {
    key: "actionHasPrivilegesConfigured",
    value: function () {
      var _actionHasPrivilegesConfigured = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee55(action) {
        return regeneratorRuntime.wrap(function _callee55$(_context56) {
          while (1) {
            switch (_context56.prev = _context56.next) {
              case 0:
                _context56.next = 2;
                return this.netCredentialsForAction(action);

              case 2:
                _context56.t0 = _context56.sent.length;
                return _context56.abrupt("return", _context56.t0 > 0);

              case 4:
              case "end":
                return _context56.stop();
            }
          }
        }, _callee55, this);
      }));

      function actionHasPrivilegesConfigured(_x95) {
        return _actionHasPrivilegesConfigured.apply(this, arguments);
      }

      return actionHasPrivilegesConfigured;
    }()
  }, {
    key: "actionRequiresPrivilege",
    value: function () {
      var _actionRequiresPrivilege = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee56(action) {
        var expiresAt, netCredentials;
        return regeneratorRuntime.wrap(function _callee56$(_context57) {
          while (1) {
            switch (_context57.prev = _context57.next) {
              case 0:
                _context57.next = 2;
                return this.getSessionExpirey();

              case 2:
                expiresAt = _context57.sent;

                if (!(expiresAt > new Date())) {
                  _context57.next = 5;
                  break;
                }

                return _context57.abrupt("return", false);

              case 5:
                _context57.next = 7;
                return this.netCredentialsForAction(action);

              case 7:
                netCredentials = _context57.sent;
                return _context57.abrupt("return", netCredentials.length > 0);

              case 9:
              case "end":
                return _context57.stop();
            }
          }
        }, _callee56, this);
      }));

      function actionRequiresPrivilege(_x96) {
        return _actionRequiresPrivilege.apply(this, arguments);
      }

      return actionRequiresPrivilege;
    }()
  }, {
    key: "savePrivileges",
    value: function () {
      var _savePrivileges = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee57() {
        var privs;
        return regeneratorRuntime.wrap(function _callee57$(_context58) {
          while (1) {
            switch (_context58.prev = _context58.next) {
              case 0:
                _context58.next = 2;
                return this.getPrivileges();

              case 2:
                privs = _context58.sent;
                this.modelManager.setItemDirty(privs, true);
                this.syncManager.sync();

              case 5:
              case "end":
                return _context58.stop();
            }
          }
        }, _callee57, this);
      }));

      function savePrivileges() {
        return _savePrivileges.apply(this, arguments);
      }

      return savePrivileges;
    }()
  }, {
    key: "authenticateAction",
    value: function () {
      var _authenticateAction = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee58(action, credentialAuthMapping) {
        var requiredCredentials, successfulCredentials, failedCredentials, _iteratorNormalCompletion30, _didIteratorError30, _iteratorError30, _iterator30, _step30, requiredCredential, passesAuth;

        return regeneratorRuntime.wrap(function _callee58$(_context59) {
          while (1) {
            switch (_context59.prev = _context59.next) {
              case 0:
                _context59.next = 2;
                return this.netCredentialsForAction(action);

              case 2:
                requiredCredentials = _context59.sent;
                successfulCredentials = [], failedCredentials = [];
                _iteratorNormalCompletion30 = true;
                _didIteratorError30 = false;
                _iteratorError30 = undefined;
                _context59.prev = 7;
                _iterator30 = requiredCredentials[Symbol.iterator]();

              case 9:
                if (_iteratorNormalCompletion30 = (_step30 = _iterator30.next()).done) {
                  _context59.next = 18;
                  break;
                }

                requiredCredential = _step30.value;
                _context59.next = 13;
                return this._verifyAuthenticationParameters(requiredCredential, credentialAuthMapping[requiredCredential]);

              case 13:
                passesAuth = _context59.sent;

                if (passesAuth) {
                  successfulCredentials.push(requiredCredential);
                } else {
                  failedCredentials.push(requiredCredential);
                }

              case 15:
                _iteratorNormalCompletion30 = true;
                _context59.next = 9;
                break;

              case 18:
                _context59.next = 24;
                break;

              case 20:
                _context59.prev = 20;
                _context59.t0 = _context59["catch"](7);
                _didIteratorError30 = true;
                _iteratorError30 = _context59.t0;

              case 24:
                _context59.prev = 24;
                _context59.prev = 25;

                if (!_iteratorNormalCompletion30 && _iterator30["return"] != null) {
                  _iterator30["return"]();
                }

              case 27:
                _context59.prev = 27;

                if (!_didIteratorError30) {
                  _context59.next = 30;
                  break;
                }

                throw _iteratorError30;

              case 30:
                return _context59.finish(27);

              case 31:
                return _context59.finish(24);

              case 32:
                return _context59.abrupt("return", {
                  success: failedCredentials.length == 0,
                  successfulCredentials: successfulCredentials,
                  failedCredentials: failedCredentials
                });

              case 33:
              case "end":
                return _context59.stop();
            }
          }
        }, _callee58, this, [[7, 20, 24, 32], [25,, 27, 31]]);
      }));

      function authenticateAction(_x97, _x98) {
        return _authenticateAction.apply(this, arguments);
      }

      return authenticateAction;
    }()
  }, {
    key: "_verifyAuthenticationParameters",
    value: function () {
      var _verifyAuthenticationParameters2 = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee61(credential, value) {
        var _this13 = this;

        var verifyAccountPassword, verifyLocalPasscode;
        return regeneratorRuntime.wrap(function _callee61$(_context62) {
          while (1) {
            switch (_context62.prev = _context62.next) {
              case 0:
                verifyAccountPassword =
                /*#__PURE__*/
                function () {
                  var _ref15 = _asyncToGenerator(
                  /*#__PURE__*/
                  regeneratorRuntime.mark(function _callee59(password) {
                    return regeneratorRuntime.wrap(function _callee59$(_context60) {
                      while (1) {
                        switch (_context60.prev = _context60.next) {
                          case 0:
                            return _context60.abrupt("return", _this13.delegate.verifyAccountPassword(password));

                          case 1:
                          case "end":
                            return _context60.stop();
                        }
                      }
                    }, _callee59);
                  }));

                  return function verifyAccountPassword(_x101) {
                    return _ref15.apply(this, arguments);
                  };
                }();

                verifyLocalPasscode =
                /*#__PURE__*/
                function () {
                  var _ref16 = _asyncToGenerator(
                  /*#__PURE__*/
                  regeneratorRuntime.mark(function _callee60(passcode) {
                    return regeneratorRuntime.wrap(function _callee60$(_context61) {
                      while (1) {
                        switch (_context61.prev = _context61.next) {
                          case 0:
                            return _context61.abrupt("return", _this13.delegate.verifyLocalPasscode(passcode));

                          case 1:
                          case "end":
                            return _context61.stop();
                        }
                      }
                    }, _callee60);
                  }));

                  return function verifyLocalPasscode(_x102) {
                    return _ref16.apply(this, arguments);
                  };
                }();

                if (!(credential == SFPrivilegesManager.CredentialAccountPassword)) {
                  _context62.next = 6;
                  break;
                }

                return _context62.abrupt("return", verifyAccountPassword(value));

              case 6:
                if (!(credential == SFPrivilegesManager.CredentialLocalPasscode)) {
                  _context62.next = 8;
                  break;
                }

                return _context62.abrupt("return", verifyLocalPasscode(value));

              case 8:
              case "end":
                return _context62.stop();
            }
          }
        }, _callee61);
      }));

      function _verifyAuthenticationParameters(_x99, _x100) {
        return _verifyAuthenticationParameters2.apply(this, arguments);
      }

      return _verifyAuthenticationParameters;
    }()
  }]);

  return SFPrivilegesManager;
}();

exports.SFPrivilegesManager = SFPrivilegesManager;
;
var SessionHistoryPersistKey = "sessionHistory_persist";
var SessionHistoryRevisionsKey = "sessionHistory_revisions";
var SessionHistoryAutoOptimizeKey = "sessionHistory_autoOptimize";

var SFSessionHistoryManager =
/*#__PURE__*/
function () {
  function SFSessionHistoryManager(modelManager, storageManager, keyRequestHandler, contentTypes, timeout) {
    var _this14 = this;

    _classCallCheck(this, SFSessionHistoryManager);

    this.modelManager = modelManager;
    this.storageManager = storageManager;
    this.$timeout = timeout || setTimeout.bind(window); // Required to persist the encrypted form of SFHistorySession

    this.keyRequestHandler = keyRequestHandler;
    this.loadFromDisk().then(function () {
      _this14.modelManager.addItemSyncObserver("session-history", contentTypes, function (allItems, validItems, deletedItems, source, sourceKey) {
        if (source === SFModelManager.MappingSourceLocalDirtied) {
          return;
        }

        var _iteratorNormalCompletion31 = true;
        var _didIteratorError31 = false;
        var _iteratorError31 = undefined;

        try {
          for (var _iterator31 = allItems[Symbol.iterator](), _step31; !(_iteratorNormalCompletion31 = (_step31 = _iterator31.next()).done); _iteratorNormalCompletion31 = true) {
            var item = _step31.value;

            try {
              _this14.addHistoryEntryForItem(item);
            } catch (e) {
              console.log("Caught exception while trying to add item history entry", e);
            }
          }
        } catch (err) {
          _didIteratorError31 = true;
          _iteratorError31 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion31 && _iterator31["return"] != null) {
              _iterator31["return"]();
            }
          } finally {
            if (_didIteratorError31) {
              throw _iteratorError31;
            }
          }
        }
      });
    });
  }

  _createClass(SFSessionHistoryManager, [{
    key: "encryptionParams",
    value: function () {
      var _encryptionParams = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee62() {
        return regeneratorRuntime.wrap(function _callee62$(_context63) {
          while (1) {
            switch (_context63.prev = _context63.next) {
              case 0:
                return _context63.abrupt("return", this.keyRequestHandler());

              case 1:
              case "end":
                return _context63.stop();
            }
          }
        }, _callee62, this);
      }));

      function encryptionParams() {
        return _encryptionParams.apply(this, arguments);
      }

      return encryptionParams;
    }()
  }, {
    key: "addHistoryEntryForItem",
    value: function addHistoryEntryForItem(item) {
      var _this15 = this;

      var persistableItemParams = {
        uuid: item.uuid,
        content_type: item.content_type,
        updated_at: item.updated_at,
        content: item.getContentCopy()
      };
      var entry = this.historySession.addEntryForItem(persistableItemParams);

      if (this.autoOptimize) {
        this.historySession.optimizeHistoryForItem(item);
      }

      if (entry && this.diskEnabled) {
        // Debounce, clear existing timeout
        if (this.diskTimeout) {
          if (this.$timeout.hasOwnProperty("cancel")) {
            this.$timeout.cancel(this.diskTimeout);
          } else {
            clearTimeout(this.diskTimeout);
          }
        }

        ;
        this.diskTimeout = this.$timeout(function () {
          _this15.saveToDisk();
        }, 2000);
      }
    }
  }, {
    key: "historyForItem",
    value: function historyForItem(item) {
      return this.historySession.historyForItem(item);
    }
  }, {
    key: "clearHistoryForItem",
    value: function () {
      var _clearHistoryForItem = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee63(item) {
        return regeneratorRuntime.wrap(function _callee63$(_context64) {
          while (1) {
            switch (_context64.prev = _context64.next) {
              case 0:
                this.historySession.clearItemHistory(item);
                return _context64.abrupt("return", this.saveToDisk());

              case 2:
              case "end":
                return _context64.stop();
            }
          }
        }, _callee63, this);
      }));

      function clearHistoryForItem(_x103) {
        return _clearHistoryForItem.apply(this, arguments);
      }

      return clearHistoryForItem;
    }()
  }, {
    key: "clearAllHistory",
    value: function () {
      var _clearAllHistory = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee64() {
        return regeneratorRuntime.wrap(function _callee64$(_context65) {
          while (1) {
            switch (_context65.prev = _context65.next) {
              case 0:
                this.historySession.clearAllHistory();
                return _context65.abrupt("return", this.storageManager.removeItem(SessionHistoryRevisionsKey));

              case 2:
              case "end":
                return _context65.stop();
            }
          }
        }, _callee64, this);
      }));

      function clearAllHistory() {
        return _clearAllHistory.apply(this, arguments);
      }

      return clearAllHistory;
    }()
  }, {
    key: "toggleDiskSaving",
    value: function () {
      var _toggleDiskSaving = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee65() {
        return regeneratorRuntime.wrap(function _callee65$(_context66) {
          while (1) {
            switch (_context66.prev = _context66.next) {
              case 0:
                this.diskEnabled = !this.diskEnabled;

                if (!this.diskEnabled) {
                  _context66.next = 6;
                  break;
                }

                this.storageManager.setItem(SessionHistoryPersistKey, JSON.stringify(true));
                this.saveToDisk();
                _context66.next = 8;
                break;

              case 6:
                this.storageManager.setItem(SessionHistoryPersistKey, JSON.stringify(false));
                return _context66.abrupt("return", this.storageManager.removeItem(SessionHistoryRevisionsKey));

              case 8:
              case "end":
                return _context66.stop();
            }
          }
        }, _callee65, this);
      }));

      function toggleDiskSaving() {
        return _toggleDiskSaving.apply(this, arguments);
      }

      return toggleDiskSaving;
    }()
  }, {
    key: "saveToDisk",
    value: function () {
      var _saveToDisk = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee66() {
        var _this16 = this;

        var encryptionParams, itemParams;
        return regeneratorRuntime.wrap(function _callee66$(_context67) {
          while (1) {
            switch (_context67.prev = _context67.next) {
              case 0:
                if (this.diskEnabled) {
                  _context67.next = 2;
                  break;
                }

                return _context67.abrupt("return");

              case 2:
                _context67.next = 4;
                return this.encryptionParams();

              case 4:
                encryptionParams = _context67.sent;
                itemParams = new SFItemParams(this.historySession, encryptionParams.keys, encryptionParams.auth_params);
                itemParams.paramsForSync().then(function (syncParams) {
                  // console.log("Saving to disk", syncParams);
                  _this16.storageManager.setItem(SessionHistoryRevisionsKey, JSON.stringify(syncParams));
                });

              case 7:
              case "end":
                return _context67.stop();
            }
          }
        }, _callee66, this);
      }));

      function saveToDisk() {
        return _saveToDisk.apply(this, arguments);
      }

      return saveToDisk;
    }()
  }, {
    key: "loadFromDisk",
    value: function () {
      var _loadFromDisk = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee67() {
        var diskValue, historyValue, encryptionParams, historySession, autoOptimizeValue;
        return regeneratorRuntime.wrap(function _callee67$(_context68) {
          while (1) {
            switch (_context68.prev = _context68.next) {
              case 0:
                _context68.next = 2;
                return this.storageManager.getItem(SessionHistoryPersistKey);

              case 2:
                diskValue = _context68.sent;

                if (diskValue) {
                  this.diskEnabled = JSON.parse(diskValue);
                }

                _context68.next = 6;
                return this.storageManager.getItem(SessionHistoryRevisionsKey);

              case 6:
                historyValue = _context68.sent;

                if (!historyValue) {
                  _context68.next = 18;
                  break;
                }

                historyValue = JSON.parse(historyValue);
                _context68.next = 11;
                return this.encryptionParams();

              case 11:
                encryptionParams = _context68.sent;
                _context68.next = 14;
                return SFJS.itemTransformer.decryptItem(historyValue, encryptionParams.keys);

              case 14:
                historySession = new SFHistorySession(historyValue);
                this.historySession = historySession;
                _context68.next = 19;
                break;

              case 18:
                this.historySession = new SFHistorySession();

              case 19:
                _context68.next = 21;
                return this.storageManager.getItem(SessionHistoryAutoOptimizeKey);

              case 21:
                autoOptimizeValue = _context68.sent;

                if (autoOptimizeValue) {
                  this.autoOptimize = JSON.parse(autoOptimizeValue);
                } else {
                  // default value is true
                  this.autoOptimize = true;
                }

              case 23:
              case "end":
                return _context68.stop();
            }
          }
        }, _callee67, this);
      }));

      function loadFromDisk() {
        return _loadFromDisk.apply(this, arguments);
      }

      return loadFromDisk;
    }()
  }, {
    key: "toggleAutoOptimize",
    value: function () {
      var _toggleAutoOptimize = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee68() {
        return regeneratorRuntime.wrap(function _callee68$(_context69) {
          while (1) {
            switch (_context69.prev = _context69.next) {
              case 0:
                this.autoOptimize = !this.autoOptimize;

                if (this.autoOptimize) {
                  this.storageManager.setItem(SessionHistoryAutoOptimizeKey, JSON.stringify(true));
                } else {
                  this.storageManager.setItem(SessionHistoryAutoOptimizeKey, JSON.stringify(false));
                }

              case 2:
              case "end":
                return _context69.stop();
            }
          }
        }, _callee68, this);
      }));

      function toggleAutoOptimize() {
        return _toggleAutoOptimize.apply(this, arguments);
      }

      return toggleAutoOptimize;
    }()
  }]);

  return SFSessionHistoryManager;
}();

exports.SFSessionHistoryManager = SFSessionHistoryManager;
;
/*
 The SingletonManager allows controllers to register an item as a singleton, which means only one instance of that model
 should exist, both on the server and on the client. When the SingletonManager detects multiple items matching the singleton predicate,
 the oldest ones will be deleted, leaving the newest ones. (See 4/28/18 update. We now choose the earliest created one as the winner.).
  (This no longer fully applies, See 4/28/18 update.) We will treat the model most recently arrived from the server as the most recent one. The reason for this is,
 if you're offline, a singleton can be created, as in the case of UserPreferneces. Then when you sign in, you'll retrieve your actual user preferences.
 In that case, even though the offline singleton has a more recent updated_at, the server retreived value is the one we care more about.
  4/28/18: I'm seeing this issue: if you have the app open in one window, then in another window sign in, and during sign in,
 click Refresh (or autorefresh occurs) in the original signed in window, then you will happen to receive from the server the newly created
 Extensions singleton, and it will be mistaken (it just looks like a regular retrieved item, since nothing is in saved) for a fresh, latest copy, and replace the current instance.
 This has happened to me and many users.
 A puzzling issue, but what if instead of resolving singletons by choosing the one most recently modified, we choose the one with the earliest create date?
 This way, we don't care when it was modified, but we always, always choose the item that was created first. This way, we always deal with the same item.
*/

var SFSingletonManager =
/*#__PURE__*/
function () {
  function SFSingletonManager(modelManager, syncManager) {
    var _this17 = this;

    _classCallCheck(this, SFSingletonManager);

    this.syncManager = syncManager;
    this.modelManager = modelManager;
    this.singletonHandlers = []; // We use sync observer instead of syncEvent `local-data-incremental-load`, because we want singletons
    // to resolve with the first priority, because they generally dictate app state.
    // If we used local-data-incremental-load, and 1 item was important singleton and 99 were heavy components,
    // then given the random nature of notifiying observers, the heavy components would spend a lot of time loading first,
    // here, we priortize ours loading as most important

    modelManager.addItemSyncObserverWithPriority({
      id: "sf-singleton-manager",
      types: "*",
      priority: -1,
      callback: function callback(allItems, validItems, deletedItems, source, sourceKey) {
        // Inside resolveSingletons, we are going to set items as dirty. If we don't stop here it will be infinite recursion.
        if (source === SFModelManager.MappingSourceLocalDirtied) {
          return;
        }

        _this17.resolveSingletons(modelManager.allNondummyItems, null, true);
      }
    });
    syncManager.addEventHandler(function (syncEvent, data) {
      if (syncEvent == "local-data-loaded") {
        _this17.resolveSingletons(modelManager.allNondummyItems, null, true);

        _this17.initialDataLoaded = true;
      } else if (syncEvent == "sync:completed") {
        // Wait for initial data load before handling any sync. If we don't want for initial data load,
        // then the singleton resolver won't have the proper items to work with to determine whether to resolve or create.
        if (!_this17.initialDataLoaded) {
          return;
        } // The reason we also need to consider savedItems in consolidating singletons is in case of sync conflicts,
        // a new item can be created, but is never processed through "retrievedItems" since it is only created locally then saved.
        // HOWEVER, by considering savedItems, we are now ruining everything, especially during sign in. A singleton can be created
        // offline, and upon sign in, will sync all items to the server, and by combining retrievedItems & savedItems, and only choosing
        // the latest, you are now resolving to the most recent one, which is in the savedItems list and not retrieved items, defeating
        // the whole purpose of this thing.
        // Updated solution: resolveSingletons will now evaluate both of these arrays separately.


        _this17.resolveSingletons(data.retrievedItems, data.savedItems);
      }
    });
    /*
      If an item alternates its uuid on registration, singletonHandlers might need to update
      their local reference to the object, since the object reference will change on uuid alternation
    */

    modelManager.addModelUuidChangeObserver("singleton-manager", function (oldModel, newModel) {
      var _iteratorNormalCompletion32 = true;
      var _didIteratorError32 = false;
      var _iteratorError32 = undefined;

      try {
        for (var _iterator32 = _this17.singletonHandlers[Symbol.iterator](), _step32; !(_iteratorNormalCompletion32 = (_step32 = _iterator32.next()).done); _iteratorNormalCompletion32 = true) {
          var handler = _step32.value;

          if (handler.singleton && SFPredicate.ItemSatisfiesPredicates(newModel, handler.predicates)) {
            // Reference is now invalid, calling resolveSingleton should update it
            handler.singleton = null;

            _this17.resolveSingletons([newModel]);
          }
        }
      } catch (err) {
        _didIteratorError32 = true;
        _iteratorError32 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion32 && _iterator32["return"] != null) {
            _iterator32["return"]();
          }
        } finally {
          if (_didIteratorError32) {
            throw _iteratorError32;
          }
        }
      }
    });
  }

  _createClass(SFSingletonManager, [{
    key: "registerSingleton",
    value: function registerSingleton(predicates, resolveCallback, createBlock) {
      /*
      predicate: a key/value pair that specifies properties that should match in order for an item to be considered a predicate
      resolveCallback: called when one or more items are deleted and a new item becomes the reigning singleton
      createBlock: called when a sync is complete and no items are found. The createBlock should create the item and return it.
      */
      this.singletonHandlers.push({
        predicates: predicates,
        resolutionCallback: resolveCallback,
        createBlock: createBlock
      });
    }
  }, {
    key: "resolveSingletons",
    value: function resolveSingletons(retrievedItems, savedItems, initialLoad) {
      var _this18 = this;

      retrievedItems = retrievedItems || [];
      savedItems = savedItems || [];
      var _iteratorNormalCompletion33 = true;
      var _didIteratorError33 = false;
      var _iteratorError33 = undefined;

      try {
        var _loop3 = function _loop3() {
          var singletonHandler = _step33.value;
          var predicates = singletonHandler.predicates.slice();

          var retrievedSingletonItems = _this18.modelManager.filterItemsWithPredicates(retrievedItems, predicates);

          var handleCreation = function handleCreation() {
            if (singletonHandler.createBlock) {
              singletonHandler.pendingCreateBlockCallback = true;
              singletonHandler.createBlock(function (created) {
                singletonHandler.singleton = created;
                singletonHandler.pendingCreateBlockCallback = false;
                singletonHandler.resolutionCallback && singletonHandler.resolutionCallback(created);
              });
            }
          }; // We only want to consider saved items count to see if it's more than 0, and do nothing else with it.
          // This way we know there was some action and things need to be resolved. The saved items will come up
          // in filterItemsWithPredicate(this.modelManager.allNondummyItems) and be deleted anyway


          var savedSingletonItemsCount = _this18.modelManager.filterItemsWithPredicates(savedItems, predicates).length;

          if (retrievedSingletonItems.length > 0 || savedSingletonItemsCount > 0) {
            /*
              Check local inventory and make sure only 1 similar item exists. If more than 1, delete newest
              Note that this local inventory will also contain whatever is in retrievedItems.
            */
            var allExtantItemsMatchingPredicate = _this18.modelManager.itemsMatchingPredicates(predicates);
            /*
              Delete all but the earliest created
            */


            if (allExtantItemsMatchingPredicate.length >= 2) {
              var sorted = allExtantItemsMatchingPredicate.sort(function (a, b) {
                /*
                  If compareFunction(a, b) is less than 0, sort a to an index lower than b, i.e. a comes first.
                  If compareFunction(a, b) is greater than 0, sort b to an index lower than a, i.e. b comes first.
                */
                if (a.errorDecrypting) {
                  return 1;
                }

                if (b.errorDecrypting) {
                  return -1;
                }

                return a.created_at < b.created_at ? -1 : 1;
              }); // The item that will be chosen to be kept

              var winningItem = sorted[0]; // Items that will be deleted
              // Delete everything but the first one

              var toDelete = sorted.slice(1, sorted.length);
              var _iteratorNormalCompletion34 = true;
              var _didIteratorError34 = false;
              var _iteratorError34 = undefined;

              try {
                for (var _iterator34 = toDelete[Symbol.iterator](), _step34; !(_iteratorNormalCompletion34 = (_step34 = _iterator34.next()).done); _iteratorNormalCompletion34 = true) {
                  var d = _step34.value;

                  _this18.modelManager.setItemToBeDeleted(d);
                }
              } catch (err) {
                _didIteratorError34 = true;
                _iteratorError34 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion34 && _iterator34["return"] != null) {
                    _iterator34["return"]();
                  }
                } finally {
                  if (_didIteratorError34) {
                    throw _iteratorError34;
                  }
                }
              }

              _this18.syncManager.sync(); // Send remaining item to callback


              singletonHandler.singleton = winningItem;
              singletonHandler.resolutionCallback && singletonHandler.resolutionCallback(winningItem);
            } else if (allExtantItemsMatchingPredicate.length == 1) {
              var singleton = allExtantItemsMatchingPredicate[0];

              if (singleton.errorDecrypting) {
                // Delete the current singleton and create a new one
                _this18.modelManager.setItemToBeDeleted(singleton);

                handleCreation();
              } else if (!singletonHandler.singleton || singletonHandler.singleton !== singleton) {
                // Not yet notified interested parties of object
                singletonHandler.singleton = singleton;
                singletonHandler.resolutionCallback && singletonHandler.resolutionCallback(singleton);
              }
            }
          } else {
            // Retrieved items does not include any items of interest. If we don't have a singleton registered to this handler,
            // we need to create one. Only do this on actual sync completetions and not on initial data load. Because we want
            // to get the latest from the server before making the decision to create a new item
            if (!singletonHandler.singleton && !initialLoad && !singletonHandler.pendingCreateBlockCallback) {
              handleCreation();
            }
          }
        };

        for (var _iterator33 = this.singletonHandlers[Symbol.iterator](), _step33; !(_iteratorNormalCompletion33 = (_step33 = _iterator33.next()).done); _iteratorNormalCompletion33 = true) {
          _loop3();
        }
      } catch (err) {
        _didIteratorError33 = true;
        _iteratorError33 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion33 && _iterator33["return"] != null) {
            _iterator33["return"]();
          }
        } finally {
          if (_didIteratorError33) {
            throw _iteratorError33;
          }
        }
      }
    }
  }]);

  return SFSingletonManager;
}();

exports.SFSingletonManager = SFSingletonManager;
; // SFStorageManager should be subclassed, and all the methods below overwritten.

var SFStorageManager =
/*#__PURE__*/
function () {
  function SFStorageManager() {
    _classCallCheck(this, SFStorageManager);
  }

  _createClass(SFStorageManager, [{
    key: "setItem",

    /* Simple Key/Value Storage */
    value: function () {
      var _setItem = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee69(key, value) {
        return regeneratorRuntime.wrap(function _callee69$(_context70) {
          while (1) {
            switch (_context70.prev = _context70.next) {
              case 0:
              case "end":
                return _context70.stop();
            }
          }
        }, _callee69);
      }));

      function setItem(_x104, _x105) {
        return _setItem.apply(this, arguments);
      }

      return setItem;
    }()
  }, {
    key: "getItem",
    value: function () {
      var _getItem = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee70(key) {
        return regeneratorRuntime.wrap(function _callee70$(_context71) {
          while (1) {
            switch (_context71.prev = _context71.next) {
              case 0:
              case "end":
                return _context71.stop();
            }
          }
        }, _callee70);
      }));

      function getItem(_x106) {
        return _getItem.apply(this, arguments);
      }

      return getItem;
    }()
  }, {
    key: "removeItem",
    value: function () {
      var _removeItem = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee71(key) {
        return regeneratorRuntime.wrap(function _callee71$(_context72) {
          while (1) {
            switch (_context72.prev = _context72.next) {
              case 0:
              case "end":
                return _context72.stop();
            }
          }
        }, _callee71);
      }));

      function removeItem(_x107) {
        return _removeItem.apply(this, arguments);
      }

      return removeItem;
    }()
  }, {
    key: "clear",
    value: function () {
      var _clear = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee72() {
        return regeneratorRuntime.wrap(function _callee72$(_context73) {
          while (1) {
            switch (_context73.prev = _context73.next) {
              case 0:
              case "end":
                return _context73.stop();
            }
          }
        }, _callee72);
      }));

      function clear() {
        return _clear.apply(this, arguments);
      }

      return clear;
    }()
  }, {
    key: "getAllModels",

    /*
    Model Storage
    */
    value: function () {
      var _getAllModels = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee73() {
        return regeneratorRuntime.wrap(function _callee73$(_context74) {
          while (1) {
            switch (_context74.prev = _context74.next) {
              case 0:
              case "end":
                return _context74.stop();
            }
          }
        }, _callee73);
      }));

      function getAllModels() {
        return _getAllModels.apply(this, arguments);
      }

      return getAllModels;
    }()
  }, {
    key: "saveModel",
    value: function () {
      var _saveModel = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee74(item) {
        return regeneratorRuntime.wrap(function _callee74$(_context75) {
          while (1) {
            switch (_context75.prev = _context75.next) {
              case 0:
                return _context75.abrupt("return", this.saveModels([item]));

              case 1:
              case "end":
                return _context75.stop();
            }
          }
        }, _callee74, this);
      }));

      function saveModel(_x108) {
        return _saveModel.apply(this, arguments);
      }

      return saveModel;
    }()
  }, {
    key: "saveModels",
    value: function () {
      var _saveModels = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee75(items) {
        return regeneratorRuntime.wrap(function _callee75$(_context76) {
          while (1) {
            switch (_context76.prev = _context76.next) {
              case 0:
              case "end":
                return _context76.stop();
            }
          }
        }, _callee75);
      }));

      function saveModels(_x109) {
        return _saveModels.apply(this, arguments);
      }

      return saveModels;
    }()
  }, {
    key: "deleteModel",
    value: function () {
      var _deleteModel = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee76(item) {
        return regeneratorRuntime.wrap(function _callee76$(_context77) {
          while (1) {
            switch (_context77.prev = _context77.next) {
              case 0:
              case "end":
                return _context77.stop();
            }
          }
        }, _callee76);
      }));

      function deleteModel(_x110) {
        return _deleteModel.apply(this, arguments);
      }

      return deleteModel;
    }()
  }, {
    key: "clearAllModels",
    value: function () {
      var _clearAllModels = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee77() {
        return regeneratorRuntime.wrap(function _callee77$(_context78) {
          while (1) {
            switch (_context78.prev = _context78.next) {
              case 0:
              case "end":
                return _context78.stop();
            }
          }
        }, _callee77);
      }));

      function clearAllModels() {
        return _clearAllModels.apply(this, arguments);
      }

      return clearAllModels;
    }()
  }, {
    key: "clearAllData",

    /* General */
    value: function () {
      var _clearAllData = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee78() {
        return regeneratorRuntime.wrap(function _callee78$(_context79) {
          while (1) {
            switch (_context79.prev = _context79.next) {
              case 0:
                return _context79.abrupt("return", Promise.all([this.clear(), this.clearAllModels()]));

              case 1:
              case "end":
                return _context79.stop();
            }
          }
        }, _callee78, this);
      }));

      function clearAllData() {
        return _clearAllData.apply(this, arguments);
      }

      return clearAllData;
    }()
  }]);

  return SFStorageManager;
}();

exports.SFStorageManager = SFStorageManager;
;

var SFSyncManager =
/*#__PURE__*/
function () {
  function SFSyncManager(modelManager, storageManager, httpManager, timeout, interval) {
    _classCallCheck(this, SFSyncManager);

    SFSyncManager.KeyRequestLoadLocal = "KeyRequestLoadLocal";
    SFSyncManager.KeyRequestSaveLocal = "KeyRequestSaveLocal";
    SFSyncManager.KeyRequestLoadSaveAccount = "KeyRequestLoadSaveAccount";
    this.httpManager = httpManager;
    this.modelManager = modelManager;
    this.storageManager = storageManager; // Allows you to set your own interval/timeout function (i.e if you're using angular and want to use $timeout)

    this.$interval = interval || setInterval.bind(window);
    this.$timeout = timeout || setTimeout.bind(window);
    this.syncStatus = {};
    this.syncStatusObservers = [];
    this.eventHandlers = []; // this.loggingEnabled = true;

    this.PerSyncItemUploadLimit = 150;
    this.ServerItemDownloadLimit = 150; // The number of changed items that constitute a major change
    // This is used by the desktop app to create backups

    this.MajorDataChangeThreshold = 15; // Sync integrity checking
    // If X consective sync requests return mismatching hashes, then we officially enter out-of-sync.

    this.MaxDiscordanceBeforeOutOfSync = 5; // How many consective sync results have had mismatching hashes. This value can never exceed this.MaxDiscordanceBeforeOutOfSync.

    this.syncDiscordance = 0;
    this.outOfSync = false;
  }

  _createClass(SFSyncManager, [{
    key: "handleServerIntegrityHash",
    value: function () {
      var _handleServerIntegrityHash = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee79(serverHash) {
        var localHash;
        return regeneratorRuntime.wrap(function _callee79$(_context80) {
          while (1) {
            switch (_context80.prev = _context80.next) {
              case 0:
                if (!(!serverHash || serverHash.length == 0)) {
                  _context80.next = 2;
                  break;
                }

                return _context80.abrupt("return", true);

              case 2:
                _context80.next = 4;
                return this.modelManager.computeDataIntegrityHash();

              case 4:
                localHash = _context80.sent;

                if (localHash) {
                  _context80.next = 7;
                  break;
                }

                return _context80.abrupt("return", true);

              case 7:
                if (!(localHash !== serverHash)) {
                  _context80.next = 13;
                  break;
                }

                this.syncDiscordance++;

                if (this.syncDiscordance >= this.MaxDiscordanceBeforeOutOfSync) {
                  if (!this.outOfSync) {
                    this.outOfSync = true;
                    this.notifyEvent("enter-out-of-sync");
                  }
                }

                return _context80.abrupt("return", false);

              case 13:
                // Integrity matches
                if (this.outOfSync) {
                  this.outOfSync = false;
                  this.notifyEvent("exit-out-of-sync");
                }

                this.syncDiscordance = 0;
                return _context80.abrupt("return", true);

              case 16:
              case "end":
                return _context80.stop();
            }
          }
        }, _callee79, this);
      }));

      function handleServerIntegrityHash(_x111) {
        return _handleServerIntegrityHash.apply(this, arguments);
      }

      return handleServerIntegrityHash;
    }()
  }, {
    key: "isOutOfSync",
    value: function isOutOfSync() {
      // Once we are outOfSync, it's up to the client to display UI to the user to instruct them
      // to take action. The client should present a reconciliation wizard.
      return this.outOfSync;
    }
  }, {
    key: "getServerURL",
    value: function () {
      var _getServerURL = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee80() {
        return regeneratorRuntime.wrap(function _callee80$(_context81) {
          while (1) {
            switch (_context81.prev = _context81.next) {
              case 0:
                _context81.next = 2;
                return this.storageManager.getItem("server");

              case 2:
                _context81.t0 = _context81.sent;

                if (_context81.t0) {
                  _context81.next = 5;
                  break;
                }

                _context81.t0 = window._default_sf_server;

              case 5:
                return _context81.abrupt("return", _context81.t0);

              case 6:
              case "end":
                return _context81.stop();
            }
          }
        }, _callee80, this);
      }));

      function getServerURL() {
        return _getServerURL.apply(this, arguments);
      }

      return getServerURL;
    }()
  }, {
    key: "getSyncURL",
    value: function () {
      var _getSyncURL = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee81() {
        return regeneratorRuntime.wrap(function _callee81$(_context82) {
          while (1) {
            switch (_context82.prev = _context82.next) {
              case 0:
                _context82.next = 2;
                return this.getServerURL();

              case 2:
                _context82.t0 = _context82.sent;
                return _context82.abrupt("return", _context82.t0 + "/items/sync");

              case 4:
              case "end":
                return _context82.stop();
            }
          }
        }, _callee81, this);
      }));

      function getSyncURL() {
        return _getSyncURL.apply(this, arguments);
      }

      return getSyncURL;
    }()
  }, {
    key: "registerSyncStatusObserver",
    value: function registerSyncStatusObserver(callback) {
      var observer = {
        key: new Date(),
        callback: callback
      };
      this.syncStatusObservers.push(observer);
      return observer;
    }
  }, {
    key: "removeSyncStatusObserver",
    value: function removeSyncStatusObserver(observer) {
      _.pull(this.syncStatusObservers, observer);
    }
  }, {
    key: "syncStatusDidChange",
    value: function syncStatusDidChange() {
      var _this19 = this;

      this.syncStatusObservers.forEach(function (observer) {
        observer.callback(_this19.syncStatus);
      });
    }
  }, {
    key: "addEventHandler",
    value: function addEventHandler(handler) {
      /*
      Possible Events:
      sync:completed
      sync:taking-too-long
      sync:updated_token
      sync:error
      major-data-change
      local-data-loaded
      sync-session-invalid
      sync-exception
       */
      this.eventHandlers.push(handler);
      return handler;
    }
  }, {
    key: "removeEventHandler",
    value: function removeEventHandler(handler) {
      _.pull(this.eventHandlers, handler);
    }
  }, {
    key: "notifyEvent",
    value: function notifyEvent(syncEvent, data) {
      var _iteratorNormalCompletion35 = true;
      var _didIteratorError35 = false;
      var _iteratorError35 = undefined;

      try {
        for (var _iterator35 = this.eventHandlers[Symbol.iterator](), _step35; !(_iteratorNormalCompletion35 = (_step35 = _iterator35.next()).done); _iteratorNormalCompletion35 = true) {
          var handler = _step35.value;
          handler(syncEvent, data || {});
        }
      } catch (err) {
        _didIteratorError35 = true;
        _iteratorError35 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion35 && _iterator35["return"] != null) {
            _iterator35["return"]();
          }
        } finally {
          if (_didIteratorError35) {
            throw _iteratorError35;
          }
        }
      }
    }
  }, {
    key: "setKeyRequestHandler",
    value: function setKeyRequestHandler(handler) {
      this.keyRequestHandler = handler;
    }
  }, {
    key: "getActiveKeyInfo",
    value: function () {
      var _getActiveKeyInfo = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee82(request) {
        return regeneratorRuntime.wrap(function _callee82$(_context83) {
          while (1) {
            switch (_context83.prev = _context83.next) {
              case 0:
                return _context83.abrupt("return", this.keyRequestHandler(request));

              case 1:
              case "end":
                return _context83.stop();
            }
          }
        }, _callee82, this);
      }));

      function getActiveKeyInfo(_x112) {
        return _getActiveKeyInfo.apply(this, arguments);
      }

      return getActiveKeyInfo;
    }()
  }, {
    key: "initialDataLoaded",
    value: function initialDataLoaded() {
      return this._initialDataLoaded === true;
    }
  }, {
    key: "_sortLocalItems",
    value: function _sortLocalItems(items) {
      var _this20 = this;

      return items.sort(function (a, b) {
        var dateResult = new Date(b.updated_at) - new Date(a.updated_at);
        var priorityList = _this20.contentTypeLoadPriority;
        var aPriority = 0,
            bPriority = 0;

        if (priorityList) {
          aPriority = priorityList.indexOf(a.content_type);
          bPriority = priorityList.indexOf(b.content_type);

          if (aPriority == -1) {
            // Not found in list, not prioritized. Set it to max value
            aPriority = priorityList.length;
          }

          if (bPriority == -1) {
            // Not found in list, not prioritized. Set it to max value
            bPriority = priorityList.length;
          }
        }

        if (aPriority == bPriority) {
          return dateResult;
        }

        if (aPriority < bPriority) {
          return -1;
        } else {
          return 1;
        } // aPriority < bPriority means a should come first


        return aPriority < bPriority ? -1 : 1;
      });
    }
  }, {
    key: "loadLocalItems",
    value: function () {
      var _loadLocalItems = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee84() {
        var _this21 = this;

        var _ref17,
            incrementalCallback,
            batchSize,
            options,
            latency,
            _args85 = arguments;

        return regeneratorRuntime.wrap(function _callee84$(_context85) {
          while (1) {
            switch (_context85.prev = _context85.next) {
              case 0:
                _ref17 = _args85.length > 0 && _args85[0] !== undefined ? _args85[0] : {}, incrementalCallback = _ref17.incrementalCallback, batchSize = _ref17.batchSize, options = _ref17.options;

                if (!(options && options.simulateHighLatency)) {
                  _context85.next = 5;
                  break;
                }

                latency = options.simulatedLatency || 1000;
                _context85.next = 5;
                return this._awaitSleep(latency);

              case 5:
                if (!this.loadLocalDataPromise) {
                  _context85.next = 7;
                  break;
                }

                return _context85.abrupt("return", this.loadLocalDataPromise);

              case 7:
                if (!batchSize) {
                  batchSize = 100;
                }

                this.loadLocalDataPromise = this.storageManager.getAllModels().then(function (items) {
                  // put most recently updated at beginning, sorted by priority
                  items = _this21._sortLocalItems(items); // Filter out any items that exist in the local model mapping and have a lower dirtied date than the local dirtiedDate.

                  items = items.filter(function (nonDecryptedItem) {
                    var localItem = _this21.modelManager.findItem(nonDecryptedItem.uuid);

                    if (!localItem) {
                      return true;
                    }

                    return new Date(nonDecryptedItem.dirtiedDate) > localItem.dirtiedDate;
                  }); // break it up into chunks to make interface more responsive for large item counts

                  var total = items.length;
                  var current = 0;
                  var processed = [];

                  var decryptNext =
                  /*#__PURE__*/
                  function () {
                    var _ref18 = _asyncToGenerator(
                    /*#__PURE__*/
                    regeneratorRuntime.mark(function _callee83() {
                      var subitems, processedSubitems;
                      return regeneratorRuntime.wrap(function _callee83$(_context84) {
                        while (1) {
                          switch (_context84.prev = _context84.next) {
                            case 0:
                              subitems = items.slice(current, current + batchSize);
                              _context84.next = 3;
                              return _this21.handleItemsResponse(subitems, null, SFModelManager.MappingSourceLocalRetrieved, SFSyncManager.KeyRequestLoadLocal);

                            case 3:
                              processedSubitems = _context84.sent;
                              processed.push(processedSubitems);
                              current += subitems.length;

                              if (!(current < total)) {
                                _context84.next = 10;
                                break;
                              }

                              return _context84.abrupt("return", new Promise(function (innerResolve, innerReject) {
                                _this21.$timeout(function () {
                                  _this21.notifyEvent("local-data-incremental-load");

                                  incrementalCallback && incrementalCallback(current, total);
                                  decryptNext().then(innerResolve);
                                });
                              }));

                            case 10:
                              // Completed
                              _this21._initialDataLoaded = true;

                              _this21.notifyEvent("local-data-loaded");

                            case 12:
                            case "end":
                              return _context84.stop();
                          }
                        }
                      }, _callee83);
                    }));

                    return function decryptNext() {
                      return _ref18.apply(this, arguments);
                    };
                  }();

                  return decryptNext();
                });
                return _context85.abrupt("return", this.loadLocalDataPromise);

              case 10:
              case "end":
                return _context85.stop();
            }
          }
        }, _callee84, this);
      }));

      function loadLocalItems() {
        return _loadLocalItems.apply(this, arguments);
      }

      return loadLocalItems;
    }()
  }, {
    key: "writeItemsToLocalStorage",
    value: function () {
      var _writeItemsToLocalStorage = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee88(items, offlineOnly) {
        var _this22 = this;

        return regeneratorRuntime.wrap(function _callee88$(_context89) {
          while (1) {
            switch (_context89.prev = _context89.next) {
              case 0:
                if (!(items.length == 0)) {
                  _context89.next = 2;
                  break;
                }

                return _context89.abrupt("return");

              case 2:
                return _context89.abrupt("return", new Promise(
                /*#__PURE__*/
                function () {
                  var _ref19 = _asyncToGenerator(
                  /*#__PURE__*/
                  regeneratorRuntime.mark(function _callee87(resolve, reject) {
                    var nonDeletedItems, deletedItems, _iteratorNormalCompletion36, _didIteratorError36, _iteratorError36, _iterator36, _step36, item, info, params;

                    return regeneratorRuntime.wrap(function _callee87$(_context88) {
                      while (1) {
                        switch (_context88.prev = _context88.next) {
                          case 0:
                            nonDeletedItems = [], deletedItems = [];
                            _iteratorNormalCompletion36 = true;
                            _didIteratorError36 = false;
                            _iteratorError36 = undefined;
                            _context88.prev = 4;

                            for (_iterator36 = items[Symbol.iterator](); !(_iteratorNormalCompletion36 = (_step36 = _iterator36.next()).done); _iteratorNormalCompletion36 = true) {
                              item = _step36.value;

                              // if the item is deleted and dirty it means we still need to sync it.
                              if (item.deleted === true && !item.dirty) {
                                deletedItems.push(item);
                              } else {
                                nonDeletedItems.push(item);
                              }
                            }

                            _context88.next = 12;
                            break;

                          case 8:
                            _context88.prev = 8;
                            _context88.t0 = _context88["catch"](4);
                            _didIteratorError36 = true;
                            _iteratorError36 = _context88.t0;

                          case 12:
                            _context88.prev = 12;
                            _context88.prev = 13;

                            if (!_iteratorNormalCompletion36 && _iterator36["return"] != null) {
                              _iterator36["return"]();
                            }

                          case 15:
                            _context88.prev = 15;

                            if (!_didIteratorError36) {
                              _context88.next = 18;
                              break;
                            }

                            throw _iteratorError36;

                          case 18:
                            return _context88.finish(15);

                          case 19:
                            return _context88.finish(12);

                          case 20:
                            if (!(deletedItems.length > 0)) {
                              _context88.next = 23;
                              break;
                            }

                            _context88.next = 23;
                            return Promise.all(deletedItems.map(
                            /*#__PURE__*/
                            function () {
                              var _ref20 = _asyncToGenerator(
                              /*#__PURE__*/
                              regeneratorRuntime.mark(function _callee85(deletedItem) {
                                return regeneratorRuntime.wrap(function _callee85$(_context86) {
                                  while (1) {
                                    switch (_context86.prev = _context86.next) {
                                      case 0:
                                        return _context86.abrupt("return", _this22.storageManager.deleteModel(deletedItem));

                                      case 1:
                                      case "end":
                                        return _context86.stop();
                                    }
                                  }
                                }, _callee85);
                              }));

                              return function (_x117) {
                                return _ref20.apply(this, arguments);
                              };
                            }()));

                          case 23:
                            _context88.next = 25;
                            return _this22.getActiveKeyInfo(SFSyncManager.KeyRequestSaveLocal);

                          case 25:
                            info = _context88.sent;

                            if (!(nonDeletedItems.length > 0)) {
                              _context88.next = 33;
                              break;
                            }

                            _context88.next = 29;
                            return Promise.all(nonDeletedItems.map(
                            /*#__PURE__*/
                            function () {
                              var _ref21 = _asyncToGenerator(
                              /*#__PURE__*/
                              regeneratorRuntime.mark(function _callee86(item) {
                                var itemParams;
                                return regeneratorRuntime.wrap(function _callee86$(_context87) {
                                  while (1) {
                                    switch (_context87.prev = _context87.next) {
                                      case 0:
                                        itemParams = new SFItemParams(item, info.keys, info.auth_params);
                                        _context87.next = 3;
                                        return itemParams.paramsForLocalStorage();

                                      case 3:
                                        itemParams = _context87.sent;

                                        if (offlineOnly) {
                                          delete itemParams.dirty;
                                        }

                                        return _context87.abrupt("return", itemParams);

                                      case 6:
                                      case "end":
                                        return _context87.stop();
                                    }
                                  }
                                }, _callee86);
                              }));

                              return function (_x118) {
                                return _ref21.apply(this, arguments);
                              };
                            }()))["catch"](function (e) {
                              return reject(e);
                            });

                          case 29:
                            params = _context88.sent;
                            _context88.next = 32;
                            return _this22.storageManager.saveModels(params)["catch"](function (error) {
                              console.error("Error writing items", error);
                              _this22.syncStatus.localError = error;

                              _this22.syncStatusDidChange();

                              reject();
                            });

                          case 32:
                            // on success
                            if (_this22.syncStatus.localError) {
                              _this22.syncStatus.localError = null;

                              _this22.syncStatusDidChange();
                            }

                          case 33:
                            resolve();

                          case 34:
                          case "end":
                            return _context88.stop();
                        }
                      }
                    }, _callee87, null, [[4, 8, 12, 20], [13,, 15, 19]]);
                  }));

                  return function (_x115, _x116) {
                    return _ref19.apply(this, arguments);
                  };
                }()));

              case 3:
              case "end":
                return _context89.stop();
            }
          }
        }, _callee88);
      }));

      function writeItemsToLocalStorage(_x113, _x114) {
        return _writeItemsToLocalStorage.apply(this, arguments);
      }

      return writeItemsToLocalStorage;
    }()
  }, {
    key: "syncOffline",
    value: function () {
      var _syncOffline = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee89(items) {
        var _this23 = this;

        var _iteratorNormalCompletion37, _didIteratorError37, _iteratorError37, _iterator37, _step37, item;

        return regeneratorRuntime.wrap(function _callee89$(_context90) {
          while (1) {
            switch (_context90.prev = _context90.next) {
              case 0:
                // Update all items updated_at to now
                _iteratorNormalCompletion37 = true;
                _didIteratorError37 = false;
                _iteratorError37 = undefined;
                _context90.prev = 3;

                for (_iterator37 = items[Symbol.iterator](); !(_iteratorNormalCompletion37 = (_step37 = _iterator37.next()).done); _iteratorNormalCompletion37 = true) {
                  item = _step37.value;
                  item.updated_at = new Date();
                }

                _context90.next = 11;
                break;

              case 7:
                _context90.prev = 7;
                _context90.t0 = _context90["catch"](3);
                _didIteratorError37 = true;
                _iteratorError37 = _context90.t0;

              case 11:
                _context90.prev = 11;
                _context90.prev = 12;

                if (!_iteratorNormalCompletion37 && _iterator37["return"] != null) {
                  _iterator37["return"]();
                }

              case 14:
                _context90.prev = 14;

                if (!_didIteratorError37) {
                  _context90.next = 17;
                  break;
                }

                throw _iteratorError37;

              case 17:
                return _context90.finish(14);

              case 18:
                return _context90.finish(11);

              case 19:
                return _context90.abrupt("return", this.writeItemsToLocalStorage(items, true).then(function (responseItems) {
                  // delete anything needing to be deleted
                  var _iteratorNormalCompletion38 = true;
                  var _didIteratorError38 = false;
                  var _iteratorError38 = undefined;

                  try {
                    for (var _iterator38 = items[Symbol.iterator](), _step38; !(_iteratorNormalCompletion38 = (_step38 = _iterator38.next()).done); _iteratorNormalCompletion38 = true) {
                      var item = _step38.value;

                      if (item.deleted) {
                        _this23.modelManager.removeItemLocally(item);
                      }
                    }
                  } catch (err) {
                    _didIteratorError38 = true;
                    _iteratorError38 = err;
                  } finally {
                    try {
                      if (!_iteratorNormalCompletion38 && _iterator38["return"] != null) {
                        _iterator38["return"]();
                      }
                    } finally {
                      if (_didIteratorError38) {
                        throw _iteratorError38;
                      }
                    }
                  }

                  _this23.modelManager.clearDirtyItems(items); // Required in order for modelManager to notify sync observers


                  _this23.modelManager.didSyncModelsOffline(items);

                  _this23.notifyEvent("sync:completed", {
                    savedItems: items
                  });

                  return {
                    saved_items: items
                  };
                }));

              case 20:
              case "end":
                return _context90.stop();
            }
          }
        }, _callee89, this, [[3, 7, 11, 19], [12,, 14, 18]]);
      }));

      function syncOffline(_x119) {
        return _syncOffline.apply(this, arguments);
      }

      return syncOffline;
    }()
    /*
      In the case of signing in and merging local data, we alternative UUIDs
      to avoid overwriting data a user may retrieve that has the same UUID.
      Alternating here forces us to to create duplicates of the items instead.
     */

  }, {
    key: "markAllItemsDirtyAndSaveOffline",
    value: function () {
      var _markAllItemsDirtyAndSaveOffline = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee90(alternateUUIDs) {
        var originalItems, _iteratorNormalCompletion39, _didIteratorError39, _iteratorError39, _iterator39, _step39, item, allItems, _iteratorNormalCompletion40, _didIteratorError40, _iteratorError40, _iterator40, _step40, _item;

        return regeneratorRuntime.wrap(function _callee90$(_context91) {
          while (1) {
            switch (_context91.prev = _context91.next) {
              case 0:
                if (!alternateUUIDs) {
                  _context91.next = 28;
                  break;
                }

                // use a copy, as alternating uuid will affect array
                originalItems = this.modelManager.allNondummyItems.filter(function (item) {
                  return !item.errorDecrypting;
                }).slice();
                _iteratorNormalCompletion39 = true;
                _didIteratorError39 = false;
                _iteratorError39 = undefined;
                _context91.prev = 5;
                _iterator39 = originalItems[Symbol.iterator]();

              case 7:
                if (_iteratorNormalCompletion39 = (_step39 = _iterator39.next()).done) {
                  _context91.next = 14;
                  break;
                }

                item = _step39.value;
                _context91.next = 11;
                return this.modelManager.alternateUUIDForItem(item);

              case 11:
                _iteratorNormalCompletion39 = true;
                _context91.next = 7;
                break;

              case 14:
                _context91.next = 20;
                break;

              case 16:
                _context91.prev = 16;
                _context91.t0 = _context91["catch"](5);
                _didIteratorError39 = true;
                _iteratorError39 = _context91.t0;

              case 20:
                _context91.prev = 20;
                _context91.prev = 21;

                if (!_iteratorNormalCompletion39 && _iterator39["return"] != null) {
                  _iterator39["return"]();
                }

              case 23:
                _context91.prev = 23;

                if (!_didIteratorError39) {
                  _context91.next = 26;
                  break;
                }

                throw _iteratorError39;

              case 26:
                return _context91.finish(23);

              case 27:
                return _context91.finish(20);

              case 28:
                allItems = this.modelManager.allNondummyItems;
                _iteratorNormalCompletion40 = true;
                _didIteratorError40 = false;
                _iteratorError40 = undefined;
                _context91.prev = 32;

                for (_iterator40 = allItems[Symbol.iterator](); !(_iteratorNormalCompletion40 = (_step40 = _iterator40.next()).done); _iteratorNormalCompletion40 = true) {
                  _item = _step40.value;

                  _item.setDirty(true);
                }

                _context91.next = 40;
                break;

              case 36:
                _context91.prev = 36;
                _context91.t1 = _context91["catch"](32);
                _didIteratorError40 = true;
                _iteratorError40 = _context91.t1;

              case 40:
                _context91.prev = 40;
                _context91.prev = 41;

                if (!_iteratorNormalCompletion40 && _iterator40["return"] != null) {
                  _iterator40["return"]();
                }

              case 43:
                _context91.prev = 43;

                if (!_didIteratorError40) {
                  _context91.next = 46;
                  break;
                }

                throw _iteratorError40;

              case 46:
                return _context91.finish(43);

              case 47:
                return _context91.finish(40);

              case 48:
                return _context91.abrupt("return", this.writeItemsToLocalStorage(allItems, false));

              case 49:
              case "end":
                return _context91.stop();
            }
          }
        }, _callee90, this, [[5, 16, 20, 28], [21,, 23, 27], [32, 36, 40, 48], [41,, 43, 47]]);
      }));

      function markAllItemsDirtyAndSaveOffline(_x120) {
        return _markAllItemsDirtyAndSaveOffline.apply(this, arguments);
      }

      return markAllItemsDirtyAndSaveOffline;
    }()
  }, {
    key: "setSyncToken",
    value: function () {
      var _setSyncToken = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee91(token) {
        return regeneratorRuntime.wrap(function _callee91$(_context92) {
          while (1) {
            switch (_context92.prev = _context92.next) {
              case 0:
                this._syncToken = token;
                _context92.next = 3;
                return this.storageManager.setItem("syncToken", token);

              case 3:
              case "end":
                return _context92.stop();
            }
          }
        }, _callee91, this);
      }));

      function setSyncToken(_x121) {
        return _setSyncToken.apply(this, arguments);
      }

      return setSyncToken;
    }()
  }, {
    key: "getSyncToken",
    value: function () {
      var _getSyncToken = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee92() {
        return regeneratorRuntime.wrap(function _callee92$(_context93) {
          while (1) {
            switch (_context93.prev = _context93.next) {
              case 0:
                if (this._syncToken) {
                  _context93.next = 4;
                  break;
                }

                _context93.next = 3;
                return this.storageManager.getItem("syncToken");

              case 3:
                this._syncToken = _context93.sent;

              case 4:
                return _context93.abrupt("return", this._syncToken);

              case 5:
              case "end":
                return _context93.stop();
            }
          }
        }, _callee92, this);
      }));

      function getSyncToken() {
        return _getSyncToken.apply(this, arguments);
      }

      return getSyncToken;
    }()
  }, {
    key: "setCursorToken",
    value: function () {
      var _setCursorToken = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee93(token) {
        return regeneratorRuntime.wrap(function _callee93$(_context94) {
          while (1) {
            switch (_context94.prev = _context94.next) {
              case 0:
                this._cursorToken = token;

                if (!token) {
                  _context94.next = 6;
                  break;
                }

                _context94.next = 4;
                return this.storageManager.setItem("cursorToken", token);

              case 4:
                _context94.next = 8;
                break;

              case 6:
                _context94.next = 8;
                return this.storageManager.removeItem("cursorToken");

              case 8:
              case "end":
                return _context94.stop();
            }
          }
        }, _callee93, this);
      }));

      function setCursorToken(_x122) {
        return _setCursorToken.apply(this, arguments);
      }

      return setCursorToken;
    }()
  }, {
    key: "getCursorToken",
    value: function () {
      var _getCursorToken = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee94() {
        return regeneratorRuntime.wrap(function _callee94$(_context95) {
          while (1) {
            switch (_context95.prev = _context95.next) {
              case 0:
                if (this._cursorToken) {
                  _context95.next = 4;
                  break;
                }

                _context95.next = 3;
                return this.storageManager.getItem("cursorToken");

              case 3:
                this._cursorToken = _context95.sent;

              case 4:
                return _context95.abrupt("return", this._cursorToken);

              case 5:
              case "end":
                return _context95.stop();
            }
          }
        }, _callee94, this);
      }));

      function getCursorToken() {
        return _getCursorToken.apply(this, arguments);
      }

      return getCursorToken;
    }()
  }, {
    key: "clearQueuedCallbacks",
    value: function clearQueuedCallbacks() {
      this._queuedCallbacks = [];
    }
  }, {
    key: "callQueuedCallbacks",
    value: function callQueuedCallbacks(response) {
      var allCallbacks = this.queuedCallbacks;

      if (allCallbacks.length) {
        var _iteratorNormalCompletion41 = true;
        var _didIteratorError41 = false;
        var _iteratorError41 = undefined;

        try {
          for (var _iterator41 = allCallbacks[Symbol.iterator](), _step41; !(_iteratorNormalCompletion41 = (_step41 = _iterator41.next()).done); _iteratorNormalCompletion41 = true) {
            var eachCallback = _step41.value;
            eachCallback(response);
          }
        } catch (err) {
          _didIteratorError41 = true;
          _iteratorError41 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion41 && _iterator41["return"] != null) {
              _iterator41["return"]();
            }
          } finally {
            if (_didIteratorError41) {
              throw _iteratorError41;
            }
          }
        }

        this.clearQueuedCallbacks();
      }
    }
  }, {
    key: "beginCheckingIfSyncIsTakingTooLong",
    value: function beginCheckingIfSyncIsTakingTooLong() {
      if (this.syncStatus.checker) {
        this.stopCheckingIfSyncIsTakingTooLong();
      }

      this.syncStatus.checker = this.$interval(function () {
        // check to see if the ongoing sync is taking too long, alert the user
        var secondsPassed = (new Date() - this.syncStatus.syncStart) / 1000;
        var warningThreshold = 5.0; // seconds

        if (secondsPassed > warningThreshold) {
          this.notifyEvent("sync:taking-too-long");
          this.stopCheckingIfSyncIsTakingTooLong();
        }
      }.bind(this), 500);
    }
  }, {
    key: "stopCheckingIfSyncIsTakingTooLong",
    value: function stopCheckingIfSyncIsTakingTooLong() {
      if (this.$interval.hasOwnProperty("cancel")) {
        this.$interval.cancel(this.syncStatus.checker);
      } else {
        clearInterval(this.syncStatus.checker);
      }

      this.syncStatus.checker = null;
    }
  }, {
    key: "lockSyncing",
    value: function lockSyncing() {
      this.syncLocked = true;
    }
  }, {
    key: "unlockSyncing",
    value: function unlockSyncing() {
      this.syncLocked = false;
    }
  }, {
    key: "sync",
    value: function () {
      var _sync = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee96() {
        var _this24 = this;

        var options,
            _args97 = arguments;
        return regeneratorRuntime.wrap(function _callee96$(_context97) {
          while (1) {
            switch (_context97.prev = _context97.next) {
              case 0:
                options = _args97.length > 0 && _args97[0] !== undefined ? _args97[0] : {};

                if (!this.syncLocked) {
                  _context97.next = 4;
                  break;
                }

                console.log("Sync Locked, Returning;");
                return _context97.abrupt("return");

              case 4:
                return _context97.abrupt("return", new Promise(
                /*#__PURE__*/
                function () {
                  var _ref22 = _asyncToGenerator(
                  /*#__PURE__*/
                  regeneratorRuntime.mark(function _callee95(resolve, reject) {
                    var allDirtyItems, dirtyItemsNotYetSaved, info, isSyncInProgress, initialDataLoaded, isContinuationSync, submitLimit, subItems, params, _iteratorNormalCompletion42, _didIteratorError42, _iteratorError42, _iterator42, _step42, item;

                    return regeneratorRuntime.wrap(function _callee95$(_context96) {
                      while (1) {
                        switch (_context96.prev = _context96.next) {
                          case 0:
                            if (!options) options = {};
                            allDirtyItems = _this24.modelManager.getDirtyItems();
                            dirtyItemsNotYetSaved = allDirtyItems.filter(function (candidate) {
                              return !_this24.lastDirtyItemsSave || candidate.dirtiedDate > _this24.lastDirtyItemsSave;
                            });
                            _context96.next = 5;
                            return _this24.getActiveKeyInfo(SFSyncManager.KeyRequestLoadSaveAccount);

                          case 5:
                            info = _context96.sent;
                            isSyncInProgress = _this24.syncStatus.syncOpInProgress;
                            initialDataLoaded = _this24.initialDataLoaded();

                            if (!(isSyncInProgress || !initialDataLoaded)) {
                              _context96.next = 16;
                              break;
                            }

                            _this24.performSyncAgainOnCompletion = true;
                            _this24.lastDirtyItemsSave = new Date();
                            _context96.next = 13;
                            return _this24.writeItemsToLocalStorage(dirtyItemsNotYetSaved, false);

                          case 13:
                            if (isSyncInProgress) {
                              _this24.queuedCallbacks.push(resolve);

                              if (_this24.loggingEnabled) {
                                console.warn("Attempting to sync while existing sync is in progress.");
                              }
                            }

                            if (!initialDataLoaded) {
                              if (_this24.loggingEnabled) {
                                console.warn("(1) Attempting to perform online sync before local data has loaded");
                              } // Resolve right away, as we can't be sure when local data will be called by consumer.


                              resolve();
                            }

                            return _context96.abrupt("return");

                          case 16:
                            // Set this value immediately after checking it above, to avoid race conditions.
                            _this24.syncStatus.syncOpInProgress = true;

                            if (!info.offline) {
                              _context96.next = 19;
                              break;
                            }

                            return _context96.abrupt("return", _this24.syncOffline(allDirtyItems).then(function (response) {
                              _this24.syncStatus.syncOpInProgress = false;
                              resolve(response);
                            })["catch"](function (e) {
                              _this24.notifyEvent("sync-exception", e);
                            }));

                          case 19:
                            if (_this24.initialDataLoaded()) {
                              _context96.next = 22;
                              break;
                            }

                            console.error("Attempting to perform online sync before local data has loaded");
                            return _context96.abrupt("return");

                          case 22:
                            if (_this24.loggingEnabled) {
                              console.log("Syncing online user.");
                            }

                            isContinuationSync = _this24.syncStatus.needsMoreSync;
                            _this24.syncStatus.syncStart = new Date();

                            _this24.beginCheckingIfSyncIsTakingTooLong();

                            submitLimit = _this24.PerSyncItemUploadLimit;
                            subItems = allDirtyItems.slice(0, submitLimit);

                            if (subItems.length < allDirtyItems.length) {
                              // more items left to be synced, repeat
                              _this24.syncStatus.needsMoreSync = true;
                            } else {
                              _this24.syncStatus.needsMoreSync = false;
                            }

                            if (!isContinuationSync) {
                              _this24.syncStatus.total = allDirtyItems.length;
                              _this24.syncStatus.current = 0;
                            } // If items are marked as dirty during a long running sync request, total isn't updated
                            // This happens mostly in the case of large imports and sync conflicts where duplicated items are created


                            if (_this24.syncStatus.current > _this24.syncStatus.total) {
                              _this24.syncStatus.total = _this24.syncStatus.current;
                            }

                            _this24.syncStatusDidChange(); // Perform save after you've updated all status signals above. Presync save can take several seconds in some cases.
                            // Write to local storage before beginning sync.
                            // This way, if they close the browser before the sync request completes, local changes will not be lost


                            _context96.next = 34;
                            return _this24.writeItemsToLocalStorage(dirtyItemsNotYetSaved, false);

                          case 34:
                            _this24.lastDirtyItemsSave = new Date();

                            if (options.onPreSyncSave) {
                              options.onPreSyncSave();
                            } // when doing a sync request that returns items greater than the limit, and thus subsequent syncs are required,
                            // we want to keep track of all retreived items, then save to local storage only once all items have been retrieved,
                            // so that relationships remain intact
                            // Update 12/18: I don't think we need to do this anymore, since relationships will now retroactively resolve their relationships,
                            // if an item they were looking for hasn't been pulled in yet.


                            if (!_this24.allRetreivedItems) {
                              _this24.allRetreivedItems = [];
                            } // We also want to do this for savedItems


                            if (!_this24.allSavedItems) {
                              _this24.allSavedItems = [];
                            }

                            params = {};
                            params.limit = _this24.ServerItemDownloadLimit;

                            if (options.performIntegrityCheck) {
                              params.compute_integrity = true;
                            }

                            _context96.prev = 41;
                            _context96.next = 44;
                            return Promise.all(subItems.map(function (item) {
                              var itemParams = new SFItemParams(item, info.keys, info.auth_params);
                              itemParams.additionalFields = options.additionalFields;
                              return itemParams.paramsForSync();
                            })).then(function (itemsParams) {
                              params.items = itemsParams;
                            });

                          case 44:
                            _context96.next = 49;
                            break;

                          case 46:
                            _context96.prev = 46;
                            _context96.t0 = _context96["catch"](41);

                            _this24.notifyEvent("sync-exception", _context96.t0);

                          case 49:
                            _iteratorNormalCompletion42 = true;
                            _didIteratorError42 = false;
                            _iteratorError42 = undefined;
                            _context96.prev = 52;

                            for (_iterator42 = subItems[Symbol.iterator](); !(_iteratorNormalCompletion42 = (_step42 = _iterator42.next()).done); _iteratorNormalCompletion42 = true) {
                              item = _step42.value;
                              // Reset dirty counter to 0, since we're about to sync it.
                              // This means anyone marking the item as dirty after this will cause it so sync again and not be cleared on sync completion.
                              item.dirtyCount = 0;
                            }

                            _context96.next = 60;
                            break;

                          case 56:
                            _context96.prev = 56;
                            _context96.t1 = _context96["catch"](52);
                            _didIteratorError42 = true;
                            _iteratorError42 = _context96.t1;

                          case 60:
                            _context96.prev = 60;
                            _context96.prev = 61;

                            if (!_iteratorNormalCompletion42 && _iterator42["return"] != null) {
                              _iterator42["return"]();
                            }

                          case 63:
                            _context96.prev = 63;

                            if (!_didIteratorError42) {
                              _context96.next = 66;
                              break;
                            }

                            throw _iteratorError42;

                          case 66:
                            return _context96.finish(63);

                          case 67:
                            return _context96.finish(60);

                          case 68:
                            _context96.next = 70;
                            return _this24.getSyncToken();

                          case 70:
                            params.sync_token = _context96.sent;
                            _context96.next = 73;
                            return _this24.getCursorToken();

                          case 73:
                            params.cursor_token = _context96.sent;
                            params['api'] = SFHttpManager.getApiVersion();

                            if (_this24.loggingEnabled) {
                              console.log("Syncing with params", params);
                            }

                            _context96.prev = 76;
                            _context96.t2 = _this24.httpManager;
                            _context96.next = 80;
                            return _this24.getSyncURL();

                          case 80:
                            _context96.t3 = _context96.sent;
                            _context96.t4 = params;

                            _context96.t5 = function (response) {
                              _this24.handleSyncSuccess(subItems, response, options).then(function () {
                                resolve(response);
                              })["catch"](function (e) {
                                console.log("Caught sync success exception:", e);

                                _this24.handleSyncError(e, null, allDirtyItems).then(function (errorResponse) {
                                  _this24.notifyEvent("sync-exception", e);

                                  resolve(errorResponse);
                                });
                              });
                            };

                            _context96.t6 = function (response, statusCode) {
                              _this24.handleSyncError(response, statusCode, allDirtyItems).then(function (errorResponse) {
                                resolve(errorResponse);
                              });
                            };

                            _context96.t2.postAuthenticatedAbsolute.call(_context96.t2, _context96.t3, _context96.t4, _context96.t5, _context96.t6);

                            _context96.next = 90;
                            break;

                          case 87:
                            _context96.prev = 87;
                            _context96.t7 = _context96["catch"](76);
                            console.log("Sync exception caught:", _context96.t7);

                          case 90:
                          case "end":
                            return _context96.stop();
                        }
                      }
                    }, _callee95, null, [[41, 46], [52, 56, 60, 68], [61,, 63, 67], [76, 87]]);
                  }));

                  return function (_x123, _x124) {
                    return _ref22.apply(this, arguments);
                  };
                }()));

              case 5:
              case "end":
                return _context97.stop();
            }
          }
        }, _callee96, this);
      }));

      function sync() {
        return _sync.apply(this, arguments);
      }

      return sync;
    }()
  }, {
    key: "_awaitSleep",
    value: function () {
      var _awaitSleep2 = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee97(durationInMs) {
        return regeneratorRuntime.wrap(function _callee97$(_context98) {
          while (1) {
            switch (_context98.prev = _context98.next) {
              case 0:
                console.warn("Simulating high latency sync request", durationInMs);
                return _context98.abrupt("return", new Promise(function (resolve, reject) {
                  setTimeout(function () {
                    resolve();
                  }, durationInMs);
                }));

              case 2:
              case "end":
                return _context98.stop();
            }
          }
        }, _callee97);
      }));

      function _awaitSleep(_x125) {
        return _awaitSleep2.apply(this, arguments);
      }

      return _awaitSleep;
    }()
  }, {
    key: "handleSyncSuccess",
    value: function () {
      var _handleSyncSuccess = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee98(syncedItems, response, options) {
        var _this25 = this;

        var latency, allSavedUUIDs, currentRequestSavedUUIDs, itemsToClearAsDirty, _iteratorNormalCompletion43, _didIteratorError43, _iteratorError43, _iterator43, _step43, item, retrieved, omitFields, saved, deprecated_unsaved, conflicts, conflictsNeedSync, matches, cursorToken;

        return regeneratorRuntime.wrap(function _callee98$(_context99) {
          while (1) {
            switch (_context99.prev = _context99.next) {
              case 0:
                if (!options.simulateHighLatency) {
                  _context99.next = 4;
                  break;
                }

                latency = options.simulatedLatency || 1000;
                _context99.next = 4;
                return this._awaitSleep(latency);

              case 4:
                this.syncStatus.error = null;

                if (this.loggingEnabled) {
                  console.log("Sync response", response);
                }

                allSavedUUIDs = this.allSavedItems.map(function (item) {
                  return item.uuid;
                });
                currentRequestSavedUUIDs = response.saved_items.map(function (savedResponse) {
                  return savedResponse.uuid;
                });
                response.retrieved_items = response.retrieved_items.filter(function (retrievedItem) {
                  var isInPreviousSaved = allSavedUUIDs.includes(retrievedItem.uuid);
                  var isInCurrentSaved = currentRequestSavedUUIDs.includes(retrievedItem.uuid);

                  if (isInPreviousSaved || isInCurrentSaved) {
                    return false;
                  }

                  var localItem = _this25.modelManager.findItem(retrievedItem.uuid);

                  if (localItem && localItem.dirty) {
                    return false;
                  }

                  return true;
                }); // Clear dirty items after we've finish filtering retrieved_items above, since that depends on dirty items.
                // Check to make sure any subItem hasn't been marked as dirty again while a sync was ongoing

                itemsToClearAsDirty = [];
                _iteratorNormalCompletion43 = true;
                _didIteratorError43 = false;
                _iteratorError43 = undefined;
                _context99.prev = 13;

                for (_iterator43 = syncedItems[Symbol.iterator](); !(_iteratorNormalCompletion43 = (_step43 = _iterator43.next()).done); _iteratorNormalCompletion43 = true) {
                  item = _step43.value;

                  if (item.dirtyCount == 0) {
                    // Safe to clear as dirty
                    itemsToClearAsDirty.push(item);
                  }
                }

                _context99.next = 21;
                break;

              case 17:
                _context99.prev = 17;
                _context99.t0 = _context99["catch"](13);
                _didIteratorError43 = true;
                _iteratorError43 = _context99.t0;

              case 21:
                _context99.prev = 21;
                _context99.prev = 22;

                if (!_iteratorNormalCompletion43 && _iterator43["return"] != null) {
                  _iterator43["return"]();
                }

              case 24:
                _context99.prev = 24;

                if (!_didIteratorError43) {
                  _context99.next = 27;
                  break;
                }

                throw _iteratorError43;

              case 27:
                return _context99.finish(24);

              case 28:
                return _context99.finish(21);

              case 29:
                this.modelManager.clearDirtyItems(itemsToClearAsDirty); // Map retrieved items to local data
                // Note that deleted items will not be returned

                _context99.next = 32;
                return this.handleItemsResponse(response.retrieved_items, null, SFModelManager.MappingSourceRemoteRetrieved, SFSyncManager.KeyRequestLoadSaveAccount);

              case 32:
                retrieved = _context99.sent;
                // Append items to master list of retrieved items for this ongoing sync operation
                this.allRetreivedItems = this.allRetreivedItems.concat(retrieved);
                this.syncStatus.retrievedCount = this.allRetreivedItems.length; // Merge only metadata for saved items
                // we write saved items to disk now because it clears their dirty status then saves
                // if we saved items before completion, we had have to save them as dirty and save them again on success as clean

                omitFields = ["content", "auth_hash"]; // Map saved items to local data

                _context99.next = 38;
                return this.handleItemsResponse(response.saved_items, omitFields, SFModelManager.MappingSourceRemoteSaved, SFSyncManager.KeyRequestLoadSaveAccount);

              case 38:
                saved = _context99.sent;
                // Append items to master list of saved items for this ongoing sync operation
                this.allSavedItems = this.allSavedItems.concat(saved); // 'unsaved' is deprecated and replaced with 'conflicts' in newer version.

                deprecated_unsaved = response.unsaved;
                _context99.next = 43;
                return this.deprecated_handleUnsavedItemsResponse(deprecated_unsaved);

              case 43:
                _context99.next = 45;
                return this.handleConflictsResponse(response.conflicts);

              case 45:
                conflicts = _context99.sent;
                conflictsNeedSync = conflicts && conflicts.length > 0;

                if (!conflicts) {
                  _context99.next = 50;
                  break;
                }

                _context99.next = 50;
                return this.writeItemsToLocalStorage(conflicts, false);

              case 50:
                _context99.next = 52;
                return this.writeItemsToLocalStorage(saved, false);

              case 52:
                _context99.next = 54;
                return this.writeItemsToLocalStorage(retrieved, false);

              case 54:
                if (!(response.integrity_hash && !response.cursor_token)) {
                  _context99.next = 59;
                  break;
                }

                _context99.next = 57;
                return this.handleServerIntegrityHash(response.integrity_hash);

              case 57:
                matches = _context99.sent;

                if (!matches) {
                  // If the server hash doesn't match our local hash, we want to continue syncing until we reach
                  // the max discordance threshold
                  if (this.syncDiscordance < this.MaxDiscordanceBeforeOutOfSync) {
                    this.performSyncAgainOnCompletion = true;
                  }
                }

              case 59:
                this.syncStatus.syncOpInProgress = false;
                this.syncStatus.current += syncedItems.length;
                this.syncStatusDidChange(); // set the sync token at the end, so that if any errors happen above, you can resync

                this.setSyncToken(response.sync_token);
                this.setCursorToken(response.cursor_token);
                this.stopCheckingIfSyncIsTakingTooLong();
                _context99.next = 67;
                return this.getCursorToken();

              case 67:
                cursorToken = _context99.sent;

                if (!(cursorToken || this.syncStatus.needsMoreSync)) {
                  _context99.next = 72;
                  break;
                }

                return _context99.abrupt("return", new Promise(function (resolve, reject) {
                  setTimeout(function () {
                    this.sync(options).then(resolve);
                  }.bind(_this25), 10); // wait 10ms to allow UI to update
                }));

              case 72:
                if (!conflictsNeedSync) {
                  _context99.next = 77;
                  break;
                }

                // We'll use the conflict sync as the next sync, so performSyncAgainOnCompletion can be turned off.
                this.performSyncAgainOnCompletion = false; // Include as part of await/resolve chain

                return _context99.abrupt("return", new Promise(function (resolve, reject) {
                  setTimeout(function () {
                    _this25.sync(options).then(resolve);
                  }, 10); // wait 10ms to allow UI to update
                }));

              case 77:
                this.syncStatus.retrievedCount = 0; // current and total represent what's going up, not what's come down or saved.

                this.syncStatus.current = 0;
                this.syncStatus.total = 0;
                this.syncStatusDidChange();

                if (this.allRetreivedItems.length >= this.majorDataChangeThreshold || saved.length >= this.majorDataChangeThreshold || deprecated_unsaved && deprecated_unsaved.length >= this.majorDataChangeThreshold || conflicts && conflicts.length >= this.majorDataChangeThreshold) {
                  this.notifyEvent("major-data-change");
                }

                this.callQueuedCallbacks(response);
                this.notifyEvent("sync:completed", {
                  retrievedItems: this.allRetreivedItems,
                  savedItems: this.allSavedItems
                });
                this.allRetreivedItems = [];
                this.allSavedItems = [];

                if (this.performSyncAgainOnCompletion) {
                  this.performSyncAgainOnCompletion = false;
                  setTimeout(function () {
                    _this25.sync(options);
                  }, 10); // wait 10ms to allow UI to update
                }

                return _context99.abrupt("return", response);

              case 88:
              case "end":
                return _context99.stop();
            }
          }
        }, _callee98, this, [[13, 17, 21, 29], [22,, 24, 28]]);
      }));

      function handleSyncSuccess(_x126, _x127, _x128) {
        return _handleSyncSuccess.apply(this, arguments);
      }

      return handleSyncSuccess;
    }()
  }, {
    key: "handleSyncError",
    value: function () {
      var _handleSyncError = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee99(response, statusCode, allDirtyItems) {
        return regeneratorRuntime.wrap(function _callee99$(_context100) {
          while (1) {
            switch (_context100.prev = _context100.next) {
              case 0:
                console.log("Sync error: ", response);

                if (statusCode == 401) {
                  this.notifyEvent("sync-session-invalid");
                }

                if (!response) {
                  response = {
                    error: {
                      message: "Could not connect to server."
                    }
                  };
                } else if (typeof response == 'string') {
                  response = {
                    error: {
                      message: response
                    }
                  };
                }

                this.syncStatus.syncOpInProgress = false;
                this.syncStatus.error = response.error;
                this.syncStatusDidChange();
                this.writeItemsToLocalStorage(allDirtyItems, false);
                this.modelManager.didSyncModelsOffline(allDirtyItems);
                this.stopCheckingIfSyncIsTakingTooLong();
                this.notifyEvent("sync:error", response.error);
                this.callQueuedCallbacks({
                  error: "Sync error"
                });
                return _context100.abrupt("return", response);

              case 12:
              case "end":
                return _context100.stop();
            }
          }
        }, _callee99, this);
      }));

      function handleSyncError(_x129, _x130, _x131) {
        return _handleSyncError.apply(this, arguments);
      }

      return handleSyncError;
    }()
  }, {
    key: "handleItemsResponse",
    value: function () {
      var _handleItemsResponse = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee100(responseItems, omitFields, source, keyRequest) {
        var keys, items, itemsWithErrorStatusChange;
        return regeneratorRuntime.wrap(function _callee100$(_context101) {
          while (1) {
            switch (_context101.prev = _context101.next) {
              case 0:
                _context101.next = 2;
                return this.getActiveKeyInfo(keyRequest);

              case 2:
                keys = _context101.sent.keys;
                _context101.next = 5;
                return SFJS.itemTransformer.decryptMultipleItems(responseItems, keys);

              case 5:
                _context101.next = 7;
                return this.modelManager.mapResponseItemsToLocalModelsOmittingFields(responseItems, omitFields, source);

              case 7:
                items = _context101.sent;
                // During the decryption process, items may be marked as "errorDecrypting". If so, we want to be sure
                // to persist this new state by writing these items back to local storage. When an item's "errorDecrypting"
                // flag is changed, its "errorDecryptingValueChanged" flag will be set, so we can find these items by filtering (then unsetting) below:
                itemsWithErrorStatusChange = items.filter(function (item) {
                  var valueChanged = item.errorDecryptingValueChanged; // unset after consuming value

                  item.errorDecryptingValueChanged = false;
                  return valueChanged;
                });

                if (itemsWithErrorStatusChange.length > 0) {
                  this.writeItemsToLocalStorage(itemsWithErrorStatusChange, false);
                }

                return _context101.abrupt("return", items);

              case 11:
              case "end":
                return _context101.stop();
            }
          }
        }, _callee100, this);
      }));

      function handleItemsResponse(_x132, _x133, _x134, _x135) {
        return _handleItemsResponse.apply(this, arguments);
      }

      return handleItemsResponse;
    }()
  }, {
    key: "refreshErroredItems",
    value: function () {
      var _refreshErroredItems = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee101() {
        var erroredItems;
        return regeneratorRuntime.wrap(function _callee101$(_context102) {
          while (1) {
            switch (_context102.prev = _context102.next) {
              case 0:
                erroredItems = this.modelManager.allNondummyItems.filter(function (item) {
                  return item.errorDecrypting == true;
                });

                if (!(erroredItems.length > 0)) {
                  _context102.next = 3;
                  break;
                }

                return _context102.abrupt("return", this.handleItemsResponse(erroredItems, null, SFModelManager.MappingSourceLocalRetrieved, SFSyncManager.KeyRequestLoadSaveAccount));

              case 3:
              case "end":
                return _context102.stop();
            }
          }
        }, _callee101, this);
      }));

      function refreshErroredItems() {
        return _refreshErroredItems.apply(this, arguments);
      }

      return refreshErroredItems;
    }()
    /*
    The difference between 'unsaved' (deprecated_handleUnsavedItemsResponse) and 'conflicts' (handleConflictsResponse) is that
    with unsaved items, the local copy is triumphant on the server, and we check the server copy to see if we should
    create it as a duplicate. This is for the legacy API where it would save what you sent the server no matter its value,
    and the client would decide what to do with the previous server value.
     handleConflictsResponse on the other hand handles where the local copy save was not triumphant on the server.
    Instead the conflict includes the server item. Here we immediately map the server value onto our local value,
    but before that, we give our local value a chance to duplicate itself if it differs from the server value.
    */

  }, {
    key: "handleConflictsResponse",
    value: function () {
      var _handleConflictsResponse = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee102(conflicts) {
        var localValues, _iteratorNormalCompletion44, _didIteratorError44, _iteratorError44, _iterator44, _step44, conflict, serverItemResponse, localItem, frozenContent, itemsNeedingLocalSave, _iteratorNormalCompletion45, _didIteratorError45, _iteratorError45, _iterator45, _step45, _conflict, _serverItemResponse, _localValues$_serverI, _frozenContent, itemRef, newItem, tempServerItem, _tempItemWithFrozenValues, frozenContentDiffers, currentContentDiffers, duplicateLocal, duplicateServer, keepLocal, keepServer, IsActiveItemSecondsThreshold, isActivelyBeingEdited, contentExcludingReferencesDiffers, isOnlyReferenceChange, localDuplicate;

        return regeneratorRuntime.wrap(function _callee102$(_context103) {
          while (1) {
            switch (_context103.prev = _context103.next) {
              case 0:
                if (!(!conflicts || conflicts.length == 0)) {
                  _context103.next = 2;
                  break;
                }

                return _context103.abrupt("return");

              case 2:
                if (this.loggingEnabled) {
                  console.log("Handle Conflicted Items:", conflicts);
                } // Get local values before doing any processing. This way, if a note change below modifies a tag,
                // and the tag is going to be iterated on in the same loop, then we don't want this change to be compared
                // to the local value.


                localValues = {};
                _iteratorNormalCompletion44 = true;
                _didIteratorError44 = false;
                _iteratorError44 = undefined;
                _context103.prev = 7;
                _iterator44 = conflicts[Symbol.iterator]();

              case 9:
                if (_iteratorNormalCompletion44 = (_step44 = _iterator44.next()).done) {
                  _context103.next = 21;
                  break;
                }

                conflict = _step44.value;
                serverItemResponse = conflict.server_item || conflict.unsaved_item;
                localItem = this.modelManager.findItem(serverItemResponse.uuid);

                if (localItem) {
                  _context103.next = 16;
                  break;
                }

                localValues[serverItemResponse.uuid] = {};
                return _context103.abrupt("continue", 18);

              case 16:
                frozenContent = localItem.getContentCopy();
                localValues[serverItemResponse.uuid] = {
                  frozenContent: frozenContent,
                  itemRef: localItem
                };

              case 18:
                _iteratorNormalCompletion44 = true;
                _context103.next = 9;
                break;

              case 21:
                _context103.next = 27;
                break;

              case 23:
                _context103.prev = 23;
                _context103.t0 = _context103["catch"](7);
                _didIteratorError44 = true;
                _iteratorError44 = _context103.t0;

              case 27:
                _context103.prev = 27;
                _context103.prev = 28;

                if (!_iteratorNormalCompletion44 && _iterator44["return"] != null) {
                  _iterator44["return"]();
                }

              case 30:
                _context103.prev = 30;

                if (!_didIteratorError44) {
                  _context103.next = 33;
                  break;
                }

                throw _iteratorError44;

              case 33:
                return _context103.finish(30);

              case 34:
                return _context103.finish(27);

              case 35:
                // Any item that's newly created here or updated will need to be persisted
                itemsNeedingLocalSave = [];
                _iteratorNormalCompletion45 = true;
                _didIteratorError45 = false;
                _iteratorError45 = undefined;
                _context103.prev = 39;
                _iterator45 = conflicts[Symbol.iterator]();

              case 41:
                if (_iteratorNormalCompletion45 = (_step45 = _iterator45.next()).done) {
                  _context103.next = 91;
                  break;
                }

                _conflict = _step45.value;
                // if sync_conflict, we receive conflict.server_item.
                // If uuid_conflict, we receive the value we attempted to save.
                _serverItemResponse = _conflict.server_item || _conflict.unsaved_item;
                _context103.t1 = SFJS.itemTransformer;
                _context103.t2 = [_serverItemResponse];
                _context103.next = 48;
                return this.getActiveKeyInfo(SFSyncManager.KeyRequestLoadSaveAccount);

              case 48:
                _context103.t3 = _context103.sent.keys;
                _context103.next = 51;
                return _context103.t1.decryptMultipleItems.call(_context103.t1, _context103.t2, _context103.t3);

              case 51:
                _localValues$_serverI = localValues[_serverItemResponse.uuid], _frozenContent = _localValues$_serverI.frozenContent, itemRef = _localValues$_serverI.itemRef; // Could be deleted

                if (itemRef) {
                  _context103.next = 54;
                  break;
                }

                return _context103.abrupt("continue", 88);

              case 54:
                // Item ref is always added, since it's value will have changed below, either by mapping, being set to dirty,
                // or being set undirty by the caller but the caller not saving because they're waiting on us.
                itemsNeedingLocalSave.push(itemRef);

                if (!(_conflict.type === "uuid_conflict")) {
                  _context103.next = 62;
                  break;
                }

                _context103.next = 58;
                return this.modelManager.alternateUUIDForItem(itemRef);

              case 58:
                newItem = _context103.sent;
                itemsNeedingLocalSave.push(newItem);
                _context103.next = 88;
                break;

              case 62:
                if (!(_conflict.type === "sync_conflict")) {
                  _context103.next = 86;
                  break;
                }

                _context103.next = 65;
                return this.modelManager.createDuplicateItemFromResponseItem(_serverItemResponse);

              case 65:
                tempServerItem = _context103.sent;
                // Convert to an object simply so we can have access to the `isItemContentEqualWith` function.
                _tempItemWithFrozenValues = this.modelManager.duplicateItemWithCustomContent({
                  content: _frozenContent,
                  duplicateOf: itemRef
                }); // if !frozenContentDiffers && currentContentDiffers, it means values have changed as we were looping through conflicts here.

                frozenContentDiffers = !_tempItemWithFrozenValues.isItemContentEqualWith(tempServerItem);
                currentContentDiffers = !itemRef.isItemContentEqualWith(tempServerItem);
                duplicateLocal = false;
                duplicateServer = false;
                keepLocal = false;
                keepServer = false;

                if (_serverItemResponse.deleted || itemRef.deleted) {
                  keepServer = true;
                } else if (frozenContentDiffers) {
                  IsActiveItemSecondsThreshold = 20;
                  isActivelyBeingEdited = (new Date() - itemRef.client_updated_at) / 1000 < IsActiveItemSecondsThreshold;

                  if (isActivelyBeingEdited) {
                    keepLocal = true;
                    duplicateServer = true;
                  } else {
                    duplicateLocal = true;
                    keepServer = true;
                  }
                } else if (currentContentDiffers) {
                  contentExcludingReferencesDiffers = !SFItem.AreItemContentsEqual({
                    leftContent: itemRef.content,
                    rightContent: tempServerItem.content,
                    keysToIgnore: itemRef.keysToIgnoreWhenCheckingContentEquality().concat(["references"]),
                    appDataKeysToIgnore: itemRef.appDataKeysToIgnoreWhenCheckingContentEquality()
                  });
                  isOnlyReferenceChange = !contentExcludingReferencesDiffers;

                  if (isOnlyReferenceChange) {
                    keepLocal = true;
                  } else {
                    duplicateLocal = true;
                    keepServer = true;
                  }
                } else {
                  // items are exactly equal
                  keepServer = true;
                }

                if (!duplicateLocal) {
                  _context103.next = 79;
                  break;
                }

                _context103.next = 77;
                return this.modelManager.duplicateItemWithCustomContentAndAddAsConflict({
                  content: _frozenContent,
                  duplicateOf: itemRef
                });

              case 77:
                localDuplicate = _context103.sent;
                itemsNeedingLocalSave.push(localDuplicate);

              case 79:
                if (duplicateServer) {
                  this.modelManager.addDuplicatedItemAsConflict({
                    duplicate: tempServerItem,
                    duplicateOf: itemRef
                  });
                  itemsNeedingLocalSave.push(tempServerItem);
                }

                if (!keepServer) {
                  _context103.next = 83;
                  break;
                }

                _context103.next = 83;
                return this.modelManager.mapResponseItemsToLocalModelsOmittingFields([_serverItemResponse], null, SFModelManager.MappingSourceRemoteRetrieved);

              case 83:
                if (keepLocal) {
                  itemRef.updated_at = tempServerItem.updated_at;
                  itemRef.setDirty(true);
                }

                _context103.next = 88;
                break;

              case 86:
                console.error("Unsupported conflict type", _conflict.type);
                return _context103.abrupt("continue", 88);

              case 88:
                _iteratorNormalCompletion45 = true;
                _context103.next = 41;
                break;

              case 91:
                _context103.next = 97;
                break;

              case 93:
                _context103.prev = 93;
                _context103.t4 = _context103["catch"](39);
                _didIteratorError45 = true;
                _iteratorError45 = _context103.t4;

              case 97:
                _context103.prev = 97;
                _context103.prev = 98;

                if (!_iteratorNormalCompletion45 && _iterator45["return"] != null) {
                  _iterator45["return"]();
                }

              case 100:
                _context103.prev = 100;

                if (!_didIteratorError45) {
                  _context103.next = 103;
                  break;
                }

                throw _iteratorError45;

              case 103:
                return _context103.finish(100);

              case 104:
                return _context103.finish(97);

              case 105:
                return _context103.abrupt("return", itemsNeedingLocalSave);

              case 106:
              case "end":
                return _context103.stop();
            }
          }
        }, _callee102, this, [[7, 23, 27, 35], [28,, 30, 34], [39, 93, 97, 105], [98,, 100, 104]]);
      }));

      function handleConflictsResponse(_x136) {
        return _handleConflictsResponse.apply(this, arguments);
      }

      return handleConflictsResponse;
    }() // Legacy API

  }, {
    key: "deprecated_handleUnsavedItemsResponse",
    value: function () {
      var _deprecated_handleUnsavedItemsResponse = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee103(unsaved) {
        var _iteratorNormalCompletion46, _didIteratorError46, _iteratorError46, _iterator46, _step46, mapping, itemResponse, item, error, dup;

        return regeneratorRuntime.wrap(function _callee103$(_context104) {
          while (1) {
            switch (_context104.prev = _context104.next) {
              case 0:
                if (!(!unsaved || unsaved.length == 0)) {
                  _context104.next = 2;
                  break;
                }

                return _context104.abrupt("return");

              case 2:
                if (this.loggingEnabled) {
                  console.log("Handle Unsaved Items:", unsaved);
                }

                _iteratorNormalCompletion46 = true;
                _didIteratorError46 = false;
                _iteratorError46 = undefined;
                _context104.prev = 6;
                _iterator46 = unsaved[Symbol.iterator]();

              case 8:
                if (_iteratorNormalCompletion46 = (_step46 = _iterator46.next()).done) {
                  _context104.next = 35;
                  break;
                }

                mapping = _step46.value;
                itemResponse = mapping.item;
                _context104.t0 = SFJS.itemTransformer;
                _context104.t1 = [itemResponse];
                _context104.next = 15;
                return this.getActiveKeyInfo(SFSyncManager.KeyRequestLoadSaveAccount);

              case 15:
                _context104.t2 = _context104.sent.keys;
                _context104.next = 18;
                return _context104.t0.decryptMultipleItems.call(_context104.t0, _context104.t1, _context104.t2);

              case 18:
                item = this.modelManager.findItem(itemResponse.uuid); // Could be deleted

                if (item) {
                  _context104.next = 21;
                  break;
                }

                return _context104.abrupt("continue", 32);

              case 21:
                error = mapping.error;

                if (!(error.tag === "uuid_conflict")) {
                  _context104.next = 27;
                  break;
                }

                _context104.next = 25;
                return this.modelManager.alternateUUIDForItem(item);

              case 25:
                _context104.next = 32;
                break;

              case 27:
                if (!(error.tag === "sync_conflict")) {
                  _context104.next = 32;
                  break;
                }

                _context104.next = 30;
                return this.modelManager.createDuplicateItemFromResponseItem(itemResponse);

              case 30:
                dup = _context104.sent;

                if (!itemResponse.deleted && !item.isItemContentEqualWith(dup)) {
                  this.modelManager.addDuplicatedItemAsConflict({
                    duplicate: dup,
                    duplicateOf: item
                  });
                }

              case 32:
                _iteratorNormalCompletion46 = true;
                _context104.next = 8;
                break;

              case 35:
                _context104.next = 41;
                break;

              case 37:
                _context104.prev = 37;
                _context104.t3 = _context104["catch"](6);
                _didIteratorError46 = true;
                _iteratorError46 = _context104.t3;

              case 41:
                _context104.prev = 41;
                _context104.prev = 42;

                if (!_iteratorNormalCompletion46 && _iterator46["return"] != null) {
                  _iterator46["return"]();
                }

              case 44:
                _context104.prev = 44;

                if (!_didIteratorError46) {
                  _context104.next = 47;
                  break;
                }

                throw _iteratorError46;

              case 47:
                return _context104.finish(44);

              case 48:
                return _context104.finish(41);

              case 49:
              case "end":
                return _context104.stop();
            }
          }
        }, _callee103, this, [[6, 37, 41, 49], [42,, 44, 48]]);
      }));

      function deprecated_handleUnsavedItemsResponse(_x137) {
        return _deprecated_handleUnsavedItemsResponse.apply(this, arguments);
      }

      return deprecated_handleUnsavedItemsResponse;
    }()
    /*
      Executes a sync request with a blank sync token and high download limit. It will download all items,
      but won't do anything with them other than decrypting, creating respective objects, and returning them to caller. (it does not map them nor establish their relationships)
      The use case came primarly for clients who had ignored a certain content_type in sync, but later issued an update
      indicated they actually did want to start handling that content type. In that case, they would need to download all items
      freshly from the server.
    */

  }, {
    key: "stateless_downloadAllItems",
    value: function stateless_downloadAllItems() {
      var _this26 = this;

      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      return new Promise(
      /*#__PURE__*/
      function () {
        var _ref23 = _asyncToGenerator(
        /*#__PURE__*/
        regeneratorRuntime.mark(function _callee105(resolve, reject) {
          var params;
          return regeneratorRuntime.wrap(function _callee105$(_context106) {
            while (1) {
              switch (_context106.prev = _context106.next) {
                case 0:
                  params = {
                    limit: options.limit || 500,
                    sync_token: options.syncToken,
                    cursor_token: options.cursorToken,
                    content_type: options.contentType,
                    event: options.event,
                    api: SFHttpManager.getApiVersion()
                  };
                  _context106.prev = 1;
                  _context106.t0 = _this26.httpManager;
                  _context106.next = 5;
                  return _this26.getSyncURL();

                case 5:
                  _context106.t1 = _context106.sent;
                  _context106.t2 = params;

                  _context106.t3 =
                  /*#__PURE__*/
                  function () {
                    var _ref24 = _asyncToGenerator(
                    /*#__PURE__*/
                    regeneratorRuntime.mark(function _callee104(response) {
                      var incomingItems, keys;
                      return regeneratorRuntime.wrap(function _callee104$(_context105) {
                        while (1) {
                          switch (_context105.prev = _context105.next) {
                            case 0:
                              if (!options.retrievedItems) {
                                options.retrievedItems = [];
                              }

                              incomingItems = response.retrieved_items;
                              _context105.next = 4;
                              return _this26.getActiveKeyInfo(SFSyncManager.KeyRequestLoadSaveAccount);

                            case 4:
                              keys = _context105.sent.keys;
                              _context105.next = 7;
                              return SFJS.itemTransformer.decryptMultipleItems(incomingItems, keys);

                            case 7:
                              options.retrievedItems = options.retrievedItems.concat(incomingItems.map(function (incomingItem) {
                                // Create model classes
                                return _this26.modelManager.createItem(incomingItem);
                              }));
                              options.syncToken = response.sync_token;
                              options.cursorToken = response.cursor_token;

                              if (options.cursorToken) {
                                _this26.stateless_downloadAllItems(options).then(resolve);
                              } else {
                                resolve(options.retrievedItems);
                              }

                            case 11:
                            case "end":
                              return _context105.stop();
                          }
                        }
                      }, _callee104);
                    }));

                    return function (_x140) {
                      return _ref24.apply(this, arguments);
                    };
                  }();

                  _context106.t4 = function (response, statusCode) {
                    reject(response);
                  };

                  _context106.t0.postAuthenticatedAbsolute.call(_context106.t0, _context106.t1, _context106.t2, _context106.t3, _context106.t4);

                  _context106.next = 16;
                  break;

                case 12:
                  _context106.prev = 12;
                  _context106.t5 = _context106["catch"](1);
                  console.log("Download all items exception caught:", _context106.t5);
                  reject(_context106.t5);

                case 16:
                case "end":
                  return _context106.stop();
              }
            }
          }, _callee105, null, [[1, 12]]);
        }));

        return function (_x138, _x139) {
          return _ref23.apply(this, arguments);
        };
      }());
    }
  }, {
    key: "resolveOutOfSync",
    value: function () {
      var _resolveOutOfSync = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee107() {
        var _this27 = this;

        return regeneratorRuntime.wrap(function _callee107$(_context108) {
          while (1) {
            switch (_context108.prev = _context108.next) {
              case 0:
                return _context108.abrupt("return", this.stateless_downloadAllItems({
                  event: "resolve-out-of-sync"
                }).then(
                /*#__PURE__*/
                function () {
                  var _ref25 = _asyncToGenerator(
                  /*#__PURE__*/
                  regeneratorRuntime.mark(function _callee106(downloadedItems) {
                    var itemsToMap, _iteratorNormalCompletion47, _didIteratorError47, _iteratorError47, _iterator47, _step47, downloadedItem, existingItem, contentDoesntMatch;

                    return regeneratorRuntime.wrap(function _callee106$(_context107) {
                      while (1) {
                        switch (_context107.prev = _context107.next) {
                          case 0:
                            itemsToMap = [];
                            _iteratorNormalCompletion47 = true;
                            _didIteratorError47 = false;
                            _iteratorError47 = undefined;
                            _context107.prev = 4;
                            _iterator47 = downloadedItems[Symbol.iterator]();

                          case 6:
                            if (_iteratorNormalCompletion47 = (_step47 = _iterator47.next()).done) {
                              _context107.next = 18;
                              break;
                            }

                            downloadedItem = _step47.value;
                            // Note that deleted items will not be sent back by the server.
                            existingItem = _this27.modelManager.findItem(downloadedItem.uuid);

                            if (!existingItem) {
                              _context107.next = 14;
                              break;
                            }

                            // Check if the content differs. If it does, create a new item, and do not map downloadedItem.
                            contentDoesntMatch = !downloadedItem.isItemContentEqualWith(existingItem);

                            if (!contentDoesntMatch) {
                              _context107.next = 14;
                              break;
                            }

                            _context107.next = 14;
                            return _this27.modelManager.duplicateItemAndAddAsConflict(existingItem);

                          case 14:
                            // Map the downloadedItem as authoritive content. If client copy at all differed, we would have created a duplicate of it above and synced it.
                            // This is also neccessary to map the updated_at value from the server
                            itemsToMap.push(downloadedItem);

                          case 15:
                            _iteratorNormalCompletion47 = true;
                            _context107.next = 6;
                            break;

                          case 18:
                            _context107.next = 24;
                            break;

                          case 20:
                            _context107.prev = 20;
                            _context107.t0 = _context107["catch"](4);
                            _didIteratorError47 = true;
                            _iteratorError47 = _context107.t0;

                          case 24:
                            _context107.prev = 24;
                            _context107.prev = 25;

                            if (!_iteratorNormalCompletion47 && _iterator47["return"] != null) {
                              _iterator47["return"]();
                            }

                          case 27:
                            _context107.prev = 27;

                            if (!_didIteratorError47) {
                              _context107.next = 30;
                              break;
                            }

                            throw _iteratorError47;

                          case 30:
                            return _context107.finish(27);

                          case 31:
                            return _context107.finish(24);

                          case 32:
                            _context107.next = 34;
                            return _this27.modelManager.mapResponseItemsToLocalModelsWithOptions({
                              items: itemsToMap,
                              source: SFModelManager.MappingSourceRemoteRetrieved
                            });

                          case 34:
                            _context107.next = 36;
                            return _this27.writeItemsToLocalStorage(_this27.modelManager.allNondummyItems);

                          case 36:
                            return _context107.abrupt("return", _this27.sync({
                              performIntegrityCheck: true
                            }));

                          case 37:
                          case "end":
                            return _context107.stop();
                        }
                      }
                    }, _callee106, null, [[4, 20, 24, 32], [25,, 27, 31]]);
                  }));

                  return function (_x141) {
                    return _ref25.apply(this, arguments);
                  };
                }()));

              case 1:
              case "end":
                return _context108.stop();
            }
          }
        }, _callee107, this);
      }));

      function resolveOutOfSync() {
        return _resolveOutOfSync.apply(this, arguments);
      }

      return resolveOutOfSync;
    }()
  }, {
    key: "handleSignout",
    value: function () {
      var _handleSignout = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee108() {
        return regeneratorRuntime.wrap(function _callee108$(_context109) {
          while (1) {
            switch (_context109.prev = _context109.next) {
              case 0:
                this.outOfSync = false;
                this.loadLocalDataPromise = null;
                this.performSyncAgainOnCompletion = false;
                this.syncStatus.syncOpInProgress = false;
                this._queuedCallbacks = [];
                this.syncStatus = {};
                return _context109.abrupt("return", this.clearSyncToken());

              case 7:
              case "end":
                return _context109.stop();
            }
          }
        }, _callee108, this);
      }));

      function handleSignout() {
        return _handleSignout.apply(this, arguments);
      }

      return handleSignout;
    }()
  }, {
    key: "clearSyncToken",
    value: function () {
      var _clearSyncToken = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee109() {
        return regeneratorRuntime.wrap(function _callee109$(_context110) {
          while (1) {
            switch (_context110.prev = _context110.next) {
              case 0:
                this._syncToken = null;
                this._cursorToken = null;
                return _context110.abrupt("return", this.storageManager.removeItem("syncToken"));

              case 3:
              case "end":
                return _context110.stop();
            }
          }
        }, _callee109, this);
      }));

      function clearSyncToken() {
        return _clearSyncToken.apply(this, arguments);
      }

      return clearSyncToken;
    }() // Only used by unit test

  }, {
    key: "__setLocalDataNotLoaded",
    value: function __setLocalDataNotLoaded() {
      this.loadLocalDataPromise = null;
      this._initialDataLoaded = false;
    }
  }, {
    key: "queuedCallbacks",
    get: function get() {
      if (!this._queuedCallbacks) {
        this._queuedCallbacks = [];
      }

      return this._queuedCallbacks;
    }
  }]);

  return SFSyncManager;
}();

exports.SFSyncManager = SFSyncManager;
;
var dateFormatter;

var SFItem =
/*#__PURE__*/
function () {
  function SFItem() {
    var json_obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, SFItem);

    this.content = {};
    this.referencingObjects = [];
    this.updateFromJSON(json_obj);

    if (!this.uuid) {
      // on React Native, this method will not exist. UUID gen will be handled manually via async methods.
      if (typeof SFJS !== "undefined" && SFJS.crypto.generateUUIDSync) {
        this.uuid = SFJS.crypto.generateUUIDSync();
      }
    }

    if (_typeof(this.content) === 'object' && !this.content.references) {
      this.content.references = [];
    }
  } // On some platforms, syncrounous uuid generation is not available.
  // Those platforms (mobile) must call this function manually.


  _createClass(SFItem, [{
    key: "initUUID",
    value: function () {
      var _initUUID = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee110() {
        return regeneratorRuntime.wrap(function _callee110$(_context111) {
          while (1) {
            switch (_context111.prev = _context111.next) {
              case 0:
                if (this.uuid) {
                  _context111.next = 4;
                  break;
                }

                _context111.next = 3;
                return SFJS.crypto.generateUUID();

              case 3:
                this.uuid = _context111.sent;

              case 4:
              case "end":
                return _context111.stop();
            }
          }
        }, _callee110, this);
      }));

      function initUUID() {
        return _initUUID.apply(this, arguments);
      }

      return initUUID;
    }()
  }, {
    key: "updateFromJSON",
    value: function updateFromJSON(json) {
      // Don't expect this to ever be the case but we're having a crash with Android and this is the only suspect.
      if (!json) {
        return;
      }

      this.deleted = json.deleted;
      this.uuid = json.uuid;
      this.enc_item_key = json.enc_item_key;
      this.auth_hash = json.auth_hash;
      this.auth_params = json.auth_params; // When updating from server response (as opposed to local json response), these keys will be missing.
      // So we only want to update these values if they are explicitly present.

      var clientKeys = ["errorDecrypting", "dirty", "dirtyCount", "dirtiedDate", "dummy"];

      for (var _i4 = 0, _clientKeys = clientKeys; _i4 < _clientKeys.length; _i4++) {
        var key = _clientKeys[_i4];

        if (json[key] !== undefined) {
          this[key] = json[key];
        }
      }

      if (this.dirtiedDate && typeof this.dirtiedDate === 'string') {
        this.dirtiedDate = new Date(this.dirtiedDate);
      } // Check if object has getter for content_type, and if so, skip


      if (!this.content_type) {
        this.content_type = json.content_type;
      } // this.content = json.content will copy it by reference rather than value. So we need to do a deep merge after.
      // json.content can still be a string here. We copy it to this.content, then do a deep merge to transfer over all values.


      if (json.errorDecrypting) {
        this.content = json.content;
      } else {
        try {
          var parsedContent = typeof json.content === 'string' ? JSON.parse(json.content) : json.content;
          SFItem.deepMerge(this.contentObject, parsedContent);
        } catch (e) {
          console.log("Error while updating item from json", e);
        }
      } // Manually merge top level data instead of wholesale merge


      if (json.created_at) {
        this.created_at = json.created_at;
      } // Could be null if we're mapping from an extension bridge, where we remove this as its a private property.


      if (json.updated_at) {
        this.updated_at = json.updated_at;
      }

      if (this.created_at) {
        this.created_at = new Date(this.created_at);
      } else {
        this.created_at = new Date();
      }

      if (this.updated_at) {
        this.updated_at = new Date(this.updated_at);
      } else {
        this.updated_at = new Date(0);
      } // Epoch
      // Allows the getter to be re-invoked


      this._client_updated_at = null;

      if (json.content) {
        this.mapContentToLocalProperties(this.contentObject);
      } else if (json.deleted == true) {
        this.handleDeletedContent();
      }
    }
  }, {
    key: "mapContentToLocalProperties",
    value: function mapContentToLocalProperties(contentObj) {}
  }, {
    key: "createContentJSONFromProperties",
    value: function createContentJSONFromProperties() {
      /*
      NOTE: This function does have side effects and WILL modify our content.
       Subclasses will override structureParams, and add their own custom content and properties to the object returned from structureParams
      These are properties that this superclass will not be aware of, like 'title' or 'text'
       When we call createContentJSONFromProperties, we want to update our own inherit 'content' field with the values returned from structureParams,
      so that our content field is up to date.
       Each subclass will call super.structureParams and merge it with its own custom result object.
      Since our own structureParams gets a real-time copy of our content, it should be safe to merge the aggregate value back into our own content field.
      */
      var content = this.structureParams();
      SFItem.deepMerge(this.contentObject, content); // Return the content item copy and not our actual value, as we don't want it to be mutated outside our control.

      return content;
    }
  }, {
    key: "structureParams",
    value: function structureParams() {
      return this.getContentCopy();
    }
    /* Allows the item to handle the case where the item is deleted and the content is null */

  }, {
    key: "handleDeletedContent",
    value: function handleDeletedContent() {// Subclasses can override
    }
  }, {
    key: "setDirty",
    value: function setDirty(dirty, updateClientDate) {
      this.dirty = dirty; // Allows the syncManager to check if an item has been marked dirty after a sync has been started
      // This prevents it from clearing it as a dirty item after sync completion, if someone else has marked it dirty
      // again after an ongoing sync.

      if (!this.dirtyCount) {
        this.dirtyCount = 0;
      }

      if (dirty) {
        this.dirtyCount++;
      } else {
        this.dirtyCount = 0;
      } // Used internally by syncManager to determine if a dirted item needs to be saved offline.
      // You want to set this in both cases, when dirty is true and false. If it's false, we still need
      // to save it to disk as an update.


      this.dirtiedDate = new Date();

      if (dirty && updateClientDate) {
        // Set the client modified date to now if marking the item as dirty
        this.client_updated_at = new Date();
      } else if (!this.hasRawClientUpdatedAtValue()) {
        // if we don't have an explcit raw value, we initialize client_updated_at.
        this.client_updated_at = new Date(this.updated_at);
      }
    }
  }, {
    key: "updateLocalRelationships",
    value: function updateLocalRelationships() {// optional override
    }
  }, {
    key: "addItemAsRelationship",
    value: function addItemAsRelationship(item) {
      item.setIsBeingReferencedBy(this);

      if (this.hasRelationshipWithItem(item)) {
        return;
      }

      var references = this.content.references || [];
      references.push({
        uuid: item.uuid,
        content_type: item.content_type
      });
      this.content.references = references;
    }
  }, {
    key: "removeItemAsRelationship",
    value: function removeItemAsRelationship(item) {
      item.setIsNoLongerBeingReferencedBy(this);
      this.removeReferenceWithUuid(item.uuid);
    } // When another object has a relationship with us, we push that object into memory here.
    // We use this so that when `this` is deleted, we're able to update the references of those other objects.

  }, {
    key: "setIsBeingReferencedBy",
    value: function setIsBeingReferencedBy(item) {
      if (!_.find(this.referencingObjects, {
        uuid: item.uuid
      })) {
        this.referencingObjects.push(item);
      }
    }
  }, {
    key: "setIsNoLongerBeingReferencedBy",
    value: function setIsNoLongerBeingReferencedBy(item) {
      _.remove(this.referencingObjects, {
        uuid: item.uuid
      }); // Legacy two-way relationships should be handled here


      if (this.hasRelationshipWithItem(item)) {
        this.removeReferenceWithUuid(item.uuid); // We really shouldn't have the authority to set this item as dirty, but it's the only way to save this change.

        this.setDirty(true);
      }
    }
  }, {
    key: "removeReferenceWithUuid",
    value: function removeReferenceWithUuid(uuid) {
      var references = this.content.references || [];
      references = references.filter(function (r) {
        return r.uuid != uuid;
      });
      this.content.references = references;
    }
  }, {
    key: "hasRelationshipWithItem",
    value: function hasRelationshipWithItem(item) {
      var target = this.content.references.find(function (r) {
        return r.uuid == item.uuid;
      });
      return target != null;
    }
  }, {
    key: "isBeingRemovedLocally",
    value: function isBeingRemovedLocally() {}
  }, {
    key: "didFinishSyncing",
    value: function didFinishSyncing() {}
  }, {
    key: "informReferencesOfUUIDChange",
    value: function informReferencesOfUUIDChange(oldUUID, newUUID) {// optional override
    }
  }, {
    key: "potentialItemOfInterestHasChangedItsUUID",
    value: function potentialItemOfInterestHasChangedItsUUID(newItem, oldUUID, newUUID) {
      if (this.errorDecrypting) {
        return;
      }

      var _iteratorNormalCompletion48 = true;
      var _didIteratorError48 = false;
      var _iteratorError48 = undefined;

      try {
        for (var _iterator48 = this.content.references[Symbol.iterator](), _step48; !(_iteratorNormalCompletion48 = (_step48 = _iterator48.next()).done); _iteratorNormalCompletion48 = true) {
          var reference = _step48.value;

          if (reference.uuid == oldUUID) {
            reference.uuid = newUUID;
            this.setDirty(true);
          }
        }
      } catch (err) {
        _didIteratorError48 = true;
        _iteratorError48 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion48 && _iterator48["return"] != null) {
            _iterator48["return"]();
          }
        } finally {
          if (_didIteratorError48) {
            throw _iteratorError48;
          }
        }
      }
    }
  }, {
    key: "doNotEncrypt",
    value: function doNotEncrypt() {
      return false;
    }
    /*
    App Data
    */

  }, {
    key: "setDomainDataItem",
    value: function setDomainDataItem(key, value, domain) {
      if (!domain) {
        console.error("SFItem.AppDomain needs to be set.");
        return;
      }

      if (this.errorDecrypting) {
        return;
      }

      if (!this.content.appData) {
        this.content.appData = {};
      }

      var data = this.content.appData[domain];

      if (!data) {
        data = {};
      }

      data[key] = value;
      this.content.appData[domain] = data;
    }
  }, {
    key: "getDomainDataItem",
    value: function getDomainDataItem(key, domain) {
      if (!domain) {
        console.error("SFItem.AppDomain needs to be set.");
        return;
      }

      if (this.errorDecrypting) {
        return;
      }

      if (!this.content.appData) {
        this.content.appData = {};
      }

      var data = this.content.appData[domain];

      if (data) {
        return data[key];
      } else {
        return null;
      }
    }
  }, {
    key: "setAppDataItem",
    value: function setAppDataItem(key, value) {
      this.setDomainDataItem(key, value, SFItem.AppDomain);
    }
  }, {
    key: "getAppDataItem",
    value: function getAppDataItem(key) {
      return this.getDomainDataItem(key, SFItem.AppDomain);
    }
  }, {
    key: "hasRawClientUpdatedAtValue",
    value: function hasRawClientUpdatedAtValue() {
      return this.getAppDataItem("client_updated_at") != null;
    }
  }, {
    key: "keysToIgnoreWhenCheckingContentEquality",

    /*
      During sync conflicts, when determing whether to create a duplicate for an item, we can omit keys that have no
      meaningful weight and can be ignored. For example, if one component has active = true and another component has active = false,
      it would be silly to duplicate them, so instead we ignore this.
     */
    value: function keysToIgnoreWhenCheckingContentEquality() {
      return [];
    } // Same as above, but keys inside appData[Item.AppDomain]

  }, {
    key: "appDataKeysToIgnoreWhenCheckingContentEquality",
    value: function appDataKeysToIgnoreWhenCheckingContentEquality() {
      return ["client_updated_at"];
    }
  }, {
    key: "getContentCopy",
    value: function getContentCopy() {
      var contentCopy = JSON.parse(JSON.stringify(this.content));
      return contentCopy;
    }
  }, {
    key: "isItemContentEqualWith",
    value: function isItemContentEqualWith(otherItem) {
      return SFItem.AreItemContentsEqual({
        leftContent: this.content,
        rightContent: otherItem.content,
        keysToIgnore: this.keysToIgnoreWhenCheckingContentEquality(),
        appDataKeysToIgnore: this.appDataKeysToIgnoreWhenCheckingContentEquality()
      });
    }
  }, {
    key: "satisfiesPredicate",
    value: function satisfiesPredicate(predicate) {
      /*
      Predicate is an SFPredicate having properties:
      {
        keypath: String,
        operator: String,
        value: object
      }
       */
      return SFPredicate.ItemSatisfiesPredicate(this, predicate);
    }
    /*
    Dates
    */

  }, {
    key: "createdAtString",
    value: function createdAtString() {
      return this.dateToLocalizedString(this.created_at);
    }
  }, {
    key: "updatedAtString",
    value: function updatedAtString() {
      return this.dateToLocalizedString(this.client_updated_at);
    }
  }, {
    key: "updatedAtTimestamp",
    value: function updatedAtTimestamp() {
      return this.updated_at.getTime();
    }
  }, {
    key: "dateToLocalizedString",
    value: function dateToLocalizedString(date) {
      if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
        if (!dateFormatter) {
          var locale = navigator.languages && navigator.languages.length ? navigator.languages[0] : navigator.language;
          dateFormatter = new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            weekday: 'long',
            hour: '2-digit',
            minute: '2-digit'
          });
        }

        return dateFormatter.format(date);
      } else {
        // IE < 11, Safari <= 9.0.
        // In English, this generates the string most similar to
        // the toLocaleDateString() result above.
        return date.toDateString() + ' ' + date.toLocaleTimeString();
      }
    }
  }, {
    key: "contentObject",
    get: function get() {
      if (this.errorDecrypting) {
        return this.content;
      }

      if (!this.content) {
        this.content = {};
        return this.content;
      }

      if (this.content !== null && _typeof(this.content) === 'object') {
        // this is the case when mapping localStorage content, in which case the content is already parsed
        return this.content;
      }

      try {
        var content = JSON.parse(this.content);
        this.content = content;
        return this.content;
      } catch (e) {
        console.log("Error parsing json", e, this);
        this.content = {};
        return this.content;
      }
    }
  }, {
    key: "pinned",
    get: function get() {
      return this.getAppDataItem("pinned");
    }
  }, {
    key: "archived",
    get: function get() {
      return this.getAppDataItem("archived");
    }
  }, {
    key: "locked",
    get: function get() {
      return this.getAppDataItem("locked");
    } // May be used by clients to display the human readable type for this item. Should be overriden by subclasses.

  }, {
    key: "displayName",
    get: function get() {
      return "Item";
    }
  }, {
    key: "client_updated_at",
    get: function get() {
      if (!this._client_updated_at) {
        var saved = this.getAppDataItem("client_updated_at");

        if (saved) {
          this._client_updated_at = new Date(saved);
        } else {
          this._client_updated_at = new Date(this.updated_at);
        }
      }

      return this._client_updated_at;
    },
    set: function set(date) {
      this._client_updated_at = date;
      this.setAppDataItem("client_updated_at", date);
    }
  }], [{
    key: "deepMerge",
    value: function deepMerge(a, b) {
      // By default _.merge will not merge a full array with an empty one.
      // We want to replace arrays wholesale
      function mergeCopyArrays(objValue, srcValue) {
        if (_.isArray(objValue)) {
          return srcValue;
        }
      }

      _.mergeWith(a, b, mergeCopyArrays);

      return a;
    }
  }, {
    key: "AreItemContentsEqual",
    value: function AreItemContentsEqual(_ref26) {
      var leftContent = _ref26.leftContent,
          rightContent = _ref26.rightContent,
          keysToIgnore = _ref26.keysToIgnore,
          appDataKeysToIgnore = _ref26.appDataKeysToIgnore;

      var omit = function omit(obj, keys) {
        if (!obj) {
          return obj;
        }

        var _iteratorNormalCompletion49 = true;
        var _didIteratorError49 = false;
        var _iteratorError49 = undefined;

        try {
          for (var _iterator49 = keys[Symbol.iterator](), _step49; !(_iteratorNormalCompletion49 = (_step49 = _iterator49.next()).done); _iteratorNormalCompletion49 = true) {
            var key = _step49.value;
            delete obj[key];
          }
        } catch (err) {
          _didIteratorError49 = true;
          _iteratorError49 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion49 && _iterator49["return"] != null) {
              _iterator49["return"]();
            }
          } finally {
            if (_didIteratorError49) {
              throw _iteratorError49;
            }
          }
        }

        return obj;
      }; // Create copies of objects before running omit as not to modify source values directly.


      leftContent = JSON.parse(JSON.stringify(leftContent));

      if (leftContent.appData) {
        omit(leftContent.appData[SFItem.AppDomain], appDataKeysToIgnore);
      }

      leftContent = omit(leftContent, keysToIgnore);
      rightContent = JSON.parse(JSON.stringify(rightContent));

      if (rightContent.appData) {
        omit(rightContent.appData[SFItem.AppDomain], appDataKeysToIgnore);
      }

      rightContent = omit(rightContent, keysToIgnore);
      return JSON.stringify(leftContent) === JSON.stringify(rightContent);
    }
  }]);

  return SFItem;
}();

exports.SFItem = SFItem;
;

var SFItemParams =
/*#__PURE__*/
function () {
  function SFItemParams(item, keys, auth_params) {
    _classCallCheck(this, SFItemParams);

    this.item = item;
    this.keys = keys;
    this.auth_params = auth_params;

    if (this.keys && !this.auth_params) {
      throw "SFItemParams.auth_params must be supplied if supplying keys.";
    }

    if (this.auth_params && !this.auth_params.version) {
      throw "SFItemParams.auth_params is missing version";
    }
  }

  _createClass(SFItemParams, [{
    key: "paramsForExportFile",
    value: function () {
      var _paramsForExportFile = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee111(includeDeleted) {
        var result;
        return regeneratorRuntime.wrap(function _callee111$(_context112) {
          while (1) {
            switch (_context112.prev = _context112.next) {
              case 0:
                this.forExportFile = true;

                if (!includeDeleted) {
                  _context112.next = 5;
                  break;
                }

                return _context112.abrupt("return", this.__params());

              case 5:
                _context112.next = 7;
                return this.__params();

              case 7:
                result = _context112.sent;
                return _context112.abrupt("return", _.omit(result, ["deleted"]));

              case 9:
              case "end":
                return _context112.stop();
            }
          }
        }, _callee111, this);
      }));

      function paramsForExportFile(_x142) {
        return _paramsForExportFile.apply(this, arguments);
      }

      return paramsForExportFile;
    }()
  }, {
    key: "paramsForExtension",
    value: function () {
      var _paramsForExtension = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee112() {
        return regeneratorRuntime.wrap(function _callee112$(_context113) {
          while (1) {
            switch (_context113.prev = _context113.next) {
              case 0:
                return _context113.abrupt("return", this.paramsForExportFile());

              case 1:
              case "end":
                return _context113.stop();
            }
          }
        }, _callee112, this);
      }));

      function paramsForExtension() {
        return _paramsForExtension.apply(this, arguments);
      }

      return paramsForExtension;
    }()
  }, {
    key: "paramsForLocalStorage",
    value: function () {
      var _paramsForLocalStorage = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee113() {
        return regeneratorRuntime.wrap(function _callee113$(_context114) {
          while (1) {
            switch (_context114.prev = _context114.next) {
              case 0:
                this.additionalFields = ["dirty", "dirtiedDate", "errorDecrypting"];
                this.forExportFile = true;
                return _context114.abrupt("return", this.__params());

              case 3:
              case "end":
                return _context114.stop();
            }
          }
        }, _callee113, this);
      }));

      function paramsForLocalStorage() {
        return _paramsForLocalStorage.apply(this, arguments);
      }

      return paramsForLocalStorage;
    }()
  }, {
    key: "paramsForSync",
    value: function () {
      var _paramsForSync = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee114() {
        return regeneratorRuntime.wrap(function _callee114$(_context115) {
          while (1) {
            switch (_context115.prev = _context115.next) {
              case 0:
                return _context115.abrupt("return", this.__params());

              case 1:
              case "end":
                return _context115.stop();
            }
          }
        }, _callee114, this);
      }));

      function paramsForSync() {
        return _paramsForSync.apply(this, arguments);
      }

      return paramsForSync;
    }()
  }, {
    key: "__params",
    value: function () {
      var _params = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee115() {
        var params, doNotEncrypt, encryptedParams;
        return regeneratorRuntime.wrap(function _callee115$(_context116) {
          while (1) {
            switch (_context116.prev = _context116.next) {
              case 0:
                params = {
                  uuid: this.item.uuid,
                  content_type: this.item.content_type,
                  deleted: this.item.deleted,
                  created_at: this.item.created_at,
                  updated_at: this.item.updated_at
                };

                if (this.item.errorDecrypting) {
                  _context116.next = 23;
                  break;
                }

                // Items should always be encrypted for export files. Only respect item.doNotEncrypt for remote sync params.
                doNotEncrypt = this.item.doNotEncrypt() && !this.forExportFile;

                if (!(this.keys && !doNotEncrypt)) {
                  _context116.next = 11;
                  break;
                }

                _context116.next = 6;
                return SFJS.itemTransformer.encryptItem(this.item, this.keys, this.auth_params);

              case 6:
                encryptedParams = _context116.sent;

                _.merge(params, encryptedParams);

                if (this.auth_params.version !== "001") {
                  params.auth_hash = null;
                }

                _context116.next = 21;
                break;

              case 11:
                if (!this.forExportFile) {
                  _context116.next = 15;
                  break;
                }

                _context116.t0 = this.item.createContentJSONFromProperties();
                _context116.next = 19;
                break;

              case 15:
                _context116.next = 17;
                return SFJS.crypto.base64(JSON.stringify(this.item.createContentJSONFromProperties()));

              case 17:
                _context116.t1 = _context116.sent;
                _context116.t0 = "000" + _context116.t1;

              case 19:
                params.content = _context116.t0;

                if (!this.forExportFile) {
                  params.enc_item_key = null;
                  params.auth_hash = null;
                }

              case 21:
                _context116.next = 26;
                break;

              case 23:
                // Error decrypting, keep "content" and related fields as is (and do not try to encrypt, otherwise that would be undefined behavior)
                params.content = this.item.content;
                params.enc_item_key = this.item.enc_item_key;
                params.auth_hash = this.item.auth_hash;

              case 26:
                if (this.additionalFields) {
                  _.merge(params, _.pick(this.item, this.additionalFields));
                }

                return _context116.abrupt("return", params);

              case 28:
              case "end":
                return _context116.stop();
            }
          }
        }, _callee115, this);
      }));

      function __params() {
        return _params.apply(this, arguments);
      }

      return __params;
    }()
  }]);

  return SFItemParams;
}();

exports.SFItemParams = SFItemParams;
;

var SFPredicate =
/*#__PURE__*/
function () {
  function SFPredicate(keypath, operator, value) {
    _classCallCheck(this, SFPredicate);

    this.keypath = keypath;
    this.operator = operator;
    this.value = value; // Preprocessing to make predicate evaluation faster.
    // Won't recurse forever, but with arbitrarily large input could get stuck. Hope there are input size limits
    // somewhere else.

    if (SFPredicate.IsRecursiveOperator(this.operator)) {
      this.value = this.value.map(SFPredicate.fromArray);
    }
  }

  _createClass(SFPredicate, null, [{
    key: "fromArray",
    value: function fromArray(array) {
      return new SFPredicate(array[0], array[1], array[2]);
    }
  }, {
    key: "ObjectSatisfiesPredicate",
    value: function ObjectSatisfiesPredicate(object, predicate) {
      // Predicates may not always be created using the official constructor
      // so if it's still an array here, convert to object
      if (Array.isArray(predicate)) {
        predicate = this.fromArray(predicate);
      }

      if (SFPredicate.IsRecursiveOperator(predicate.operator)) {
        if (predicate.operator === "and") {
          var _iteratorNormalCompletion50 = true;
          var _didIteratorError50 = false;
          var _iteratorError50 = undefined;

          try {
            for (var _iterator50 = predicate.value[Symbol.iterator](), _step50; !(_iteratorNormalCompletion50 = (_step50 = _iterator50.next()).done); _iteratorNormalCompletion50 = true) {
              var subPredicate = _step50.value;

              if (!this.ObjectSatisfiesPredicate(object, subPredicate)) {
                return false;
              }
            }
          } catch (err) {
            _didIteratorError50 = true;
            _iteratorError50 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion50 && _iterator50["return"] != null) {
                _iterator50["return"]();
              }
            } finally {
              if (_didIteratorError50) {
                throw _iteratorError50;
              }
            }
          }

          return true;
        }

        if (predicate.operator === "or") {
          var _iteratorNormalCompletion51 = true;
          var _didIteratorError51 = false;
          var _iteratorError51 = undefined;

          try {
            for (var _iterator51 = predicate.value[Symbol.iterator](), _step51; !(_iteratorNormalCompletion51 = (_step51 = _iterator51.next()).done); _iteratorNormalCompletion51 = true) {
              var subPredicate = _step51.value;

              if (this.ObjectSatisfiesPredicate(object, subPredicate)) {
                return true;
              }
            }
          } catch (err) {
            _didIteratorError51 = true;
            _iteratorError51 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion51 && _iterator51["return"] != null) {
                _iterator51["return"]();
              }
            } finally {
              if (_didIteratorError51) {
                throw _iteratorError51;
              }
            }
          }

          return false;
        }
      }

      var predicateValue = predicate.value;

      if (typeof predicateValue == 'string' && predicateValue.includes(".ago")) {
        predicateValue = this.DateFromString(predicateValue);
      }

      var valueAtKeyPath = predicate.keypath.split('.').reduce(function (previous, current) {
        return previous && previous[current];
      }, object);
      var falseyValues = [false, "", null, undefined, NaN]; // If the value at keyPath is undefined, either because the property is nonexistent or the value is null.

      if (valueAtKeyPath == undefined) {
        if (predicate.operator == "!=") {
          return !falseyValues.includes(predicate.value);
        } else {
          return falseyValues.includes(predicate.value);
        }
      }

      if (predicate.operator == "=") {
        // Use array comparison
        if (Array.isArray(valueAtKeyPath)) {
          return JSON.stringify(valueAtKeyPath) == JSON.stringify(predicateValue);
        } else {
          return valueAtKeyPath == predicateValue;
        }
      } else if (predicate.operator == "!=") {
        // Use array comparison
        if (Array.isArray(valueAtKeyPath)) {
          return JSON.stringify(valueAtKeyPath) != JSON.stringify(predicateValue);
        } else {
          return valueAtKeyPath !== predicateValue;
        }
      } else if (predicate.operator == "<") {
        return valueAtKeyPath < predicateValue;
      } else if (predicate.operator == ">") {
        return valueAtKeyPath > predicateValue;
      } else if (predicate.operator == "<=") {
        return valueAtKeyPath <= predicateValue;
      } else if (predicate.operator == ">=") {
        return valueAtKeyPath >= predicateValue;
      } else if (predicate.operator == "startsWith") {
        return valueAtKeyPath.startsWith(predicateValue);
      } else if (predicate.operator == "in") {
        return predicateValue.indexOf(valueAtKeyPath) != -1;
      } else if (predicate.operator == "includes") {
        return this.resolveIncludesPredicate(valueAtKeyPath, predicateValue);
      } else if (predicate.operator == "matches") {
        var regex = new RegExp(predicateValue);
        return regex.test(valueAtKeyPath);
      }

      return false;
    }
  }, {
    key: "resolveIncludesPredicate",
    value: function resolveIncludesPredicate(valueAtKeyPath, predicateValue) {
      // includes can be a string  or a predicate (in array form)
      if (typeof predicateValue == 'string') {
        // if string, simply check if the valueAtKeyPath includes the predicate value
        return valueAtKeyPath.includes(predicateValue);
      } else {
        // is a predicate array or predicate object
        var innerPredicate;

        if (Array.isArray(predicateValue)) {
          innerPredicate = SFPredicate.fromArray(predicateValue);
        } else {
          innerPredicate = predicateValue;
        }

        var _iteratorNormalCompletion52 = true;
        var _didIteratorError52 = false;
        var _iteratorError52 = undefined;

        try {
          for (var _iterator52 = valueAtKeyPath[Symbol.iterator](), _step52; !(_iteratorNormalCompletion52 = (_step52 = _iterator52.next()).done); _iteratorNormalCompletion52 = true) {
            var obj = _step52.value;

            if (this.ObjectSatisfiesPredicate(obj, innerPredicate)) {
              return true;
            }
          }
        } catch (err) {
          _didIteratorError52 = true;
          _iteratorError52 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion52 && _iterator52["return"] != null) {
              _iterator52["return"]();
            }
          } finally {
            if (_didIteratorError52) {
              throw _iteratorError52;
            }
          }
        }

        return false;
      }
    }
  }, {
    key: "ItemSatisfiesPredicate",
    value: function ItemSatisfiesPredicate(item, predicate) {
      if (Array.isArray(predicate)) {
        predicate = SFPredicate.fromArray(predicate);
      }

      return this.ObjectSatisfiesPredicate(item, predicate);
    }
  }, {
    key: "ItemSatisfiesPredicates",
    value: function ItemSatisfiesPredicates(item, predicates) {
      var _iteratorNormalCompletion53 = true;
      var _didIteratorError53 = false;
      var _iteratorError53 = undefined;

      try {
        for (var _iterator53 = predicates[Symbol.iterator](), _step53; !(_iteratorNormalCompletion53 = (_step53 = _iterator53.next()).done); _iteratorNormalCompletion53 = true) {
          var predicate = _step53.value;

          if (!this.ItemSatisfiesPredicate(item, predicate)) {
            return false;
          }
        }
      } catch (err) {
        _didIteratorError53 = true;
        _iteratorError53 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion53 && _iterator53["return"] != null) {
            _iterator53["return"]();
          }
        } finally {
          if (_didIteratorError53) {
            throw _iteratorError53;
          }
        }
      }

      return true;
    }
  }, {
    key: "DateFromString",
    value: function DateFromString(string) {
      // x.days.ago, x.hours.ago
      var comps = string.split(".");
      var unit = comps[1];
      var date = new Date();
      var offset = parseInt(comps[0]);

      if (unit == "days") {
        date.setDate(date.getDate() - offset);
      } else if (unit == "hours") {
        date.setHours(date.getHours() - offset);
      }

      return date;
    }
  }, {
    key: "IsRecursiveOperator",
    value: function IsRecursiveOperator(operator) {
      return ["and", "or"].includes(operator);
    }
  }]);

  return SFPredicate;
}();

exports.SFPredicate = SFPredicate;
;

var SFPrivileges =
/*#__PURE__*/
function (_SFItem) {
  _inherits(SFPrivileges, _SFItem);

  _createClass(SFPrivileges, null, [{
    key: "contentType",
    value: function contentType() {
      // It has prefix SN since it was originally imported from SN codebase
      return "SN|Privileges";
    }
  }]);

  function SFPrivileges(json_obj) {
    var _this28;

    _classCallCheck(this, SFPrivileges);

    _this28 = _possibleConstructorReturn(this, _getPrototypeOf(SFPrivileges).call(this, json_obj));

    if (!_this28.content.desktopPrivileges) {
      _this28.content.desktopPrivileges = {};
    }

    return _this28;
  }

  _createClass(SFPrivileges, [{
    key: "setCredentialsForAction",
    value: function setCredentialsForAction(action, credentials) {
      this.content.desktopPrivileges[action] = credentials;
    }
  }, {
    key: "getCredentialsForAction",
    value: function getCredentialsForAction(action) {
      return this.content.desktopPrivileges[action] || [];
    }
  }, {
    key: "toggleCredentialForAction",
    value: function toggleCredentialForAction(action, credential) {
      if (this.isCredentialRequiredForAction(action, credential)) {
        this.removeCredentialForAction(action, credential);
      } else {
        this.addCredentialForAction(action, credential);
      }
    }
  }, {
    key: "removeCredentialForAction",
    value: function removeCredentialForAction(action, credential) {
      _.pull(this.content.desktopPrivileges[action], credential);
    }
  }, {
    key: "addCredentialForAction",
    value: function addCredentialForAction(action, credential) {
      var credentials = this.getCredentialsForAction(action);
      credentials.push(credential);
      this.setCredentialsForAction(action, credentials);
    }
  }, {
    key: "isCredentialRequiredForAction",
    value: function isCredentialRequiredForAction(action, credential) {
      var credentialsRequired = this.getCredentialsForAction(action);
      return credentialsRequired.includes(credential);
    }
  }]);

  return SFPrivileges;
}(SFItem);

exports.SFPrivileges = SFPrivileges;
;
/*
 Important: This is the only object in the session history domain that is persistable.
  A history session contains one main content object:
 the itemUUIDToItemHistoryMapping. This is a dictionary whose keys are item uuids,
 and each value is an SFItemHistory object.
  Each SFItemHistory object contains an array called `entires` which contain `SFItemHistory` entries (or subclasses, if the
 `SFItemHistory.HistoryEntryClassMapping` class property value is set.)
*/
// See default class values at bottom of this file, including `SFHistorySession.LargeItemEntryAmountThreshold`.

var SFHistorySession =
/*#__PURE__*/
function (_SFItem2) {
  _inherits(SFHistorySession, _SFItem2);

  function SFHistorySession(json_obj) {
    var _this29;

    _classCallCheck(this, SFHistorySession);

    _this29 = _possibleConstructorReturn(this, _getPrototypeOf(SFHistorySession).call(this, json_obj));
    /*
      Our .content params:
      {
        itemUUIDToItemHistoryMapping
      }
     */

    if (!_this29.content.itemUUIDToItemHistoryMapping) {
      _this29.content.itemUUIDToItemHistoryMapping = {};
    } // When initializing from a json_obj, we want to deserialize the item history JSON into SFItemHistory objects.


    var uuids = Object.keys(_this29.content.itemUUIDToItemHistoryMapping);
    uuids.forEach(function (itemUUID) {
      var itemHistory = _this29.content.itemUUIDToItemHistoryMapping[itemUUID];
      _this29.content.itemUUIDToItemHistoryMapping[itemUUID] = new SFItemHistory(itemHistory);
    });
    return _this29;
  }

  _createClass(SFHistorySession, [{
    key: "addEntryForItem",
    value: function addEntryForItem(item) {
      var itemHistory = this.historyForItem(item);
      var entry = itemHistory.addHistoryEntryForItem(item);
      return entry;
    }
  }, {
    key: "historyForItem",
    value: function historyForItem(item) {
      var history = this.content.itemUUIDToItemHistoryMapping[item.uuid];

      if (!history) {
        history = this.content.itemUUIDToItemHistoryMapping[item.uuid] = new SFItemHistory();
      }

      return history;
    }
  }, {
    key: "clearItemHistory",
    value: function clearItemHistory(item) {
      this.historyForItem(item).clear();
    }
  }, {
    key: "clearAllHistory",
    value: function clearAllHistory() {
      this.content.itemUUIDToItemHistoryMapping = {};
    }
  }, {
    key: "optimizeHistoryForItem",
    value: function optimizeHistoryForItem(item) {
      // Clean up if there are too many revisions. Note SFHistorySession.LargeItemEntryAmountThreshold is the amount of revisions which above, call
      // for an optimization. An optimization may not remove entries above this threshold. It will determine what it should keep and what it shouldn't.
      // So, it is possible to have a threshold of 60 but have 600 entries, if the item history deems those worth keeping.
      var itemHistory = this.historyForItem(item);

      if (itemHistory.entries.length > SFHistorySession.LargeItemEntryAmountThreshold) {
        itemHistory.optimize();
      }
    }
  }]);

  return SFHistorySession;
}(SFItem); // See comment in `this.optimizeHistoryForItem`


exports.SFHistorySession = SFHistorySession;
SFHistorySession.LargeItemEntryAmountThreshold = 60;
; // See default class values at bottom of this file, including `SFItemHistory.LargeEntryDeltaThreshold`.

var SFItemHistory =
/*#__PURE__*/
function () {
  function SFItemHistory() {
    var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, SFItemHistory);

    if (!this.entries) {
      this.entries = [];
    } // Deserialize the entries into entry objects.


    if (params.entries) {
      var _iteratorNormalCompletion54 = true;
      var _didIteratorError54 = false;
      var _iteratorError54 = undefined;

      try {
        for (var _iterator54 = params.entries[Symbol.iterator](), _step54; !(_iteratorNormalCompletion54 = (_step54 = _iterator54.next()).done); _iteratorNormalCompletion54 = true) {
          var entryParams = _step54.value;
          var entry = this.createEntryForItem(entryParams.item);
          entry.setPreviousEntry(this.getLastEntry());
          this.entries.push(entry);
        }
      } catch (err) {
        _didIteratorError54 = true;
        _iteratorError54 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion54 && _iterator54["return"] != null) {
            _iterator54["return"]();
          }
        } finally {
          if (_didIteratorError54) {
            throw _iteratorError54;
          }
        }
      }
    }
  }

  _createClass(SFItemHistory, [{
    key: "createEntryForItem",
    value: function createEntryForItem(item) {
      var historyItemClass = SFItemHistory.HistoryEntryClassMapping && SFItemHistory.HistoryEntryClassMapping[item.content_type];

      if (!historyItemClass) {
        historyItemClass = SFItemHistoryEntry;
      }

      var entry = new historyItemClass(item);
      return entry;
    }
  }, {
    key: "getLastEntry",
    value: function getLastEntry() {
      return this.entries[this.entries.length - 1];
    }
  }, {
    key: "addHistoryEntryForItem",
    value: function addHistoryEntryForItem(item) {
      var prospectiveEntry = this.createEntryForItem(item);
      var previousEntry = this.getLastEntry();
      prospectiveEntry.setPreviousEntry(previousEntry); // Don't add first revision if text length is 0, as this means it's a new note.
      // Actually, nevermind. If we do this, the first character added to a new note
      // will be displayed as "1 characters loaded".
      // if(!previousRevision && prospectiveRevision.textCharDiffLength == 0) {
      //   return;
      // }
      // Don't add if text is the same

      if (prospectiveEntry.isSameAsEntry(previousEntry)) {
        return;
      }

      this.entries.push(prospectiveEntry);
      return prospectiveEntry;
    }
  }, {
    key: "clear",
    value: function clear() {
      this.entries.length = 0;
    }
  }, {
    key: "optimize",
    value: function optimize() {
      var _this30 = this;

      var keepEntries = [];

      var isEntrySignificant = function isEntrySignificant(entry) {
        return entry.deltaSize() > SFItemHistory.LargeEntryDeltaThreshold;
      };

      var processEntry = function processEntry(entry, index, keep) {
        // Entries may be processed retrospectively, meaning it can be decided to be deleted, then an upcoming processing can change that.
        if (keep) {
          keepEntries.push(entry);
        } else {
          // Remove if in keep
          var index = keepEntries.indexOf(entry);

          if (index !== -1) {
            keepEntries.splice(index, 1);
          }
        }

        if (keep && isEntrySignificant(entry) && entry.operationVector() == -1) {
          // This is a large negative change. Hang on to the previous entry.
          var previousEntry = _this30.entries[index - 1];

          if (previousEntry) {
            keepEntries.push(previousEntry);
          }
        }
      };

      this.entries.forEach(function (entry, index) {
        if (index == 0 || index == _this30.entries.length - 1) {
          // Keep the first and last
          processEntry(entry, index, true);
        } else {
          var significant = isEntrySignificant(entry);
          processEntry(entry, index, significant);
        }
      });
      this.entries = this.entries.filter(function (entry, index) {
        return keepEntries.indexOf(entry) !== -1;
      });
    }
  }]);

  return SFItemHistory;
}(); // The amount of characters added or removed that constitute a keepable entry after optimization.


exports.SFItemHistory = SFItemHistory;
SFItemHistory.LargeEntryDeltaThreshold = 15;
;

var SFItemHistoryEntry =
/*#__PURE__*/
function () {
  function SFItemHistoryEntry(item) {
    _classCallCheck(this, SFItemHistoryEntry);

    // Whatever values `item` has will be persisted, so be sure that the values are picked beforehand.
    this.item = SFItem.deepMerge({}, item); // We'll assume a `text` content value to diff on. If it doesn't exist, no problem.

    this.defaultContentKeyToDiffOn = "text"; // Default value

    this.textCharDiffLength = 0;

    if (typeof this.item.updated_at == 'string') {
      this.item.updated_at = new Date(this.item.updated_at);
    }
  }

  _createClass(SFItemHistoryEntry, [{
    key: "setPreviousEntry",
    value: function setPreviousEntry(previousEntry) {
      this.hasPreviousEntry = previousEntry != null; // we'll try to compute the delta based on an assumed content property of `text`, if it exists.

      if (this.item.content[this.defaultContentKeyToDiffOn]) {
        if (previousEntry) {
          this.textCharDiffLength = this.item.content[this.defaultContentKeyToDiffOn].length - previousEntry.item.content[this.defaultContentKeyToDiffOn].length;
        } else {
          this.textCharDiffLength = this.item.content[this.defaultContentKeyToDiffOn].length;
        }
      }
    }
  }, {
    key: "operationVector",
    value: function operationVector() {
      // We'll try to use the value of `textCharDiffLength` to help determine this, if it's set
      if (this.textCharDiffLength != undefined) {
        if (!this.hasPreviousEntry || this.textCharDiffLength == 0) {
          return 0;
        } else if (this.textCharDiffLength < 0) {
          return -1;
        } else {
          return 1;
        }
      } // Otherwise use a default value of 1


      return 1;
    }
  }, {
    key: "deltaSize",
    value: function deltaSize() {
      // Up to the subclass to determine how large the delta was, i.e number of characters changed.
      // But this general class won't be able to determine which property it should diff on, or even its format.
      // We can return the `textCharDiffLength` if it's set, otherwise, just return 1;
      if (this.textCharDiffLength != undefined) {
        return Math.abs(this.textCharDiffLength);
      } // Otherwise return 1 here to constitute a basic positive delta.
      // The value returned should always be positive. override `operationVector` to return the direction of the delta.


      return 1;
    }
  }, {
    key: "isSameAsEntry",
    value: function isSameAsEntry(entry) {
      if (!entry) {
        return false;
      }

      var lhs = new SFItem(this.item);
      var rhs = new SFItem(entry.item);
      return lhs.isItemContentEqualWith(rhs);
    }
  }]);

  return SFItemHistoryEntry;
}();

exports.SFItemHistoryEntry = SFItemHistoryEntry;
;
/*
 Abstract class with default implementations of some crypto functions.
 Instantiate an instance of either SFCryptoJS (uses cryptojs) or SFCryptoWeb (uses web crypto)
 These subclasses may override some of the functions in this abstract class.
*/

var globalScope = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : null;

var SFAbstractCrypto =
/*#__PURE__*/
function () {
  function SFAbstractCrypto() {
    _classCallCheck(this, SFAbstractCrypto);

    this.DefaultPBKDF2Length = 768;
  }

  _createClass(SFAbstractCrypto, [{
    key: "generateUUIDSync",
    value: function generateUUIDSync() {
      var crypto = globalScope.crypto || globalScope.msCrypto;

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

        if (globalScope.performance && typeof globalScope.performance.now === "function") {
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
    key: "generateUUID",
    value: function () {
      var _generateUUID = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee116() {
        return regeneratorRuntime.wrap(function _callee116$(_context117) {
          while (1) {
            switch (_context117.prev = _context117.next) {
              case 0:
                return _context117.abrupt("return", this.generateUUIDSync());

              case 1:
              case "end":
                return _context117.stop();
            }
          }
        }, _callee116, this);
      }));

      function generateUUID() {
        return _generateUUID.apply(this, arguments);
      }

      return generateUUID;
    }()
    /* Constant-time string comparison */

  }, {
    key: "timingSafeEqual",
    value: function timingSafeEqual(a, b) {
      var strA = String(a);
      var strB = String(b);
      var lenA = strA.length;
      var result = 0;

      if (lenA !== strB.length) {
        strB = strA;
        result = 1;
      }

      for (var i = 0; i < lenA; i++) {
        result |= strA.charCodeAt(i) ^ strB.charCodeAt(i);
      }

      return result === 0;
    }
  }, {
    key: "decryptText",
    value: function () {
      var _decryptText = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee117() {
        var _ref27,
            ciphertextToAuth,
            contentCiphertext,
            encryptionKey,
            iv,
            authHash,
            authKey,
            requiresAuth,
            localAuthHash,
            keyData,
            ivData,
            decrypted,
            _args118 = arguments;

        return regeneratorRuntime.wrap(function _callee117$(_context118) {
          while (1) {
            switch (_context118.prev = _context118.next) {
              case 0:
                _ref27 = _args118.length > 0 && _args118[0] !== undefined ? _args118[0] : {}, ciphertextToAuth = _ref27.ciphertextToAuth, contentCiphertext = _ref27.contentCiphertext, encryptionKey = _ref27.encryptionKey, iv = _ref27.iv, authHash = _ref27.authHash, authKey = _ref27.authKey;
                requiresAuth = _args118.length > 1 ? _args118[1] : undefined;

                if (!(requiresAuth && !authHash)) {
                  _context118.next = 5;
                  break;
                }

                console.error("Auth hash is required.");
                return _context118.abrupt("return");

              case 5:
                if (!authHash) {
                  _context118.next = 12;
                  break;
                }

                _context118.next = 8;
                return this.hmac256(ciphertextToAuth, authKey);

              case 8:
                localAuthHash = _context118.sent;

                if (!(this.timingSafeEqual(authHash, localAuthHash) === false)) {
                  _context118.next = 12;
                  break;
                }

                console.error("Auth hash does not match, returning null.");
                return _context118.abrupt("return", null);

              case 12:
                keyData = CryptoJS.enc.Hex.parse(encryptionKey);
                ivData = CryptoJS.enc.Hex.parse(iv || "");
                decrypted = CryptoJS.AES.decrypt(contentCiphertext, keyData, {
                  iv: ivData,
                  mode: CryptoJS.mode.CBC,
                  padding: CryptoJS.pad.Pkcs7
                });
                return _context118.abrupt("return", decrypted.toString(CryptoJS.enc.Utf8));

              case 16:
              case "end":
                return _context118.stop();
            }
          }
        }, _callee117, this);
      }));

      function decryptText() {
        return _decryptText.apply(this, arguments);
      }

      return decryptText;
    }()
  }, {
    key: "encryptText",
    value: function () {
      var _encryptText = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee118(text, key, iv) {
        var keyData, ivData, encrypted;
        return regeneratorRuntime.wrap(function _callee118$(_context119) {
          while (1) {
            switch (_context119.prev = _context119.next) {
              case 0:
                keyData = CryptoJS.enc.Hex.parse(key);
                ivData = CryptoJS.enc.Hex.parse(iv || "");
                encrypted = CryptoJS.AES.encrypt(text, keyData, {
                  iv: ivData,
                  mode: CryptoJS.mode.CBC,
                  padding: CryptoJS.pad.Pkcs7
                });
                return _context119.abrupt("return", encrypted.toString());

              case 4:
              case "end":
                return _context119.stop();
            }
          }
        }, _callee118);
      }));

      function encryptText(_x143, _x144, _x145) {
        return _encryptText.apply(this, arguments);
      }

      return encryptText;
    }()
  }, {
    key: "generateRandomKey",
    value: function () {
      var _generateRandomKey = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee119(bits) {
        return regeneratorRuntime.wrap(function _callee119$(_context120) {
          while (1) {
            switch (_context120.prev = _context120.next) {
              case 0:
                return _context120.abrupt("return", CryptoJS.lib.WordArray.random(bits / 8).toString());

              case 1:
              case "end":
                return _context120.stop();
            }
          }
        }, _callee119);
      }));

      function generateRandomKey(_x146) {
        return _generateRandomKey.apply(this, arguments);
      }

      return generateRandomKey;
    }()
  }, {
    key: "generateItemEncryptionKey",
    value: function () {
      var _generateItemEncryptionKey = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee120() {
        var length, cost, salt, passphrase;
        return regeneratorRuntime.wrap(function _callee120$(_context121) {
          while (1) {
            switch (_context121.prev = _context121.next) {
              case 0:
                // Generates a key that will be split in half, each being 256 bits. So total length will need to be 512.
                length = 512;
                cost = 1;
                _context121.next = 4;
                return this.generateRandomKey(length);

              case 4:
                salt = _context121.sent;
                _context121.next = 7;
                return this.generateRandomKey(length);

              case 7:
                passphrase = _context121.sent;
                return _context121.abrupt("return", this.pbkdf2(passphrase, salt, cost, length));

              case 9:
              case "end":
                return _context121.stop();
            }
          }
        }, _callee120, this);
      }));

      function generateItemEncryptionKey() {
        return _generateItemEncryptionKey.apply(this, arguments);
      }

      return generateItemEncryptionKey;
    }()
  }, {
    key: "firstHalfOfKey",
    value: function () {
      var _firstHalfOfKey = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee121(key) {
        return regeneratorRuntime.wrap(function _callee121$(_context122) {
          while (1) {
            switch (_context122.prev = _context122.next) {
              case 0:
                return _context122.abrupt("return", key.substring(0, key.length / 2));

              case 1:
              case "end":
                return _context122.stop();
            }
          }
        }, _callee121);
      }));

      function firstHalfOfKey(_x147) {
        return _firstHalfOfKey.apply(this, arguments);
      }

      return firstHalfOfKey;
    }()
  }, {
    key: "secondHalfOfKey",
    value: function () {
      var _secondHalfOfKey = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee122(key) {
        return regeneratorRuntime.wrap(function _callee122$(_context123) {
          while (1) {
            switch (_context123.prev = _context123.next) {
              case 0:
                return _context123.abrupt("return", key.substring(key.length / 2, key.length));

              case 1:
              case "end":
                return _context123.stop();
            }
          }
        }, _callee122);
      }));

      function secondHalfOfKey(_x148) {
        return _secondHalfOfKey.apply(this, arguments);
      }

      return secondHalfOfKey;
    }()
  }, {
    key: "base64",
    value: function () {
      var _base = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee123(text) {
        return regeneratorRuntime.wrap(function _callee123$(_context124) {
          while (1) {
            switch (_context124.prev = _context124.next) {
              case 0:
                return _context124.abrupt("return", globalScope.btoa(encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, function toSolidBytes(match, p1) {
                  return String.fromCharCode('0x' + p1);
                })));

              case 1:
              case "end":
                return _context124.stop();
            }
          }
        }, _callee123);
      }));

      function base64(_x149) {
        return _base.apply(this, arguments);
      }

      return base64;
    }()
  }, {
    key: "base64Decode",
    value: function () {
      var _base64Decode = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee124(base64String) {
        return regeneratorRuntime.wrap(function _callee124$(_context125) {
          while (1) {
            switch (_context125.prev = _context125.next) {
              case 0:
                return _context125.abrupt("return", globalScope.atob(base64String));

              case 1:
              case "end":
                return _context125.stop();
            }
          }
        }, _callee124);
      }));

      function base64Decode(_x150) {
        return _base64Decode.apply(this, arguments);
      }

      return base64Decode;
    }()
  }, {
    key: "sha256",
    value: function () {
      var _sha = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee125(text) {
        return regeneratorRuntime.wrap(function _callee125$(_context126) {
          while (1) {
            switch (_context126.prev = _context126.next) {
              case 0:
                return _context126.abrupt("return", CryptoJS.SHA256(text).toString());

              case 1:
              case "end":
                return _context126.stop();
            }
          }
        }, _callee125);
      }));

      function sha256(_x151) {
        return _sha.apply(this, arguments);
      }

      return sha256;
    }()
  }, {
    key: "hmac256",
    value: function () {
      var _hmac = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee126(message, key) {
        var keyData, messageData, result;
        return regeneratorRuntime.wrap(function _callee126$(_context127) {
          while (1) {
            switch (_context127.prev = _context127.next) {
              case 0:
                keyData = CryptoJS.enc.Hex.parse(key);
                messageData = CryptoJS.enc.Utf8.parse(message);
                result = CryptoJS.HmacSHA256(messageData, keyData).toString();
                return _context127.abrupt("return", result);

              case 4:
              case "end":
                return _context127.stop();
            }
          }
        }, _callee126);
      }));

      function hmac256(_x152, _x153) {
        return _hmac.apply(this, arguments);
      }

      return hmac256;
    }()
  }, {
    key: "generateSalt",
    value: function () {
      var _generateSalt = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee127(identifier, version, cost, nonce) {
        var result;
        return regeneratorRuntime.wrap(function _callee127$(_context128) {
          while (1) {
            switch (_context128.prev = _context128.next) {
              case 0:
                _context128.next = 2;
                return this.sha256([identifier, "SF", version, cost, nonce].join(":"));

              case 2:
                result = _context128.sent;
                return _context128.abrupt("return", result);

              case 4:
              case "end":
                return _context128.stop();
            }
          }
        }, _callee127, this);
      }));

      function generateSalt(_x154, _x155, _x156, _x157) {
        return _generateSalt.apply(this, arguments);
      }

      return generateSalt;
    }()
    /** Generates two deterministic keys based on one input */

  }, {
    key: "generateSymmetricKeyPair",
    value: function () {
      var _generateSymmetricKeyPair = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee128() {
        var _ref28,
            password,
            pw_salt,
            pw_cost,
            output,
            outputLength,
            splitLength,
            firstThird,
            secondThird,
            thirdThird,
            _args129 = arguments;

        return regeneratorRuntime.wrap(function _callee128$(_context129) {
          while (1) {
            switch (_context129.prev = _context129.next) {
              case 0:
                _ref28 = _args129.length > 0 && _args129[0] !== undefined ? _args129[0] : {}, password = _ref28.password, pw_salt = _ref28.pw_salt, pw_cost = _ref28.pw_cost;
                _context129.next = 3;
                return this.pbkdf2(password, pw_salt, pw_cost, this.DefaultPBKDF2Length);

              case 3:
                output = _context129.sent;
                outputLength = output.length;
                splitLength = outputLength / 3;
                firstThird = output.slice(0, splitLength);
                secondThird = output.slice(splitLength, splitLength * 2);
                thirdThird = output.slice(splitLength * 2, splitLength * 3);
                return _context129.abrupt("return", [firstThird, secondThird, thirdThird]);

              case 10:
              case "end":
                return _context129.stop();
            }
          }
        }, _callee128, this);
      }));

      function generateSymmetricKeyPair() {
        return _generateSymmetricKeyPair.apply(this, arguments);
      }

      return generateSymmetricKeyPair;
    }()
  }, {
    key: "computeEncryptionKeysForUser",
    value: function () {
      var _computeEncryptionKeysForUser = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee129(password, authParams) {
        var pw_salt;
        return regeneratorRuntime.wrap(function _callee129$(_context130) {
          while (1) {
            switch (_context130.prev = _context130.next) {
              case 0:
                if (!(authParams.version == "003")) {
                  _context130.next = 9;
                  break;
                }

                if (authParams.identifier) {
                  _context130.next = 4;
                  break;
                }

                console.error("authParams is missing identifier.");
                return _context130.abrupt("return");

              case 4:
                _context130.next = 6;
                return this.generateSalt(authParams.identifier, authParams.version, authParams.pw_cost, authParams.pw_nonce);

              case 6:
                pw_salt = _context130.sent;
                _context130.next = 10;
                break;

              case 9:
                // Salt is returned from server
                pw_salt = authParams.pw_salt;

              case 10:
                return _context130.abrupt("return", this.generateSymmetricKeyPair({
                  password: password,
                  pw_salt: pw_salt,
                  pw_cost: authParams.pw_cost
                }).then(function (keys) {
                  var userKeys = {
                    pw: keys[0],
                    mk: keys[1],
                    ak: keys[2]
                  };
                  return userKeys;
                }));

              case 11:
              case "end":
                return _context130.stop();
            }
          }
        }, _callee129, this);
      }));

      function computeEncryptionKeysForUser(_x158, _x159) {
        return _computeEncryptionKeysForUser.apply(this, arguments);
      }

      return computeEncryptionKeysForUser;
    }() // Unlike computeEncryptionKeysForUser, this method always uses the latest SF Version

  }, {
    key: "generateInitialKeysAndAuthParamsForUser",
    value: function () {
      var _generateInitialKeysAndAuthParamsForUser = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee130(identifier, password) {
        var version, pw_cost, pw_nonce, pw_salt;
        return regeneratorRuntime.wrap(function _callee130$(_context131) {
          while (1) {
            switch (_context131.prev = _context131.next) {
              case 0:
                version = this.SFJS.version;
                pw_cost = this.SFJS.defaultPasswordGenerationCost;
                _context131.next = 4;
                return this.generateRandomKey(256);

              case 4:
                pw_nonce = _context131.sent;
                _context131.next = 7;
                return this.generateSalt(identifier, version, pw_cost, pw_nonce);

              case 7:
                pw_salt = _context131.sent;
                return _context131.abrupt("return", this.generateSymmetricKeyPair({
                  password: password,
                  pw_salt: pw_salt,
                  pw_cost: pw_cost
                }).then(function (keys) {
                  var authParams = {
                    pw_nonce: pw_nonce,
                    pw_cost: pw_cost,
                    identifier: identifier,
                    version: version
                  };
                  var userKeys = {
                    pw: keys[0],
                    mk: keys[1],
                    ak: keys[2]
                  };
                  return {
                    keys: userKeys,
                    authParams: authParams
                  };
                }));

              case 9:
              case "end":
                return _context131.stop();
            }
          }
        }, _callee130, this);
      }));

      function generateInitialKeysAndAuthParamsForUser(_x160, _x161) {
        return _generateInitialKeysAndAuthParamsForUser.apply(this, arguments);
      }

      return generateInitialKeysAndAuthParamsForUser;
    }()
  }]);

  return SFAbstractCrypto;
}();

exports.SFAbstractCrypto = SFAbstractCrypto;
;

var SFCryptoJS =
/*#__PURE__*/
function (_SFAbstractCrypto) {
  _inherits(SFCryptoJS, _SFAbstractCrypto);

  function SFCryptoJS() {
    _classCallCheck(this, SFCryptoJS);

    return _possibleConstructorReturn(this, _getPrototypeOf(SFCryptoJS).apply(this, arguments));
  }

  _createClass(SFCryptoJS, [{
    key: "pbkdf2",
    value: function () {
      var _pbkdf = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee131(password, pw_salt, pw_cost, length) {
        var params;
        return regeneratorRuntime.wrap(function _callee131$(_context132) {
          while (1) {
            switch (_context132.prev = _context132.next) {
              case 0:
                params = {
                  keySize: length / 32,
                  hasher: CryptoJS.algo.SHA512,
                  iterations: pw_cost
                };
                return _context132.abrupt("return", CryptoJS.PBKDF2(password, pw_salt, params).toString());

              case 2:
              case "end":
                return _context132.stop();
            }
          }
        }, _callee131);
      }));

      function pbkdf2(_x162, _x163, _x164, _x165) {
        return _pbkdf.apply(this, arguments);
      }

      return pbkdf2;
    }()
  }]);

  return SFCryptoJS;
}(SFAbstractCrypto);

exports.SFCryptoJS = SFCryptoJS;
;
var globalScope = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : null;
var subtleCrypto = globalScope.crypto ? globalScope.crypto.subtle : null;

var SFCryptoWeb =
/*#__PURE__*/
function (_SFAbstractCrypto2) {
  _inherits(SFCryptoWeb, _SFAbstractCrypto2);

  function SFCryptoWeb() {
    _classCallCheck(this, SFCryptoWeb);

    return _possibleConstructorReturn(this, _getPrototypeOf(SFCryptoWeb).apply(this, arguments));
  }

  _createClass(SFCryptoWeb, [{
    key: "pbkdf2",

    /**
    Public
    */
    value: function () {
      var _pbkdf2 = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee132(password, pw_salt, pw_cost, length) {
        var key;
        return regeneratorRuntime.wrap(function _callee132$(_context133) {
          while (1) {
            switch (_context133.prev = _context133.next) {
              case 0:
                _context133.next = 2;
                return this.webCryptoImportKey(password, "PBKDF2", ["deriveBits"]);

              case 2:
                key = _context133.sent;

                if (key) {
                  _context133.next = 6;
                  break;
                }

                console.log("Key is null, unable to continue");
                return _context133.abrupt("return", null);

              case 6:
                return _context133.abrupt("return", this.webCryptoDeriveBits(key, pw_salt, pw_cost, length));

              case 7:
              case "end":
                return _context133.stop();
            }
          }
        }, _callee132, this);
      }));

      function pbkdf2(_x166, _x167, _x168, _x169) {
        return _pbkdf2.apply(this, arguments);
      }

      return pbkdf2;
    }()
  }, {
    key: "generateRandomKey",
    value: function () {
      var _generateRandomKey2 = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee134(bits) {
        var _this31 = this;

        var extractable;
        return regeneratorRuntime.wrap(function _callee134$(_context135) {
          while (1) {
            switch (_context135.prev = _context135.next) {
              case 0:
                extractable = true;
                return _context135.abrupt("return", subtleCrypto.generateKey({
                  name: "AES-CBC",
                  length: bits
                }, extractable, ["encrypt", "decrypt"]).then(function (keyObject) {
                  return subtleCrypto.exportKey("raw", keyObject).then(
                  /*#__PURE__*/
                  function () {
                    var _ref29 = _asyncToGenerator(
                    /*#__PURE__*/
                    regeneratorRuntime.mark(function _callee133(keyData) {
                      var key;
                      return regeneratorRuntime.wrap(function _callee133$(_context134) {
                        while (1) {
                          switch (_context134.prev = _context134.next) {
                            case 0:
                              _context134.next = 2;
                              return _this31.arrayBufferToHexString(new Uint8Array(keyData));

                            case 2:
                              key = _context134.sent;
                              return _context134.abrupt("return", key);

                            case 4:
                            case "end":
                              return _context134.stop();
                          }
                        }
                      }, _callee133);
                    }));

                    return function (_x171) {
                      return _ref29.apply(this, arguments);
                    };
                  }())["catch"](function (err) {
                    console.error("Error exporting key", err);
                  });
                })["catch"](function (err) {
                  console.error("Error generating key", err);
                }));

              case 2:
              case "end":
                return _context135.stop();
            }
          }
        }, _callee134);
      }));

      function generateRandomKey(_x170) {
        return _generateRandomKey2.apply(this, arguments);
      }

      return generateRandomKey;
    }()
  }, {
    key: "generateItemEncryptionKey",
    value: function () {
      var _generateItemEncryptionKey2 = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee135() {
        var length;
        return regeneratorRuntime.wrap(function _callee135$(_context136) {
          while (1) {
            switch (_context136.prev = _context136.next) {
              case 0:
                // Generates a key that will be split in half, each being 256 bits. So total length will need to be 512.
                length = 256;
                return _context136.abrupt("return", Promise.all([this.generateRandomKey(length), this.generateRandomKey(length)]).then(function (values) {
                  return values.join("");
                }));

              case 2:
              case "end":
                return _context136.stop();
            }
          }
        }, _callee135, this);
      }));

      function generateItemEncryptionKey() {
        return _generateItemEncryptionKey2.apply(this, arguments);
      }

      return generateItemEncryptionKey;
    }()
  }, {
    key: "encryptText",
    value: function () {
      var _encryptText2 = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee137(text, key, iv) {
        var _this32 = this;

        var ivData, alg, keyBuffer, keyData, textData;
        return regeneratorRuntime.wrap(function _callee137$(_context138) {
          while (1) {
            switch (_context138.prev = _context138.next) {
              case 0:
                if (!iv) {
                  _context138.next = 6;
                  break;
                }

                _context138.next = 3;
                return this.hexStringToArrayBuffer(iv);

              case 3:
                _context138.t0 = _context138.sent;
                _context138.next = 7;
                break;

              case 6:
                _context138.t0 = new ArrayBuffer(16);

              case 7:
                ivData = _context138.t0;
                alg = {
                  name: 'AES-CBC',
                  iv: ivData
                };
                _context138.next = 11;
                return this.hexStringToArrayBuffer(key);

              case 11:
                keyBuffer = _context138.sent;
                _context138.next = 14;
                return this.webCryptoImportKey(keyBuffer, alg.name, ["encrypt"]);

              case 14:
                keyData = _context138.sent;
                _context138.next = 17;
                return this.stringToArrayBuffer(text);

              case 17:
                textData = _context138.sent;
                return _context138.abrupt("return", crypto.subtle.encrypt(alg, keyData, textData).then(
                /*#__PURE__*/
                function () {
                  var _ref30 = _asyncToGenerator(
                  /*#__PURE__*/
                  regeneratorRuntime.mark(function _callee136(result) {
                    var cipher;
                    return regeneratorRuntime.wrap(function _callee136$(_context137) {
                      while (1) {
                        switch (_context137.prev = _context137.next) {
                          case 0:
                            _context137.next = 2;
                            return _this32.arrayBufferToBase64(result);

                          case 2:
                            cipher = _context137.sent;
                            return _context137.abrupt("return", cipher);

                          case 4:
                          case "end":
                            return _context137.stop();
                        }
                      }
                    }, _callee136);
                  }));

                  return function (_x175) {
                    return _ref30.apply(this, arguments);
                  };
                }()));

              case 19:
              case "end":
                return _context138.stop();
            }
          }
        }, _callee137, this);
      }));

      function encryptText(_x172, _x173, _x174) {
        return _encryptText2.apply(this, arguments);
      }

      return encryptText;
    }()
  }, {
    key: "decryptText",
    value: function () {
      var _decryptText2 = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee139() {
        var _this33 = this;

        var _ref31,
            ciphertextToAuth,
            contentCiphertext,
            encryptionKey,
            iv,
            authHash,
            authKey,
            requiresAuth,
            localAuthHash,
            ivData,
            alg,
            keyBuffer,
            keyData,
            textData,
            _args140 = arguments;

        return regeneratorRuntime.wrap(function _callee139$(_context140) {
          while (1) {
            switch (_context140.prev = _context140.next) {
              case 0:
                _ref31 = _args140.length > 0 && _args140[0] !== undefined ? _args140[0] : {}, ciphertextToAuth = _ref31.ciphertextToAuth, contentCiphertext = _ref31.contentCiphertext, encryptionKey = _ref31.encryptionKey, iv = _ref31.iv, authHash = _ref31.authHash, authKey = _ref31.authKey;
                requiresAuth = _args140.length > 1 ? _args140[1] : undefined;

                if (!(requiresAuth && !authHash)) {
                  _context140.next = 5;
                  break;
                }

                console.error("Auth hash is required.");
                return _context140.abrupt("return");

              case 5:
                if (!authHash) {
                  _context140.next = 12;
                  break;
                }

                _context140.next = 8;
                return this.hmac256(ciphertextToAuth, authKey);

              case 8:
                localAuthHash = _context140.sent;

                if (!(this.timingSafeEqual(authHash, localAuthHash) === false)) {
                  _context140.next = 12;
                  break;
                }

                console.error("Auth hash does not match, returning null. ".concat(authHash, " != ").concat(localAuthHash));
                return _context140.abrupt("return", null);

              case 12:
                if (!iv) {
                  _context140.next = 18;
                  break;
                }

                _context140.next = 15;
                return this.hexStringToArrayBuffer(iv);

              case 15:
                _context140.t0 = _context140.sent;
                _context140.next = 19;
                break;

              case 18:
                _context140.t0 = new ArrayBuffer(16);

              case 19:
                ivData = _context140.t0;
                alg = {
                  name: 'AES-CBC',
                  iv: ivData
                };
                _context140.next = 23;
                return this.hexStringToArrayBuffer(encryptionKey);

              case 23:
                keyBuffer = _context140.sent;
                _context140.next = 26;
                return this.webCryptoImportKey(keyBuffer, alg.name, ["decrypt"]);

              case 26:
                keyData = _context140.sent;
                _context140.next = 29;
                return this.base64ToArrayBuffer(contentCiphertext);

              case 29:
                textData = _context140.sent;
                return _context140.abrupt("return", crypto.subtle.decrypt(alg, keyData, textData).then(
                /*#__PURE__*/
                function () {
                  var _ref32 = _asyncToGenerator(
                  /*#__PURE__*/
                  regeneratorRuntime.mark(function _callee138(result) {
                    var decoded;
                    return regeneratorRuntime.wrap(function _callee138$(_context139) {
                      while (1) {
                        switch (_context139.prev = _context139.next) {
                          case 0:
                            _context139.next = 2;
                            return _this33.arrayBufferToString(result);

                          case 2:
                            decoded = _context139.sent;
                            return _context139.abrupt("return", decoded);

                          case 4:
                          case "end":
                            return _context139.stop();
                        }
                      }
                    }, _callee138);
                  }));

                  return function (_x176) {
                    return _ref32.apply(this, arguments);
                  };
                }())["catch"](function (error) {
                  console.error("Error decrypting:", error);
                }));

              case 31:
              case "end":
                return _context140.stop();
            }
          }
        }, _callee139, this);
      }));

      function decryptText() {
        return _decryptText2.apply(this, arguments);
      }

      return decryptText;
    }()
  }, {
    key: "hmac256",
    value: function () {
      var _hmac2 = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee141(message, key) {
        var _this34 = this;

        var keyHexData, keyData, messageData;
        return regeneratorRuntime.wrap(function _callee141$(_context142) {
          while (1) {
            switch (_context142.prev = _context142.next) {
              case 0:
                _context142.next = 2;
                return this.hexStringToArrayBuffer(key);

              case 2:
                keyHexData = _context142.sent;
                _context142.next = 5;
                return this.webCryptoImportKey(keyHexData, "HMAC", ["sign"], {
                  name: "SHA-256"
                });

              case 5:
                keyData = _context142.sent;
                _context142.next = 8;
                return this.stringToArrayBuffer(message);

              case 8:
                messageData = _context142.sent;
                return _context142.abrupt("return", crypto.subtle.sign({
                  name: "HMAC"
                }, keyData, messageData).then(
                /*#__PURE__*/
                function () {
                  var _ref33 = _asyncToGenerator(
                  /*#__PURE__*/
                  regeneratorRuntime.mark(function _callee140(signature) {
                    var hash;
                    return regeneratorRuntime.wrap(function _callee140$(_context141) {
                      while (1) {
                        switch (_context141.prev = _context141.next) {
                          case 0:
                            _context141.next = 2;
                            return _this34.arrayBufferToHexString(signature);

                          case 2:
                            hash = _context141.sent;
                            return _context141.abrupt("return", hash);

                          case 4:
                          case "end":
                            return _context141.stop();
                        }
                      }
                    }, _callee140);
                  }));

                  return function (_x179) {
                    return _ref33.apply(this, arguments);
                  };
                }())["catch"](function (err) {
                  console.error("Error computing hmac", err);
                }));

              case 10:
              case "end":
                return _context142.stop();
            }
          }
        }, _callee141, this);
      }));

      function hmac256(_x177, _x178) {
        return _hmac2.apply(this, arguments);
      }

      return hmac256;
    }()
    /**
    Internal
    */

  }, {
    key: "webCryptoImportKey",
    value: function () {
      var _webCryptoImportKey = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee142(input, alg, actions, hash) {
        var text;
        return regeneratorRuntime.wrap(function _callee142$(_context143) {
          while (1) {
            switch (_context143.prev = _context143.next) {
              case 0:
                if (!(typeof input === "string")) {
                  _context143.next = 6;
                  break;
                }

                _context143.next = 3;
                return this.stringToArrayBuffer(input);

              case 3:
                _context143.t0 = _context143.sent;
                _context143.next = 7;
                break;

              case 6:
                _context143.t0 = input;

              case 7:
                text = _context143.t0;
                return _context143.abrupt("return", subtleCrypto.importKey("raw", text, {
                  name: alg,
                  hash: hash
                }, false, actions).then(function (key) {
                  return key;
                })["catch"](function (err) {
                  console.error(err);
                  return null;
                }));

              case 9:
              case "end":
                return _context143.stop();
            }
          }
        }, _callee142, this);
      }));

      function webCryptoImportKey(_x180, _x181, _x182, _x183) {
        return _webCryptoImportKey.apply(this, arguments);
      }

      return webCryptoImportKey;
    }()
  }, {
    key: "webCryptoDeriveBits",
    value: function () {
      var _webCryptoDeriveBits = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee144(key, pw_salt, pw_cost, length) {
        var _this35 = this;

        var params;
        return regeneratorRuntime.wrap(function _callee144$(_context145) {
          while (1) {
            switch (_context145.prev = _context145.next) {
              case 0:
                _context145.next = 2;
                return this.stringToArrayBuffer(pw_salt);

              case 2:
                _context145.t0 = _context145.sent;
                _context145.t1 = pw_cost;
                _context145.t2 = {
                  name: "SHA-512"
                };
                params = {
                  "name": "PBKDF2",
                  salt: _context145.t0,
                  iterations: _context145.t1,
                  hash: _context145.t2
                };
                return _context145.abrupt("return", subtleCrypto.deriveBits(params, key, length).then(
                /*#__PURE__*/
                function () {
                  var _ref34 = _asyncToGenerator(
                  /*#__PURE__*/
                  regeneratorRuntime.mark(function _callee143(bits) {
                    var key;
                    return regeneratorRuntime.wrap(function _callee143$(_context144) {
                      while (1) {
                        switch (_context144.prev = _context144.next) {
                          case 0:
                            _context144.next = 2;
                            return _this35.arrayBufferToHexString(new Uint8Array(bits));

                          case 2:
                            key = _context144.sent;
                            return _context144.abrupt("return", key);

                          case 4:
                          case "end":
                            return _context144.stop();
                        }
                      }
                    }, _callee143);
                  }));

                  return function (_x188) {
                    return _ref34.apply(this, arguments);
                  };
                }())["catch"](function (err) {
                  console.error(err);
                  return null;
                }));

              case 7:
              case "end":
                return _context145.stop();
            }
          }
        }, _callee144, this);
      }));

      function webCryptoDeriveBits(_x184, _x185, _x186, _x187) {
        return _webCryptoDeriveBits.apply(this, arguments);
      }

      return webCryptoDeriveBits;
    }()
  }, {
    key: "stringToArrayBuffer",
    value: function () {
      var _stringToArrayBuffer = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee145(string) {
        return regeneratorRuntime.wrap(function _callee145$(_context146) {
          while (1) {
            switch (_context146.prev = _context146.next) {
              case 0:
                return _context146.abrupt("return", new Promise(function (resolve, reject) {
                  var blob = new Blob([string]);
                  var f = new FileReader();

                  f.onload = function (e) {
                    resolve(e.target.result);
                  };

                  f.readAsArrayBuffer(blob);
                }));

              case 1:
              case "end":
                return _context146.stop();
            }
          }
        }, _callee145);
      }));

      function stringToArrayBuffer(_x189) {
        return _stringToArrayBuffer.apply(this, arguments);
      }

      return stringToArrayBuffer;
    }()
  }, {
    key: "arrayBufferToString",
    value: function () {
      var _arrayBufferToString = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee146(arrayBuffer) {
        return regeneratorRuntime.wrap(function _callee146$(_context147) {
          while (1) {
            switch (_context147.prev = _context147.next) {
              case 0:
                return _context147.abrupt("return", new Promise(function (resolve, reject) {
                  var blob = new Blob([arrayBuffer]);
                  var f = new FileReader();

                  f.onload = function (e) {
                    resolve(e.target.result);
                  };

                  f.readAsText(blob);
                }));

              case 1:
              case "end":
                return _context147.stop();
            }
          }
        }, _callee146);
      }));

      function arrayBufferToString(_x190) {
        return _arrayBufferToString.apply(this, arguments);
      }

      return arrayBufferToString;
    }()
  }, {
    key: "arrayBufferToHexString",
    value: function () {
      var _arrayBufferToHexString = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee147(arrayBuffer) {
        var byteArray, hexString, nextHexByte, i;
        return regeneratorRuntime.wrap(function _callee147$(_context148) {
          while (1) {
            switch (_context148.prev = _context148.next) {
              case 0:
                byteArray = new Uint8Array(arrayBuffer);
                hexString = "";

                for (i = 0; i < byteArray.byteLength; i++) {
                  nextHexByte = byteArray[i].toString(16);

                  if (nextHexByte.length < 2) {
                    nextHexByte = "0" + nextHexByte;
                  }

                  hexString += nextHexByte;
                }

                return _context148.abrupt("return", hexString);

              case 4:
              case "end":
                return _context148.stop();
            }
          }
        }, _callee147);
      }));

      function arrayBufferToHexString(_x191) {
        return _arrayBufferToHexString.apply(this, arguments);
      }

      return arrayBufferToHexString;
    }()
  }, {
    key: "hexStringToArrayBuffer",
    value: function () {
      var _hexStringToArrayBuffer = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee148(hex) {
        var bytes, c;
        return regeneratorRuntime.wrap(function _callee148$(_context149) {
          while (1) {
            switch (_context149.prev = _context149.next) {
              case 0:
                for (bytes = [], c = 0; c < hex.length; c += 2) {
                  bytes.push(parseInt(hex.substr(c, 2), 16));
                }

                return _context149.abrupt("return", new Uint8Array(bytes));

              case 2:
              case "end":
                return _context149.stop();
            }
          }
        }, _callee148);
      }));

      function hexStringToArrayBuffer(_x192) {
        return _hexStringToArrayBuffer.apply(this, arguments);
      }

      return hexStringToArrayBuffer;
    }()
  }, {
    key: "base64ToArrayBuffer",
    value: function () {
      var _base64ToArrayBuffer = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee149(base64) {
        var binary_string, len, bytes, i;
        return regeneratorRuntime.wrap(function _callee149$(_context150) {
          while (1) {
            switch (_context150.prev = _context150.next) {
              case 0:
                _context150.next = 2;
                return this.base64Decode(base64);

              case 2:
                binary_string = _context150.sent;
                len = binary_string.length;
                bytes = new Uint8Array(len);

                for (i = 0; i < len; i++) {
                  bytes[i] = binary_string.charCodeAt(i);
                }

                return _context150.abrupt("return", bytes.buffer);

              case 7:
              case "end":
                return _context150.stop();
            }
          }
        }, _callee149, this);
      }));

      function base64ToArrayBuffer(_x193) {
        return _base64ToArrayBuffer.apply(this, arguments);
      }

      return base64ToArrayBuffer;
    }()
  }, {
    key: "arrayBufferToBase64",
    value: function () {
      var _arrayBufferToBase = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee150(buffer) {
        return regeneratorRuntime.wrap(function _callee150$(_context151) {
          while (1) {
            switch (_context151.prev = _context151.next) {
              case 0:
                return _context151.abrupt("return", new Promise(function (resolve, reject) {
                  var blob = new Blob([buffer], {
                    type: 'application/octet-binary'
                  });
                  var reader = new FileReader();

                  reader.onload = function (evt) {
                    var dataurl = evt.target.result;
                    resolve(dataurl.substr(dataurl.indexOf(',') + 1));
                  };

                  reader.readAsDataURL(blob);
                }));

              case 1:
              case "end":
                return _context151.stop();
            }
          }
        }, _callee150);
      }));

      function arrayBufferToBase64(_x194) {
        return _arrayBufferToBase.apply(this, arguments);
      }

      return arrayBufferToBase64;
    }()
  }]);

  return SFCryptoWeb;
}(SFAbstractCrypto);

exports.SFCryptoWeb = SFCryptoWeb;
;

var SFItemTransformer =
/*#__PURE__*/
function () {
  function SFItemTransformer(crypto) {
    _classCallCheck(this, SFItemTransformer);

    this.crypto = crypto;
  }

  _createClass(SFItemTransformer, [{
    key: "_private_encryptString",
    value: function () {
      var _private_encryptString2 = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee151(string, encryptionKey, authKey, uuid, auth_params) {
        var fullCiphertext, contentCiphertext, iv, ciphertextToAuth, authHash, authParamsString;
        return regeneratorRuntime.wrap(function _callee151$(_context152) {
          while (1) {
            switch (_context152.prev = _context152.next) {
              case 0:
                if (!(auth_params.version === "001")) {
                  _context152.next = 7;
                  break;
                }

                _context152.next = 3;
                return this.crypto.encryptText(string, encryptionKey, null);

              case 3:
                contentCiphertext = _context152.sent;
                fullCiphertext = auth_params.version + contentCiphertext;
                _context152.next = 21;
                break;

              case 7:
                _context152.next = 9;
                return this.crypto.generateRandomKey(128);

              case 9:
                iv = _context152.sent;
                _context152.next = 12;
                return this.crypto.encryptText(string, encryptionKey, iv);

              case 12:
                contentCiphertext = _context152.sent;
                ciphertextToAuth = [auth_params.version, uuid, iv, contentCiphertext].join(":");
                _context152.next = 16;
                return this.crypto.hmac256(ciphertextToAuth, authKey);

              case 16:
                authHash = _context152.sent;
                _context152.next = 19;
                return this.crypto.base64(JSON.stringify(auth_params));

              case 19:
                authParamsString = _context152.sent;
                fullCiphertext = [auth_params.version, authHash, uuid, iv, contentCiphertext, authParamsString].join(":");

              case 21:
                return _context152.abrupt("return", fullCiphertext);

              case 22:
              case "end":
                return _context152.stop();
            }
          }
        }, _callee151, this);
      }));

      function _private_encryptString(_x195, _x196, _x197, _x198, _x199) {
        return _private_encryptString2.apply(this, arguments);
      }

      return _private_encryptString;
    }()
  }, {
    key: "encryptItem",
    value: function () {
      var _encryptItem = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee152(item, keys, auth_params) {
        var params, item_key, ek, ak, ciphertext, authHash;
        return regeneratorRuntime.wrap(function _callee152$(_context153) {
          while (1) {
            switch (_context153.prev = _context153.next) {
              case 0:
                params = {}; // encrypt item key

                _context153.next = 3;
                return this.crypto.generateItemEncryptionKey();

              case 3:
                item_key = _context153.sent;

                if (!(auth_params.version === "001")) {
                  _context153.next = 10;
                  break;
                }

                _context153.next = 7;
                return this.crypto.encryptText(item_key, keys.mk, null);

              case 7:
                params.enc_item_key = _context153.sent;
                _context153.next = 13;
                break;

              case 10:
                _context153.next = 12;
                return this._private_encryptString(item_key, keys.mk, keys.ak, item.uuid, auth_params);

              case 12:
                params.enc_item_key = _context153.sent;

              case 13:
                _context153.next = 15;
                return this.crypto.firstHalfOfKey(item_key);

              case 15:
                ek = _context153.sent;
                _context153.next = 18;
                return this.crypto.secondHalfOfKey(item_key);

              case 18:
                ak = _context153.sent;
                _context153.next = 21;
                return this._private_encryptString(JSON.stringify(item.createContentJSONFromProperties()), ek, ak, item.uuid, auth_params);

              case 21:
                ciphertext = _context153.sent;

                if (!(auth_params.version === "001")) {
                  _context153.next = 27;
                  break;
                }

                _context153.next = 25;
                return this.crypto.hmac256(ciphertext, ak);

              case 25:
                authHash = _context153.sent;
                params.auth_hash = authHash;

              case 27:
                params.content = ciphertext;
                return _context153.abrupt("return", params);

              case 29:
              case "end":
                return _context153.stop();
            }
          }
        }, _callee152, this);
      }));

      function encryptItem(_x200, _x201, _x202) {
        return _encryptItem.apply(this, arguments);
      }

      return encryptItem;
    }()
  }, {
    key: "encryptionComponentsFromString",
    value: function encryptionComponentsFromString(string, encryptionKey, authKey) {
      var encryptionVersion = string.substring(0, 3);

      if (encryptionVersion === "001") {
        return {
          contentCiphertext: string.substring(3, string.length),
          encryptionVersion: encryptionVersion,
          ciphertextToAuth: string,
          iv: null,
          authHash: null,
          encryptionKey: encryptionKey,
          authKey: authKey
        };
      } else {
        var components = string.split(":");
        return {
          encryptionVersion: components[0],
          authHash: components[1],
          uuid: components[2],
          iv: components[3],
          contentCiphertext: components[4],
          authParams: components[5],
          ciphertextToAuth: [components[0], components[2], components[3], components[4]].join(":"),
          encryptionKey: encryptionKey,
          authKey: authKey
        };
      }
    }
  }, {
    key: "decryptItem",
    value: function () {
      var _decryptItem = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee153(item, keys) {
        var encryptedItemKey, requiresAuth, keyParams, item_key, ek, ak, itemParams, content;
        return regeneratorRuntime.wrap(function _callee153$(_context154) {
          while (1) {
            switch (_context154.prev = _context154.next) {
              case 0:
                if (!(typeof item.content != "string")) {
                  _context154.next = 2;
                  break;
                }

                return _context154.abrupt("return");

              case 2:
                if (!item.content.startsWith("000")) {
                  _context154.next = 14;
                  break;
                }

                _context154.prev = 3;
                _context154.t0 = JSON;
                _context154.next = 7;
                return this.crypto.base64Decode(item.content.substring(3, item.content.length));

              case 7:
                _context154.t1 = _context154.sent;
                item.content = _context154.t0.parse.call(_context154.t0, _context154.t1);
                _context154.next = 13;
                break;

              case 11:
                _context154.prev = 11;
                _context154.t2 = _context154["catch"](3);

              case 13:
                return _context154.abrupt("return");

              case 14:
                if (item.enc_item_key) {
                  _context154.next = 17;
                  break;
                }

                // This needs to be here to continue, return otherwise
                console.log("Missing item encryption key, skipping decryption.");
                return _context154.abrupt("return");

              case 17:
                // decrypt encrypted key
                encryptedItemKey = item.enc_item_key;
                requiresAuth = true;

                if (!encryptedItemKey.startsWith("002") && !encryptedItemKey.startsWith("003")) {
                  // legacy encryption type, has no prefix
                  encryptedItemKey = "001" + encryptedItemKey;
                  requiresAuth = false;
                }

                keyParams = this.encryptionComponentsFromString(encryptedItemKey, keys.mk, keys.ak); // return if uuid in auth hash does not match item uuid. Signs of tampering.

                if (!(keyParams.uuid && keyParams.uuid !== item.uuid)) {
                  _context154.next = 26;
                  break;
                }

                console.error("Item key params UUID does not match item UUID");

                if (!item.errorDecrypting) {
                  item.errorDecryptingValueChanged = true;
                }

                item.errorDecrypting = true;
                return _context154.abrupt("return");

              case 26:
                _context154.next = 28;
                return this.crypto.decryptText(keyParams, requiresAuth);

              case 28:
                item_key = _context154.sent;

                if (item_key) {
                  _context154.next = 34;
                  break;
                }

                console.log("Error decrypting item", item);

                if (!item.errorDecrypting) {
                  item.errorDecryptingValueChanged = true;
                }

                item.errorDecrypting = true;
                return _context154.abrupt("return");

              case 34:
                _context154.next = 36;
                return this.crypto.firstHalfOfKey(item_key);

              case 36:
                ek = _context154.sent;
                _context154.next = 39;
                return this.crypto.secondHalfOfKey(item_key);

              case 39:
                ak = _context154.sent;
                itemParams = this.encryptionComponentsFromString(item.content, ek, ak);
                _context154.prev = 41;
                _context154.t3 = JSON;
                _context154.next = 45;
                return this.crypto.base64Decode(itemParams.authParams);

              case 45:
                _context154.t4 = _context154.sent;
                item.auth_params = _context154.t3.parse.call(_context154.t3, _context154.t4);
                _context154.next = 51;
                break;

              case 49:
                _context154.prev = 49;
                _context154.t5 = _context154["catch"](41);

              case 51:
                if (!(itemParams.uuid && itemParams.uuid !== item.uuid)) {
                  _context154.next = 55;
                  break;
                }

                if (!item.errorDecrypting) {
                  item.errorDecryptingValueChanged = true;
                }

                item.errorDecrypting = true;
                return _context154.abrupt("return");

              case 55:
                if (!itemParams.authHash) {
                  // legacy 001
                  itemParams.authHash = item.auth_hash;
                }

                _context154.next = 58;
                return this.crypto.decryptText(itemParams, true);

              case 58:
                content = _context154.sent;

                if (!content) {
                  if (!item.errorDecrypting) {
                    item.errorDecryptingValueChanged = true;
                  }

                  item.errorDecrypting = true;
                } else {
                  if (item.errorDecrypting == true) {
                    item.errorDecryptingValueChanged = true;
                  } // Content should only be set if it was successfully decrypted, and should otherwise remain unchanged.


                  item.errorDecrypting = false;
                  item.content = content;
                }

              case 60:
              case "end":
                return _context154.stop();
            }
          }
        }, _callee153, this, [[3, 11], [41, 49]]);
      }));

      function decryptItem(_x203, _x204) {
        return _decryptItem.apply(this, arguments);
      }

      return decryptItem;
    }()
  }, {
    key: "decryptMultipleItems",
    value: function () {
      var _decryptMultipleItems = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee155(items, keys, _throws) {
        var _this36 = this;

        var decrypt;
        return regeneratorRuntime.wrap(function _callee155$(_context156) {
          while (1) {
            switch (_context156.prev = _context156.next) {
              case 0:
                decrypt =
                /*#__PURE__*/
                function () {
                  var _ref35 = _asyncToGenerator(
                  /*#__PURE__*/
                  regeneratorRuntime.mark(function _callee154(item) {
                    var isString;
                    return regeneratorRuntime.wrap(function _callee154$(_context155) {
                      while (1) {
                        switch (_context155.prev = _context155.next) {
                          case 0:
                            if (item) {
                              _context155.next = 2;
                              break;
                            }

                            return _context155.abrupt("return");

                          case 2:
                            if (!(item.deleted == true && item.content == null)) {
                              _context155.next = 4;
                              break;
                            }

                            return _context155.abrupt("return");

                          case 4:
                            isString = typeof item.content === 'string' || item.content instanceof String;

                            if (!isString) {
                              _context155.next = 19;
                              break;
                            }

                            _context155.prev = 6;
                            _context155.next = 9;
                            return _this36.decryptItem(item, keys);

                          case 9:
                            _context155.next = 19;
                            break;

                          case 11:
                            _context155.prev = 11;
                            _context155.t0 = _context155["catch"](6);

                            if (!item.errorDecrypting) {
                              item.errorDecryptingValueChanged = true;
                            }

                            item.errorDecrypting = true;

                            if (!_throws) {
                              _context155.next = 17;
                              break;
                            }

                            throw _context155.t0;

                          case 17:
                            console.error("Error decrypting item", item, _context155.t0);
                            return _context155.abrupt("return");

                          case 19:
                          case "end":
                            return _context155.stop();
                        }
                      }
                    }, _callee154, null, [[6, 11]]);
                  }));

                  return function decrypt(_x208) {
                    return _ref35.apply(this, arguments);
                  };
                }();

                return _context156.abrupt("return", Promise.all(items.map(function (item) {
                  return decrypt(item);
                })));

              case 2:
              case "end":
                return _context156.stop();
            }
          }
        }, _callee155);
      }));

      function decryptMultipleItems(_x205, _x206, _x207) {
        return _decryptMultipleItems.apply(this, arguments);
      }

      return decryptMultipleItems;
    }()
  }]);

  return SFItemTransformer;
}();

exports.SFItemTransformer = SFItemTransformer;
;
var globalScope = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : null;

var StandardFile =
/*#__PURE__*/
function () {
  function StandardFile(cryptoInstance) {
    _classCallCheck(this, StandardFile);

    // This library runs in native environments as well (react native)
    if (globalScope) {
      // detect IE8 and above, and edge.
      // IE and Edge do not support pbkdf2 in WebCrypto, therefore we need to use CryptoJS
      var IEOrEdge = typeof document !== 'undefined' && document.documentMode || /Edge/.test(navigator.userAgent);

      if (!IEOrEdge && globalScope.crypto && globalScope.crypto.subtle) {
        this.crypto = new SFCryptoWeb();
      } else {
        this.crypto = new SFCryptoJS();
      }
    } // This must be placed outside window check, as it's used in native.


    if (cryptoInstance) {
      this.crypto = cryptoInstance;
    }

    this.itemTransformer = new SFItemTransformer(this.crypto);
    this.crypto.SFJS = {
      version: this.version(),
      defaultPasswordGenerationCost: this.defaultPasswordGenerationCost()
    };
  }

  _createClass(StandardFile, [{
    key: "version",
    value: function version() {
      return "003";
    }
  }, {
    key: "supportsPasswordDerivationCost",
    value: function supportsPasswordDerivationCost(cost) {
      // some passwords are created on platforms with stronger pbkdf2 capabilities, like iOS,
      // which CryptoJS can't handle here (WebCrypto can however).
      // if user has high password cost and is using browser that doesn't support WebCrypto,
      // we want to tell them that they can't login with this browser.
      if (cost > 5000) {
        return this.crypto instanceof SFCryptoWeb;
      } else {
        return true;
      }
    } // Returns the versions that this library supports technically.

  }, {
    key: "supportedVersions",
    value: function supportedVersions() {
      return ["001", "002", "003"];
    }
  }, {
    key: "isVersionNewerThanLibraryVersion",
    value: function isVersionNewerThanLibraryVersion(version) {
      var libraryVersion = this.version();
      return parseInt(version) > parseInt(libraryVersion);
    }
  }, {
    key: "isProtocolVersionOutdated",
    value: function isProtocolVersionOutdated(version) {
      // YYYY-MM-DD
      var expirationDates = {
        "001": Date.parse("2018-01-01"),
        "002": Date.parse("2020-01-01")
      };
      var date = expirationDates[version];

      if (!date) {
        // No expiration date, is active version
        return false;
      }

      var expired = new Date() > date;
      return expired;
    }
  }, {
    key: "costMinimumForVersion",
    value: function costMinimumForVersion(version) {
      return {
        "001": 3000,
        "002": 3000,
        "003": 110000
      }[version];
    }
  }, {
    key: "defaultPasswordGenerationCost",
    value: function defaultPasswordGenerationCost() {
      return this.costMinimumForVersion(this.version());
    }
  }]);

  return StandardFile;
}();

exports.StandardFile = StandardFile;

if (globalScope) {
  // window is for some reason defined in React Native, but throws an exception when you try to set to it
  try {
    globalScope.StandardFile = StandardFile;
    globalScope.SFJS = new StandardFile();
    globalScope.SFCryptoWeb = SFCryptoWeb;
    globalScope.SFCryptoJS = SFCryptoJS;
    globalScope.SFItemTransformer = SFItemTransformer;
    globalScope.SFModelManager = SFModelManager;
    globalScope.SFItem = SFItem;
    globalScope.SFItemParams = SFItemParams;
    globalScope.SFHttpManager = SFHttpManager;
    globalScope.SFStorageManager = SFStorageManager;
    globalScope.SFSyncManager = SFSyncManager;
    globalScope.SFAuthManager = SFAuthManager;
    globalScope.SFMigrationManager = SFMigrationManager;
    globalScope.SFAlertManager = SFAlertManager;
    globalScope.SFPredicate = SFPredicate;
    globalScope.SFHistorySession = SFHistorySession;
    globalScope.SFSessionHistoryManager = SFSessionHistoryManager;
    globalScope.SFItemHistory = SFItemHistory;
    globalScope.SFItemHistoryEntry = SFItemHistoryEntry;
    globalScope.SFPrivilegesManager = SFPrivilegesManager;
    globalScope.SFPrivileges = SFPrivileges;
    globalScope.SFSingletonManager = SFSingletonManager;
  } catch (e) {
    console.log("Exception while exporting window variables", e);
  }
}


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1])(1)
});

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1]);
