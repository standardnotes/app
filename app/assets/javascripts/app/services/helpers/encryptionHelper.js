class EncryptionHelper {

  static _private_encryptString(string, encryptionKey, authKey, version) {
    var fullCiphertext, contentCiphertext;
    if(version === "001") {
      contentCiphertext = Neeto.crypto.encryptText(string, encryptionKey, null);
      fullCiphertext = version + contentCiphertext;
    } else {
      var iv = Neeto.crypto.generateRandomKey(128);
      contentCiphertext = Neeto.crypto.encryptText(string, encryptionKey, iv);
      var ciphertextToAuth = [version, iv, contentCiphertext].join(":");
      var authHash = Neeto.crypto.hmac256(ciphertextToAuth, authKey);
      fullCiphertext = [version, authHash, iv, contentCiphertext].join(":");
    }

    return fullCiphertext;
  }

  static encryptItem(item, keys, version) {
    var params = {};
    // encrypt item key
    var item_key = Neeto.crypto.generateRandomEncryptionKey();
    if(version === "001") {
      // legacy
      params.enc_item_key = Neeto.crypto.encryptText(item_key, keys.mk, null);
    } else {
      params.enc_item_key = this._private_encryptString(item_key, keys.encryptionKey, keys.authKey, version);
    }

    // encrypt content
    var ek = Neeto.crypto.firstHalfOfKey(item_key);
    var ak = Neeto.crypto.secondHalfOfKey(item_key);
    var ciphertext = this._private_encryptString(JSON.stringify(item.createContentJSONFromProperties()), ek, ak, version);
    if(version === "001") {
      var authHash = Neeto.crypto.hmac256(ciphertext, ak);
      params.auth_hash = authHash;
    }

    params.content = ciphertext;
    return params;
  }

  static encryptionComponentsFromString(string, baseKey, encryptionKey, authKey) {
    var encryptionVersion = string.substring(0, 3);
    if(encryptionVersion === "001") {
      return {
        contentCiphertext: string.substring(3, string.length),
        encryptionVersion: encryptionVersion,
        ciphertextToAuth: string,
        iv: null,
        authHash: null,
        encryptionKey: baseKey,
        authKey: authKey
      }
    } else {
      let components = string.split(":");
      return {
        encryptionVersion: components[0],
        authHash: components[1],
        iv: components[2],
        contentCiphertext: components[3],
        ciphertextToAuth: [components[0], components[2], components[3]].join(":"),
        encryptionKey: encryptionKey,
        authKey: authKey
      }
    }
  }

  static decryptItem(item, keys) {
    // decrypt encrypted key
    var encryptedItemKey = item.enc_item_key;
    var requiresAuth = true;
    if(encryptedItemKey.startsWith("002") === false) {
      // legacy encryption type, has no prefix
      encryptedItemKey = "001" + encryptedItemKey;
      requiresAuth = false;
    }
    var keyParams = this.encryptionComponentsFromString(encryptedItemKey, keys.mk, keys.encryptionKey, keys.authKey);
    var item_key = Neeto.crypto.decryptText(keyParams, requiresAuth);

    if(!item_key) {
      return;
    }

    // decrypt content
    var ek = Neeto.crypto.firstHalfOfKey(item_key);
    var ak = Neeto.crypto.secondHalfOfKey(item_key);
    var itemParams = this.encryptionComponentsFromString(item.content, ek, ek, ak);
    if(!itemParams.authHash) {
      itemParams.authHash = item.auth_hash;
    }
    var content = Neeto.crypto.decryptText(itemParams, true);
    item.content = content;
  }

  static decryptMultipleItems(items, keys, throws) {
    for (var item of items) {
     if(item.deleted == true) {
       continue;
     }

     var isString = typeof item.content === 'string' || item.content instanceof String;
     if(isString) {
       try {
         if((item.content.startsWith("001") || item.content.startsWith("002")) && item.enc_item_key) {
           // is encrypted
           this.decryptItem(item, keys);
         } else {
           // is base64 encoded
           item.content = Neeto.crypto.base64Decode(item.content.substring(3, item.content.length))
         }
       } catch (e) {
         if(throws) {
           throw e;
         }
         console.log("Error decrypting item", item, e);
         continue;
       }
     }
   }
  }

}
