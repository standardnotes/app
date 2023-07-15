import { ContentType } from '@standardnotes/domain-core'
import { DecryptedPayload, PayloadTimestampDefaults } from '../../Abstract/Payload'
import { ContactPublicKeySet } from './PublicKeySet/ContactPublicKeySet'
import { ContactPublicKeySetInterface } from './PublicKeySet/ContactPublicKeySetInterface'
import { TrustedContact } from './TrustedContact'
import { TrustedContactInterface } from './TrustedContactInterface'
import { FillItemContentSpecialized } from '../../Abstract/Content/ItemContent'
import { TrustedContactContentSpecialized } from './TrustedContactContent'
import { ConflictStrategy } from '../../Abstract/Item'

function createMockPublicKeySetChain(): ContactPublicKeySetInterface {
  const nMinusOne = new ContactPublicKeySet({
    encryption: 'encryption-public-key-n-1',
    signing: 'signing-public-key-n-1',
    timestamp: new Date(-1),
    isRevoked: false,
    previousKeySet: undefined,
  })

  const root = new ContactPublicKeySet({
    encryption: 'encryption-public-key',
    signing: 'signing-public-key',
    timestamp: new Date(),
    isRevoked: false,
    previousKeySet: nMinusOne,
  })

  return root
}

function CreateContact(params: {
  name?: string
  contactUuid?: string
  isMe?: boolean
  publicKeySet?: ContactPublicKeySetInterface
}): TrustedContactInterface {
  return new TrustedContact(
    new DecryptedPayload({
      uuid: 'item-uuid',
      content_type: ContentType.TYPES.TrustedContact,
      ...PayloadTimestampDefaults(),
      content: FillItemContentSpecialized<TrustedContactContentSpecialized, TrustedContactInterface>({
        name: params.name ?? 'test',
        contactUuid: params.contactUuid ?? 'contact-uuid',
        isMe: params.isMe ?? false,
        publicKeySet: params.publicKeySet ?? createMockPublicKeySetChain(),
      }),
    }),
  )
}

describe('isSingleton', () => {
  it('should be true', () => {
    const contact = CreateContact({})

    expect(contact.isSingleton).toEqual(true)
  })
})

describe('strategyWhenConflictingWithItem', () => {
  it('should be KeepBase', () => {
    const contact = CreateContact({})

    expect(contact.strategyWhenConflictingWithItem({} as unknown as TrustedContactInterface)).toEqual(
      ConflictStrategy.KeepBase,
    )
  })
})

describe('TrustedContact', () => {
  describe('isPublicKeyTrusted', () => {
    it('should be false if key set is revoked', () => {
      const root = new ContactPublicKeySet({
        encryption: 'encryption-public-key',
        signing: 'signing-public-key',
        timestamp: new Date(),
        isRevoked: true,
        previousKeySet: undefined,
      })

      const contact = CreateContact({ publicKeySet: root })

      expect(contact.isPublicKeyTrusted('encryption-public-key')).toEqual(false)
    })

    it('should return false if public key is not found', () => {
      const root = new ContactPublicKeySet({
        encryption: 'encryption-public-key',
        signing: 'signing-public-key',
        timestamp: new Date(),
        isRevoked: true,
        previousKeySet: undefined,
      })

      const contact = CreateContact({ publicKeySet: root })

      expect(contact.isPublicKeyTrusted('not-found-public-key')).toEqual(false)
    })
  })

  describe('isSigningKeyTrusted', () => {
    it('should be false if key set is revoked', () => {
      const root = new ContactPublicKeySet({
        encryption: 'encryption-public-key',
        signing: 'signing-public-key',
        timestamp: new Date(),
        isRevoked: true,
        previousKeySet: undefined,
      })

      const contact = CreateContact({ publicKeySet: root })

      expect(contact.isSigningKeyTrusted('signing-public-key')).toEqual(false)
    })

    it('should return false if signing key is not found', () => {
      const root = new ContactPublicKeySet({
        encryption: 'encryption-public-key',
        signing: 'signing-public-key',
        timestamp: new Date(),
        isRevoked: true,
        previousKeySet: undefined,
      })

      const contact = CreateContact({ publicKeySet: root })

      expect(contact.isSigningKeyTrusted('not-found-signing-key')).toEqual(false)
    })
  })
})
