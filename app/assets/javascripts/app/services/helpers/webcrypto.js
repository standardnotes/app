var subtleCrypto = window.crypto.subtle;

class SNCryptoWeb extends SNCrypto {

  /**
  Overrides
  */
  defaultPasswordGenerationParams() {
    return {pw_func: "pbkdf2", pw_alg: "sha512", pw_key_size: 512, pw_cost: 5000};
  }

  /** Generates two deterministic keys based on one input */
  generateSymmetricKeyPair({password, pw_salt, pw_func, pw_alg, pw_cost, pw_key_size} = {}, callback) {
   this.stretchPassword({password: password, pw_func: pw_func, pw_alg: pw_alg, pw_salt: pw_salt, pw_cost: pw_cost, pw_key_size: pw_key_size}, function(output){
     var outputLength = output.length;
     var firstHalf = output.slice(0, outputLength/2);
     var secondHalf = output.slice(outputLength/2, outputLength);
     callback([firstHalf, secondHalf]);
   })
  }

  /**
  Internal
  */

  stretchPassword({password, pw_salt, pw_cost, pw_func, pw_alg, pw_key_size} = {}, callback) {

   this.webCryptoImportKey(password, pw_func, function(key){
     console.log("Importing key", password);

     if(!key) {
       console.log("Key is null, unable to continue");
       callback(null);
       return;
     }

     this.webCryptoDeriveBits({key: key, pw_func: pw_func, pw_alg: pw_alg, pw_salt: pw_salt, pw_cost: pw_cost, pw_key_size: pw_key_size}, function(key){
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

  webCryptoDeriveBits({key, pw_func, pw_alg, pw_salt, pw_cost, pw_key_size} = {}, callback) {
     var algMapping = {
       "sha256" : "SHA-256",
       "sha512" : "SHA-512",
     }
     var alg = algMapping[pw_alg];
     subtleCrypto.deriveBits(
      {
        "name": pw_func.toUpperCase(),
        salt: this.stringToArrayBuffer(pw_salt),
        iterations: pw_cost,
        hash: {name: alg},
      },
      key,
      pw_key_size
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
     var encoder = new TextEncoder("utf-8");
     return encoder.encode(string);
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
