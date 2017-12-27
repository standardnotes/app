'use strict';

var Neeto = window.Neeto = Neeto || {};
var SN = SN || {};

// detect IE8 and above, and edge.
// IE and Edge do not support pbkdf2 in WebCrypto, therefore we need to use CryptoJS
var IEOrEdge = document.documentMode || /Edge/.test(navigator.userAgent);

if(!IEOrEdge && (window.crypto && window.crypto.subtle)) {
  Neeto.crypto = new SNCryptoWeb();
} else {
  Neeto.crypto = new SNCryptoJS();
}

angular.module('app.frontend', [])

function getParameterByName(name, url) {
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function parametersFromURL(url) {
  url = url.split("?").slice(-1)[0];
  var obj = {};
  url.replace(/([^=&]+)=([^&]*)/g, function(m, key, value) {
    obj[decodeURIComponent(key)] = decodeURIComponent(value);
  });
  return obj;
}

function isDesktopApplication() {
  return window && window.process && window.process.type && window.process.versions["electron"];
}

function isMacApplication() {
  return window && window.process && window.process.type && window.process.platform == "darwin";
}
