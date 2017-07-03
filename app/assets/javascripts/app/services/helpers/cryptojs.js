class SNCryptoJS extends SNCrypto {

   /** Generates two deterministic keys based on one input */
   generateSymmetricKeyPair({password, pw_salt, pw_cost} = {}, callback) {
     var output = CryptoJS.PBKDF2(password, pw_salt, { keySize: 768/32, hasher: CryptoJS.algo.SHA512, iterations: pw_cost }).toString();

     var outputLength = output.length;
     var splitLength = outputLength/3;
     var firstThird = output.slice(0, splitLength);
     var secondThird = output.slice(splitLength, splitLength);
     var thirdThird = output.slice(splitLength * 2, splitLength);
     callback([firstThird, secondThird, thirdThird])
   }

   defaultPasswordGenerationCost() {
     return 3000;
   }
 }


export { SNCryptoJS }
