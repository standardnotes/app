var subtleCrypto = window.crypto ? window.crypto.subtle : null;

class SNCryptoWeb extends SNCrypto {

  /**
  Overrides
  */
  defaultPasswordGenerationCost() {
    return 10000;
  }

  /** Generates two deterministic keys based on one input */
  generateSymmetricKeyPair({password, pw_salt, pw_func, pw_alg, pw_cost, pw_key_size} = {}, callback) {
   this.stretchPassword({password: password, pw_func: pw_func, pw_alg: pw_alg, pw_salt: pw_salt, pw_cost: pw_cost, pw_key_size: pw_key_size}, function(output){
     var outputLength = output.length;
     var splitLength = outputLength/3;
     var firstThird = output.slice(0, splitLength);
     var secondThird = output.slice(splitLength, splitLength);
     var thirdThird = output.slice(splitLength * 2, splitLength);
     callback([firstThird, secondThird, thirdThird])
   })
  }

  /**
  Internal
  */

  stretchPassword({password, pw_salt, pw_cost} = {}, callback) {

   this.webCryptoImportKey(password, pw_func, function(key){

     if(!key) {
       console.log("Key is null, unable to continue");
       callback(null);
       return;
     }

     this.webCryptoDeriveBits({key: key, pw_salt: pw_salt, pw_cost: pw_cost}, function(key){
       if(!key) {
         callback(null);
         return;
       }

       callback(key);

     }.bind(this))
   }.bind(this))
  }

  webCryptoImportKey(input, pw_func, callback) {
     subtleCrypto.importKey(
      "raw",
      this.stringToArrayBuffer(input),
      {name: pw_func.toUpperCase()},
      false,
      ["deriveBits"]
    )
    .then(function(key){
      callback(key);
    })
    .catch(function(err){
      console.error(err);
      callback(null);
    });
  }

  webCryptoDeriveBits({key, pw_salt, pw_cost} = {}, callback) {
     subtleCrypto.deriveBits(
      {
        "name": pw_func.toUpperCase(),
        salt: this.stringToArrayBuffer(pw_salt),
        iterations: pw_cost,
        hash: {name: "SHA-512"},
      },
      key,
      768
    )
    .then(function(bits){
      var key = this.arrayBufferToHexString(new Uint8Array(bits));
      callback(key);
    }.bind(this))
    .catch(function(err){
      console.error(err);
      callback(null);
    });
  }

  stringToArrayBuffer(string) {
    // not available on Edge/IE

    if(window.TextEncoder) {
      var encoder = new TextEncoder("utf-8");
      var result = encoder.encode(string);
      return result;
    } else {
      string = unescape(encodeURIComponent(string));
      var buf = new ArrayBuffer(string.length);
      var bufView = new Uint8Array(buf);
      for (var i=0, strLen=string.length; i<strLen; i++) {
        bufView[i] = string.charCodeAt(i);
      }
      return buf;
    }
  }

  arrayBufferToHexString(arrayBuffer) {
      var byteArray = new Uint8Array(arrayBuffer);
      var hexString = "";
      var nextHexByte;

      for (var i=0; i<byteArray.byteLength; i++) {
          nextHexByte = byteArray[i].toString(16);
          if (nextHexByte.length < 2) {
              nextHexByte = "0" + nextHexByte;
          }
          hexString += nextHexByte;
      }
      return hexString;
  }
}

export { SNCryptoWeb }
