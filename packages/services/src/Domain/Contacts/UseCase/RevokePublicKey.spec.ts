import { MutatorClientInterface } from './../../Mutator/MutatorClientInterface'
import { ContactPublicKeySet, ContactPublicKeySetInterface, TrustedContactInterface } from '@standardnotes/models'
import { RevokePublicKeyUseCase } from './RevokePublicKey'

function createMockPublicKeySetChain(): ContactPublicKeySetInterface {
  const nMinusTwo = new ContactPublicKeySet({
    encryption: 'encryption-public-key-n-2',
    signing: 'signing-public-key-n-2',
    timestamp: new Date(-2),
    isRevoked: false,
    previousKeySet: undefined,
  })

  const nMinusOne = new ContactPublicKeySet({
    encryption: 'encryption-public-key-n-1',
    signing: 'signing-public-key-n-1',
    timestamp: new Date(-1),
    isRevoked: false,
    previousKeySet: nMinusTwo,
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

describe('RevokePublicKey', () => {
  let selfContact: jest.Mocked<TrustedContactInterface>
  let usecase: RevokePublicKeyUseCase

  beforeEach(() => {
    selfContact = {
      name: 'Me',
      contactUuid: '123',
      publicKeySet: createMockPublicKeySetChain(),
      isMe: true,
    } as jest.Mocked<TrustedContactInterface>

    const mutator = {} as jest.Mocked<MutatorClientInterface>

    usecase = new RevokePublicKeyUseCase(mutator)
  })

  it('should not be able to revoke current keyset', async () => {
    const result = await usecase.execute({
      selfContact: selfContact,
      revokeKeySet: selfContact.publicKeySet,
    })

    expect(result.isFailed()).toBe(true)
  })

  it('should be able to revoke non-current keyset', async () => {
    const result = await usecase.execute({
      selfContact: selfContact,
      revokeKeySet: selfContact.publicKeySet.previousKeySet!,
    })

    expect(result.isFailed()).toBe(false)
  })

  it('revoking a keyset should send a keypair revocation message to trusted contacts', async () => {
    console.error('TODO')
  })

  it('should distrust revoked keyset as third party contact', async () => {
    console.error('TODO')
  })
})
