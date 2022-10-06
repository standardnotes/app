export const V001Algorithm = Object.freeze({
  SaltSeedLength: 128,
  /**
   * V001 supported a variable PBKDF2 cost
   */
  PbkdfMinCost: 3000,
  PbkdfCostsUsed: [3000, 5000, 10_000, 60_000],
  PbkdfOutputLength: 512,
  EncryptionKeyLength: 256,
})

export const V002Algorithm = Object.freeze({
  SaltSeedLength: 128,
  /**
   * V002 supported a variable PBKDF2 cost
   */
  PbkdfMinCost: 3000,
  /**
   * While some 002 accounts also used costs in V001.PbkdfCostsUsed,
   * the vast majority used costs >= 100,000
   */
  PbkdfCostsUsed: V001Algorithm.PbkdfCostsUsed.concat([100_000, 101_000, 102_000, 103_000]),
  /** Possible costs used, but statistically more likely these were 001 accounts */
  ImprobablePbkdfCostsUsed: [3000, 5000],
  PbkdfOutputLength: 768,
  EncryptionKeyLength: 256,
  EncryptionIvLength: 128,
})

export enum V003Algorithm {
  SaltSeedLength = 256,
  PbkdfCost = 110000,
  PbkdfOutputLength = 768,
  EncryptionKeyLength = 256,
  EncryptionIvLength = 128,
}

export enum V004Algorithm {
  ArgonSaltSeedLength = 256,
  ArgonSaltLength = 128,
  ArgonIterations = 5,
  ArgonMemLimit = 67108864,
  ArgonOutputKeyBytes = 64,
  EncryptionKeyLength = 256,
  EncryptionNonceLength = 192,
}

export enum V005Algorithm {
  ArgonSaltSeedLength = 256,
  ArgonSaltLength = 128,
  ArgonIterations = 5,
  ArgonMemLimit = 67108864,
  ArgonOutputKeyBytes = 64,
  EncryptionKeyLength = 256,
  AsymmetricEncryptionNonceLength = 192,
  SymmetricEncryptionNonceLength = 192,
}

