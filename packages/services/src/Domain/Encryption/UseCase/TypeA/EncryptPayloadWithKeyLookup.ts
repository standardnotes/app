import { EncryptedOutputParameters, EncryptionOperatorsInterface } from '@standardnotes/encryption'
import {
  ContentTypeUsesKeySystemRootKeyEncryption,
  DecryptedPayloadInterface,
  KeySystemRootKeyInterface,
  RootKeyInterface,
} from '@standardnotes/models'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'

import { EncryptTypeAPayload } from './EncryptPayload'
import { RootKeyManager } from '../../../RootKeyManager/RootKeyManager'
import { KeySystemKeyManagerInterface } from '../../../KeySystem/KeySystemKeyManagerInterface'

export class EncryptTypeAPayloadWithKeyLookup {
  constructor(
    private operators: EncryptionOperatorsInterface,
    private keySystemKeyManager: KeySystemKeyManagerInterface,
    private rootKeyManager: RootKeyManager,
  ) {}

  async executeOne(
    payload: DecryptedPayloadInterface,
    signingKeyPair?: PkcKeyPair,
  ): Promise<EncryptedOutputParameters> {
    let key: RootKeyInterface | KeySystemRootKeyInterface | undefined
    if (ContentTypeUsesKeySystemRootKeyEncryption(payload.content_type)) {
      if (!payload.key_system_identifier) {
        throw Error(`Key system-encrypted payload ${payload.content_type}is missing a key_system_identifier`)
      }
      key = this.keySystemKeyManager.getPrimaryKeySystemRootKey(payload.key_system_identifier)
    } else {
      key = this.rootKeyManager.getRootKey()
    }

    if (key == undefined) {
      throw Error('Attempting root key encryption with no root key')
    }

    const usecase = new EncryptTypeAPayload(this.operators)
    return usecase.executeOne(payload, key, signingKeyPair)
  }

  async executeMany(
    payloads: DecryptedPayloadInterface[],
    signingKeyPair?: PkcKeyPair,
  ): Promise<EncryptedOutputParameters[]> {
    return Promise.all(payloads.map((payload) => this.executeOne(payload, signingKeyPair)))
  }
}
