import { EncryptedPayloadInterface, HistoryEntry } from '@standardnotes/models'
import { EncryptionProviderInterface, RevisionClientInterface } from '@standardnotes/services'
jest.mock('@standardnotes/models', () => {
  const original = jest.requireActual('@standardnotes/models')

  return {
    ...original,
    checkRemotePayloadAllowed: jest.fn(),
  }
})
const checkRemotePayloadAllowed = require('@standardnotes/models').checkRemotePayloadAllowed

import { Revision } from '../../Revision/Revision'

import { GetRevision } from './GetRevision'

describe('GetRevision', () => {
  let revisionManager: RevisionClientInterface
  let encryptionService: EncryptionProviderInterface

  const createUseCase = () => new GetRevision(revisionManager, encryptionService)

  beforeEach(() => {
    revisionManager = {} as jest.Mocked<RevisionClientInterface>
    revisionManager.getRevision = jest.fn().mockReturnValue({
      uuid: '00000000-0000-0000-0000-000000000000',
      item_uuid: '00000000-0000-0000-0000-000000000000',
      content: '004:foobar',
      content_type: 'Note',
      items_key_id: 'foobar',
      enc_item_key: 'foobar',
      auth_hash: 'foobar',
      created_at: '2021-01-01T00:00:00.000Z',
      updated_at: '2021-01-01T00:00:00.000Z',
    } as jest.Mocked<Revision>)

    encryptionService = {} as jest.Mocked<EncryptionProviderInterface>
    encryptionService.getEmbeddedPayloadAuthenticatedData = jest
      .fn()
      .mockReturnValue({ u: '00000000-0000-0000-0000-000000000000' })
    const encryptedPayload = {
      content: 'foobar',
    } as jest.Mocked<EncryptedPayloadInterface>
    encryptedPayload.copy = jest.fn().mockReturnValue(encryptedPayload)
    encryptionService.decryptSplitSingle = jest.fn().mockReturnValue(encryptedPayload)

    checkRemotePayloadAllowed.mockImplementation(() => ({ allowed: {} }))
  })

  it('should get revision', async () => {
    const useCase = createUseCase()

    const result = await useCase.execute({
      itemUuid: '00000000-0000-0000-0000-000000000000',
      revisionUuid: '00000000-0000-0000-0000-000000000000',
    })

    expect(result.isFailed()).toBe(false)
    expect(result.getValue()).toBeInstanceOf(HistoryEntry)
  })

  it('it should get a revision without uuid from embedded params', async () => {
    encryptionService.getEmbeddedPayloadAuthenticatedData = jest.fn().mockReturnValue({ u: undefined })

    const useCase = createUseCase()

    const result = await useCase.execute({
      itemUuid: '00000000-0000-0000-0000-000000000000',
      revisionUuid: '00000000-0000-0000-0000-000000000000',
    })

    expect(result.isFailed()).toBe(false)
    expect(result.getValue()).toBeInstanceOf(HistoryEntry)
  })

  it('it should get a revision without embedded params', async () => {
    encryptionService.getEmbeddedPayloadAuthenticatedData = jest.fn().mockReturnValue(undefined)

    const useCase = createUseCase()

    const result = await useCase.execute({
      itemUuid: '00000000-0000-0000-0000-000000000000',
      revisionUuid: '00000000-0000-0000-0000-000000000000',
    })

    expect(result.isFailed()).toBe(false)
    expect(result.getValue()).toBeInstanceOf(HistoryEntry)
  })

  it('should fail if item uuid is invalid', async () => {
    const useCase = createUseCase()

    const result = await useCase.execute({
      itemUuid: 'invalid',
      revisionUuid: '00000000-0000-0000-0000-000000000000',
    })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toEqual('Could not get revision: Given value is not a valid uuid: invalid')
  })

  it('should fail if revision uuid is invalid', async () => {
    const useCase = createUseCase()

    const result = await useCase.execute({
      itemUuid: '00000000-0000-0000-0000-000000000000',
      revisionUuid: 'invalid',
    })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toEqual('Could not get revision: Given value is not a valid uuid: invalid')
  })

  it('should fail if revision is not found', async () => {
    revisionManager.getRevision = jest.fn().mockReturnValue(null)

    const useCase = createUseCase()

    const result = await useCase.execute({
      itemUuid: '00000000-0000-0000-0000-000000000000',
      revisionUuid: '00000000-0000-0000-0000-000000000000',
    })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toEqual('Could not get revision: Revision not found')
  })

  it('should fail if there is an error in decrypting the revision', async () => {
    const encryptedPayload = {
      content: 'foobar',
      errorDecrypting: true,
    } as jest.Mocked<EncryptedPayloadInterface>
    encryptedPayload.copy = jest.fn().mockReturnValue(encryptedPayload)
    encryptionService.decryptSplitSingle = jest.fn().mockReturnValue(encryptedPayload)

    const useCase = createUseCase()

    const result = await useCase.execute({
      itemUuid: '00000000-0000-0000-0000-000000000000',
      revisionUuid: '00000000-0000-0000-0000-000000000000',
    })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toEqual('Could not decrypt revision.')
  })

  it('should fail if remote payload is not allowed', async () => {
    checkRemotePayloadAllowed.mockImplementation(() => ({ disallowed: {} }))

    const useCase = createUseCase()

    const result = await useCase.execute({
      itemUuid: '00000000-0000-0000-0000-000000000000',
      revisionUuid: '00000000-0000-0000-0000-000000000000',
    })

    expect(result.isFailed()).toBe(true)
  })

  it('should fail if revision manager throws', async () => {
    revisionManager.getRevision = jest.fn().mockRejectedValue(new Error('error'))

    const useCase = createUseCase()

    const result = await useCase.execute({
      itemUuid: '00000000-0000-0000-0000-000000000000',
      revisionUuid: '00000000-0000-0000-0000-000000000000',
    })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toEqual('Could not get revision: error')
  })
})
