import { ContentType, ProtocolVersion } from '@standardnotes/common'
import {
  DecryptedPayload,
  FillItemContentSpecialized,
  PayloadTimestampDefaults,
  RootKeyContent,
  RootKeyContentSpecialized,
  RootKeyInterface,
} from '@standardnotes/models'
import { UuidGenerator } from '@standardnotes/utils'
import { SNRootKey } from './RootKey'

export function CreateNewRootKey<K extends RootKeyInterface>(content: RootKeyContentSpecialized): K {
  const uuid = UuidGenerator.GenerateUuid()

  const payload = new DecryptedPayload<RootKeyContent>({
    uuid: uuid,
    content_type: ContentType.RootKey,
    content: FillRootKeyContent(content),
    ...PayloadTimestampDefaults(),
  })

  return new SNRootKey(payload) as K
}

export function FillRootKeyContent(content: Partial<RootKeyContentSpecialized>): RootKeyContent {
  if (!content.version) {
    if (content.dataAuthenticationKey) {
      /**
       * If there's no version stored, it must be either 001 or 002.
       * If there's a dataAuthenticationKey, it has to be 002. Otherwise it's 001.
       */
      content.version = ProtocolVersion.V002
    } else {
      content.version = ProtocolVersion.V001
    }
  }

  return FillItemContentSpecialized(content)
}

export function ContentTypesUsingRootKeyEncryption(): ContentType[] {
  return [
    ContentType.RootKey,
    ContentType.ItemsKey,
    ContentType.EncryptedStorage,
    ContentType.TrustedContact,
    ContentType.KeySystemRootKey,
  ]
}

export function ContentTypeUsesRootKeyEncryption(contentType: ContentType): boolean {
  return ContentTypesUsingRootKeyEncryption().includes(contentType)
}

export function ContentTypeUsesKeySystemRootKeyEncryption(contentType: ContentType): boolean {
  return contentType === ContentType.KeySystemItemsKey
}
