import { ContentType } from '@standardnotes/domain-core'
import { DecryptedPayload, PayloadTimestampDefaults } from '../../../Abstract/Payload'
import { TrustedContact } from '../TrustedContact'
import { TrustedContactInterface } from '../TrustedContactInterface'
import { TrustedContactMutator } from './TrustedContactMutator'
import { ContactPublicKeySet } from '../PublicKeySet/ContactPublicKeySet'
import { FillItemContentSpecialized } from '../../../Abstract/Content/ItemContent'
import { TrustedContactContentSpecialized } from '../Content/TrustedContactContent'
import { MutationType } from '../../../Abstract/Item'
import { PortablePublicKeySet } from '../Types/PortablePublicKeySet'
import { ContactPublicKeySetInterface } from '../PublicKeySet/ContactPublicKeySetInterface'

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

describe('TrustedContactMutator', () => {
  let contact: TrustedContactInterface
  let mutator: TrustedContactMutator

  beforeEach(() => {
    contact = new TrustedContact(
      new DecryptedPayload({
        uuid: 'item-uuid',
        content_type: ContentType.TYPES.TrustedContact,
        ...PayloadTimestampDefaults(),
        content: FillItemContentSpecialized<TrustedContactContentSpecialized, TrustedContactInterface>({
          name: 'test',
          contactUuid: 'contact-uuid',
          isMe: true,
          publicKeySet: createMockPublicKeySetChain(),
        }),
      }),
    )

    mutator = new TrustedContactMutator(contact, MutationType.UpdateUserTimestamps)
  })

  it('should set name', () => {
    mutator.name = 'new name'

    const result = mutator.getResult()

    expect(result.content.name).toEqual('new name')
  })

  it('should add public key', () => {
    const currentKeySet = contact.publicKeySet

    const newKeySet: PortablePublicKeySet = {
      encryption: 'new-encryption-public-key',
      signing: 'new-signing-public-key',
    }

    mutator.addPublicKey(newKeySet)

    const result = new TrustedContact(mutator.getResult())

    expect(result.publicKeySet.encryption).toEqual(newKeySet.encryption)
    expect(result.publicKeySet.signing).toEqual(newKeySet.signing)
    expect(result.publicKeySet.previousKeySet).toEqual(currentKeySet)
  })

  it('should replace public key set', () => {
    const replacement = new ContactPublicKeySet({
      encryption: 'encryption-public-key-replacement',
      signing: 'signing-public-key-replacement',
      timestamp: new Date(),
      previousKeySet: undefined,
    })

    mutator.replacePublicKeySet(replacement.asJson())

    const result = new TrustedContact(mutator.getResult())

    expect(result.publicKeySet.encryption).toEqual(replacement.encryption)
    expect(result.publicKeySet.signing).toEqual(replacement.signing)
  })
})
