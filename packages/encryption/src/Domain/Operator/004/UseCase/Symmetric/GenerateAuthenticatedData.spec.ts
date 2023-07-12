import { CreateAnyKeyParams } from '../../../../Keys/RootKey/KeyParamsFunctions'
import { AnyKeyParamsContent, ProtocolVersion } from '@standardnotes/common'
import { GenerateAuthenticatedDataUseCase } from './GenerateAuthenticatedData'
import {
  DecryptedPayloadInterface,
  ItemsKeyInterface,
  KeySystemRootKeyInterface,
  RootKeyInterface,
} from '@standardnotes/models'
import { KeySystemItemsKey } from '../../../../Keys/KeySystemItemsKey/KeySystemItemsKey'
import { ContentType } from '@standardnotes/domain-core'

describe('generate authenticated data use case', () => {
  let usecase: GenerateAuthenticatedDataUseCase

  beforeEach(() => {
    usecase = new GenerateAuthenticatedDataUseCase()
  })

  it('should include key params if payload being encrypted is an items key', () => {
    const payload = {
      uuid: '123',
      content_type: ContentType.TYPES.ItemsKey,
    } as jest.Mocked<DecryptedPayloadInterface>

    const keyParams = CreateAnyKeyParams({
      identifier: 'key-params-123',
    } as jest.Mocked<AnyKeyParamsContent>)

    const rootKey = {
      keyParams,
    } as jest.Mocked<RootKeyInterface>

    const authenticatedData = usecase.execute(payload, rootKey)

    expect(authenticatedData).toEqual({
      u: payload.uuid,
      v: ProtocolVersion.V004,
      kp: keyParams.content,
    })
  })

  it('should include root key params if payload is a key system items key', () => {
    const payload = {
      uuid: '123',
      content_type: ContentType.TYPES.KeySystemItemsKey,
      shared_vault_uuid: 'shared-vault-uuid-123',
      key_system_identifier: 'key-system-identifier-123',
    } as jest.Mocked<DecryptedPayloadInterface>

    const keySystemRootKey = {
      keyVersion: ProtocolVersion.V004,
      keyParams: {
        seed: 'seed-123',
      },
      content_type: ContentType.TYPES.KeySystemRootKey,
      token: '123',
    } as jest.Mocked<KeySystemRootKeyInterface>

    const authenticatedData = usecase.execute(payload, keySystemRootKey)

    expect(authenticatedData).toEqual({
      u: payload.uuid,
      v: ProtocolVersion.V004,
      kp: keySystemRootKey.keyParams,
      ksi: payload.key_system_identifier,
      svu: payload.shared_vault_uuid,
    })
  })

  it('should include key system identifier and shared vault uuid', () => {
    const payload = {
      uuid: '123',
      content_type: ContentType.TYPES.Note,
      shared_vault_uuid: 'shared-vault-uuid-123',
      key_system_identifier: 'key-system-identifier-123',
    } as jest.Mocked<DecryptedPayloadInterface>

    const itemsKey = {
      creationTimestamp: 123,
      keyVersion: ProtocolVersion.V004,
      content_type: ContentType.TYPES.KeySystemItemsKey,
    } as jest.Mocked<KeySystemItemsKey>

    const authenticatedData = usecase.execute(payload, itemsKey)

    expect(authenticatedData).toEqual({
      u: payload.uuid,
      v: ProtocolVersion.V004,
      ksi: payload.key_system_identifier,
      svu: payload.shared_vault_uuid,
    })
  })

  it('should include only uuid and version if non-keysystem item with items key', () => {
    const payload = {
      uuid: '123',
      content_type: ContentType.TYPES.Note,
    } as jest.Mocked<DecryptedPayloadInterface>

    const itemsKey = {
      content_type: ContentType.TYPES.ItemsKey,
    } as jest.Mocked<ItemsKeyInterface>

    const authenticatedData = usecase.execute(payload, itemsKey)

    expect(authenticatedData).toEqual({
      u: payload.uuid,
      v: ProtocolVersion.V004,
    })
  })
})
