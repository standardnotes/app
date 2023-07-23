import { ContentType } from '@standardnotes/domain-core'
import { DecryptedPayload, PayloadTimestampDefaults } from '../../Abstract/Payload'
import { ContactPublicKeySet } from './PublicKeySet/ContactPublicKeySet'
import { ContactPublicKeySetInterface } from './PublicKeySet/ContactPublicKeySetInterface'
import { TrustedContact } from './TrustedContact'
import { TrustedContactInterface } from './TrustedContactInterface'
import { FillItemContentSpecialized } from '../../Abstract/Content/ItemContent'
import { ConflictStrategy } from '../../Abstract/Item'
import { TrustedContactContentSpecialized } from './Content/TrustedContactContent'
import { PublicKeyTrustStatus } from './Types/PublicKeyTrustStatus'

function createMockPublicKeySetChain(): ContactPublicKeySetInterface {
  const nMinusOne = new ContactPublicKeySet({
    encryption: 'encryption-public-key-n-1',
    signing: 'signing-public-key-n-1',
    timestamp: new Date(-1),
    previousKeySet: undefined,
  })

  const root = new ContactPublicKeySet({
    encryption: 'encryption-public-key',
    signing: 'signing-public-key',
    timestamp: new Date(),
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
  describe('getTrustStatusForPublicKey', () => {
    it('should be trusted if key set is root', () => {
      const contact = CreateContact({ publicKeySet: createMockPublicKeySetChain() })

      expect(contact.getTrustStatusForPublicKey('encryption-public-key')).toEqual(PublicKeyTrustStatus.Trusted)
    })

    it('should be semi-trusted if key set is previous', () => {
      const contact = CreateContact({ publicKeySet: createMockPublicKeySetChain() })

      expect(contact.getTrustStatusForPublicKey('encryption-public-key-n-1')).toEqual(PublicKeyTrustStatus.Previous)
    })

    it('should return not trusted if public key is not found', () => {
      const contact = CreateContact({ publicKeySet: createMockPublicKeySetChain() })

      expect(contact.getTrustStatusForPublicKey('not-found-public-key')).toEqual(PublicKeyTrustStatus.NotTrusted)
    })
  })

  describe('getTrustStatusForSigningPublicKey', () => {
    it('should be trusted if key set is root', () => {
      const contact = CreateContact({ publicKeySet: createMockPublicKeySetChain() })

      expect(contact.getTrustStatusForSigningPublicKey('signing-public-key')).toEqual(PublicKeyTrustStatus.Trusted)
    })

    it('should be semi-trusted if key set is previous', () => {
      const contact = CreateContact({ publicKeySet: createMockPublicKeySetChain() })

      expect(contact.getTrustStatusForSigningPublicKey('signing-public-key-n-1')).toEqual(PublicKeyTrustStatus.Previous)
    })

    it('should return not trusted if public key is not found', () => {
      const contact = CreateContact({ publicKeySet: createMockPublicKeySetChain() })

      expect(contact.getTrustStatusForSigningPublicKey('not-found-public-key')).toEqual(PublicKeyTrustStatus.NotTrusted)
    })
  })
})
