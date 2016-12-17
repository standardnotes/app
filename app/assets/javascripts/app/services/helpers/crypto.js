var Neeto = Neeto || {};

Neeto.crypto = {

   generateRandomKey: function() {
     return CryptoJS.lib.WordArray.random(256/8).toString();
   },

   generateUUID: function() {
      var d = new Date().getTime();
      if(window.performance && typeof window.performance.now === "function"){
          d += performance.now(); //use high-precision timer if available
      }
      var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = (d + Math.random()*16)%16 | 0;
          d = Math.floor(d/16);
          return (c=='x' ? r : (r&0x3|0x8)).toString(16);
      });
      return uuid;
  },

   decryptText: function(encrypted_content, key) {
     return CryptoJS.AES.decrypt(encrypted_content, key).toString(CryptoJS.enc.Utf8);
   },

   encryptText: function(text, key) {
     return CryptoJS.AES.encrypt(text, key).toString();
   },

   generateRandomEncryptionKey: function() {
     var salt = Neeto.crypto.generateRandomKey();
     var passphrase = Neeto.crypto.generateRandomKey();
     return CryptoJS.PBKDF2(passphrase, salt, { keySize: 256/32 }).toString();
   },

   sha256: function(text) {
     return CryptoJS.SHA256(text).toString();
   },

   /** Generates two deterministic keys based on one input */
   generateSymmetricKeyPair: function({password, pw_salt, pw_func, pw_alg, pw_cost, pw_key_size} = {}) {
     var algMapping = {
       "sha256" : CryptoJS.algo.SHA256,
       "sha512" : CryptoJS.algo.SHA512
     }
     var fnMapping = {
       "pbkdf2" : CryptoJS.PBKDF2
     }

     var alg = algMapping[pw_alg];
     var kdf = fnMapping[pw_func];
     var output = kdf(password, pw_salt, { keySize: pw_key_size/32, hasher: alg, iterations: pw_cost }).toString();

     var outputLength = output.length;
     var firstHalf = output.slice(0, outputLength/2);
     var secondHalf = output.slice(outputLength/2, outputLength);
     return [firstHalf, secondHalf];
   },

   computeEncryptionKeysForUser: function({email, password, pw_salt, pw_func, pw_alg, pw_cost, pw_key_size} = {}) {
     var keys = Neeto.crypto.generateSymmetricKeyPair({password: password, pw_salt: pw_salt,
       pw_func: pw_func, pw_alg: pw_alg, pw_cost: pw_cost, pw_key_size: pw_key_size});
     var pw = keys[0];
     var gk = keys[1];

     return {pw: pw, gk: gk};
   },

   generateInitialEncryptionKeysForUser: function({email, password} = {}) {
     var defaults = this.defaultPasswordGenerationParams();
     var {pw_func, pw_alg, pw_key_size, pw_cost} = defaults;
     var pw_nonce = this.generateRandomKey();
     var pw_salt = CryptoJS.SHA1(email + "SN" + pw_nonce).toString();
     var keys = Neeto.crypto.generateSymmetricKeyPair(_.merge({email: email, password: password, pw_salt: pw_salt}, defaults));
     var pw = keys[0];
     var gk = keys[1];

     return _.merge({pw: pw, gk: gk, pw_nonce: pw_nonce}, defaults);
   },

   defaultPasswordGenerationParams: function() {
     return {pw_func: "pbkdf2", pw_alg: "sha512", pw_key_size: 512, pw_cost: 3000};
   }
 };
