var Neeto = Neeto || {};

Neeto.crypto = {

   generateRandomKey: function() {
     return CryptoJS.lib.WordArray.random(256/8).toString();
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

   /** Generates two deterministic 256 bit keys based on one input */
   generateAsymmetricKeyPair: function(input, salt) {
     var output = CryptoJS.PBKDF2(input, salt, { keySize: 512/32, hasher: CryptoJS.algo.SHA512, iterations: 3000 });
     var firstHalf = _.clone(output);
     var secondHalf = _.clone(output);
     var sigBytes = output.sigBytes/2;
     var outputLength = output.words.length;
     firstHalf.words = output.words.slice(0, outputLength/2);
     secondHalf.words = output.words.slice(outputLength/2, outputLength);
     firstHalf.sigBytes = sigBytes;
     secondHalf.sigBytes = sigBytes;
     return [firstHalf.toString(), secondHalf.toString()];
   },

   generateEncryptionKeysForUser: function(password, email) {
     var keys = Neeto.crypto.generateAsymmetricKeyPair(password, email);
     var pw = keys[0];
     var gk = keys[1];

     return {pw: pw, gk: gk};
   }
 };
