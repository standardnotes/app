class SNCryptoJS extends SNCrypto {

   /** Generates two deterministic keys based on one input */
   generateSymmetricKeyPair({password, pw_salt, pw_func, pw_alg, pw_cost, pw_key_size} = {}, callback) {
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
     callback([firstHalf, secondHalf])
   }

   defaultPasswordGenerationParams() {
     return {pw_func: "pbkdf2", pw_alg: "sha512", pw_key_size: 512, pw_cost: 3000};
   }
 }


export { SNCryptoJS }
