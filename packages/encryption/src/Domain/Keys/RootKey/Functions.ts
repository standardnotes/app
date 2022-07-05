import { ContentType, ProtocolVersion } from '@standardnotes/common'
import {
  DecryptedPayload,
  FillItemContentSpecialized,
  PayloadTimestampDefaults,
  RootKeyContent,
  RootKeyContentSpecialized,
} from '@standardnotes/models'
import { UuidGenerator } from '@standardnotes/utils'
import { SNRootKey } from './RootKey'

export function CreateNewRootKey(content: RootKeyContentSpecialized): SNRootKey {
  const uuid = UuidGenerator.GenerateUuid()

  const payload = new DecryptedPayload<RootKeyContent>({
    uuid: uuid,
    content_type: ContentType.RootKey,
    content: FillRootKeyContent(content),
    ...PayloadTimestampDefaults(),
  })

  return new SNRootKey(payload)
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

export function ContentTypeUsesRootKeyEncryption(contentType: ContentType): boolean {
  return (
    contentType === ContentType.RootKey ||
    contentType === ContentType.ItemsKey ||
    contentType === ContentType.EncryptedStorage
  )
}

export function ItemContentTypeUsesRootKeyEncryption(contentType: ContentType): boolean {
  return contentType === ContentType.ItemsKey
}
