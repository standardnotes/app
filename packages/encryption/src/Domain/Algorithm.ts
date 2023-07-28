import { SodiumConstant } from '@standardnotes/sncrypto-common'

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

export const V003Algorithm = Object.freeze({
  SaltSeedLength: 256,
  PbkdfCost: 110000,
  PbkdfOutputLength: 768,
  EncryptionKeyLength: 256,
  EncryptionIvLength: 128,
})

export const V004Algorithm = Object.freeze({
  ArgonSaltSeedLength: 256,
  ArgonSaltLength: 128,
  ArgonIterations: 5,
  ArgonMemLimit: 67108864,
  ArgonOutputKeyBytes: 64,

  EncryptionKeyLength: 256,
  EncryptionNonceLength: 192,

  AsymmetricEncryptionNonceLength: 192,

  MasterKeyEncryptionKeyPairSubKeyNumber: 1,
  MasterKeyEncryptionKeyPairSubKeyContext: 'sn-pkc-e',
  MasterKeyEncryptionKeyPairSubKeyBytes: SodiumConstant.crypto_box_SEEDBYTES,

  MasterKeySigningKeyPairSubKeyNumber: 2,
  MasterKeySigningKeyPairSubKeyContext: 'sn-pkc-s',
  MasterKeySigningKeyPairSubKeyBytes: SodiumConstant.crypto_sign_SEEDBYTES,

  PayloadKeyHashingKeySubKeyNumber: 1,
  PayloadKeyHashingKeySubKeyContext: 'sn-sym-h',
  PayloadKeyHashingKeySubKeyBytes: SodiumConstant.crypto_generichash_KEYBYTES,
})
