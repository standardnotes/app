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
