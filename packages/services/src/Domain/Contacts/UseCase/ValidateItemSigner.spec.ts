import {
  DecryptedItemInterface,
  PayloadSource,
  PersistentSignatureData,
  TrustedContactInterface,
} from '@standardnotes/models'
import { ItemManagerInterface } from './../../Item/ItemManagerInterface'
import { ValidateItemSignerUseCase } from './ValidateItemSigner'

describe('validate item signer use case', () => {
  let usecase: ValidateItemSignerUseCase
  let items: ItemManagerInterface

  const trustedContact = {} as jest.Mocked<TrustedContactInterface>
  trustedContact.isSigningKeyTrusted = jest.fn().mockReturnValue(true)

  beforeEach(() => {
    items = {} as jest.Mocked<ItemManagerInterface>
    usecase = new ValidateItemSignerUseCase(items)
  })

  const createItem = (params: {
    last_edited_by_uuid: string | undefined
    shared_vault_uuid: string | undefined
    signatureData: PersistentSignatureData | undefined
    source?: PayloadSource
  }): jest.Mocked<DecryptedItemInterface> => {
    const payload = {
      source: params.source ?? PayloadSource.RemoteRetrieved,
    } as jest.Mocked<DecryptedItemInterface['payload']>

    const item = {
      last_edited_by_uuid: params.last_edited_by_uuid,
      shared_vault_uuid: params.shared_vault_uuid,
      signatureData: params.signatureData,
      payload: payload,
    } as unknown as jest.Mocked<DecryptedItemInterface>

    return item
  }

  describe('has last edited by uuid', () => {
    describe('trusted contact not found', () => {
      beforeEach(() => {
        items.itemsMatchingPredicate = jest.fn().mockReturnValue([])
      })

      it('should return invalid signing is required', () => {
        const item = createItem({
          last_edited_by_uuid: 'uuid-123',
          shared_vault_uuid: 'shared-vault-123',
          signatureData: undefined,
        })

        const result = usecase.execute(item)
        expect(result).toEqual('no')
      })

      it('should return not applicable signing is not required', () => {
        const item = createItem({
          last_edited_by_uuid: 'uuid-123',
          shared_vault_uuid: undefined,
          signatureData: undefined,
        })

        const result = usecase.execute(item)
        expect(result).toEqual('not-applicable')
      })
    })

    describe('trusted contact found for last editor', () => {
      beforeEach(() => {
        items.itemsMatchingPredicate = jest.fn().mockReturnValue([trustedContact])
      })

      describe('does not have signature data', () => {
        it('should return not applicable if the item was just recently created', () => {
          const item = createItem({
            last_edited_by_uuid: 'uuid-123',
            shared_vault_uuid: 'shared-vault-123',
            signatureData: undefined,
            source: PayloadSource.Constructor,
          })

          const result = usecase.execute(item)
          expect(result).toEqual('not-applicable')
        })

        it('should return not applicable if the item was just recently saved', () => {
          const item = createItem({
            last_edited_by_uuid: 'uuid-123',
            shared_vault_uuid: 'shared-vault-123',
            signatureData: undefined,
            source: PayloadSource.RemoteSaved,
          })

          const result = usecase.execute(item)
          expect(result).toEqual('not-applicable')
        })

        it('should return invalid if signing is required', () => {
          const item = createItem({
            last_edited_by_uuid: 'uuid-123',
            shared_vault_uuid: 'shared-vault-123',
            signatureData: undefined,
          })

          const result = usecase.execute(item)
          expect(result).toEqual('no')
        })

        it('should return not applicable if signing is not required', () => {
          const item = createItem({
            last_edited_by_uuid: 'uuid-123',
            signatureData: undefined,
            shared_vault_uuid: undefined,
          })

          const result = usecase.execute(item)
          expect(result).toEqual('not-applicable')
        })
      })

      describe('has signature data', () => {
        describe('signature data does not have result', () => {
          it('should return invalid if signing is required', () => {
            const item = createItem({
              last_edited_by_uuid: 'uuid-123',
              shared_vault_uuid: 'shared-vault-123',
              signatureData: {
                required: true,
              } as jest.Mocked<PersistentSignatureData>,
            })

            const result = usecase.execute(item)
            expect(result).toEqual('no')
          })

          it('should return not applicable if signing is not required', () => {
            const item = createItem({
              last_edited_by_uuid: 'uuid-123',
              shared_vault_uuid: undefined,
              signatureData: {
                required: false,
              } as jest.Mocked<PersistentSignatureData>,
            })

            const result = usecase.execute(item)
            expect(result).toEqual('not-applicable')
          })
        })

        describe('signature data has result', () => {
          it('should return invalid if signature result does not pass', () => {
            const item = createItem({
              last_edited_by_uuid: 'uuid-123',
              shared_vault_uuid: 'shared-vault-123',
              signatureData: {
                required: true,
                result: {
                  passes: false,
                },
              } as jest.Mocked<PersistentSignatureData>,
            })

            const result = usecase.execute(item)
            expect(result).toEqual('no')
          })

          it('should return invalid if signature result passes and a trusted contact is NOT found for signature public key', () => {
            const item = createItem({
              last_edited_by_uuid: 'uuid-123',
              shared_vault_uuid: 'shared-vault-123',
              signatureData: {
                required: true,
                result: {
                  passes: true,
                  publicKey: 'pk-123',
                },
              } as jest.Mocked<PersistentSignatureData>,
            })

            items.itemsMatchingPredicate = jest.fn().mockReturnValue([])

            const result = usecase.execute(item)
            expect(result).toEqual('no')
          })

          it('should return valid if signature result passes and a trusted contact is found for signature public key', () => {
            const item = createItem({
              last_edited_by_uuid: 'uuid-123',
              shared_vault_uuid: 'shared-vault-123',
              signatureData: {
                required: true,
                result: {
                  passes: true,
                  publicKey: 'pk-123',
                },
              } as jest.Mocked<PersistentSignatureData>,
            })

            items.itemsMatchingPredicate = jest.fn().mockReturnValue([trustedContact])

            const result = usecase.execute(item)
            expect(result).toEqual('yes')
          })
        })
      })
    })
  })

  describe('has no last edited by uuid', () => {
    describe('does not have signature data', () => {
      it('should return not applicable if the item was just recently created', () => {
        const item = createItem({
          last_edited_by_uuid: undefined,
          shared_vault_uuid: 'shared-vault-123',
          signatureData: undefined,
          source: PayloadSource.Constructor,
        })

        const result = usecase.execute(item)
        expect(result).toEqual('not-applicable')
      })

      it('should return not applicable if the item was just recently saved', () => {
        const item = createItem({
          last_edited_by_uuid: undefined,
          shared_vault_uuid: 'shared-vault-123',
          signatureData: undefined,
          source: PayloadSource.RemoteSaved,
        })

        const result = usecase.execute(item)
        expect(result).toEqual('not-applicable')
      })

      it('should return invalid if signing is required', () => {
        const item = createItem({
          last_edited_by_uuid: undefined,
          shared_vault_uuid: 'shared-vault-123',
          signatureData: undefined,
        })

        const result = usecase.execute(item)
        expect(result).toEqual('no')
      })

      it('should return not applicable if signing is not required', () => {
        const item = createItem({
          last_edited_by_uuid: undefined,
          shared_vault_uuid: undefined,
          signatureData: undefined,
        })

        const result = usecase.execute(item)
        expect(result).toEqual('not-applicable')
      })
    })

    describe('has signature data', () => {
      describe('signature data does not have result', () => {
        it('should return invalid if signing is required', () => {
          const item = createItem({
            last_edited_by_uuid: undefined,
            shared_vault_uuid: 'shared-vault-123',
            signatureData: {
              required: true,
            } as jest.Mocked<PersistentSignatureData>,
          })

          const result = usecase.execute(item)
          expect(result).toEqual('no')
        })

        it('should return not applicable if signing is not required', () => {
          const item = createItem({
            last_edited_by_uuid: undefined,
            shared_vault_uuid: undefined,
            signatureData: {
              required: false,
            } as jest.Mocked<PersistentSignatureData>,
          })

          const result = usecase.execute(item)
          expect(result).toEqual('not-applicable')
        })
      })

      describe('signature data has result', () => {
        it('should return invalid if signature result does not pass', () => {
          const item = createItem({
            last_edited_by_uuid: undefined,
            shared_vault_uuid: 'shared-vault-123',
            signatureData: {
              required: true,
              result: {
                passes: false,
              },
            } as jest.Mocked<PersistentSignatureData>,
          })

          const result = usecase.execute(item)
          expect(result).toEqual('no')
        })

        it('should return invalid if signature result passes and a trusted contact is NOT found for signature public key', () => {
          const item = createItem({
            last_edited_by_uuid: undefined,
            shared_vault_uuid: 'shared-vault-123',
            signatureData: {
              required: true,
              result: {
                passes: true,
                publicKey: 'pk-123',
              },
            } as jest.Mocked<PersistentSignatureData>,
          })

          items.getItems = jest.fn().mockReturnValue([])

          const result = usecase.execute(item)
          expect(result).toEqual('no')
        })

        it('should return valid if signature result passes and a trusted contact is found for signature public key', () => {
          const item = createItem({
            last_edited_by_uuid: undefined,
            shared_vault_uuid: 'shared-vault-123',
            signatureData: {
              required: true,
              result: {
                passes: true,
                publicKey: 'pk-123',
              },
            } as jest.Mocked<PersistentSignatureData>,
          })

          items.getItems = jest.fn().mockReturnValue([trustedContact])

          const result = usecase.execute(item)
          expect(result).toEqual('yes')
        })
      })
    })
  })
})
