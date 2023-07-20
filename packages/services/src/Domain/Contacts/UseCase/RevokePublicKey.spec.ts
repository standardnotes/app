import { MutatorClientInterface } from './../../Mutator/MutatorClientInterface'
import { ContactPublicKeySet, ContactPublicKeySetInterface, TrustedContactInterface } from '@standardnotes/models'
import { RevokePublicKeyUseCase } from './RevokePublicKey'
import { ContactServiceInterface } from '../ContactServiceInterface'
import { EncryptAsymmetricMessagePayload } from '../../Encryption/UseCase/Asymmetric/EncryptAsymmetricMessagePayload'
import { SendAsymmetricMessageUseCase } from '../../AsymmetricMessage/UseCase/SendAsymmetricMessageUseCase'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { Result } from '@standardnotes/domain-core'
import { GetOutboundAsymmetricMessages } from '../../AsymmetricMessage/UseCase/GetOutboundAsymmetricMessages'
import { GetAsymmetricStringAdditionalData } from '../../Encryption/UseCase/Asymmetric/GetAsymmetricStringAdditionalData'
import { AsymmetricMessageServerInterface, SharedVaultInvitesServerInterface } from '@standardnotes/api'

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
  let encryptAsymmetricMessageUseCase: jest.Mocked<EncryptAsymmetricMessagePayload>
  let sendMessageUseCase: jest.Mocked<SendAsymmetricMessageUseCase>

  const senderEncryptionKeyPair: PkcKeyPair = {
    privateKey: 'private-key',
    publicKey: 'public-key',
  }

  const senderSigningKeyPair: PkcKeyPair = {
    privateKey: 'private-key',
    publicKey: 'public-key',
  }

  beforeEach(() => {
    selfContact = {
      name: 'Me',
      contactUuid: '123',
      publicKeySet: createMockPublicKeySetChain(),
      isMe: true,
    } as jest.Mocked<TrustedContactInterface>

    const otherContact = {
      name: 'Other',
      contactUuid: '456',
      publicKeySet: createMockPublicKeySetChain(),
      isMe: false,
    } as jest.Mocked<TrustedContactInterface>

    const mutator = {} as jest.Mocked<MutatorClientInterface>
    mutator.changeItem = jest.fn()

    const contacts = {} as jest.Mocked<ContactServiceInterface>
    contacts.getAllContacts = jest.fn().mockReturnValue([selfContact, otherContact])

    encryptAsymmetricMessageUseCase = {} as jest.Mocked<EncryptAsymmetricMessagePayload>
    encryptAsymmetricMessageUseCase.execute = jest.fn().mockReturnValue(Result.ok())

    sendMessageUseCase = {} as jest.Mocked<SendAsymmetricMessageUseCase>
    sendMessageUseCase.execute = jest.fn()

    const getOutboundMessages = {} as jest.Mocked<GetOutboundAsymmetricMessages>
    const getAdditionalData = {} as jest.Mocked<GetAsymmetricStringAdditionalData>

    const invitesServer = {} as jest.Mocked<SharedVaultInvitesServerInterface>
    const messageServer = {} as jest.Mocked<AsymmetricMessageServerInterface>

    usecase = new RevokePublicKeyUseCase(
      mutator,
      contacts,
      messageServer,
      invitesServer,
      encryptAsymmetricMessageUseCase,
      sendMessageUseCase,
      getOutboundMessages,
      getAdditionalData,
    )
  })

  it('should not be able to revoke current keyset', async () => {
    const result = await usecase.execute({
      selfContact: selfContact,
      revokeKeySet: selfContact.publicKeySet,
      senderEncryptionKeyPair,
      senderSigningKeyPair,
    })

    expect(result.isFailed()).toBe(true)
  })

  it('should be able to revoke non-current keyset', async () => {
    const result = await usecase.execute({
      selfContact: selfContact,
      revokeKeySet: selfContact.publicKeySet.previousKeySet!,
      senderEncryptionKeyPair,
      senderSigningKeyPair,
    })

    expect(result.isFailed()).toBe(false)
  })

  it('revoking a keyset should send a keypair revocation message to trusted contacts', async () => {
    const result = await usecase.execute({
      selfContact: selfContact,
      revokeKeySet: selfContact.publicKeySet.previousKeySet!,
      senderEncryptionKeyPair,
      senderSigningKeyPair,
    })

    expect(result.isFailed()).toBe(false)

    expect(encryptAsymmetricMessageUseCase.execute).toBeCalledTimes(1)
    expect(sendMessageUseCase.execute).toBeCalledTimes(1)
  })
})
