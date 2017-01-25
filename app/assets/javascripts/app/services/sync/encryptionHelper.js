class EncryptionHelper {

  encryptItem(item, key) {
    var item_key = null;
    if(item.enc_item_key) {
      item_key = Neeto.crypto.decryptText(item.enc_item_key, key);
    } else {
      item_key = Neeto.crypto.generateRandomEncryptionKey();
      item.enc_item_key = Neeto.crypto.encryptText(item_key, key);
    }

    var ek = Neeto.crypto.firstHalfOfKey(item_key);
    var ak = Neeto.crypto.secondHalfOfKey(item_key);
    var encryptedContent = "001" + Neeto.crypto.encryptText(JSON.stringify(item.createContentJSONFromProperties()), ek);
    var authHash = Neeto.crypto.hmac256(encryptedContent, ak);

    item.content = encryptedContent;
    item.auth_hash = authHash;
    item.local_encryption_scheme = "1.0";
  }

  decryptItem(item, key) {
    var item_key = Neeto.crypto.decryptText(item.enc_item_key, key);

    var ek = Neeto.crypto.firstHalfOfKey(item_key);
    var ak = Neeto.crypto.secondHalfOfKey(item_key);
    var authHash = Neeto.crypto.hmac256(item.content, ak);
    if(authHash !== item.auth_hash || !item.auth_hash) {
      console.log("Authentication hash does not match.")
      return;
    }

    var content = Neeto.crypto.decryptText(item.content.substring(3, item.content.length), ek);
    item.content = content;
  }

  decryptMultipleItems(items, key) {
   for (var item of items) {
     if(item.deleted == true) {
       continue;
     }

     var isString = typeof item.content === 'string' || item.content instanceof String;
     if(isString) {
       try {
         if(item.content.substring(0, 3) == "001" && item.enc_item_key) {
           // is encrypted
           this.decryptItem(item, key);
         } else {
           // is base64 encoded
           item.content = Neeto.crypto.base64Decode(item.content.substring(3, item.content.length))
         }
       } catch (e) {
         console.log("Error decrypting item", item, e);
         continue;
       }
     }
    }
  }

}

angular.module('app.frontend').service('encryptionHelper', EncryptionHelper);
